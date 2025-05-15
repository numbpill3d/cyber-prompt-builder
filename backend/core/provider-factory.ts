/**
 * Provider Factory Service
 * Factory pattern implementation for creating AI provider instances
 */

import { AIProvider } from '../interfaces/ai-provider';
import { getService } from './service-locator';
import { SettingsManager } from '../interfaces/settings-manager';

// Map to store provider factories
type ProviderFactoryFn = () => AIProvider;

/**
 * Provider Factory for creating and managing provider instances
 */
export class ProviderFactory {
  private static providers: Map<string, ProviderFactoryFn> = new Map();
  private static instances: Map<string, AIProvider> = new Map();
  
  /**
   * Register a provider with the factory
   * @param name Name of the provider
   * @param factory Factory function to create provider instances
   */
  public static registerProvider(name: string, factory: ProviderFactoryFn): void {
    this.providers.set(name.toLowerCase(), factory);
  }
  
  /**
   * Get a provider instance by name
   * @param name Name of the provider
   * @returns Provider instance
   */
  public static getProvider(name: string): AIProvider {
    const providerName = name.toLowerCase();
    
    // Check if we already have an instance
    if (this.instances.has(providerName)) {
      return this.instances.get(providerName)!;
    }
    
    // Otherwise, create new instance
    const factory = this.providers.get(providerName);
    if (!factory) {
      throw new Error(`Provider '${name}' not registered`);
    }
    
    const provider = factory();
    this.instances.set(providerName, provider);
    
    return provider;
  }
  
  /**
   * Get all registered provider names
   * @returns Array of provider names
   */
  public static getAvailableProviders(): string[] {
    return Array.from(this.providers.keys());
  }
  
  /**
   * Get all configured providers (those with API keys)
   * @returns Array of provider names
   */
  public static getConfiguredProviders(): string[] {
    const settingsManager = getService<SettingsManager>('settingsManager');
    
    return this.getAvailableProviders().filter(provider => {
      try {
        const apiKey = settingsManager.getApiKey(provider);
        return !!apiKey && apiKey.trim() !== '';
      } catch (error) {
        return false;
      }
    });
  }
  
  /**
   * Check if a provider is configured
   * @param name Provider name
   * @returns True if configured
   */
  public static isProviderConfigured(name: string): boolean {
    try {
      const provider = this.getProvider(name);
      return provider.isConfigured();
    } catch (error) {
      return false;
    }
  }
  
  /**
   * Create a provider instance based on configuration
   * @param config Provider configuration
   * @returns Provider instance
   */
  public static createFromConfig(config: { type: string, [key: string]: any }): AIProvider {
    const provider = this.getProvider(config.type);
    
    // Any additional configuration can be applied here if needed
    
    return provider;
  }
  
  /**
   * Reset all provider instances
   * Useful for testing or when configuration changes
   */
  public static resetInstances(): void {
    this.instances.clear();
  }
}

// Export a singleton instance for use throughout the app
export const providerFactory = ProviderFactory;