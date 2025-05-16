/**
 * Settings Manager Interface
 * Defines the contract for application settings management
 */

import { ModeSettings } from '../../services/mode/mode-types';
import { ModeAnalyticsData } from '../../services/mode/mode-analytics';

/**
 * Application settings interface
 */
export interface AppSettings {
  activeProvider: string;
  agent: AgentSettings;
  providers: {
    [key: string]: AIProviderSettings;
  };
  ui: UISettings;
  tts?: any; // To be replaced with TTSSettings
  mode?: ModeSettings; // Mode settings
  modeAnalytics?: ModeAnalyticsData; // Mode analytics data
}

/**
 * Agent settings interface
 */
export interface AgentSettings {
  enableTaskBreakdown: boolean;
  maxParallelTasks: number;
  autoStartTasks: boolean;
  memory: {
    retentionPeriod: number;
    maxContextSize: number;
    useExternalMemory: boolean;
  };
}

/**
 * AI provider settings
 */
export interface AIProviderSettings {
  preferredModel: string;
  apiKey?: string;
  organizationId?: string;
  customEndpoint?: string;
  context?: {
    maxLength: number;
    expirationTime: number;
  };
}

/**
 * UI settings
 */
export interface UISettings {
  theme: 'light' | 'dark' | 'system';
  codeHighlightTheme: string;
  fontFamily: string;
  fontSize: number;
  compactMode: boolean;
  sidebarVisible: boolean;
}

/**
 * Settings manager interface
 */
export interface SettingsManager {
  // General settings
  getSettings(): AppSettings;
  updateSettings(settings: Partial<AppSettings>): void;
  resetSettings(): void;

  // Provider-specific settings
  getActiveProvider(): string;
  setActiveProvider(provider: string): void;
  getApiKey(provider: string): string | null;
  setApiKey(provider: string, apiKey: string): void;
  getPreferredModel(provider: string): string;
  setPreferredModel(provider: string, model: string): void;

  // Agent settings
  getAgentSettings(): AgentSettings;
  updateAgentSettings(settings: Partial<AgentSettings>): void;

  // UI settings
  getUISettings(): UISettings;
  updateUISettings(settings: Partial<UISettings>): void;

  // Mode settings
  getActiveMode(): string;
  setActiveMode(modeId: string): void;
  getModeSettings(): ModeSettings | undefined;
  updateModeSettings(settings: Partial<ModeSettings>): void;

  // Persistence
  saveSettingsToStorage(): Promise<boolean>;
  loadSettingsFromStorage(): Promise<boolean>;
  exportSettings(): string;
  importSettings(data: string): boolean;
}