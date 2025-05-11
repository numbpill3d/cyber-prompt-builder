/**
 * Deployment Service
 * Handles Vercel deployment, GitHub integration, and other deployment options
 */

import { StructuredResponse, generateStandaloneHtml } from './response-handler';
import { Session } from './session-manager';

// GitHub authentication types
export interface GitHubCredentials {
  type: 'oauth' | 'token';
  token?: string; // Personal Access Token
  oauthToken?: string; // OAuth Token
}

// Repository creation options
export interface GitHubRepoOptions {
  name: string;
  description?: string;
  isPrivate: boolean;
  addReadme: boolean;
  addLicense?: 'mit' | 'apache' | 'gpl' | 'none';
}

// Vercel deployment options
export interface VercelDeployOptions {
  projectName: string;
  framework?: 'static' | 'react' | 'next' | 'vue' | 'svelte'; // Default: 'static'
  envVars?: Record<string, string>; // Environment variables
  directory?: string; // Directory to deploy (default: project root)
  team?: string; // Team ID for team projects
}

// Template options for project export
export interface TemplateOptions {
  includeLicense: boolean;
  includeReadme: boolean;
  includeEnvExample: boolean;
  includeGitignore: boolean;
  includePackageJson: boolean;
  projectType: 'static' | 'react' | 'vue' | 'node' | 'other';
}

/**
 * Deployment service for GitHub and Vercel integrations
 */
export class DeploymentService {
  private githubCredentials: GitHubCredentials | null = null;
  private vercelToken: string | null = null;
  
  /**
   * Set GitHub credentials
   */
  setGitHubCredentials(credentials: GitHubCredentials): void {
    this.githubCredentials = credentials;
  }
  
  /**
   * Check if GitHub is authenticated
   */
  isGitHubAuthenticated(): boolean {
    return !!this.githubCredentials && 
      !!(this.githubCredentials.token || this.githubCredentials.oauthToken);
  }
  
  /**
   * Set Vercel API token
   */
  setVercelToken(token: string): void {
    this.vercelToken = token;
  }
  
  /**
   * Check if Vercel is authenticated
   */
  isVercelAuthenticated(): boolean {
    return !!this.vercelToken;
  }
  
  /**
   * Deploy to Vercel
   */
  async deployToVercel(
    response: StructuredResponse,
    options: VercelDeployOptions
  ): Promise<{ success: boolean; deployUrl?: string; error?: string }> {
    // Check if authenticated
    if (!this.isVercelAuthenticated()) {
      return {
        success: false,
        error: 'Not authenticated with Vercel. Please set your Vercel API token.'
      };
    }
    
    try {
      // Prepare the files to be deployed
      const deployFiles = this.prepareFilesForDeployment(response, options);
      
      // In a real implementation, this would call the Vercel API
      // For this prototype, we'll simulate a successful deployment
      
      // Simulate API call delay
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      // Generate a simulated deployment URL
      const deployUrl = `https://${options.projectName.toLowerCase().replace(/[^a-z0-9]/g, '-')}.vercel.app`;
      
      return {
        success: true,
        deployUrl
      };
    } catch (error) {
      console.error('Error deploying to Vercel:', error);
      return {
        success: false,
        error: `Failed to deploy to Vercel: ${error instanceof Error ? error.message : String(error)}`
      };
    }
  }
  
  /**
   * Push to GitHub
   */
  async pushToGitHub(
    response: StructuredResponse,
    options: GitHubRepoOptions,
    originalPrompt?: string
  ): Promise<{ success: boolean; repoUrl?: string; error?: string }> {
    // Check if authenticated
    if (!this.isGitHubAuthenticated()) {
      return {
        success: false,
        error: 'Not authenticated with GitHub. Please set your GitHub credentials.'
      };
    }
    
    try {
      // Prepare the files to be pushed
      const repoFiles = this.prepareFilesForGitHub(response, options, originalPrompt);
      
      // In a real implementation, this would call the GitHub API
      // For this prototype, we'll simulate a successful push
      
      // Simulate API call delay
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      // Generate a simulated repository URL
      const repoUrl = `https://github.com/username/${options.name}`;
      
      return {
        success: true,
        repoUrl
      };
    } catch (error) {
      console.error('Error pushing to GitHub:', error);
      return {
        success: false,
        error: `Failed to push to GitHub: ${error instanceof Error ? error.message : String(error)}`
      };
    }
  }
  
