/**
 * Configuration Service
 * Handles loading and validating environment variables and configuration
 */

import { Logger } from '../logging/logger';
import { errorHandler, ValidationError } from '../error/error-handler';

// Configuration schema types
export type ConfigValueType = 'string' | 'number' | 'boolean' | 'json';

// Configuration value definition
export interface ConfigValueDefinition {
  key: string;
  type: ConfigValueType;
  required: boolean;
  default?: string | number | boolean | Record<string, unknown>;
  description?: string;
  sensitive?: boolean; // Whether this is sensitive data like API keys
  validator?: (value: unknown) => boolean;
}

// Configuration schema
export interface ConfigSchema {
  [category: string]: {
    description?: string;
    values: ConfigValueDefinition[];
  };
}

// Configuration value with metadata
export interface ConfigValue<T = unknown> {
  value: T;
  source: 'env' | 'default' | 'override';
  sensitive: boolean;
}

// Configuration service
export class ConfigService {
  private static instance: ConfigService;
  private logger: Logger;
  private schema: ConfigSchema = {};
  private config: Record<string, Record<string, ConfigValue>> = {};
  private initialized = false;

  private constructor() {
    this.logger = new Logger('ConfigService');
  }

  // Get singleton instance
  public static getInstance(): ConfigService {
    if (!ConfigService.instance) {
      ConfigService.instance = new ConfigService();
    }
    return ConfigService.instance;
  }

  // Register configuration schema
  public registerSchema(schema: ConfigSchema): void {
    this.schema = { ...this.schema, ...schema };
    this.logger.debug('Configuration schema registered', { categories: Object.keys(schema) });
  }

  // Initialize configuration from environment variables
  public initialize(): void {
    if (this.initialized) {
      this.logger.warn('Configuration already initialized');
      return;
    }

    this.logger.info('Initializing configuration');
    
    try {
      // Process each category in the schema
      for (const [category, categorySchema] of Object.entries(this.schema)) {
        this.config[category] = {};
        
        // Process each value in the category
        for (const valueDef of categorySchema.values) {
          const { key, type, required, default: defaultValue, sensitive } = valueDef;
          
          // Try to get from environment
          const envKey = `REACT_APP_${category.toUpperCase()}_${key.toUpperCase()}`;
          const envValue = process.env[envKey];
          
          if (envValue !== undefined) {
            // Value found in environment
            const parsedValue = this.parseValue(envValue, type);
            
            // Validate if validator provided
            if (valueDef.validator && !valueDef.validator(parsedValue)) {
              throw new ValidationError(`Invalid value for ${category}.${key}`, undefined, {
                key: envKey,
                type
              });
            }
            
            this.config[category][key] = {
              value: parsedValue,
              source: 'env',
              sensitive: sensitive || false
            };
            
            this.logger.debug(`Loaded config ${category}.${key} from environment`);
          } else if (defaultValue !== undefined) {
            // Use default value
            this.config[category][key] = {
              value: defaultValue,
              source: 'default',
              sensitive: sensitive || false
            };
            
            this.logger.debug(`Using default value for ${category}.${key}`);
          } else if (required) {
            // Missing required value
            throw new ValidationError(`Missing required configuration value: ${category}.${key}`, undefined, {
              key: envKey
            });
          }
        }
      }
      
      this.initialized = true;
      this.logger.info('Configuration initialized successfully');
    } catch (error) {
      this.logger.error('Failed to initialize configuration', { error });
      errorHandler.handleError(error as Error, { context: 'ConfigService.initialize' });
      throw error;
    }
  }

  // Parse string value to the correct type
  private parseValue(value: string, type: ConfigValueType): unknown {
    try {
      let num: number;
      let lowerValue: string;
      
      switch (type) {
        case 'string':
          return value;
        case 'number':
          num = Number(value);
          if (isNaN(num)) {
            throw new Error(`Cannot parse "${value}" as a number`);
          }
          return num;
        case 'boolean':
          lowerValue = value.toLowerCase();
          if (['true', '1', 'yes', 'y'].includes(lowerValue)) {
            return true;
          }
          if (['false', '0', 'no', 'n'].includes(lowerValue)) {
            return false;
          }
          throw new Error(`Cannot parse "${value}" as a boolean`);
        case 'json':
          return JSON.parse(value);
        default:
          return value;
      }
    } catch (error) {
      throw new ValidationError(`Failed to parse configuration value: ${value} as ${type}`, error as Error);
    }
  }

