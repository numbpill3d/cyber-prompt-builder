/**
 * Settings Manager
 * Handles user preferences and API key storage
 */

import { TTSSettings } from './tts/tts-types';

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

  constructor() {
    this.settings = this.loadSettings();
  }

  /**
   * Load settings from localStorage
   */
  private loadSettings(): AppSettings {
    const storedSettings = localStorage.getItem(SettingsManager.STORAGE_KEY);
    if (!storedSettings) {
      return { ...defaultSettings };
    }

    try {
      // Merge stored settings with default settings to ensure all properties exist
      return {
        ...defaultSettings,
        ...JSON.parse(storedSettings)
      };
    } catch (error) {
      console.error('Failed to parse settings from localStorage, using defaults', error);
      return { ...defaultSettings };
    }
  }

  /**
   * Save settings to localStorage
   */
  private saveSettings(): void {
    localStorage.setItem(SettingsManager.STORAGE_KEY, JSON.stringify(this.settings));
  }

  /**
   * Get all settings
   */
  getSettings(): AppSettings {
    return { ...this.settings };
  }

  /**
   * Update settings
   * @param settings Partial settings to update
   */
  updateSettings(settings: Partial<AppSettings>): void {
    this.settings = {
      ...this.settings,
      ...settings
    };
    this.saveSettings();
  }

  /**
   * Get API key for a provider
   * @param provider Provider name
   */
  getApiKey(provider: string): string {
    return this.settings.providers[provider as keyof typeof this.settings.providers]?.apiKey || '';
  }

  /**
   * Set API key for a provider
   * @param provider Provider name
   * @param apiKey API key
   */
  setApiKey(provider: string, apiKey: string): void {
    if (provider in this.settings.providers) {
      this.settings.providers[provider as keyof typeof this.settings.providers].apiKey = apiKey;
      this.saveSettings();
    }
  }

  /**
   * Get preferred model for a provider
   * @param provider Provider name
   */
  getPreferredModel(provider: string): string {
    return this.settings.providers[provider as keyof typeof this.settings.providers]?.preferredModel || '';
  }

  /**
   * Set preferred model for a provider
   * @param provider Provider name
   * @param model Model name
   */
  setPreferredModel(provider: string, model: string): void {
    if (provider in this.settings.providers) {
      this.settings.providers[provider as keyof typeof this.settings.providers].preferredModel = model;
      this.saveSettings();
    }
  }

  /**
   * Get active provider
   */
  getActiveProvider(): string {
    return this.settings.activeProvider;
  }

  /**
   * Set active provider
   * @param provider Provider name
   */
  setActiveProvider(provider: string): void {
    this.settings.activeProvider = provider;
    this.saveSettings();
  }

  /**
   * Get agent settings
   */
  getAgentSettings(): AgentSettings {
    return { ...this.settings.agent };
  }

  /**
   * Update agent settings
   * @param settings Partial agent settings to update
   */
  updateAgentSettings(settings: Partial<AgentSettings>): void {
    this.settings.agent = {
      ...this.settings.agent,
      ...settings
    };
    this.saveSettings();
  }

  /**
   * Reset all settings to defaults
   */
  resetSettings(): void {
    this.settings = { ...defaultSettings };
    this.saveSettings();
  }
}

// Create a singleton instance for use throughout the app
export const settingsManager = new SettingsManager();