import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

console.log('Checking build output...');

// Check if dist directory exists
const distPath = path.join(__dirname, 'dist');
console.log(`Checking if dist directory exists at: ${distPath}`);

if (!fs.existsSync(distPath)) {
  console.error('❌ dist directory does not exist!');
  process.exit(1);
}

console.log('✅ dist directory exists');

// Check if index.html exists
const indexPath = path.join(distPath, 'index.html');
console.log(`Checking if index.html exists at: ${indexPath}`);

if (!fs.existsSync(indexPath)) {
  console.error('❌ index.html does not exist in dist directory!');
  process.exit(1);
}

console.log('✅ index.html exists');

// Read index.html content
const indexContent = fs.readFileSync(indexPath, 'utf-8');
console.log('index.html content length:', indexContent.length);

// Check if it contains a root element
if (!indexContent.includes('id="root"')) {
  console.error('❌ index.html does not contain a root element!');
  process.exit(1);
}

console.log('✅ index.html contains a root element');

// Check for JavaScript files
const jsFiles = fs.readdirSync(distPath).filter(file => file.endsWith('.js'));
console.log(`Found ${jsFiles.length} JavaScript files in dist directory`);

if (jsFiles.length === 0) {
  console.error('❌ No JavaScript files found in dist directory!');
  process.exit(1);
}

console.log('✅ JavaScript files exist');

// Check for CSS files
const cssFiles = fs.readdirSync(distPath).filter(file => file.endsWith('.css'));
console.log(`Found ${cssFiles.length} CSS files in dist directory`);

// List all files in dist directory
console.log('\nFiles in dist directory:');
listFilesRecursively(distPath);

console.log('\n✅ Build output check completed successfully');

// Function to list files recursively
function listFilesRecursively(dir, indent = '') {
  const files = fs.readdirSync(dir);
  
  files.forEach(file => {
    const filePath = path.join(dir, file);
    const stats = fs.statSync(filePath);
    
    if (stats.isDirectory()) {
      console.log(`${indent}📁 ${file}/`);
      listFilesRecursively(filePath, indent + '  ');
    } else {
      const sizeInKB = Math.round(stats.size / 1024 * 100) / 100;
      console.log(`${indent}📄 ${file} (${sizeInKB} KB)`);
    }
  });
}
