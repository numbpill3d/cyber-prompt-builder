/**
 * AI Provider Interface
 * Defines the contract that all AI providers must implement
 */

export interface AIProviderOptions {
  apiKey: string;
  model?: string;
  temperature?: number;
  maxTokens?: number;
  language?: string;
  streaming?: boolean;
}

export interface AIPrompt {
  content: string;
  context?: string;
  systemPrompt?: string;
}

export interface AIResponse {
  content: string;
  error?: string;
  raw?: any; // Raw response from the provider for debugging
}

export interface StreamingResponseChunk {
  content: string;
  isComplete: boolean;
  error?: string;
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

export interface EmbeddingResult {
  embedding: number[];
  tokenCount: number;
}

export interface AIProvider {
  name: string;
  
  // Core functionality
  generateResponse(prompt: AIPrompt, options: AIProviderOptions): Promise<AIResponse>;
  generateStreamingResponse(prompt: AIPrompt, options: AIProviderOptions, 
                           onChunk: (chunk: StreamingResponseChunk) => void): Promise<AIResponse>;
  generateEmbedding(text: string, options: AIProviderOptions): Promise<EmbeddingResult>;
  
  // Model information
  listAvailableModels(): Promise<string[]>;
  isApiKeyValid(apiKey: string): Promise<boolean>;
  
  // Enhanced functionality
  isConfigured(): boolean;
  estimateCost(prompt: AIPrompt, options: AIProviderOptions): Promise<CostEstimate>;
  optimizePrompt(prompt: AIPrompt, language?: string): Promise<PromptOptimizationResult>;
  
  // Provider capabilities
  getMaxContextLength(model?: string): number;
  supportsStreaming(model?: string): boolean;
  supportsEmbeddings(model?: string): boolean;
  supportsLanguage(language: string): boolean;
  getProviderSpecificPrompt(prompt: AIPrompt, language?: string): AIPrompt;
}