  // Get a configuration value
  public get<T>(category: string, key: string): T {
    if (!this.initialized) {
      this.initialize();
    }
    
    const categoryConfig = this.config[category];
    if (!categoryConfig) {
      throw new ValidationError(`Configuration category not found: ${category}`);
    }
    
    const configValue = categoryConfig[key];
    if (!configValue) {
      throw new ValidationError(`Configuration value not found: ${category}.${key}`);
    }
    
    return configValue.value as T;
  }

  // Set a configuration value (override)
  public set<T>(category: string, key: string, value: T): void {
    if (!this.initialized) {
      this.initialize();
    }
    
    // Ensure category exists
    if (!this.config[category]) {
      this.config[category] = {};
    }
    
    // Get definition if available
    const definition = this.schema[category]?.values.find(v => v.key === key);
    
    // Validate if validator provided
    if (definition?.validator && !definition.validator(value)) {
      throw new ValidationError(`Invalid value for ${category}.${key}`);
    }
    
    // Set the value
    this.config[category][key] = {
      value,
      source: 'override',
      sensitive: definition?.sensitive || false
    };
    
    this.logger.debug(`Configuration value ${category}.${key} overridden`);
  }

  // Get all configuration values (excluding sensitive ones by default)
  public getAll(includeSensitive = false): Record<string, Record<string, unknown>> {
    if (!this.initialized) {
      this.initialize();
    }
    
    const result: Record<string, Record<string, unknown>> = {};
    
    for (const [category, values] of Object.entries(this.config)) {
      result[category] = {};
      
      for (const [key, configValue] of Object.entries(values)) {
        if (includeSensitive || !configValue.sensitive) {
          result[category][key] = configValue.value;
        }
      }
    }
    
    return result;
  }

  // Check if configuration is initialized
  public isInitialized(): boolean {
    return this.initialized;
  }

  // Reset configuration (for testing)
  public reset(): void {
    this.config = {};
    this.initialized = false;
    this.logger.debug('Configuration reset');
  }
}

// Export singleton instance
export const configService = ConfigService.getInstance();

// Default configuration schema
const defaultSchema: ConfigSchema = {
  app: {
    description: 'General application settings',
    values: [
      {
        key: 'environment',
        type: 'string',
        required: false,
        default: 'development',
        description: 'Application environment (development, test, production)'
      },
      {
        key: 'debug',
        type: 'boolean',
        required: false,
        default: false,
        description: 'Enable debug mode'
      }
    ]
  },
  providers: {
    description: 'AI provider settings',
    values: [
      {
        key: 'openai_api_key',
        type: 'string',
        required: false,
        sensitive: true,
        description: 'OpenAI API key'
      },
      {
        key: 'claude_api_key',
        type: 'string',
        required: false,
        sensitive: true,
        description: 'Claude API key'
      },
      {
        key: 'gemini_api_key',
        type: 'string',
        required: false,
        sensitive: true,
        description: 'Gemini API key'
      },
      {
        key: 'default_provider',
        type: 'string',
        required: false,
        default: 'openai',
        description: 'Default AI provider'
      }
    ]
  },
  agent: {
    description: 'Agent settings',
    values: [
      {
        key: 'max_iterations',
        type: 'number',
        required: false,
        default: 3,
        description: 'Maximum number of iterations for agent tasks'
      },
      {
        key: 'enable_task_breakdown',
        type: 'boolean',
        required: false,
        default: true,
        description: 'Enable task breakdown'
      },
      {
        key: 'enable_iteration',
        type: 'boolean',
        required: false,
        default: true,
        description: 'Enable iteration'
      },
      {
        key: 'enable_context_memory',
        type: 'boolean',
        required: false,
        default: true,
        description: 'Enable context memory'
      }
    ]
  },
  memory: {
    description: 'Memory engine settings',
    values: [
      {
        key: 'db_endpoint',
        type: 'string',
        required: false,
        default: 'localhost:8000',
        description: 'Memory database endpoint'
      },
      {
        key: 'collection_name',
        type: 'string',
        required: false,
        default: 'ai_assistant_memory',
        description: 'Memory collection name'
      }
    ]
  },
  logging: {
    description: 'Logging settings',
    values: [
      {
        key: 'level',
        type: 'string',
        required: false,
        default: 'info',
        description: 'Logging level (debug, info, warn, error, critical)',
        validator: (value) => ['debug', 'info', 'warn', 'error', 'critical'].includes(value as string)
      },
      {
        key: 'enable_local_storage',
        type: 'boolean',
        required: false,
        default: true,
        description: 'Enable logging to local storage'
      }
    ]
  }
};

// Register default schema
configService.registerSchema(defaultSchema);