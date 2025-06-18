
/**
 * Model Router
 * Routes AI requests to appropriate providers with fallback and load balancing
 */

import { AIProvider } from '@shared/interfaces/ai-provider';
import { ServiceLocator } from './service-locator';
import { SettingsManager } from '@shared/interfaces/settings-manager';

export interface ModelRouterOptions {
  activeProvider?: string;
  fallbackProvider?: string;
  memoryEnabled?: boolean;
  conversationLoggingEnabled?: boolean;
  fallbackEnabled?: boolean;
}

/**
 * Model Router for managing AI provider selection and routing
 */
export class ModelRouter {
  private activeProvider: string = 'claude';
  private fallbackProvider?: string;
  private memoryEnabled: boolean = false;
  private conversationLoggingEnabled: boolean = false;
  private fallbackEnabled: boolean = false;
  private serviceLocator?: ServiceLocator;

  constructor(serviceLocator?: ServiceLocator) {
    this.serviceLocator = serviceLocator;
  }

  /**
   * Send a message to the active provider
   */
  async sendMessage(message: string, options?: any): Promise<any> {
    try {
      const provider = this.getActiveProviderInstance();
      const result = await provider.generateResponse(
        { content: message },
        { apiKey: this.getApiKey(this.activeProvider), ...options }
      );

      // Store in memory if enabled
      if (this.memoryEnabled && this.serviceLocator) {
        try {
          const memoryService = this.serviceLocator.get('memoryEngine');
          // Store user message and response
        } catch (error) {
          console.warn('Memory service not available', error);
        }
      }

      // Log conversation if enabled
      if (this.conversationLoggingEnabled && this.serviceLocator) {
        try {
          const conversationService = this.serviceLocator.get('conversationManager');
          // Log conversation
        } catch (error) {
          console.warn('Conversation service not available', error);
        }
      }

      return result;
    } catch (error) {
      if (this.fallbackEnabled && this.fallbackProvider) {
        console.warn(`Primary provider failed, using fallback: ${this.fallbackProvider}`);
        const fallbackProviderInstance = this.getProviderInstance(this.fallbackProvider);
        return await fallbackProviderInstance.generateResponse(
          { content: message },
          { apiKey: this.getApiKey(this.fallbackProvider), ...options }
        );
      }
      throw error;
    }
  }

  /**
   * Set the active provider
   */
  setActiveProvider(provider: string): void {
    this.activeProvider = provider;
  }

  /**
   * Set the fallback provider
   */
  setFallbackProvider(provider: string): void {
    this.fallbackProvider = provider;
  }

  /**
   * Enable or disable memory integration
   */
  setMemoryEnabled(enabled: boolean): void {
    this.memoryEnabled = enabled;
  }

  /**
   * Enable or disable conversation logging
   */
  setConversationLoggingEnabled(enabled: boolean): void {
    this.conversationLoggingEnabled = enabled;
  }

  /**
   * Enable or disable fallback functionality
   */
  setFallbackEnabled(enabled: boolean): void {
    this.fallbackEnabled = enabled;
  }

  /**
   * Get the active provider instance
   */
  private getActiveProviderInstance(): AIProvider {
    return this.getProviderInstance(this.activeProvider);
  }

  /**
   * Get a provider instance by name
   */
  private getProviderInstance(name: string): AIProvider {
    if (!this.serviceLocator) {
      throw new Error('Service locator not configured');
    }

    const providerServiceName = `${name.toLowerCase()}Provider`;
    try {
      return this.serviceLocator.get<AIProvider>(providerServiceName);
    } catch (error) {
      throw new Error(`Provider '${name}' not found or not registered`);
    }
  }

  /**
   * Get API key for a provider
   */
  private getApiKey(provider: string): string {
    if (!this.serviceLocator) {
      throw new Error('Service locator not configured');
    }

    try {
      const settingsManager = this.serviceLocator.get<SettingsManager>('settingsManager');
      const apiKey = settingsManager.getApiKey(provider);
      if (!apiKey) {
        throw new Error(`API key not configured for provider: ${provider}`);
      }
      return apiKey;
    } catch (error) {
      throw new Error(`Failed to get API key for provider '${provider}': ${error}`);
    }
  }
}
