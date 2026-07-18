/**
 * Plugin Manager
 * Handles registration, discovery, and execution of plugins
 */

import { StructuredResponse } from '../response-handler';
import { Task } from '../agent/task-manager';
import { Session } from '../session-manager';

// Plugin types
export enum PluginType {
  TOOL = 'tool',
  PRESET = 'preset',
  TEMPLATE = 'template',
  TRANSFORMER = 'transformer',
  ANALYZER = 'analyzer',
  WORKFLOW = 'workflow'
}

// Trust levels for plugins
export enum PluginTrustLevel {
  OFFICIAL = 'official',    // Built-in or officially supported plugins
  TRUSTED = 'trusted',      // Verified by the platform
  COMMUNITY = 'community',  // Community plugins that haven't been verified
  LOCAL = 'local'           // Locally developed, not distributed
}

// Base interface for all plugins
export interface Plugin {
  id: string;
  name: string;
  description: string;
  version: string;
  author: string;
  type: PluginType;
  trustLevel: PluginTrustLevel;
  tags: string[];
  icon?: string;
  enabled: boolean;
}

// Tool plugin for adding new functionality
export interface ToolPlugin extends Plugin {
  type: PluginType.TOOL;
  execute: (input: any) => Promise<any>;
  inputSchema: any;  // JSON Schema for input validation
  outputSchema: any; // JSON Schema for output validation
  uiComponent?: string; // Component to render for this tool
}

// Preset plugin for quick start templates
export interface PresetPlugin extends Plugin {
  type: PluginType.PRESET;
  prompt: string;
  context?: string;
  description: string;
  previewImage?: string;
  category: string;
}

// Template plugin for project scaffolding
export interface TemplatePlugin extends Plugin {
  type: PluginType.TEMPLATE;
  files: Array<{path: string, content: string}>;
  variables: Array<{name: string, description: string, default?: string}>;
  applyTemplate: (variables: Record<string, string>) => Promise<Map<string, string>>;
}

// Transformer plugin for modifying code
export interface TransformerPlugin extends Plugin {
  type: PluginType.TRANSFORMER;
  supportedLanguages: string[];
  transform: (code: string, language: string, options?: any) => Promise<string>;
}

// Analyzer plugin for code analysis
export interface AnalyzerPlugin extends Plugin {
  type: PluginType.ANALYZER;
  supportedLanguages: string[];
  analyze: (code: string, language: string) => Promise<AnalysisResult>;
}

// Workflow plugin for multi-step processes
export interface WorkflowPlugin extends Plugin {
  type: PluginType.WORKFLOW;
  steps: WorkflowStep[];
  executeWorkflow: (initialInput: any) => Promise<any>;
}

// Types for analyzer results
export interface AnalysisResult {
  issues: Array<{
    type: 'error' | 'warning' | 'info',
    message: string,
    line?: number,
    column?: number,
    severity: number,
    fix?: {
      description: string,
      replacement: string
    }
  }>;
  metrics: Record<string, number>;
  summary: string;
}

// Types for workflow steps
export interface WorkflowStep {
  id: string;
  name: string;
  description: string;
  pluginId: string; // ID of plugin to execute
  inputMapping: Record<string, string>; // Maps workflow variables to plugin inputs
  outputMapping: Record<string, string>; // Maps plugin outputs to workflow variables
  condition?: string; // Expression to determine if this step should run
}

/**
 * Plugin Manager for loading, registering, and executing plugins
 */
export class PluginManager {
  private plugins: Map<string, Plugin> = new Map();
  private toolPlugins: Map<string, ToolPlugin> = new Map();
  private presetPlugins: Map<string, PresetPlugin> = new Map();
  private templatePlugins: Map<string, TemplatePlugin> = new Map();
  private transformerPlugins: Map<string, TransformerPlugin> = new Map();
  private analyzerPlugins: Map<string, AnalyzerPlugin> = new Map();
  private workflowPlugins: Map<string, WorkflowPlugin> = new Map();
  
