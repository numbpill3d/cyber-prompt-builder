import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = 3001;

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

// Serve static files from the dist directory
app.use(express.static(path.join(__dirname, 'dist')));

// Explicitly serve the assets directory
app.use('/assets', express.static(path.join(__dirname, 'dist', 'assets')));

// Health check endpoint
app.get('/health', (req, res) => {
  res.status(200).json({
    status: 'OK',
    timestamp: new Date().toISOString()
  });
});

// Root route
app.get('/', (req, res) => {
  const indexPath = path.join(__dirname, 'dist', 'index.html');
  console.log('Serving index.html from:', indexPath);
  
  if (fs.existsSync(indexPath)) {
    res.sendFile(indexPath);
  } else {
    res.status(404).send('Application files not found');
  }
});

// Start the server
app.listen(PORT, () => {
  console.log(`Simple test server running on port ${PORT}`);
});
