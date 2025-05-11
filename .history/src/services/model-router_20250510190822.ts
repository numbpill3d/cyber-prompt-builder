/**
 * Model Router
 * Handles automatic provider selection and routing based on various criteria
 */

import { AIPrompt, AIProviderOptions, getProvider, DEFAULT_PROVIDER } from './providers/providers';
import { settingsManager } from './settings-manager';

// Types of routing strategies
export type RoutingStrategy = 'user-selected' | 'cost-optimized' | 'performance-optimized' | 'balanced';

export interface RoutingOptions {
  strategy: RoutingStrategy;
  promptComplexity?: 'low' | 'medium' | 'high';
  prioritizeCost?: boolean;
  prioritizeAccuracy?: boolean;
}

// Default routing options
const defaultRoutingOptions: RoutingOptions = {
  strategy: 'user-selected',
  promptComplexity: 'medium',
  prioritizeCost: false,
  prioritizeAccuracy: false
};

/**
 * ModelRouter handles selection of the appropriate AI provider based on various criteria
 */
export class ModelRouter {
  private routingOptions: RoutingOptions;

  constructor(options: Partial<RoutingOptions> = {}) {
    this.routingOptions = {
      ...defaultRoutingOptions,
      ...options
    };
  }

  /**
   * Route a prompt to the appropriate provider based on strategy
   * @param prompt The prompt to route
   * @param options Provider options
   * @returns The provider name selected
   */
  public routePrompt(prompt: AIPrompt, options?: Partial<AIProviderOptions>): string {
    // Get available providers with configured API keys
    const availableProviders = this.getConfiguredProviders();
    
    if (availableProviders.length === 0) {
      throw new Error("No providers are configured with API keys");
    }
    
    // Apply routing strategy
    switch (this.routingOptions.strategy) {
      case 'user-selected':
        return this.routeUserSelected();
      
      case 'cost-optimized':
        return this.routeCostOptimized(prompt, availableProviders);
      
      case 'performance-optimized':
        return this.routePerformanceOptimized(prompt, availableProviders);
      
      case 'balanced':
        return this.routeBalanced(prompt, availableProviders);
      
      default:
        return this.routeUserSelected();
    }
  }
  
  /**
   * Route based on user's selected provider
   */
  private routeUserSelected(): string {
    const userSelectedProvider = settingsManager.getActiveProvider();
    return userSelectedProvider || DEFAULT_PROVIDER;
  }
  
  /**
   * Route based on cost optimization
   */
  private routeCostOptimized(prompt: AIPrompt, availableProviders: string[]): string {
    // Example cost-based routing logic
    // In a real implementation, this would use actual pricing data
    const preferredOrder = ['gemini', 'openai', 'claude'];
    
    // Find the first available provider in preferred order
    for (const provider of preferredOrder) {
      if (availableProviders.includes(provider)) {
        return provider;
      }
    }
    
    // Fall back to first available
    return availableProviders[0];
  }
  
  /**
   * Route based on performance optimization
   */
  private routePerformanceOptimized(prompt: AIPrompt, availableProviders: string[]): string {
    // Example performance-based routing logic
    const preferredOrder = ['claude', 'openai', 'gemini'];
    
    // Find the first available provider in preferred order
    for (const provider of preferredOrder) {
      if (availableProviders.includes(provider)) {
        return provider;
      }
    }
    
    // Fall back to first available
    return availableProviders[0];
  }
  
  /**
   * Route based on balanced approach
   */
  private routeBalanced(prompt: AIPrompt, availableProviders: string[]): string {
    // For simple prompts, use cost-optimized
    if (this.routingOptions.promptComplexity === 'low') {
      return this.routeCostOptimized(prompt, availableProviders);
    }
    
    // For complex prompts, use performance-optimized
    if (this.routingOptions.promptComplexity === 'high') {
      return this.routePerformanceOptimized(prompt, availableProviders);
    }
    
    // For medium complexity, make a balanced choice
    if (this.routingOptions.prioritizeCost) {
      return this.routeCostOptimized(prompt, availableProviders);
    }
    
    if (this.routingOptions.prioritizeAccuracy) {
      return this.routePerformanceOptimized(prompt, availableProviders);
    }
    
    // Default balanced approach for medium complexity
    // Use user's preference if available, otherwise use a default
    return this.routeUserSelected();
  }
  
  /**
   * Get providers that have configured API keys
   */
  private getConfiguredProviders(): string[] {
    const settings = settingsManager.getSettings();
    const availableProviders: string[] = [];
    
    // Check each provider for an API key
    for (const provider in settings.providers) {
      const apiKey = settings.providers[provider as keyof typeof settings.providers].apiKey;
      if (apiKey && apiKey.trim() !== '') {
        availableProviders.push(provider);
      }
    }
    
    return availableProviders;
  }
  
  /**
   * Set the routing strategy
   */
  public setRoutingStrategy(strategy: RoutingStrategy): void {
    this.routingOptions.strategy = strategy;
  }
  
  /**
   * Set routing options
   */
  public setRoutingOptions(options: Partial<RoutingOptions>): void {
    this.routingOptions = {
      ...this.routingOptions,
      ...options
    };
  }
  
  /**
   * Get current routing options
   */
  public getRoutingOptions(): RoutingOptions {
    return { ...this.routingOptions };
  }
}

// Create a singleton instance for use throughout the app
export const modelRouter = new ModelRouter();