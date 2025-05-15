import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

// Get the current directory
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Define the directories to process
const directories = [
  'frontend',
  'backend',
  'shared'
];

// Define the import path mappings
const importMappings = [
  { from: '@/components', to: '@frontend/components' },
  { from: '@/hooks', to: '@frontend/hooks' },
  { from: '@/pages', to: '@frontend/pages' },
  { from: '@/ui', to: '@frontend/ui' },
  { from: '@/services', to: '@backend/services' },
  { from: '@/core', to: '@backend/core' },
  { from: '@/integrations', to: '@backend/integrations' },
  { from: '@/lib', to: '@shared/lib' },
  { from: '@/interfaces', to: '@shared/interfaces' },
  { from: '@/types', to: '@shared/types' },
  { from: './components', to: './components' }, // Keep relative imports as is
  { from: './hooks', to: './hooks' }, // Keep relative imports as is
  { from: './pages', to: './pages' }, // Keep relative imports as is
  { from: './services', to: './services' }, // Keep relative imports as is
];

// Function to process a file
function processFile(filePath) {
  // Only process TypeScript and TSX files
  if (!filePath.endsWith('.ts') && !filePath.endsWith('.tsx')) {
    return;
  }

  console.log(`Processing ${filePath}`);
  
  try {
    let content = fs.readFileSync(filePath, 'utf8');
    let modified = false;

    // Apply each mapping
    importMappings.forEach(mapping => {
      const regex = new RegExp(`from ['"]${mapping.from}`, 'g');
      if (regex.test(content)) {
        content = content.replace(regex, `from '${mapping.to}`);
        modified = true;
      }
    });

    // Save the file if it was modified
    if (modified) {
      fs.writeFileSync(filePath, content, 'utf8');
      console.log(`Updated imports in ${filePath}`);
    }
  } catch (error) {
    console.error(`Error processing ${filePath}:`, error);
  }
}

// Function to recursively process a directory
function processDirectory(directoryPath) {
  const items = fs.readdirSync(directoryPath);
  
  items.forEach(item => {
    const itemPath = path.join(directoryPath, item);
    const stats = fs.statSync(itemPath);
    
    if (stats.isDirectory()) {
      processDirectory(itemPath);
    } else {
      processFile(itemPath);
    }
  });
}

// Process each directory
directories.forEach(dir => {
  console.log(`Processing directory: ${dir}`);
  processDirectory(dir);
});

console.log('Import paths update completed!');