  /**
   * Generate a README from a prompt and code
   */
  generateReadme(
    response: StructuredResponse,
    originalPrompt?: string,
    sessionInfo?: Partial<Session>
  ): string {
    const title = originalPrompt 
      ? originalPrompt.split('\n')[0].substring(0, 50)
      : 'Generated Project';
    
    const codeLanguages = Object.keys(response.codeBlocks);
    const hasWeb = codeLanguages.includes('html') || codeLanguages.includes('css') || codeLanguages.includes('js');
    
    let readme = `# ${title}\n\n`;
    
    // Add description
    if (originalPrompt) {
      readme += `## Description\n\n${originalPrompt.substring(0, 300)}${originalPrompt.length > 300 ? '...' : ''}\n\n`;
    }
    
    // Add technologies used
    readme += '## Technologies Used\n\n';
    if (codeLanguages.length > 0) {
      codeLanguages.forEach(lang => {
        const langDisplay = {
          'js': 'JavaScript',
          'ts': 'TypeScript',
          'html': 'HTML',
          'css': 'CSS',
          'python': 'Python',
          'java': 'Java',
          'c': 'C',
          'cpp': 'C++',
          'cs': 'C#',
          'go': 'Go',
          'rust': 'Rust',
          'php': 'PHP',
          'ruby': 'Ruby'
        }[lang] || lang.charAt(0).toUpperCase() + lang.slice(1);
        
        readme += `- ${langDisplay}\n`;
      });
    } else {
      readme += '- N/A\n';
    }
    
    // Add setup instructions
    readme += '\n## Setup and Usage\n\n';
    
    if (hasWeb) {
      readme += `### Running Locally

1. Clone this repository
2. Open the \`index.html\` file in your browser

### Development

- Edit the HTML, CSS, and JavaScript files as needed
- No build step required for basic usage
`;
    } else if (codeLanguages.includes('python')) {
      readme += `### Setup

1. Clone this repository
2. Install dependencies: \`pip install -r requirements.txt\` (if applicable)
3. Run the script: \`python main.py\`
`;
    } else {
      readme += `### Setup

1. Clone this repository
2. Follow standard setup procedures for the included languages/frameworks
`;
    }
    
    // Add AI metadata
    if (response.meta) {
      readme += '\n## AI Generation Info\n\n';
      readme += `- Generated with: ${response.meta.provider} (${response.meta.model})\n`;
      readme += `- Generated on: ${new Date(response.meta.timestamp).toLocaleDateString()}\n`;
      
      if (sessionInfo?.iterations?.length) {
        readme += `- Iterations: ${sessionInfo.iterations.length}\n`;
      }
    }
    
    // Add license
    readme += '\n## License\n\nMIT\n';
    
    return readme;
  }
  
  /**
   * Create a downloadable template bundle with good practices
   */
  async createTemplateBundle(
    response: StructuredResponse,
    options: TemplateOptions,
    originalPrompt?: string
  ): Promise<Blob> {
    // In a real implementation, this would create a ZIP file with proper templates
    // For this prototype, we'll prepare the file content but not actually create the ZIP
    
    const files = new Map<string, string>();
    
    // Add code files from the response
    Object.entries(response.codeBlocks).forEach(([lang, code]) => {
      const fileName = this.getDefaultFileName(lang, options.projectType);
      files.set(fileName, code);
    });
    
    // Add README if requested
    if (options.includeReadme) {
      const readme = this.generateReadme(response, originalPrompt);
      files.set('README.md', readme);
    }
    
    // Add .gitignore if requested
    if (options.includeGitignore) {
      files.set('.gitignore', this.generateGitignore(options.projectType));
    }
    
    // Add license if requested
    if (options.includeLicense) {
      files.set('LICENSE', this.generateMITLicense());
    }
    
    // Add .env.example if requested
    if (options.includeEnvExample) {
      files.set('.env.example', this.generateEnvExample(options.projectType));
    }
    
    // Add package.json if requested
    if (options.includePackageJson && (options.projectType === 'react' || options.projectType === 'vue' || options.projectType === 'node')) {
      files.set('package.json', this.generatePackageJson(options.projectType, originalPrompt));
    }
    
    // In a real implementation, this would create a ZIP file
    // For now, we'll return a placeholder Blob
    return new Blob(['ZIP file placeholder'], { type: 'application/zip' });
  }
  
  /**
   * Generate a .gitignore file
   */
  private generateGitignore(projectType: string): string {
    let content = `# System files
.DS_Store
Thumbs.db

# Editor directories and files
.idea/
.vscode/
*.suo
*.ntvs*
*.njsproj
*.sln
`;
    
    // Add project-specific ignores
    switch (projectType) {
      case 'node':
      case 'react':
      case 'vue':
        content += `
# Node.js
node_modules/
npm-debug.log
yarn-debug.log
yarn-error.log
package-lock.json
yarn.lock

# Environment variables
.env
.env.local
.env.development.local
.env.test.local
.env.production.local

# Build output
/dist
/build
`;
        break;
        
      case 'python':
        content += `
# Python
__pycache__/
*.py[cod]
*$py.class
*.so
.Python
env/
build/
develop-eggs/
dist/
downloads/
eggs/
.eggs/
lib/
lib64/
parts/
sdist/
var/
*.egg-info/
.installed.cfg
*.egg
venv/
ENV/
`;
        break;
    }
    
    return content;
  }
  
