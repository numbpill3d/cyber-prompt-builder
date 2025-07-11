/**
 * Settings Service
 * Manages application settings with persistence to localStorage
 */

import { Logger } from '../logging/logger';
import { errorHandler } from '../error/error-handler';
import { ModeSettings } from '../mode/mode-types';

/**
 * Application settings structure
 */
export interface AppSettings {
  // Mode settings
  mode?: ModeSettings;
  
  // UI settings
  ui?: {
    theme: 'light' | 'dark' | 'system';
    sidebarCollapsed: boolean;
    fontSize: 'small' | 'medium' | 'large';
  };
  
  // Provider settings
  providers?: {
    defaultProvider: 'openai' | 'claude' | 'gemini';
    apiKeys: {
      openai?: string;
      claude?: string;
      gemini?: string;
    };
  };
  
  // Agent settings
  agent?: {
    maxIterations: number;
    enableTaskBreakdown: boolean;
    enableIteration: boolean;
    enableContextMemory: boolean;
  };
  
  // Memory settings
  memory?: {
    dbEndpoint: string;
    collectionName: string;
  };
  
  // Prompt builder settings
  promptBuilder?: {
    maxTokens: number;
    temperature: number;
  };
  
  // TTS settings
  tts?: {
    enabled: boolean;
    voice: string;
  };
  
  // Debug settings
  debug?: {
    enabled: boolean;
    logLevel: string;
  };
}

/**
 * Default application settings
 */
const DEFAULT_SETTINGS: AppSettings = {
  ui: {
    theme: 'system',
    sidebarCollapsed: false,
    fontSize: 'medium'
  },
  providers: {
    defaultProvider: 'openai',
    apiKeys: {}
  },
  agent: {
    maxIterations: 3,
    enableTaskBreakdown: true,
    enableIteration: true,
    enableContextMemory: true
  },
  memory: {
    dbEndpoint: 'localhost:8000',
    collectionName: 'ai_assistant_memory'
  },
  promptBuilder: {
    maxTokens: 4096,
    temperature: 0.7
  },
  tts: {
    enabled: false,
    voice: 'en-US-Standard-A'
  },
  debug: {
    enabled: false,
    logLevel: 'info'
  }
};

/**
 * Settings Service class
 */
export class SettingsService {
  private static instance: SettingsService;
  private logger: Logger;
  private settings: AppSettings;
  private readonly storageKey = 'cyber_prompt_builder_settings';

  private constructor() {
    this.logger = new Logger('SettingsService');
    this.settings = { ...DEFAULT_SETTINGS };
    this.loadSettings();
  }

  /**
   * Get the singleton instance
   */
  public static getInstance(): SettingsService {
    if (!SettingsService.instance) {
      SettingsService.instance = new SettingsService();
    }
    return SettingsService.instance;
  }

  /**
   * Load settings from localStorage
   */
  private loadSettings(): void {
    try {
      if (typeof window !== 'undefined' && window.localStorage) {
        const stored = localStorage.getItem(this.storageKey);
        if (stored) {
          const parsedSettings = JSON.parse(stored);
          this.settings = this.mergeSettings(DEFAULT_SETTINGS, parsedSettings);
          this.logger.info('Settings loaded from localStorage');
        } else {
          this.logger.info('No stored settings found, using defaults');
        }
      } else {
        this.logger.warn('localStorage not available, using default settings');
      }
    } catch (error) {
      this.logger.error('Failed to load settings from localStorage', { error });
      errorHandler.handleError(error as Error, { context: 'settings-load' });
      this.settings = { ...DEFAULT_SETTINGS };
    }
  }

  /**
   * Save settings to localStorage
   */
  private saveSettings(): void {
    try {
      if (typeof window !== 'undefined' && window.localStorage) {
        localStorage.setItem(this.storageKey, JSON.stringify(this.settings));
        this.logger.debug('Settings saved to localStorage');
      } else {
        this.logger.warn('localStorage not available, settings not persisted');
      }
    } catch (error) {
      this.logger.error('Failed to save settings to localStorage', { error });
      errorHandler.handleError(error as Error, { context: 'settings-save' });
    }
  }

