/**
 * Settings Manager Interface
 */

export interface AppSettings {
  [key: string]: unknown;
}

export interface SettingsManager {
  getSettings(): Promise<AppSettings>;
  updateSettings(updates: Partial<AppSettings>): Promise<void>;
  getApiKey(provider: string): Promise<string | null>;
  getPreferredModel(): Promise<string>;
  getActiveProvider(): Promise<string>;
}