/**
 * Model Router
 * Handles automatic provider selection and routing based on various criteria
 */

import { AIPrompt, AIProviderOptions, getProvider, DEFAULT_PROVIDER, getConfiguredProviders, estimateCostAcrossProviders, optimizePromptForProvider } from './providers/providers';
import { settingsManager } from './settings-manager';
import { Logger } from './logging/logger';
import { errorHandler, ProviderError, ValidationError } from './error/error-handler';
import { configService } from './config/config-service';

// Types of routing strategies
export type RoutingStrategy = 'user-selected' | 'cost-optimized' | 'performance-optimized' | 'balanced' | 'auto';

export interface RoutingOptions {
  strategy: RoutingStrategy;
  promptComplexity?: 'low' | 'medium' | 'high' | 'auto';
  prioritizeCost?: boolean;
  prioritizeAccuracy?: boolean;
  languageSpecific?: string; // Programming language if specific
  contextLength?: number;    // Estimated context length
}

// Default routing options
const defaultRoutingOptions: RoutingOptions = {
  strategy: 'user-selected',
  promptComplexity: 'medium',
  prioritizeCost: false,
  prioritizeAccuracy: false,
  languageSpecific: undefined,
  contextLength: 0
};

/**
 * ModelRouter handles selection of the appropriate AI provider based on various criteria
 */
export class ModelRouter {
  private routingOptions: RoutingOptions;
  private logger: Logger;

  constructor(options: Partial<RoutingOptions> = {}) {
    this.logger = new Logger('ModelRouter');
    
    // Try to load default strategy from config
    let configStrategy: RoutingStrategy = defaultRoutingOptions.strategy;
    try {
      const configuredProvider = configService.get<string>('providers', 'default_provider');
      if (configuredProvider) {
        configStrategy = 'user-selected';
      }
    } catch (error) {
      this.logger.debug('Failed to load default provider from config', { error });
    }
    
    this.routingOptions = {
      ...defaultRoutingOptions,
      strategy: configStrategy,
      ...options
    };
    
    this.logger.info('ModelRouter initialized', { strategy: this.routingOptions.strategy });
  }

  /**
   * Route a prompt to the appropriate provider based on strategy
   * @param prompt The prompt to route
   * @param options Provider options
   * @returns The provider name selected
   */
  public routePrompt(prompt: AIPrompt, options?: Partial<AIProviderOptions>): string {
    try {
      // Get available providers with configured API keys
      const availableProviders = this.getConfiguredProviders();
      
      if (availableProviders.length === 0) {
        throw new ProviderError("No providers are configured with API keys");
      }
      
      this.logger.debug('Routing prompt', {
        strategy: this.routingOptions.strategy,
        promptLength: prompt.content.length,
        availableProviders
      });
      
      // Auto-detect complexity if needed
      if (this.routingOptions.promptComplexity === 'auto') {
        this.routingOptions.promptComplexity = this.detectPromptComplexity(prompt);
        this.logger.debug('Auto-detected prompt complexity', {
          complexity: this.routingOptions.promptComplexity
        });
      }
      
      let selectedProvider: string;
      
      // Apply routing strategy
      switch (this.routingOptions.strategy) {
        case 'user-selected':
          selectedProvider = this.routeUserSelected();
          break;
        
        case 'cost-optimized':
          selectedProvider = this.routeCostOptimized(prompt, availableProviders);
          break;
        
        case 'performance-optimized':
          selectedProvider = this.routePerformanceOptimized(prompt, availableProviders);
          break;
        
        case 'balanced':
          selectedProvider = this.routeBalanced(prompt, availableProviders);
          break;
          
        case 'auto':
          selectedProvider = this.routeAuto(prompt, availableProviders);
          break;
        
        default:
          selectedProvider = this.routeUserSelected();
      }
      
      this.logger.info('Selected provider for prompt', {
        provider: selectedProvider,
        strategy: this.routingOptions.strategy
      });
      
      return selectedProvider;
    } catch (error) {
      this.logger.error('Failed to route prompt', {
        error,
        strategy: this.routingOptions.strategy
      });
      throw errorHandler.handleError(error as Error, {
        strategy: this.routingOptions.strategy,
        promptLength: prompt.content.length
      });
    }
  }
  