  /**
   * Generate an MIT license
   */
  private generateMITLicense(): string {
    const currentYear = new Date().getFullYear();
    
    return `MIT License

Copyright (c) ${currentYear}

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE.`;
  }
  
  /**
   * Generate a .env.example file
   */
  private generateEnvExample(projectType: string): string {
    // Default comments
    let content = `# Environment Variables
# Copy this file to .env and fill in your values

`;
    
    // Add project-specific variables
    switch (projectType) {
      case 'node':
        content += `# Server Configuration
PORT=3000
NODE_ENV=development

# Database Configuration
DB_HOST=localhost
DB_PORT=5432
DB_USER=postgres
DB_PASSWORD=postgres
DB_NAME=mydatabase

# API Keys (Replace with your actual keys)
API_KEY=your_api_key_here
`;
        break;
        
      case 'react':
      case 'vue':
        content += `# API Configuration
VITE_API_URL=http://localhost:3000/api
VITE_APP_ENV=development

# Feature Flags
VITE_ENABLE_ANALYTICS=false
VITE_ENABLE_DARK_MODE=true
`;
        break;
        
      case 'python':
        content += `# Application Settings
DEBUG=True
SECRET_KEY=your_secret_key_here

# Database Settings
DATABASE_URL=sqlite:///db.sqlite3

# API Keys
API_KEY=your_api_key_here
`;
        break;
        
      default:
        content += `# Add your environment variables here
API_KEY=your_api_key_here
DEBUG=true
`;
    }
    
    return content;
  }
  
  /**
   * Generate a basic package.json
   */
  private generatePackageJson(projectType: string, projectDescription?: string): string {
    const name = projectDescription 
      ? projectDescription.substring(0, 20).toLowerCase().replace(/[^a-z0-9]/g, '-')
      : 'generated-project';
    
    const description = projectDescription 
      ? projectDescription.substring(0, 100)
      : 'Generated project';
    
    let packageJson: any = {
      name,
      version: '0.1.0',
      description,
      private: true,
      scripts: {
        start: 'echo "No start script defined"'
      },
      dependencies: {},
      devDependencies: {}
    };
    
    // Add project-specific configs
    switch (projectType) {
      case 'react':
        packageJson.scripts = {
          dev: 'vite',
          build: 'vite build',
          preview: 'vite preview'
        };
        packageJson.dependencies = {
          'react': '^18.2.0',
          'react-dom': '^18.2.0'
        };
        packageJson.devDependencies = {
          '@types/react': '^18.2.0',
          '@types/react-dom': '^18.2.0',
          '@vitejs/plugin-react': '^4.0.0',
          'typescript': '^5.0.0',
          'vite': '^4.0.0'
        };
        break;
        
      case 'vue':
        packageJson.scripts = {
          dev: 'vite',
          build: 'vite build',
          preview: 'vite preview'
        };
        packageJson.dependencies = {
          'vue': '^3.3.0'
        };
        packageJson.devDependencies = {
          '@vitejs/plugin-vue': '^4.0.0',
          'typescript': '^5.0.0',
          'vite': '^4.0.0'
        };
        break;
        
      case 'node':
        packageJson.main = 'index.js';
        packageJson.scripts = {
          start: 'node index.js',
          dev: 'nodemon index.js'
        };
        packageJson.dependencies = {
          'express': '^4.18.0'
        };
        packageJson.devDependencies = {
          'nodemon': '^2.0.0'
        };
        break;
    }
    
    return JSON.stringify(packageJson, null, 2);
  }
  
  /**
   * Prepare files for Vercel deployment
   */
  private prepareFilesForDeployment(
    response: StructuredResponse,
    options: VercelDeployOptions
  ): Map<string, string> {
    const files = new Map<string, string>();
    
    // Convert code blocks to files
    Object.entries(response.codeBlocks).forEach(([lang, code]) => {
      const fileName = this.getDefaultFileName(lang, options.framework || 'static');
      files.set(fileName, code);
    });
    
    // If we have HTML, CSS, and JS but no index.html, create a combined file
    if (!files.has('index.html') && response.codeBlocks['html'] && 
        (response.codeBlocks['css'] || response.codeBlocks['js'])) {
      const html = generateStandaloneHtml(response);
      files.set('index.html', html);
    }
    
    // For React/Next.js, add necessary configuration files
    if (options.framework === 'react' || options.framework === 'next') {
      files.set('package.json', this.generatePackageJson(options.framework));
      files.set('tsconfig.json', this.generateTsConfig(options.framework));
      files.set('vite.config.ts', this.generateViteConfig(options.framework));
    }
    
    return files;
  }
  
