/**
 * Settings Service Implementation
 * Implements the SettingsManager interface
 */

import {
  SettingsManager,
  AppSettings,
  AgentSettings,
  AIProviderSettings,
  UISettings
} from '../../core/interfaces/settings-manager';
import { TTSSettings } from '../../core/interfaces/tts-service';
import { TrackingConfig } from '../../core/interfaces/evolution-engine';
import { AutoImprovementConfig } from '../../core/interfaces/auto-improvement-system';
import { ModeSettings, DEFAULT_MODES } from '../mode/mode-types';

/**
 * Default settings
 */
const DEFAULT_SETTINGS: AppSettings = {
  activeProvider: 'openai',
  agent: {
    enableTaskBreakdown: true,
    maxParallelTasks: 3,
    autoStartTasks: false,
    memory: {
      retentionPeriod: 30,
      maxContextSize: 4096,
      useExternalMemory: false
    }
  },
  providers: {
    openai: {
      preferredModel: 'gpt-4-turbo',
      context: {
        maxLength: 8192,
        expirationTime: 3600
      }
    },
    claude: {
      preferredModel: 'claude-3-opus',
      context: {
        maxLength: 8192,
        expirationTime: 3600
      }
    },
    gemini: {
      preferredModel: 'gemini-pro',
      context: {
        maxLength: 8192,
        expirationTime: 3600
      }
    }
  },
  ui: {
    theme: 'dark',
    codeHighlightTheme: 'monokai',
    fontFamily: 'Inter, system-ui, sans-serif',
    fontSize: 14,
    compactMode: false,
    sidebarVisible: true
  },
  tts: {
    enabled: true,
    engineType: 'web_speech_api',
    defaultVoice: {
      voiceURI: '',
      rate: 1.0,
      pitch: 1.0,
      volume: 1.0
    },
    codeConfig: {
      enabled: true,
      speakPunctuation: false,
      useAlternativeVoice: false,
      skipComments: true,
      verbosityLevel: 'normal'
    },
    autoStart: false,
    skipMarkdown: true
  },
  mode: {
    activeMode: 'code',
    modes: { ...DEFAULT_MODES },
    customModes: {}
  }
};

/**
 * Settings Manager Implementation
 */
export class SettingsService implements SettingsManager {
  private settings: AppSettings;
  private storageKey: string = 'cyber_prompt_builder_settings';

  constructor() {
    // Start with default settings
    this.settings = this.getDefaultSettings();

    // Load settings from storage on initialization
    this.loadSettingsFromStorage().catch(error => {
      console.error('Failed to load settings from storage:', error);
    });
  }

  /**
   * Get default settings
   */
  private getDefaultSettings(): AppSettings {
    return JSON.parse(JSON.stringify(DEFAULT_SETTINGS));
  }

  /**
   * Get all settings
   */
  getSettings(): AppSettings {
    return JSON.parse(JSON.stringify(this.settings));
  }

  /**
   * Update settings
   */
  updateSettings(settings: Partial<AppSettings>): void {
    this.settings = {
      ...this.settings,
      ...settings
    };

    // Save to storage
    this.saveSettingsToStorage().catch(error => {
      console.error('Failed to save settings to storage:', error);
    });
  }

  /**
   * Reset settings to default
   */
  resetSettings(): void {
    this.settings = this.getDefaultSettings();

    // Save to storage
    this.saveSettingsToStorage().catch(error => {
      console.error('Failed to save settings to storage:', error);
    });
  }

  /**
   * Get active provider
   */
  getActiveProvider(): string {
    return this.settings.activeProvider;
  }

  /**
   * Set active provider
   */
  setActiveProvider(provider: string): void {
    this.settings.activeProvider = provider;

    // Save to storage
    this.saveSettingsToStorage().catch(error => {
      console.error('Failed to save settings to storage:', error);
    });
  }

  /**
   * Get API key for a provider
   */
  getApiKey(provider: string): string | null {
    const providerSettings = this.settings.providers[provider];
    return providerSettings?.apiKey || null;
  }

  /**
   * Set API key for a provider
   */
  setApiKey(provider: string, apiKey: string): void {
    if (!this.settings.providers[provider]) {
      this.settings.providers[provider] = {
        preferredModel: ''
      };
    }

    this.settings.providers[provider].apiKey = apiKey;

    // Save to storage
    this.saveSettingsToStorage().catch(error => {
      console.error('Failed to save settings to storage:', error);
    });
  }

  /**
   * Get preferred model for a provider
   */
  getPreferredModel(provider: string): string {
    const providerSettings = this.settings.providers[provider];
    return providerSettings?.preferredModel || '';
  }

  /**
   * Set preferred model for a provider
   */
  setPreferredModel(provider: string, model: string): void {
    if (!this.settings.providers[provider]) {
      this.settings.providers[provider] = {
        preferredModel: model
      };
    } else {
      this.settings.providers[provider].preferredModel = model;
    }

    // Save to storage
    this.saveSettingsToStorage().catch(error => {
      console.error('Failed to save settings to storage:', error);
    });
  }

