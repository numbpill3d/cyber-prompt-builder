/**
 * AI Provider Interface
 * This defines the common interface that all AI providers must implement
 */

export interface AIProviderOptions {
  apiKey: string;
  model?: string;
  temperature?: number;
  maxTokens?: number;
  language?: string;
}

export interface AIPrompt {
  content: string;
  context?: string;
}

export interface AIResponse {
  code: string;
  error?: string;
  raw?: any; // Raw response from the provider for debugging
}

export interface CostEstimate {
  inputCost: number;  // Cost for input tokens
  outputCost: number; // Cost for output tokens
  totalCost: number;  // Total estimated cost
  currency: string;   // Currency (USD, EUR, etc.)
}

export interface PromptOptimizationResult {
  optimizedPrompt: AIPrompt;
  rationale: string;
}

export interface AIProvider {
  name: string;
  
  // Core functionality
  generateCode(prompt: AIPrompt, options: AIProviderOptions): Promise<AIResponse>;
  listAvailableModels(): Promise<string[]>;
  isApiKeyValid(apiKey: string): Promise<boolean>;
  
  // Enhanced functionality
  isConfigured(): boolean;
  estimateCost(prompt: AIPrompt, options: AIProviderOptions): Promise<CostEstimate>;
  optimizePrompt(prompt: AIPrompt, language?: string): Promise<PromptOptimizationResult>;
  
  // Provider capabilities
  getMaxContextLength(model?: string): number;
  supportsLanguage(language: string): boolean;
  getProviderSpecificPrompt(prompt: AIPrompt, language?: string): AIPrompt;
}

// Factory for creating AI providers
export class AIProviderFactory {
  private static providers: Map<string, () => AIProvider> = new Map();

  static registerProvider(name: string, factory: () => AIProvider): void {
    this.providers.set(name.toLowerCase(), factory);
  }

  static createProvider(name: string): AIProvider {
    const factory = this.providers.get(name.toLowerCase());
    if (!factory) {
      throw new Error(`AI provider ${name} not found`);
    }
    return factory();
  }

  static getAvailableProviders(): string[] {
    return Array.from(this.providers.keys());
  }
}