  /**
   * Merge default settings with stored settings
   */
  private mergeSettings(defaults: AppSettings, stored: Partial<AppSettings>): AppSettings {
    const merged: AppSettings = { ...defaults };
    
    // Deep merge each section
    Object.keys(stored).forEach(key => {
      const typedKey = key as keyof AppSettings;
      if (stored[typedKey] && typeof stored[typedKey] === 'object') {
        merged[typedKey] = { ...defaults[typedKey], ...stored[typedKey] } as any;
      } else {
        (merged as any)[typedKey] = stored[typedKey];
      }
    });
    
    return merged;
  }

  /**
   * Get all settings
   */
  public getSettings(): AppSettings {
    return { ...this.settings };
  }

  /**
   * Update settings
   */
  public updateSettings(newSettings: Partial<AppSettings>): void {
    try {
      this.settings = this.mergeSettings(this.settings, newSettings);
      this.saveSettings();
      this.logger.info('Settings updated');
    } catch (error) {
      this.logger.error('Failed to update settings', { error });
      errorHandler.handleError(error as Error, { context: 'settings-update' });
      throw error;
    }
  }

  /**
   * Get a specific setting value
   */
  public getSetting<T>(path: string): T | undefined {
    try {
      const keys = path.split('.');
      let current: any = this.settings;
      
      for (const key of keys) {
        if (current && typeof current === 'object' && key in current) {
          current = current[key];
        } else {
          return undefined;
        }
      }
      
      return current as T;
    } catch (error) {
      this.logger.error(`Failed to get setting: ${path}`, { error });
      return undefined;
    }
  }

  /**
   * Set a specific setting value
   */
  public setSetting(path: string, value: any): void {
    try {
      const keys = path.split('.');
      const lastKey = keys.pop();
      
      if (!lastKey) {
        throw new Error('Invalid setting path');
      }
      
      let current: any = this.settings;
      
      // Navigate to the parent object
      for (const key of keys) {
        if (!current[key] || typeof current[key] !== 'object') {
          current[key] = {};
        }
        current = current[key];
      }
      
      // Set the value
      current[lastKey] = value;
      
      this.saveSettings();
      this.logger.debug(`Setting updated: ${path}`);
    } catch (error) {
      this.logger.error(`Failed to set setting: ${path}`, { error });
      errorHandler.handleError(error as Error, { context: 'settings-set' });
      throw error;
    }
  }

  /**
   * Reset settings to defaults
   */
  public resetSettings(): void {
    try {
      this.settings = { ...DEFAULT_SETTINGS };
      this.saveSettings();
      this.logger.info('Settings reset to defaults');
    } catch (error) {
      this.logger.error('Failed to reset settings', { error });
      errorHandler.handleError(error as Error, { context: 'settings-reset' });
      throw error;
    }
  }

  /**
   * Export settings as JSON
   */
  public exportSettings(): string {
    try {
      return JSON.stringify(this.settings, null, 2);
    } catch (error) {
      this.logger.error('Failed to export settings', { error });
      errorHandler.handleError(error as Error, { context: 'settings-export' });
      throw error;
    }
  }

  /**
   * Import settings from JSON
   */
  public importSettings(settingsJson: string): void {
    try {
      const importedSettings = JSON.parse(settingsJson);
      this.updateSettings(importedSettings);
      this.logger.info('Settings imported successfully');
    } catch (error) {
      this.logger.error('Failed to import settings', { error });
      errorHandler.handleError(error as Error, { context: 'settings-import' });
      throw error;
    }
  }

  /**
   * Check if settings are valid
   */
  public validateSettings(settings: Partial<AppSettings>): boolean {
    try {
      // Basic validation - ensure required fields exist and have correct types
      if (settings.ui) {
        const validThemes = ['light', 'dark', 'system'];
        if (settings.ui.theme && !validThemes.includes(settings.ui.theme)) {
          return false;
        }
      }
      
      if (settings.providers) {
        const validProviders = ['openai', 'claude', 'gemini'];
        if (settings.providers.defaultProvider && 
            !validProviders.includes(settings.providers.defaultProvider)) {
          return false;
        }
      }
      
      if (settings.agent) {
        if (settings.agent.maxIterations && 
            (typeof settings.agent.maxIterations !== 'number' || 
             settings.agent.maxIterations < 1 || 
             settings.agent.maxIterations > 10)) {
          return false;
        }
      }
      
      return true;
    } catch (error) {
      this.logger.error('Settings validation failed', { error });
      return false;
    }
  }
}

// Export singleton instance
export const settingsService = SettingsService.getInstance();