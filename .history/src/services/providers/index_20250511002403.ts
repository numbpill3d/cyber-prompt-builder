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