  /**
   * Get agent settings
   */
  getAgentSettings(): AgentSettings {
    return JSON.parse(JSON.stringify(this.settings.agent));
  }

  /**
   * Update agent settings
   */
  updateAgentSettings(settings: Partial<AgentSettings>): void {
    this.settings.agent = {
      ...this.settings.agent,
      ...settings
    };

    // Save to storage
    this.saveSettingsToStorage().catch(error => {
      console.error('Failed to save settings to storage:', error);
    });
  }

  /**
   * Get UI settings
   */
  getUISettings(): UISettings {
    return JSON.parse(JSON.stringify(this.settings.ui));
  }

  /**
   * Update UI settings
   */
  updateUISettings(settings: Partial<UISettings>): void {
    this.settings.ui = {
      ...this.settings.ui,
      ...settings
    };

    // Save to storage
    this.saveSettingsToStorage().catch(error => {
      console.error('Failed to save settings to storage:', error);
    });
  }

  /**
   * Get TTS settings
   */
  getTTSSettings(): TTSSettings {
    return JSON.parse(JSON.stringify(this.settings.tts));
  }

  /**
   * Update TTS settings
   */
  updateTTSSettings(settings: Partial<TTSSettings>): void {
    this.settings.tts = {
      ...this.settings.tts,
      ...settings
    };

    // Save to storage
    this.saveSettingsToStorage().catch(error => {
      console.error('Failed to save settings to storage:', error);
    });
  }

  /**
   * Get custom settings from TTS object
   */
  private getCustomSettings(key: string): any {
    if (!this.settings.tts) {
      this.settings.tts = {};
    }

    if (!this.settings.tts[key]) {
      // Initialize with default values based on key
      if (key === 'evolution') {
        this.settings.tts[key] = {
          enableTracking: true,
          trackingFrequency: 'perSession',
          saveHistory: true,
          historyLimit: 50,
          dimensions: [
            'promptQuality', 'codeQuality', 'creativity', 'efficiency',
            'consistency', 'adaptability', 'learning'
          ]
        };
      } else if (key === 'autoImprovement') {
        this.settings.tts[key] = {
          enabled: true,
          frequency: 'manual',
          thresholds: {
            minPriority: 5,
            maxConcurrentTasks: 3
          },
          reporting: {
            notificationsEnabled: true,
            detailedReporting: true,
            storeHistory: true
          },
          integrations: {
            useMemorySystem: true,
            autoApply: false
          }
        };
      } else if (key === 'conversation') {
        this.settings.tts[key] = {
          maxBranches: 10,
          maxHistoryLength: 100,
          defaultContextOptions: {
            turnLimit: 10,
            includeCodeBlocks: true,
            codeBlockLimit: 5,
            includeMemories: true
          },
          autoBranching: false,
          storageLimit: 50 * 1024 * 1024 // 50MB
        };
      }
    }

    return this.settings.tts[key];
  }

  /**
   * Get Evolution settings
   */
  getEvolutionSettings(): TrackingConfig {
    return JSON.parse(JSON.stringify(this.getCustomSettings('evolution')));
  }

  /**
   * Update Evolution settings
   */
  updateEvolutionSettings(settings: Partial<TrackingConfig>): void {
    if (!this.settings.tts) {
      this.settings.tts = {};
    }

    this.settings.tts.evolution = {
      ...this.getCustomSettings('evolution'),
      ...settings
    };

    // Save to storage
    this.saveSettingsToStorage().catch(error => {
      console.error('Failed to save settings to storage:', error);
    });
  }

  /**
   * Get Auto-Improvement settings
   */
  getAutoImprovementSettings(): AutoImprovementConfig {
    return JSON.parse(JSON.stringify(this.getCustomSettings('autoImprovement')));
  }

  /**
   * Update Auto-Improvement settings
   */
  updateAutoImprovementSettings(settings: Partial<AutoImprovementConfig>): void {
    if (!this.settings.tts) {
      this.settings.tts = {};
    }

    this.settings.tts.autoImprovement = {
      ...this.getCustomSettings('autoImprovement'),
      ...settings
    };

    // Save to storage
    this.saveSettingsToStorage().catch(error => {
      console.error('Failed to save settings to storage:', error);
    });
  }

  /**
   * Get Conversation settings
   */
  getConversationSettings(): any {
    return JSON.parse(JSON.stringify(this.getCustomSettings('conversation')));
  }

  /**
   * Update Conversation settings
   */
  updateConversationSettings(settings: any): void {
    if (!this.settings.tts) {
      this.settings.tts = {};
    }

    this.settings.tts.conversation = {
      ...this.getCustomSettings('conversation'),
      ...settings
    };

    // Save to storage
    this.saveSettingsToStorage().catch(error => {
      console.error('Failed to save settings to storage:', error);
    });
  }

