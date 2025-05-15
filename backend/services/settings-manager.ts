/**
 * Settings Manager
 * Handles user preferences and API key storage
 */

import { TTSSettings } from './tts/tts-types';
import { Logger } from './logging/logger';
import { errorHandler, ValidationError } from './error/error-handler';
import { configService } from './config/config-service';

export interface AIProviderSettings {
  apiKey: string;
  preferredModel: string;
}

export interface AgentSettings {
  enableTaskBreakdown: boolean;
  enableIteration: boolean;
  enableContextMemory: boolean;
  maxIterations: number;
}

export interface AppSettings {
  activeProvider: string;
  providers: {
    claude: AIProviderSettings;
    openai: AIProviderSettings;
    gemini: AIProviderSettings;
  };
  agent: AgentSettings;
  theme: 'light' | 'dark' | 'system';
  tts?: TTSSettings; // TTS settings
}

// Default settings
const defaultSettings: AppSettings = {
  activeProvider: 'claude',
  providers: {
    claude: {
      apiKey: '',
      preferredModel: 'claude-3-opus-20240229'
    },
    openai: {
      apiKey: '',
      preferredModel: 'gpt-4'
    },
    gemini: {
      apiKey: '',
      preferredModel: 'gemini-pro'
    }
  },
  agent: {
    enableTaskBreakdown: true,
    enableIteration: true,
    enableContextMemory: true,
    maxIterations: 3
  },
  theme: 'system',
  // TTS settings will be initialized by the TTS service
};

export class SettingsManager {
  private static STORAGE_KEY = 'ai_code_assistant_settings';
  private settings: AppSettings;
  private logger: Logger;

  constructor() {
    this.logger = new Logger('SettingsManager');
    this.settings = this.loadSettings();
    this.syncWithConfigService();
    
    this.logger.info('SettingsManager initialized');
  }

  /**
   * Load settings from localStorage
   */
  private loadSettings(): AppSettings {
    try {
      const storedSettings = localStorage.getItem(SettingsManager.STORAGE_KEY);
      if (!storedSettings) {
        this.logger.debug('No settings found in localStorage, using defaults');
        return { ...defaultSettings };
      }

      // Merge stored settings with default settings to ensure all properties exist
      const parsedSettings = JSON.parse(storedSettings);
      const mergedSettings = {
        ...defaultSettings,
        ...parsedSettings
      };
      
      this.logger.debug('Settings loaded from localStorage');
      return mergedSettings;
    } catch (error) {
      this.logger.error('Failed to parse settings from localStorage, using defaults', { error });
      return { ...defaultSettings };
    }
  }

  /**
   * Save settings to localStorage
   */
  /**
   * Sync settings with configuration service
   * This loads values from environment variables when available
   */
  private syncWithConfigService(): void {
    try {
      // Try to load API keys from config service
      try {
        const openaiApiKey = configService.get<string>('providers', 'openai_api_key');
        if (openaiApiKey) {
          this.settings.providers.openai.apiKey = openaiApiKey;
          this.logger.debug('Loaded OpenAI API key from config');
        }
      } catch (error) {
        this.logger.debug('OpenAI API key not found in config');
      }
      
      try {
        const claudeApiKey = configService.get<string>('providers', 'claude_api_key');
        if (claudeApiKey) {
          this.settings.providers.claude.apiKey = claudeApiKey;
          this.logger.debug('Loaded Claude API key from config');
        }
      } catch (error) {
        this.logger.debug('Claude API key not found in config');
      }
      
      try {
        const geminiApiKey = configService.get<string>('providers', 'gemini_api_key');
        if (geminiApiKey) {
          this.settings.providers.gemini.apiKey = geminiApiKey;
          this.logger.debug('Loaded Gemini API key from config');
        }
      } catch (error) {
        this.logger.debug('Gemini API key not found in config');
      }
      
      // Try to load default provider
      try {
        const defaultProvider = configService.get<string>('providers', 'default_provider');
        if (defaultProvider && ['claude', 'openai', 'gemini'].includes(defaultProvider)) {
          this.settings.activeProvider = defaultProvider;
          this.logger.debug('Loaded default provider from config', { provider: defaultProvider });
        }
      } catch (error) {
        this.logger.debug('Default provider not found in config');
      }
      
      // Try to load agent settings
      try {
        const maxIterations = configService.get<number>('agent', 'max_iterations');
        const enableTaskBreakdown = configService.get<boolean>('agent', 'enable_task_breakdown');
        const enableIteration = configService.get<boolean>('agent', 'enable_iteration');
        const enableContextMemory = configService.get<boolean>('agent', 'enable_context_memory');
        
        this.settings.agent = {
          ...this.settings.agent,
          ...(maxIterations !== undefined && { maxIterations }),
          ...(enableTaskBreakdown !== undefined && { enableTaskBreakdown }),
          ...(enableIteration !== undefined && { enableIteration }),
          ...(enableContextMemory !== undefined && { enableContextMemory })
        };
        
        this.logger.debug('Loaded agent settings from config');
      } catch (error) {
        this.logger.debug('Agent settings not found in config');
      }
      
      // Save synced settings to localStorage
      this.saveSettings();
    } catch (error) {
      this.logger.error('Failed to sync settings with config service', { error });
      errorHandler.handleError(error as Error, { context: 'SettingsManager.syncWithConfigService' });
    }
  }

