import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import http from 'http';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

console.log('Testing server configuration...');

// Check if server.js exists
const serverPath = path.join(__dirname, 'server.js');
if (!fs.existsSync(serverPath)) {
  console.error('❌ server.js does not exist!');
  process.exit(1);
}

console.log('✅ server.js exists');

// Check if dist directory exists
const distPath = path.join(__dirname, 'dist');
if (!fs.existsSync(distPath)) {
  console.error('❌ dist directory does not exist!');
  process.exit(1);
}

console.log('✅ dist directory exists');

// Check if index.html exists
const indexPath = path.join(distPath, 'index.html');
if (!fs.existsSync(indexPath)) {
  console.error('❌ index.html does not exist in dist directory!');
  process.exit(1);
}

console.log('✅ index.html exists');

// Check if assets directory exists
const assetsPath = path.join(distPath, 'assets');
if (!fs.existsSync(assetsPath)) {
  console.error('❌ assets directory does not exist in dist directory!');
  process.exit(1);
}

console.log('✅ assets directory exists');

// Test HTTP requests to the server
console.log('\nTesting HTTP requests to the server...');

// Function to make an HTTP request
function makeRequest(path) {
  return new Promise((resolve, reject) => {
    const options = {
      hostname: 'localhost',
      port: 3000,
      path: path,
      method: 'GET',
    };

    const req = http.request(options, (res) => {
      let data = '';
      res.on('data', (chunk) => {
        data += chunk;
      });
      res.on('end', () => {
        resolve({
          statusCode: res.statusCode,
          headers: res.headers,
          data: data.length > 100 ? `${data.substring(0, 100)}... (${data.length} bytes)` : data
        });
      });
    });

    req.on('error', (error) => {
      reject(error);
    });

    req.end();
  });
}

// Start the server
console.log('Starting the server...');
const server = await import('./server.js');

// Wait for the server to start
await new Promise(resolve => setTimeout(resolve, 2000));

try {
  // Test the root path
  console.log('\nTesting root path (/)...');
  const rootResponse = await makeRequest('/');
  console.log(`Status code: ${rootResponse.statusCode}`);
  console.log(`Content-Type: ${rootResponse.headers['content-type']}`);
  console.log(`Data: ${rootResponse.data}`);

  // Test the health check path
  console.log('\nTesting health check path (/health)...');
  const healthResponse = await makeRequest('/health');
  console.log(`Status code: ${healthResponse.statusCode}`);
  console.log(`Content-Type: ${healthResponse.headers['content-type']}`);
  console.log(`Data: ${healthResponse.data}`);

  // Test an asset path
  console.log('\nTesting an asset path...');
  const assetFiles = fs.readdirSync(assetsPath);
  if (assetFiles.length > 0) {
    const assetFile = assetFiles.find(file => file.endsWith('.js'));
    if (assetFile) {
      const assetResponse = await makeRequest(`/assets/${assetFile}`);
      console.log(`Status code: ${assetResponse.statusCode}`);
      console.log(`Content-Type: ${assetResponse.headers['content-type']}`);
      console.log(`Data: ${assetResponse.data}`);
    }
  }

  console.log('\n✅ Server tests completed successfully');
} catch (error) {
  console.error('❌ Error testing the server:', error);
} finally {
  // Exit the process to stop the server
  process.exit(0);
}