  /**
   * Get active mode
   */
  getActiveMode(): string {
    return this.settings.mode?.activeMode || 'code';
  }

  /**
   * Set active mode
   */
  setActiveMode(modeId: string): void {
    if (!this.settings.mode) {
      this.settings.mode = {
        activeMode: 'code',
        modes: { ...DEFAULT_MODES },
        customModes: {}
      };
    }

    this.settings.mode.activeMode = modeId;

    // Save to storage
    this.saveSettingsToStorage().catch(error => {
      console.error('Failed to save settings to storage:', error);
    });
  }

  /**
   * Get mode settings
   */
  getModeSettings(): ModeSettings | undefined {
    return this.settings.mode ? JSON.parse(JSON.stringify(this.settings.mode)) : undefined;
  }

  /**
   * Update mode settings
   */
  updateModeSettings(settings: Partial<ModeSettings>): void {
    if (!this.settings.mode) {
      this.settings.mode = {
        activeMode: 'code',
        modes: { ...DEFAULT_MODES },
        customModes: {}
      };
    }

    this.settings.mode = {
      ...this.settings.mode,
      ...settings
    };

    // Save to storage
    this.saveSettingsToStorage().catch(error => {
      console.error('Failed to save settings to storage:', error);
    });
  }

  /**
   * Save settings to storage
   */
  async saveSettingsToStorage(): Promise<boolean> {
    try {
      // Filter out sensitive information
      const settingsToSave = this.prepareSettingsForStorage();

      // Save to localStorage
      localStorage.setItem(this.storageKey, JSON.stringify(settingsToSave));
      return true;
    } catch (error) {
      console.error('Failed to save settings to storage:', error);
      return false;
    }
  }

  /**
   * Prepare settings for storage (remove sensitive information)
   */
  private prepareSettingsForStorage(): Partial<AppSettings> {
    const settingsCopy = JSON.parse(JSON.stringify(this.settings));

    // Remove API keys
    for (const provider in settingsCopy.providers) {
      if (settingsCopy.providers[provider].apiKey) {
        // Keep a placeholder to know that key exists
        settingsCopy.providers[provider].apiKeyExists = true;
        delete settingsCopy.providers[provider].apiKey;
      }
    }

    return settingsCopy;
  }

  /**
   * Load settings from storage
   */
  async loadSettingsFromStorage(): Promise<boolean> {
    try {
      const storedSettings = localStorage.getItem(this.storageKey);

      if (storedSettings) {
        const parsedSettings = JSON.parse(storedSettings);

        // Restore settings but keep default values for things that are missing
        this.mergeSettings(parsedSettings);

        // For each provider that had an API key, we need to prompt the user
        // In a real application, we'd have a secure way to store API keys
        // For this implementation, we'll just need to restore them via UI

        return true;
      }

      return false;
    } catch (error) {
      console.error('Failed to load settings from storage:', error);
      return false;
    }
  }

  /**
   * Merge settings with default settings to ensure all properties exist
   */
  private mergeSettings(storedSettings: Partial<AppSettings>): void {
    // Merge top-level properties
    for (const key in DEFAULT_SETTINGS) {
      if (key in storedSettings) {
        if (typeof DEFAULT_SETTINGS[key] === 'object' && DEFAULT_SETTINGS[key] !== null) {
          // For objects, do a deep merge
          this.settings[key] = this.deepMerge(DEFAULT_SETTINGS[key], storedSettings[key]);
        } else {
          // For primitive values, use the stored value
          this.settings[key] = storedSettings[key];
        }
      }
    }
  }

  /**
   * Deep merge two objects
   */
  private deepMerge(target: any, source: any): any {
    const output = { ...target };

    if (typeof target === 'object' && typeof source === 'object') {
      Object.keys(source).forEach(key => {
        if (typeof source[key] === 'object' && source[key] !== null) {
          if (key in target) {
            output[key] = this.deepMerge(target[key], source[key]);
          } else {
            output[key] = source[key];
          }
        } else {
          output[key] = source[key];
        }
      });
    }

    return output;
  }

  /**
   * Export settings as a JSON string
   */
  exportSettings(): string {
    const settingsToExport = this.prepareSettingsForStorage();
    return JSON.stringify(settingsToExport, null, 2);
  }

  /**
   * Import settings from a JSON string
   */
  importSettings(data: string): boolean {
    try {
      const importedSettings = JSON.parse(data);

      // Validate the imported settings structure
      if (!importedSettings || typeof importedSettings !== 'object') {
        throw new Error('Invalid settings format');
      }

      // Merge with default settings
      this.mergeSettings(importedSettings);

      // Save to storage
      this.saveSettingsToStorage().catch(error => {
        console.error('Failed to save imported settings to storage:', error);
      });

      return true;
    } catch (error) {
      console.error('Failed to import settings:', error);
      return false;
    }
  }
}

// Factory function
export function createSettingsService(): SettingsManager {
  return new SettingsService();
}