  private saveSettings(): void {
    try {
      localStorage.setItem(SettingsManager.STORAGE_KEY, JSON.stringify(this.settings));
      this.logger.debug('Settings saved to localStorage');
    } catch (error) {
      this.logger.error('Failed to save settings to localStorage', { error });
      errorHandler.handleError(error as Error, { context: 'SettingsManager.saveSettings' });
    }
  }

  /**
   * Get all settings
   */
  getSettings(): AppSettings {
    try {
      return { ...this.settings };
    } catch (error) {
      this.logger.error('Failed to get settings', { error });
      throw errorHandler.handleError(error as Error, { context: 'SettingsManager.getSettings' });
    }
  }

  /**
   * Update settings
   * @param settings Partial settings to update
   */
  updateSettings(settings: Partial<AppSettings>): void {
    try {
      this.settings = {
        ...this.settings,
        ...settings
      };
      this.saveSettings();
      this.logger.info('Settings updated', {
        updatedKeys: Object.keys(settings)
      });
    } catch (error) {
      this.logger.error('Failed to update settings', { error });
      throw errorHandler.handleError(error as Error, { context: 'SettingsManager.updateSettings' });
    }
  }

  /**
   * Get API key for a provider
   * @param provider Provider name
   */
  getApiKey(provider: string): string {
    try {
      // First try to get from config service (environment variables)
      try {
        const configKey = configService.get<string>('providers', `${provider}_api_key`);
        if (configKey) {
          return configKey;
        }
      } catch (error) {
        // Fall back to settings if not in config
        this.logger.debug(`API key for ${provider} not found in config, using stored settings`);
      }
      
      // Get from settings
      const apiKey = this.settings.providers[provider as keyof typeof this.settings.providers]?.apiKey || '';
      
      if (!apiKey) {
        this.logger.debug(`No API key configured for ${provider}`);
      }
      
      return apiKey;
    } catch (error) {
      this.logger.error(`Failed to get API key for ${provider}`, { error, provider });
      throw errorHandler.handleError(error as Error, { provider });
    }
  }

  /**
   * Set API key for a provider
   * @param provider Provider name
   * @param apiKey API key
   */
  setApiKey(provider: string, apiKey: string): void {
    try {
      if (!(provider in this.settings.providers)) {
        throw new ValidationError(`Invalid provider: ${provider}`);
      }
      
      this.settings.providers[provider as keyof typeof this.settings.providers].apiKey = apiKey;
      this.saveSettings();
      
      this.logger.info(`API key set for ${provider}`);
      
      // Also try to update in config service for future runs
      try {
        configService.set(`providers`, `${provider}_api_key`, apiKey);
      } catch (error) {
        this.logger.debug(`Could not update config service with API key for ${provider}`, { error });
      }
    } catch (error) {
      this.logger.error(`Failed to set API key for ${provider}`, { error, provider });
      throw errorHandler.handleError(error as Error, { provider });
    }
  }

  /**
   * Get preferred model for a provider
   * @param provider Provider name
   */
  getPreferredModel(provider: string): string {
    try {
      return this.settings.providers[provider as keyof typeof this.settings.providers]?.preferredModel || '';
    } catch (error) {
      this.logger.error(`Failed to get preferred model for ${provider}`, { error, provider });
      throw errorHandler.handleError(error as Error, { provider });
    }
  }

  /**
   * Set preferred model for a provider
   * @param provider Provider name
   * @param model Model name
   */
  setPreferredModel(provider: string, model: string): void {
    try {
      if (!(provider in this.settings.providers)) {
        throw new ValidationError(`Invalid provider: ${provider}`);
      }
      
      this.settings.providers[provider as keyof typeof this.settings.providers].preferredModel = model;
      this.saveSettings();
      
      this.logger.info(`Preferred model for ${provider} set to ${model}`, { provider, model });
    } catch (error) {
      this.logger.error(`Failed to set preferred model for ${provider}`, { error, provider, model });
      throw errorHandler.handleError(error as Error, { provider, model });
    }
  }