  /**
   * Auto-detect prompt complexity
   */
  private detectPromptComplexity(prompt: AIPrompt): 'low' | 'medium' | 'high' {
    const fullPrompt = prompt.context 
      ? `${prompt.context}\n\n${prompt.content}`
      : prompt.content;
    
    // Simple heuristics for complexity
    const length = fullPrompt.length;
    const lineCount = fullPrompt.split('\n').length;
    const complexTerms = [
      'algorithm', 'optimization', 'complex', 'advanced', 'architecture',
      'database', 'performance', 'security', 'scale', 'distributed',
      'machine learning', 'AI', 'neural', 'parallel', 'concurrent'
    ];
    
    // Count occurrences of complex terms
    const complexTermCount = complexTerms.reduce((count, term) => {
      const regex = new RegExp(term, 'gi');
      const matches = fullPrompt.match(regex);
      return count + (matches ? matches.length : 0);
    }, 0);
    
    // Determine complexity
    if (length > 1000 || lineCount > 30 || complexTermCount > 5) {
      return 'high';
    } else if (length > 500 || lineCount > 15 || complexTermCount > 2) {
      return 'medium';
    } else {
      return 'low';
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
   * Route based on cost optimization - simplified synchronous version
   */
  private routeCostOptimized(prompt: AIPrompt, availableProviders: string[]): string {
    // Simple cost-based routing based on known provider pricing
    // Gemini tends to be cheapest, followed by OpenAI, then Claude
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
   * Get cost estimate for a provider (can be used for more detailed async cost analysis)
   */
  public async getCostEstimate(provider: string, prompt: AIPrompt): Promise<number> {
    try {
      this.logger.debug(`Estimating cost for ${provider}`, {
        provider,
        promptLength: prompt.content.length
      });
      
      const costEstimates = await estimateCostAcrossProviders(prompt);
      const cost = costEstimates[provider]?.totalCost || 0;
      
      this.logger.debug(`Cost estimate for ${provider}`, { provider, cost });
      return cost;
    } catch (error) {
      this.logger.error(`Error estimating cost for ${provider}`, { error, provider });
      return errorHandler.withFallback(
        async () => {
          throw error;
        },
        0,
        (appError) => {
          this.logger.warn(`Using fallback cost of 0 for ${provider}`, { provider });
        }
      )();
    }
  }
  
  /**
   * Route based on performance optimization
   */
  private routePerformanceOptimized(prompt: AIPrompt, availableProviders: string[]): string {
    // Performance rating based on language and task
    const language = this.routingOptions.languageSpecific;
    
    // Preferred orders based on language
    const languagePreferences: Record<string, string[]> = {
      // Languages where OpenAI tends to perform better
      'javascript': ['openai', 'claude', 'gemini'],
      'typescript': ['openai', 'claude', 'gemini'],
      'python': ['openai', 'claude', 'gemini'],
      
      // Languages where Claude tends to perform better
      'rust': ['claude', 'openai', 'gemini'],
      'go': ['claude', 'openai', 'gemini'],
      
      // Default preference
      'default': ['claude', 'openai', 'gemini']
    };
    
    const preferredOrder = language && languagePreferences[language.toLowerCase()]
      ? languagePreferences[language.toLowerCase()]
      : languagePreferences.default;
    
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
   * Auto-routing that intelligently selects the best strategy based on prompt analysis
   */
  private routeAuto(prompt: AIPrompt, availableProviders: string[]): string {
    // Logic to automatically determine the best strategy
    
    // Check if language-specific
    const hasCode = /```[\s\S]*?```/.test(prompt.content);
    const codeLanguageMatch = prompt.content.match(/```(\w+)/);
    const language = codeLanguageMatch ? codeLanguageMatch[1] : undefined;
    
    if (language) {
      // Set language-specific routing
      this.routingOptions.languageSpecific = language;
    }
    
    // For very complex tasks with long contexts, prioritize models with larger context windows
    if (this.routingOptions.promptComplexity === 'high' && (prompt.context || this.routingOptions.contextLength > 8000)) {
      // Get providers by context window size
      const contextRanking = availableProviders
        .map(provider => {
          const providerInstance = getProvider(provider);
          const model = settingsManager.getPreferredModel(provider);
          return {
            provider,
            contextSize: providerInstance.getMaxContextLength(model)
          };
        })
        .sort((a, b) => b.contextSize - a.contextSize);
      
      if (contextRanking.length > 0) {
        return contextRanking[0].provider;
      }
    }
    
    // For code generation tasks, prioritize performance
    if (hasCode || language) {
      return this.routePerformanceOptimized(prompt, availableProviders);
    }
    
    // For short, simple queries, prioritize cost
    if (this.routingOptions.promptComplexity === 'low') {
      return this.routeCostOptimized(prompt, availableProviders);
    }
    
    // Default to balanced for everything else
    return this.routeBalanced(prompt, availableProviders);
  }
  
  /**
   * Get providers that have configured API keys
   */
  private getConfiguredProviders(): string[] {
    return getConfiguredProviders();
  }
  
  /**
   * Optimize a prompt for the selected provider
   */
  public async optimizePromptForProvider(provider: string, prompt: AIPrompt): Promise<AIPrompt> {
    try {
      this.logger.debug(`Optimizing prompt for ${provider}`, {
        provider,
        language: this.routingOptions.languageSpecific,
        promptLength: prompt.content.length
      });
      
      const language = this.routingOptions.languageSpecific;
      const optimizedPrompt = await optimizePromptForProvider(provider, prompt, language);
      
      this.logger.debug(`Prompt optimized for ${provider}`, {
        provider,
        originalLength: prompt.content.length,
        optimizedLength: optimizedPrompt.content.length
      });
      
      return optimizedPrompt;
    } catch (error) {
      this.logger.error(`Failed to optimize prompt for ${provider}`, { error, provider });
      
      // Fall back to original prompt
      return errorHandler.withFallback(
        async () => {
          throw error;
        },
        prompt,
        (appError) => {
          this.logger.warn(`Using original prompt for ${provider} due to optimization failure`, { provider });
        }
      )();
    }
  }
  
  /**
   * Set the routing strategy
   */
  public setRoutingStrategy(strategy: RoutingStrategy): void {
    try {
      if (!Object.values(RoutingStrategy).includes(strategy as any)) {
        throw new ValidationError(`Invalid routing strategy: ${strategy}`);
      }
      
      this.routingOptions.strategy = strategy;
      this.logger.info(`Routing strategy set to ${strategy}`, { strategy });
    } catch (error) {
      this.logger.error(`Failed to set routing strategy to ${strategy}`, { error, strategy });
      throw errorHandler.handleError(error as Error, { strategy });
    }
  }
  
  /**
   * Set routing options
   */
  public setRoutingOptions(options: Partial<RoutingOptions>): void {
    try {
      this.routingOptions = {
        ...this.routingOptions,
        ...options
      };
      
      this.logger.debug('Routing options updated', { options });
    } catch (error) {
      this.logger.error('Failed to update routing options', { error, options });
      throw errorHandler.handleError(error as Error, { options });
    }
  }
  
  /**
   * Get current routing options
   */
  public getRoutingOptions(): RoutingOptions {
    try {
      return { ...this.routingOptions };
    } catch (error) {
      this.logger.error('Failed to get routing options', { error });
      throw errorHandler.handleError(error as Error);
    }
  }
}

// Create a singleton instance for use throughout the app
export const modelRouter = new ModelRouter();