import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware for parsing JSON and urlencoded form data
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Security headers and CORS
app.use((req, res, next) => {
  // CORS headers
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, Authorization');
  res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  
  // Security headers
  res.header('X-Content-Type-Options', 'nosniff');
  res.header('X-Frame-Options', 'DENY');
  res.header('X-XSS-Protection', '1; mode=block');
  res.header('Referrer-Policy', 'strict-origin-when-cross-origin');
  res.header('Permissions-Policy', 'camera=(), microphone=(), geolocation=()');
  
  // Content Security Policy
  if (process.env.NODE_ENV === 'production') {
    res.header('Content-Security-Policy', 
      "default-src 'self'; " +
      "script-src 'self' 'unsafe-inline' 'unsafe-eval'; " +
      "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; " +
      "font-src 'self' https://fonts.gstatic.com; " +
      "img-src 'self' data: https:; " +
      "connect-src 'self' https://api.openai.com https://api.anthropic.com https://generativelanguage.googleapis.com; " +
      "frame-ancestors 'none'; " +
      "base-uri 'self'; " +
      "form-action 'self'"
    );
  }

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  next();
});

// Health check endpoint for Render
app.get('/health', (req, res) => {
  // Check if dist directory and index.html exist
  const distPath = path.join(__dirname, 'dist');
  const indexPath = path.join(distPath, 'index.html');
  const distExists = fs.existsSync(distPath);
  const indexExists = distExists && fs.existsSync(indexPath);

  // Get list of files in dist directory if it exists
  let distFiles = [];
  if (distExists) {
    try {
      distFiles = fs.readdirSync(distPath);
    } catch (error) {
      console.error('Error reading dist directory:', error);
    }
  }

  // Get environment variables (excluding sensitive ones)
  const envVars = {};
  Object.keys(process.env).forEach(key => {
    if (key.startsWith('REACT_APP_') &&
        !key.includes('KEY') &&
        !key.includes('SECRET') &&
        !key.includes('TOKEN')) {
      envVars[key] = process.env[key];
    }
  });

  res.status(200).json({
    status: 'OK',
    timestamp: new Date().toISOString(),
    environment: process.env.REACT_APP_APP_ENVIRONMENT || 'production',
    node_version: process.version,
    server_info: {
      dist_directory_exists: distExists,
      index_html_exists: indexExists,
      dist_files: distFiles,
      current_directory: __dirname
    },
    env: envVars
  });
});

// API endpoint to get environment info (non-sensitive)
app.get('/api/config', (req, res) => {
  // Only return non-sensitive configuration
  const config = {
    environment: process.env.REACT_APP_APP_ENVIRONMENT || 'production',
    defaultProvider: process.env.REACT_APP_PROVIDERS_DEFAULT_PROVIDER || 'openai',
    features: {
      taskBreakdown: process.env.REACT_APP_AGENT_ENABLE_TASK_BREAKDOWN === 'true',
      iteration: process.env.REACT_APP_AGENT_ENABLE_ITERATION === 'true',
      contextMemory: process.env.REACT_APP_AGENT_ENABLE_CONTEXT_MEMORY === 'true',
      tts: process.env.REACT_APP_TTS_ENABLED === 'true'
    }
  };

  res.json(config);
});

// Log directory contents to help with debugging
console.log('Current directory:', __dirname);
try {
  const distPath = path.join(__dirname, 'dist');
  console.log('Checking if dist directory exists:', fs.existsSync(distPath));
  if (fs.existsSync(distPath)) {
    console.log('dist directory contents:', fs.readdirSync(distPath));

    const indexPath = path.join(distPath, 'index.html');
    console.log('Checking if index.html exists:', fs.existsSync(indexPath));
  }
} catch (error) {
  console.error('Error checking dist directory:', error);
}

// Serve static files from the dist and public directories
// Make sure to serve the dist directory at the root path
app.use('/', express.static(path.join(__dirname, 'dist')));
// Explicitly serve the assets directory to handle the absolute paths in index.html
app.use('/assets', express.static(path.join(__dirname, 'dist', 'assets')));
// Serve the public directory for fallback files
app.use(express.static(path.join(__dirname, 'public')));

// Log all incoming requests
app.use((req, res, next) => {
  console.log(`${new Date().toISOString()} - ${req.method} ${req.url}`);
  next();
});

// Catch-all handler for SPA routing - serve the index.html file for all routes
app.get('*', (req, res, next) => {
  // Skip API routes and static assets
  if (req.path.startsWith('/api/') || req.path.startsWith('/health') || req.path.includes('.')) {
    return next();
  }
  const indexPath = path.join(__dirname, 'dist', 'index.html');
  const errorPath = path.join(__dirname, 'public', 'error.html');
  const fallbackPath = path.join(__dirname, 'public', 'index.html');

  console.log('Serving index.html from:', indexPath);

  // Check if the dist/index.html file exists
  if (fs.existsSync(indexPath)) {
    res.sendFile(indexPath);
  }
  // If dist/index.html doesn't exist, try to serve public/error.html
  else if (fs.existsSync(errorPath)) {
    console.warn('Main application index.html not found, serving error page');
    res.sendFile(errorPath);
  }
  // If public/error.html doesn't exist, try to serve public/index.html
  else if (fs.existsSync(fallbackPath)) {
    console.warn('Main application and error page not found, serving fallback page');
    res.sendFile(fallbackPath);
  }
  // If none of the above exist, return a simple error message
  else {
    console.error('No index.html or fallback pages found');
    res.status(404).send(`
      <html>
        <head><title>Application Error</title></head>
        <body>
          <h1>Application Error</h1>
          <p>The application files were not found. The application may not be built correctly.</p>
          <p>Server time: ${new Date().toISOString()}</p>
        </body>
      </html>
    `);
  }
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error('Server error:', err);
  res.status(500).json({
    error: 'Internal Server Error',
    message: process.env.NODE_ENV === 'development' ? err.message : 'Something went wrong'
  });
});

// Start the server
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
  console.log(`Environment: ${process.env.REACT_APP_APP_ENVIRONMENT || 'production'}`);
});