  constructor() {
    // Register built-in plugins
    this.registerBuiltInPlugins();
  }
  
  /**
   * Register a plugin
   */
  registerPlugin(plugin: Plugin): void {
    // Check if plugin with same ID already exists
    if (this.plugins.has(plugin.id)) {
      console.warn(`Plugin with ID ${plugin.id} already registered. Skipping.`);
      return;
    }
    
    // Add to general plugins collection
    this.plugins.set(plugin.id, plugin);
    
    // Add to type-specific collection
    switch (plugin.type) {
      case PluginType.TOOL:
        this.toolPlugins.set(plugin.id, plugin as ToolPlugin);
        break;
      case PluginType.PRESET:
        this.presetPlugins.set(plugin.id, plugin as PresetPlugin);
        break;
      case PluginType.TEMPLATE:
        this.templatePlugins.set(plugin.id, plugin as TemplatePlugin);
        break;
      case PluginType.TRANSFORMER:
        this.transformerPlugins.set(plugin.id, plugin as TransformerPlugin);
        break;
      case PluginType.ANALYZER:
        this.analyzerPlugins.set(plugin.id, plugin as AnalyzerPlugin);
        break;
      case PluginType.WORKFLOW:
        this.workflowPlugins.set(plugin.id, plugin as WorkflowPlugin);
        break;
    }
    
    console.log(`Plugin "${plugin.name}" (${plugin.id}) registered successfully.`);
  }
  
  /**
   * Unregister a plugin
   */
  unregisterPlugin(pluginId: string): boolean {
    const plugin = this.plugins.get(pluginId);
    if (!plugin) {
      console.warn(`Plugin with ID ${pluginId} not found.`);
      return false;
    }
    
    // Remove from general collection
    this.plugins.delete(pluginId);
    
    // Remove from type-specific collection
    switch (plugin.type) {
      case PluginType.TOOL:
        this.toolPlugins.delete(pluginId);
        break;
      case PluginType.PRESET:
        this.presetPlugins.delete(pluginId);
        break;
      case PluginType.TEMPLATE:
        this.templatePlugins.delete(pluginId);
        break;
      case PluginType.TRANSFORMER:
        this.transformerPlugins.delete(pluginId);
        break;
      case PluginType.ANALYZER:
        this.analyzerPlugins.delete(pluginId);
        break;
      case PluginType.WORKFLOW:
        this.workflowPlugins.delete(pluginId);
        break;
    }
    
    console.log(`Plugin "${plugin.name}" (${pluginId}) unregistered successfully.`);
    return true;
  }
  
  /**
   * Get all registered plugins
   */
  getAllPlugins(): Plugin[] {
    return Array.from(this.plugins.values());
  }
  
  /**
   * Get plugins by type
   */
  getPluginsByType(type: PluginType): Plugin[] {
    switch (type) {
      case PluginType.TOOL:
        return Array.from(this.toolPlugins.values());
      case PluginType.PRESET:
        return Array.from(this.presetPlugins.values());
      case PluginType.TEMPLATE:
        return Array.from(this.templatePlugins.values());
      case PluginType.TRANSFORMER:
        return Array.from(this.transformerPlugins.values());
      case PluginType.ANALYZER:
        return Array.from(this.analyzerPlugins.values());
      case PluginType.WORKFLOW:
        return Array.from(this.workflowPlugins.values());
      default:
        return [];
    }
  }
  
  /**
   * Get a plugin by ID
   */
  getPlugin(pluginId: string): Plugin | undefined {
    return this.plugins.get(pluginId);
  }
  
