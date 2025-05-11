/**
 * AI Provider Interface
 * Defines the contract for AI provider implementations (Claude, OpenAI, Gemini)
 */

import { AIPrompt, AIResponse } from '../../core/models/response';

/**
 * AI Provider options
 */
export interface AIProviderOptions {
  apiKey: string;
  model: string;
  temperature?: number;
  maxTokens?: number;
  language?: string;
  extraParams?: Record<string, any>;
}

/**
 * Cost estimate for AI generation
 */
export interface CostEstimate {
  inputCost: number;
  outputCost: number;
  totalCost: number;
  inputTokens: number;
  outputTokens: number;
  totalTokens: number;
}

/**
 * Prompt optimization result
 */
export interface PromptOptimizationResult {
  optimizedPrompt: AIPrompt;
  changes?: string[];
  reasoning?: string;
}

/**
 * AI Provider interface
 */
export interface AIProvider {
  // Provider metadata
  getName(): string;
  getDescription(): string;
  getVersion(): string;
  
  // Model management
  listAvailableModels(): Promise<string[]>;
  getDefaultModel(): string;
  supportsModel(model: string): boolean;
  
  // API key management
  isApiKeyValid(apiKey: string): Promise<boolean>;
  isConfigured(): boolean;
  
  // Generation
  generateCode(prompt: AIPrompt, options: AIProviderOptions): Promise<AIResponse>;
  
  // Cost estimation
  estimateCost(prompt: AIPrompt, options: AIProviderOptions): Promise<CostEstimate>;
  
  // Prompt optimization
  optimizePrompt(prompt: AIPrompt, language?: string): Promise<PromptOptimizationResult>;
  
  // Advanced capabilities
  supportsChatMode(): boolean;
  supportsStreaming(): boolean;
  supportsImageInput(): boolean;
  supportsFunctionCalling(): boolean;
  
  // Limits and constraints
  getTokenLimit(model: string): number;
  getRateLimit(): { requests: number, period: string };
}

/**
 * AI Provider Factory for registering and creating providers
 */
export class AIProviderFactory {
  private static providers: Map<string, new () => AIProvider> = new Map();
  
  /**
   * Register a provider implementation
   * @param name Provider name
   * @param providerClass Provider class
   */
  static registerProvider(name: string, providerClass: new () => AIProvider): void {
    AIProviderFactory.providers.set(name.toLowerCase(), providerClass);
  }
  
  /**
   * Create a provider instance by name
   * @param name Provider name
   * @returns Provider instance
   * @throws Error if provider is not registered
   */
  static createProvider(name: string): AIProvider {
    const providerClass = AIProviderFactory.providers.get(name.toLowerCase());
    
    if (!providerClass) {
      throw new Error(`Provider '${name}' not registered. Available providers: ${Array.from(AIProviderFactory.providers.keys()).join(', ')}`);
    }
    
    return new providerClass();
  }
  
  /**
   * Get list of available provider names
   * @returns Array of provider names
   */
  static getAvailableProviders(): string[] {
    return Array.from(AIProviderFactory.providers.keys());
  }
  
  /**
   * Check if a provider is registered
   * @param name Provider name
   * @returns True if provider is registered
   */
  static hasProvider(name: string): boolean {
    return AIProviderFactory.providers.has(name.toLowerCase());
  }
}

/**
 * Decorator for registering a provider implementation with the factory
 * @param name Provider name
 */
export function registerAIProvider(name: string) {
  return function<T extends new () => AIProvider>(constructor: T) {
    AIProviderFactory.registerProvider(name, constructor);
    return constructor;
  };
}