  /**
   * Prepare files for GitHub repository
   */
  private prepareFilesForGitHub(
    response: StructuredResponse,
    options: GitHubRepoOptions,
    originalPrompt?: string
  ): Map<string, string> {
    const files = new Map<string, string>();
    
    // Convert code blocks to files
    Object.entries(response.codeBlocks).forEach(([lang, code]) => {
      const fileName = this.getDefaultFileName(lang);
      files.set(fileName, code);
    });
    
    // Add README if requested
    if (options.addReadme) {
      const readme = this.generateReadme(response, originalPrompt);
      files.set('README.md', readme);
    }
    
    // Add license if requested
    if (options.addLicense && options.addLicense !== 'none') {
      const license = this.generateMITLicense(); // Currently only supporting MIT
      files.set('LICENSE', license);
    }
    
    // Add .gitignore
    files.set('.gitignore', this.generateGitignore('static'));
    
    return files;
  }
  
  /**
   * Get default filename for a language
   */
  private getDefaultFileName(lang: string, projectType: string = 'static'): string {
    const fileMap: Record<string, string> = {
      'html': 'index.html',
      'css': 'styles.css',
      'js': 'script.js',
      'ts': 'script.ts',
      'jsx': 'App.jsx',
      'tsx': 'App.tsx',
      'python': 'main.py',
      'py': 'main.py',
      'java': 'Main.java',
      'c': 'main.c',
      'cpp': 'main.cpp',
      'cs': 'Program.cs',
      'go': 'main.go',
      'rust': 'main.rs',
      'rs': 'main.rs',
      'php': 'index.php',
      'ruby': 'main.rb',
      'rb': 'main.rb',
      'markdown': 'README.md',
      'md': 'README.md',
      'json': 'data.json',
      'yaml': 'config.yaml',
      'yml': 'config.yml',
      'bash': 'script.sh',
      'sh': 'script.sh',
      'sql': 'queries.sql'
    };
    
    // For React/Vue projects, use framework-specific paths
    if (projectType === 'react' || projectType === 'next') {
      if (lang === 'html') return 'index.html';
      if (lang === 'css') return 'src/styles.css';
      if (lang === 'js') return 'src/main.jsx';
      if (lang === 'ts') return 'src/main.tsx';
      if (lang === 'jsx') return 'src/App.jsx';
      if (lang === 'tsx') return 'src/App.tsx';
    } else if (projectType === 'vue') {
      if (lang === 'html') return 'index.html';
      if (lang === 'css') return 'src/styles.css';
      if (lang === 'js') return 'src/main.js';
      if (lang === 'ts') return 'src/main.ts';
    }
    
    return fileMap[lang] || `file.${lang}`;
  }
  
  /**
   * Generate a basic tsconfig.json for TypeScript projects
   */
  private generateTsConfig(projectType: string): string {
    if (projectType === 'react' || projectType === 'next') {
      return JSON.stringify({
        "compilerOptions": {
          "target": "ES2020",
          "useDefineForClassFields": true,
          "lib": ["ES2020", "DOM", "DOM.Iterable"],
          "module": "ESNext",
          "skipLibCheck": true,
          "moduleResolution": "bundler",
          "allowImportingTsExtensions": true,
          "resolveJsonModule": true,
          "isolatedModules": true,
          "noEmit": true,
          "jsx": "react-jsx",
          "strict": true,
          "noUnusedLocals": true,
          "noUnusedParameters": true,
          "noFallthroughCasesInSwitch": true
        },
        "include": ["src"],
        "references": [{ "path": "./tsconfig.node.json" }]
      }, null, 2);
    }
    
    return JSON.stringify({
      "compilerOptions": {
        "target": "ES2020",
        "module": "ESNext",
        "moduleResolution": "node",
        "strict": true,
        "esModuleInterop": true,
        "skipLibCheck": true,
        "forceConsistentCasingInFileNames": true
      },
      "include": ["src/**/*.ts"],
      "exclude": ["node_modules"]
    }, null, 2);
  }
  
  /**
   * Generate a basic vite.config.ts
   */
  private generateViteConfig(projectType: string): string {
    if (projectType === 'react') {
      return `import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
})`;
    } else if (projectType === 'vue') {
      return `import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'

export default defineConfig({
  plugins: [vue()],
})`;
    }
    
    return `import { defineConfig } from 'vite'

export default defineConfig({
  // Vite configuration
})`;
  }
}

// Export singleton instance
export const deploymentService = new DeploymentService();