  /**
   * Execute a tool plugin
   */
  async executeTool(pluginId: string, input: any): Promise<any> {
    const plugin = this.toolPlugins.get(pluginId);
    if (!plugin) {
      throw new Error(`Tool plugin with ID ${pluginId} not found.`);
    }
    
    if (!plugin.enabled) {
      throw new Error(`Tool plugin with ID ${pluginId} is disabled.`);
    }
    
    try {
      // Validate input
      // In a real implementation, we would validate against inputSchema
      
      // Execute the tool
      let result = await plugin.execute(input);
      
      // Validate output
      // In a real implementation, we would validate against outputSchema
      
      return result;
    } catch (error) {
      console.error(`Error executing tool plugin ${pluginId}:`, error);
      throw new Error(`Failed to execute tool: ${error instanceof Error ? error.message : String(error)}`);
    }
  }
  
  /**
   * Apply a transformer to code
   */
  async applyTransformer(
    pluginId: string, 
    code: string, 
    language: string, 
    options?: any
  ): Promise<string> {
    const plugin = this.transformerPlugins.get(pluginId);
    if (!plugin) {
      throw new Error(`Transformer plugin with ID ${pluginId} not found.`);
    }
    
    if (!plugin.enabled) {
      throw new Error(`Transformer plugin with ID ${pluginId} is disabled.`);
    }
    
    if (!plugin.supportedLanguages.includes(language) && !plugin.supportedLanguages.includes('*')) {
      throw new Error(`Language ${language} not supported by transformer ${pluginId}.`);
    }
    
    try {
      return await plugin.transform(code, language, options);
    } catch (error) {
      console.error(`Error applying transformer ${pluginId}:`, error);
      throw new Error(`Failed to transform code: ${error instanceof Error ? error.message : String(error)}`);
    }
  }
  
  /**
   * Analyze code using an analyzer plugin
   */
  async analyzeCode(
    pluginId: string, 
    code: string, 
    language: string
  ): Promise<AnalysisResult> {
    const plugin = this.analyzerPlugins.get(pluginId);
    if (!plugin) {
      throw new Error(`Analyzer plugin with ID ${pluginId} not found.`);
    }
    
    if (!plugin.enabled) {
      throw new Error(`Analyzer plugin with ID ${pluginId} is disabled.`);
    }
    
    if (!plugin.supportedLanguages.includes(language) && !plugin.supportedLanguages.includes('*')) {
      throw new Error(`Language ${language} not supported by analyzer ${pluginId}.`);
    }
    
    try {
      return await plugin.analyze(code, language);
    } catch (error) {
      console.error(`Error analyzing code with ${pluginId}:`, error);
      throw new Error(`Failed to analyze code: ${error instanceof Error ? error.message : String(error)}`);
    }
  }
  
  /**
   * Get preset prompts from preset plugins
   */
  getPresets(category?: string): PresetPlugin[] {
    let presets = Array.from(this.presetPlugins.values())
      .filter(preset => preset.enabled);
    
    if (category) {
      presets = presets.filter(preset => preset.category === category);
    }
    
    return presets;
  }
  
  /**
   * Apply a template to create a project
   */
  async applyTemplate(
    pluginId: string, 
    variables: Record<string, string>
  ): Promise<Map<string, string>> {
    const plugin = this.templatePlugins.get(pluginId);
    if (!plugin) {
      throw new Error(`Template plugin with ID ${pluginId} not found.`);
    }
    
    if (!plugin.enabled) {
      throw new Error(`Template plugin with ID ${pluginId} is disabled.`);
    }
    
    try {
      return await plugin.applyTemplate(variables);
    } catch (error) {
      console.error(`Error applying template ${pluginId}:`, error);
      throw new Error(`Failed to apply template: ${error instanceof Error ? error.message : String(error)}`);
    }
  }
  
  /**
   * Execute a workflow
   */
  async executeWorkflow(
    pluginId: string, 
    initialInput: any
  ): Promise<any> {
    const plugin = this.workflowPlugins.get(pluginId);
    if (!plugin) {
      throw new Error(`Workflow plugin with ID ${pluginId} not found.`);
    }
    
    if (!plugin.enabled) {
      throw new Error(`Workflow plugin with ID ${pluginId} is disabled.`);
    }
    
    try {
      return await plugin.executeWorkflow(initialInput);
    } catch (error) {
      console.error(`Error executing workflow ${pluginId}:`, error);
      throw new Error(`Failed to execute workflow: ${error instanceof Error ? error.message : String(error)}`);
    }
  }
  