  /**
   * Get active provider
   */
  getActiveProvider(): string {
    try {
      // First try to get from config
      try {
        const configProvider = configService.get<string>('providers', 'default_provider');
        if (configProvider && ['claude', 'openai', 'gemini'].includes(configProvider)) {
          return configProvider;
        }
      } catch (error) {
        // Fall back to settings
        this.logger.debug('Default provider not found in config, using stored settings');
      }
      
      return this.settings.activeProvider;
    } catch (error) {
      this.logger.error('Failed to get active provider', { error });
      throw errorHandler.handleError(error as Error);
    }
  }

  /**
   * Set active provider
   * @param provider Provider name
   */
  setActiveProvider(provider: string): void {
    try {
      if (!['claude', 'openai', 'gemini'].includes(provider)) {
        throw new ValidationError(`Invalid provider: ${provider}`);
      }
      
      this.settings.activeProvider = provider;
      this.saveSettings();
      
      // Also try to update in config service
      try {
        configService.set('providers', 'default_provider', provider);
      } catch (error) {
        this.logger.debug('Could not update config service with default provider', { error });
      }
      
      this.logger.info(`Active provider set to ${provider}`, { provider });
    } catch (error) {
      this.logger.error(`Failed to set active provider to ${provider}`, { error, provider });
      throw errorHandler.handleError(error as Error, { provider });
    }
  }

  /**
   * Get agent settings
   */
  getAgentSettings(): AgentSettings {
    try {
      // Try to get from config first
      try {
        const maxIterations = configService.get<number>('agent', 'max_iterations');
        const enableTaskBreakdown = configService.get<boolean>('agent', 'enable_task_breakdown');
        const enableIteration = configService.get<boolean>('agent', 'enable_iteration');
        const enableContextMemory = configService.get<boolean>('agent', 'enable_context_memory');
        
        // If any values are found in config, merge them with stored settings
        if (maxIterations !== undefined || enableTaskBreakdown !== undefined ||
            enableIteration !== undefined || enableContextMemory !== undefined) {
          
          return {
            ...this.settings.agent,
            ...(maxIterations !== undefined && { maxIterations }),
            ...(enableTaskBreakdown !== undefined && { enableTaskBreakdown }),
            ...(enableIteration !== undefined && { enableIteration }),
            ...(enableContextMemory !== undefined && { enableContextMemory })
          };
        }
      } catch (error) {
        // Fall back to settings
        this.logger.debug('Agent settings not found in config, using stored settings');
      }
      
      return { ...this.settings.agent };
    } catch (error) {
      this.logger.error('Failed to get agent settings', { error });
      throw errorHandler.handleError(error as Error);
    }
  }

  /**
   * Update agent settings
   * @param settings Partial agent settings to update
   */
  updateAgentSettings(settings: Partial<AgentSettings>): void {
    try {
      this.settings.agent = {
        ...this.settings.agent,
        ...settings
      };
      this.saveSettings();
      
      // Also try to update in config service
      try {
        if (settings.maxIterations !== undefined) {
          configService.set('agent', 'max_iterations', settings.maxIterations);
        }
        if (settings.enableTaskBreakdown !== undefined) {
          configService.set('agent', 'enable_task_breakdown', settings.enableTaskBreakdown);
        }
        if (settings.enableIteration !== undefined) {
          configService.set('agent', 'enable_iteration', settings.enableIteration);
        }
        if (settings.enableContextMemory !== undefined) {
          configService.set('agent', 'enable_context_memory', settings.enableContextMemory);
        }
      } catch (error) {
        this.logger.debug('Could not update config service with agent settings', { error });
      }
      
      this.logger.info('Agent settings updated', { updatedKeys: Object.keys(settings) });
    } catch (error) {
      this.logger.error('Failed to update agent settings', { error, settings });
      throw errorHandler.handleError(error as Error, { settings });
    }
  }

  /**
   * Reset all settings to defaults
   */
  resetSettings(): void {
    try {
      this.settings = { ...defaultSettings };
      this.saveSettings();
      this.logger.info('Settings reset to defaults');
    } catch (error) {
      this.logger.error('Failed to reset settings', { error });
      throw errorHandler.handleError(error as Error);
    }
  }
}

// Create a singleton instance for use throughout the app
export const settingsManager = new SettingsManager();