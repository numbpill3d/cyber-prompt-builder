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

// Enable CORS for development
app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, Authorization');
  res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  next();
});

// Health check endpoint for Render
app.get('/health', (req, res) => {
  res.status(200).json({
    status: 'OK',
    timestamp: new Date().toISOString(),
    environment: process.env.REACT_APP_APP_ENVIRONMENT || 'production'
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

// Serve static files from the dist directory
app.use(express.static(path.join(__dirname, 'dist')));

// For any other request, send the index.html file
app.get('*', (req, res) => {
  const indexPath = path.join(__dirname, 'dist', 'index.html');

  // Check if the file exists
  if (fs.existsSync(indexPath)) {
    res.sendFile(indexPath);
  } else {
    res.status(404).send('Application files not found. The application may not be built correctly.');
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