  /**
   * Register built-in plugins
   */
  private registerBuiltInPlugins(): void {
    // Register some built-in tools
    
    // 1. CSS Optimizer Tool
    this.registerPlugin({
      id: 'built-in-css-optimizer',
      name: 'CSS Optimizer',
      description: 'Optimizes CSS code by removing duplicates, combining rules, and minifying',
      version: '1.0.0',
      author: 'Cyber-Prompt Builder',
      type: PluginType.TOOL,
      trustLevel: PluginTrustLevel.OFFICIAL,
      tags: ['css', 'optimization', 'web'],
      enabled: true,
      execute: async (input: { code: string, minify?: boolean }) => {
        const { code, minify = false } = input;
        
        // In a real implementation, this would actually optimize the CSS
        // For now, just return a simulated result
        return {
          optimizedCode: minify ? code.replace(/\s+/g, ' ').replace(/\s*:\s*/g, ':').replace(/\s*;\s*/g, ';') : code,
          stats: {
            originalSize: code.length,
            optimizedSize: minify ? code.replace(/\s+/g, ' ').replace(/\s*:\s*/g, ':').replace(/\s*;\s*/g, ';').length : code.length,
            reductionPercentage: 12.5, // Placeholder
          }
        };
      },
      inputSchema: {
        type: 'object',
        properties: {
          code: { type: 'string' },
          minify: { type: 'boolean' }
        },
        required: ['code']
      },
      outputSchema: {
        type: 'object',
        properties: {
          optimizedCode: { type: 'string' },
          stats: { 
            type: 'object',
            properties: {
              originalSize: { type: 'number' },
              optimizedSize: { type: 'number' },
              reductionPercentage: { type: 'number' }
            }
          }
        }
      }
    } as ToolPlugin);
    
    // 2. Lighthouse Audit Simulator
    this.registerPlugin({
      id: 'built-in-lighthouse-audit',
      name: 'Lighthouse Audit',
      description: 'Simulates a Lighthouse audit on your code to check for performance, accessibility, SEO, and best practices',
      version: '1.0.0',
      author: 'Cyber-Prompt Builder',
      type: PluginType.ANALYZER,
      trustLevel: PluginTrustLevel.OFFICIAL,
      tags: ['performance', 'accessibility', 'seo', 'web'],
      enabled: true,
      supportedLanguages: ['html'],
      analyze: async (code: string, language: string) => {
        // In a real implementation, this would actually run a Lighthouse audit
        // For now, return a simulated result
        return {
          issues: [
            {
              type: 'warning',
              message: 'Images do not have explicit width and height',
              line: 15,
              severity: 2,
              fix: {
                description: 'Add width and height attributes to image elements',
                replacement: '<img src="image.jpg" width="300" height="200" alt="Description">'
              }
            },
            {
              type: 'info',
              message: 'Consider adding meta description for better SEO',
              line: 5,
              severity: 1,
              fix: {
                description: 'Add meta description tag',
                replacement: '<meta name="description" content="Your page description here">'
              }
            }
          ],
          metrics: {
            performance: 85,
            accessibility: 90,
            bestPractices: 86,
            seo: 92
          },
          summary: 'Page is generally well-structured but has minor issues with image attributes and SEO meta tags'
        };
      }
    } as AnalyzerPlugin);
    
    // 3. React Converter
    this.registerPlugin({
      id: 'built-in-react-converter',
      name: 'Convert to React',
      description: 'Converts standard HTML/CSS/JS to React components',
      version: '1.0.0',
      author: 'Cyber-Prompt Builder',
      type: PluginType.TRANSFORMER,
      trustLevel: PluginTrustLevel.OFFICIAL,
      tags: ['react', 'conversion', 'web'],
      enabled: true,
      supportedLanguages: ['html', 'jsx'],
      transform: async (code: string, language: string, options?: any) => {
        // In a real implementation, this would actually convert HTML to React
        // For now, just return a simulated React component
        if (language === 'html') {
          return `
import React from 'react';
import './styles.css';

export function MyComponent() {
  return (
    <div className="container">
      {/* Converted from HTML */}
      ${code.replace(/<script.*?>(.*?)<\/script>/gsi, '')
            .replace(/<style.*?>(.*?)<\/style>/gsi, '')}
    </div>
  );
}`;
        }
        return code;
      }
    } as TransformerPlugin);
    
    // 4. A sample project template
    this.registerPlugin({
      id: 'built-in-react-starter',
      name: 'React Starter',
      description: 'A minimal React starter template with TypeScript, Vite, and TailwindCSS',
      version: '1.0.0',
      author: 'Cyber-Prompt Builder',
      type: PluginType.TEMPLATE,
      trustLevel: PluginTrustLevel.OFFICIAL,
      tags: ['react', 'typescript', 'vite', 'tailwind'],
      enabled: true,
      files: [
        // This would normally contain all template files
        { path: 'src/App.tsx', content: 'export default function App() { return <div>Hello World</div>; }' }
      ],
      variables: [
        { name: 'projectName', description: 'Name of the project', default: 'react-app' },
        { name: 'description', description: 'Project description' }
      ],
      applyTemplate: async (variables: Record<string, string>) => {
        // In a real implementation, this would generate all project files
        // For now, return a simplified set of files
        const files = new Map<string, string>();
        
        files.set('package.json', JSON.stringify({
          name: variables.projectName || 'react-app',
          version: '0.1.0',
          description: variables.description || 'A React application',
          dependencies: {
            'react': '^18.2.0',
            'react-dom': '^18.2.0'
          },
          devDependencies: {
            'typescript': '^5.0.0',
            'vite': '^4.0.0'
          }
        }, null, 2));
        
        files.set('src/App.tsx', `
import React from 'react';
import './App.css';

function App() {
  return (
    <div className="App">
      <header className="App-header">
        <h1>${variables.projectName || 'React App'}</h1>
        <p>${variables.description || 'A React application'}</p>
      </header>
    </div>
  );
}

export default App;
`);
        
        return files;
      }
    } as TemplatePlugin);
    
    // 5. React Project Workflow
    this.registerPlugin({
      id: 'built-in-react-workflow',
      name: 'Build React App',
      description: 'A workflow to create and set up a complete React application',
      version: '1.0.0',
      author: 'Cyber-Prompt Builder',
      type: PluginType.WORKFLOW,
      trustLevel: PluginTrustLevel.OFFICIAL,
      tags: ['react', 'workflow', 'project'],
      enabled: true,
      steps: [
        {
          id: 'step1',
          name: 'Create Project',
          description: 'Create the basic project structure',
          pluginId: 'built-in-react-starter',
          inputMapping: {
            'projectName': 'projectName',
            'description': 'description'
          },
          outputMapping: {
            'files': 'templateFiles'
          }
        },
        {
          id: 'step2',
          name: 'Optimize CSS',
          description: 'Optimize the CSS code',
          pluginId: 'built-in-css-optimizer',
          inputMapping: {
            'code': 'cssCode',
            'minify': 'shouldMinify'
          },
          outputMapping: {
            'optimizedCode': 'optimizedCss'
          },
          condition: 'hasCss'
        }
      ],
      executeWorkflow: async (initialInput: any) => {
        // In a real implementation, this would execute all steps in sequence
        // For now, return a simulated result
        return {
          success: true,
          result: {
            files: new Map<string, string>([
              ['package.json', '{}'],
              ['src/App.tsx', 'function App() { return <div>Hello World</div>; }'],
              ['src/App.css', '.App { text-align: center; }']
            ]),
            stats: {
              steps: 2,
              completed: 2,
              duration: 1250
            }
          }
        };
      }
    } as WorkflowPlugin);
  }
}

// Export singleton instance
export const pluginManager = new PluginManager();