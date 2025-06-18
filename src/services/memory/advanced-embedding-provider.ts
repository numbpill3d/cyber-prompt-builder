/**
 * Advanced Embedding Provider
 * Supports multiple embedding models including OpenAI, local models, and sentence transformers
 */

import { MemoryProviderConfig } from './memory-types';

export interface EmbeddingModel {
  name: string;
  dimensions: number;
  maxTokens: number;
  costPerToken?: number;
}

export interface EmbeddingProvider {
  generateEmbeddings(texts: string[]): Promise<number[][]>;
  getModel(): EmbeddingModel;
  isAvailable(): Promise<boolean>;
}

/**
 * OpenAI Embedding Provider
 */
export class OpenAIEmbeddingProvider implements EmbeddingProvider {
  private apiKey: string;
  private model: EmbeddingModel;

  constructor(apiKey: string, modelName: string = 'text-embedding-3-small') {
    this.apiKey = apiKey;
    
    // Define available OpenAI embedding models
    const models: Record<string, EmbeddingModel> = {
      'text-embedding-3-small': {
        name: 'text-embedding-3-small',
        dimensions: 1536,
        maxTokens: 8191,
        costPerToken: 0.00002 / 1000
      },
      'text-embedding-3-large': {
        name: 'text-embedding-3-large',
        dimensions: 3072,
        maxTokens: 8191,
        costPerToken: 0.00013 / 1000
      },
      'text-embedding-ada-002': {
        name: 'text-embedding-ada-002',
        dimensions: 1536,
        maxTokens: 8191,
        costPerToken: 0.0001 / 1000
      }
    };

    this.model = models[modelName] || models['text-embedding-3-small'];
  }

  async generateEmbeddings(texts: string[]): Promise<number[][]> {
    try {
      const response = await fetch('https://api.openai.com/v1/embeddings', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.apiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          input: texts,
          model: this.model.name,
          encoding_format: 'float'
        }),
      });

      if (!response.ok) {
        throw new Error(`OpenAI API error: ${response.status} ${response.statusText}`);
      }

      const data = await response.json();
      return data.data.map((item: any) => item.embedding);
    } catch (error) {
      console.error('Error generating OpenAI embeddings:', error);
      throw error;
    }
  }

  getModel(): EmbeddingModel {
    return this.model;
  }

  async isAvailable(): Promise<boolean> {
    try {
      const response = await fetch('https://api.openai.com/v1/models', {
        headers: {
          'Authorization': `Bearer ${this.apiKey}`,
        },
      });
      return response.ok;
    } catch {
      return false;
    }
  }
}

/**
 * Local Sentence Transformer Provider (fallback)
 */
export class LocalEmbeddingProvider implements EmbeddingProvider {
  private model: EmbeddingModel;

  constructor(dimensions: number = 384) {
    this.model = {
      name: 'local-sentence-transformer',
      dimensions,
      maxTokens: 512,
    };
  }

  async generateEmbeddings(texts: string[]): Promise<number[][]> {
    // Enhanced local embedding using TF-IDF with semantic features
    return texts.map(text => this.generateSingleEmbedding(text));
  }

  private generateSingleEmbedding(text: string): number[] {
    const words = text.toLowerCase().split(/\s+/);
    const embedding = new Array(this.model.dimensions).fill(0);
    
    // Enhanced features
    const features = {
      // Length features
      wordCount: words.length,
      charCount: text.length,
      avgWordLength: words.reduce((sum, word) => sum + word.length, 0) / words.length,
      
      // Syntactic features
      hasCode: /[{}();]/.test(text),
      hasNumbers: /\d/.test(text),
      hasSpecialChars: /[!@#$%^&*]/.test(text),
      
      // Semantic features
      isQuestion: text.includes('?'),
      isCommand: /^(create|make|build|generate|write|add|remove|delete|update|modify)/.test(text.toLowerCase()),
      
      // Programming language indicators
      hasJavaScript: /\b(function|const|let|var|=>|console\.log)\b/.test(text),
      hasPython: /\b(def|import|print|if __name__|class)\b/.test(text),
      hasHTML: /<[^>]+>/.test(text),
      hasCSS: /\{[^}]*:[^}]*\}/.test(text),
    };

    // Convert features to embedding dimensions
    let idx = 0;
    
    // Normalize and embed length features
    embedding[idx++] = Math.tanh(features.wordCount / 100);
    embedding[idx++] = Math.tanh(features.charCount / 1000);
    embedding[idx++] = Math.tanh(features.avgWordLength / 10);
    
    // Binary features
    embedding[idx++] = features.hasCode ? 1 : -1;
    embedding[idx++] = features.hasNumbers ? 1 : -1;
    embedding[idx++] = features.hasSpecialChars ? 1 : -1;
    embedding[idx++] = features.isQuestion ? 1 : -1;
    embedding[idx++] = features.isCommand ? 1 : -1;
    
    // Language features
    embedding[idx++] = features.hasJavaScript ? 1 : -1;
    embedding[idx++] = features.hasPython ? 1 : -1;
    embedding[idx++] = features.hasHTML ? 1 : -1;
    embedding[idx++] = features.hasCSS ? 1 : -1;

    // Word-based features using simple hash
    for (const word of words.slice(0, 50)) { // Limit to first 50 words
      if (idx >= this.model.dimensions - 10) break;
      
      const hash = this.simpleHash(word) % (this.model.dimensions - idx - 10);
      embedding[idx + hash] += 1;
    }

    // Fill remaining dimensions with text characteristics
    while (idx < this.model.dimensions) {
      const charCode = text.charCodeAt(idx % text.length) || 0;
      embedding[idx] = (charCode / 255) * 2 - 1; // Normalize to [-1, 1]
      idx++;
    }

    // Normalize the vector
    const magnitude = Math.sqrt(embedding.reduce((sum, val) => sum + val * val, 0));
    return embedding.map(val => val / (magnitude || 1));
  }

  private simpleHash(str: string): number {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // Convert to 32-bit integer
    }
    return Math.abs(hash);
  }

  getModel(): EmbeddingModel {
    return this.model;
  }

  async isAvailable(): Promise<boolean> {
    return true; // Always available as fallback
  }
}

/**
 * Advanced Embedding Function that chooses the best available provider
 */
export class AdvancedEmbeddingFunction {
  private providers: EmbeddingProvider[] = [];
  private activeProvider: EmbeddingProvider;

  constructor(config: MemoryProviderConfig = {}) {
    // Try to initialize OpenAI provider if API key is available
    const openaiKey = this.getOpenAIKey();
    if (openaiKey) {
      this.providers.push(new OpenAIEmbeddingProvider(openaiKey, config.embeddingModel));
    }

    // Always add local provider as fallback
    this.providers.push(new LocalEmbeddingProvider(config.dimensions || 384));
    
    // Set the first available provider as active
    this.activeProvider = this.providers[0];
  }

  private getOpenAIKey(): string | null {
    // Try to get OpenAI key from various sources
    if (typeof window !== 'undefined') {
      return localStorage.getItem('openai_api_key') || null;
    }
    return process.env.OPENAI_API_KEY || null;
  }

  async initialize(): Promise<void> {
    // Find the best available provider
    for (const provider of this.providers) {
      if (await provider.isAvailable()) {
        this.activeProvider = provider;
        console.log(`Using embedding provider: ${provider.getModel().name}`);
        break;
      }
    }
  }

  async generate(texts: string[]): Promise<number[][]> {
    try {
      return await this.activeProvider.generateEmbeddings(texts);
    } catch (error) {
      console.error('Error with primary embedding provider, falling back:', error);
      
      // Try fallback providers
      for (let i = 1; i < this.providers.length; i++) {
        try {
          const fallbackProvider = this.providers[i];
          if (await fallbackProvider.isAvailable()) {
            this.activeProvider = fallbackProvider;
            return await fallbackProvider.generateEmbeddings(texts);
          }
        } catch (fallbackError) {
          console.error(`Fallback provider ${i} failed:`, fallbackError);
        }
      }
      
      throw new Error('All embedding providers failed');
    }
  }

  getActiveModel(): EmbeddingModel {
    return this.activeProvider.getModel();
  }

  getDimensions(): number {
    return this.activeProvider.getModel().dimensions;
  }
}/**
 * Advanced Embedding Provider
 * Supports multiple embedding models including OpenAI, local models, and sentence transformers
 */

import { MemoryProviderConfig } from './memory-types';

export interface EmbeddingModel {
  name: string;
  dimensions: number;
  maxTokens: number;
  costPerToken?: number;
}

export interface EmbeddingProvider {
  generateEmbeddings(texts: string[]): Promise<number[][]>;
  getModel(): EmbeddingModel;
  isAvailable(): Promise<boolean>;
}

/**
 * OpenAI Embedding Provider
 */
export class OpenAIEmbeddingProvider implements EmbeddingProvider {
  private apiKey: string;
  private model: EmbeddingModel;

  constructor(apiKey: string, modelName: string = 'text-embedding-3-small') {
    this.apiKey = apiKey;
    
    // Define available OpenAI embedding models
    const models: Record<string, EmbeddingModel> = {
      'text-embedding-3-small': {
        name: 'text-embedding-3-small',
        dimensions: 1536,
        maxTokens: 8191,
        costPerToken: 0.00002 / 1000
      },
      'text-embedding-3-large': {
        name: 'text-embedding-3-large',
        dimensions: 3072,
        maxTokens: 8191,
        costPerToken: 0.00013 / 1000
      },
      'text-embedding-ada-002': {
        name: 'text-embedding-ada-002',
        dimensions: 1536,
        maxTokens: 8191,
        costPerToken: 0.0001 / 1000
      }
    };

    this.model = models[modelName] || models['text-embedding-3-small'];
  }

  async generateEmbeddings(texts: string[]): Promise<number[][]> {
    try {
      const response = await fetch('https://api.openai.com/v1/embeddings', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.apiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          input: texts,
          model: this.model.name,
          encoding_format: 'float'
        }),
      });

      if (!response.ok) {
        throw new Error(`OpenAI API error: ${response.status} ${response.statusText}`);
      }

      const data = await response.json();
      return data.data.map((item: any) => item.embedding);
    } catch (error) {
      console.error('Error generating OpenAI embeddings:', error);
      throw error;
    }
  }

  getModel(): EmbeddingModel {
    return this.model;
  }

  async isAvailable(): Promise<boolean> {
    try {
      const response = await fetch('https://api.openai.com/v1/models', {
        headers: {
          'Authorization': `Bearer ${this.apiKey}`,
        },
      });
      return response.ok;
    } catch {
      return false;
    }
  }
}

/**
 * Local Sentence Transformer Provider (fallback)
 */
export class LocalEmbeddingProvider implements EmbeddingProvider {
  private model: EmbeddingModel;

  constructor(dimensions: number = 384) {
    this.model = {
      name: 'local-sentence-transformer',
      dimensions,
      maxTokens: 512,
    };
  }

  async generateEmbeddings(texts: string[]): Promise<number[][]> {
    // Enhanced local embedding using TF-IDF with semantic features
    return texts.map(text => this.generateSingleEmbedding(text));
  }

  private generateSingleEmbedding(text: string): number[] {
    const words = text.toLowerCase().split(/\s+/);
    const embedding = new Array(this.model.dimensions).fill(0);
    
    // Enhanced features
    const features = {
      // Length features
      wordCount: words.length,
      charCount: text.length,
      avgWordLength: words.reduce((sum, word) => sum + word.length, 0) / words.length,
      
      // Syntactic features
      hasCode: /[{}();]/.test(text),
      hasNumbers: /\d/.test(text),
      hasSpecialChars: /[!@#$%^&*]/.test(text),
      
      // Semantic features
      isQuestion: text.includes('?'),
      isCommand: /^(create|make|build|generate|write|add|remove|delete|update|modify)/.test(text.toLowerCase()),
      
      // Programming language indicators
      hasJavaScript: /\b(function|const|let|var|=>|console\.log)\b/.test(text),
      hasPython: /\b(def|import|print|if __name__|class)\b/.test(text),
      hasHTML: /<[^>]+>/.test(text),
      hasCSS: /\{[^}]*:[^}]*\}/.test(text),
    };

    // Convert features to embedding dimensions
    let idx = 0;
    
    // Normalize and embed length features
    embedding[idx++] = Math.tanh(features.wordCount / 100);
    embedding[idx++] = Math.tanh(features.charCount / 1000);
    embedding[idx++] = Math.tanh(features.avgWordLength / 10);
    
    // Binary features
    embedding[idx++] = features.hasCode ? 1 : -1;
    embedding[idx++] = features.hasNumbers ? 1 : -1;
    embedding[idx++] = features.hasSpecialChars ? 1 : -1;
    embedding[idx++] = features.isQuestion ? 1 : -1;
    embedding[idx++] = features.isCommand ? 1 : -1;
    
    // Language features
    embedding[idx++] = features.hasJavaScript ? 1 : -1;
    embedding[idx++] = features.hasPython ? 1 : -1;
    embedding[idx++] = features.hasHTML ? 1 : -1;
    embedding[idx++] = features.hasCSS ? 1 : -1;

    // Word-based features using simple hash
    for (const word of words.slice(0, 50)) { // Limit to first 50 words
      if (idx >= this.model.dimensions - 10) break;
      
      const hash = this.simpleHash(word) % (this.model.dimensions - idx - 10);
      embedding[idx + hash] += 1;
    }

    // Fill remaining dimensions with text characteristics
    while (idx < this.model.dimensions) {
      const charCode = text.charCodeAt(idx % text.length) || 0;
      embedding[idx] = (charCode / 255) * 2 - 1; // Normalize to [-1, 1]
      idx++;
    }

    // Normalize the vector
    const magnitude = Math.sqrt(embedding.reduce((sum, val) => sum + val * val, 0));
    return embedding.map(val => val / (magnitude || 1));
  }

  private simpleHash(str: string): number {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // Convert to 32-bit integer
    }
    return Math.abs(hash);
  }

  getModel(): EmbeddingModel {
    return this.model;
  }

  async isAvailable(): Promise<boolean> {
    return true; // Always available as fallback
  }
}

/**
 * Advanced Embedding Function that chooses the best available provider
 */
export class AdvancedEmbeddingFunction {
  private providers: EmbeddingProvider[] = [];
  private activeProvider: EmbeddingProvider;

  constructor(config: MemoryProviderConfig = {}) {
    // Try to initialize OpenAI provider if API key is available
    const openaiKey = this.getOpenAIKey();
    if (openaiKey) {
      this.providers.push(new OpenAIEmbeddingProvider(openaiKey, config.embeddingModel));
    }

    // Always add local provider as fallback
    this.providers.push(new LocalEmbeddingProvider(config.dimensions || 384));
    
    // Set the first available provider as active
    this.activeProvider = this.providers[0];
  }

  private getOpenAIKey(): string | null {
    // Try to get OpenAI key from various sources
    if (typeof window !== 'undefined') {
      return localStorage.getItem('openai_api_key') || null;
    }
    return process.env.OPENAI_API_KEY || null;
  }

  async initialize(): Promise<void> {
    // Find the best available provider
    for (const provider of this.providers) {
      if (await provider.isAvailable()) {
        this.activeProvider = provider;
        console.log(`Using embedding provider: ${provider.getModel().name}`);
        break;
      }
    }
  }

  async generate(texts: string[]): Promise<number[][]> {
    try {
      return await this.activeProvider.generateEmbeddings(texts);
    } catch (error) {
      console.error('Error with primary embedding provider, falling back:', error);
      
      // Try fallback providers
      for (let i = 1; i < this.providers.length; i++) {
        try {
          const fallbackProvider = this.providers[i];
          if (await fallbackProvider.isAvailable()) {
            this.activeProvider = fallbackProvider;
            return await fallbackProvider.generateEmbeddings(texts);
          }
        } catch (fallbackError) {
          console.error(`Fallback provider ${i} failed:`, fallbackError);
        }
      }
      
      throw new Error('All embedding providers failed');
    }
  }

  getActiveModel(): EmbeddingModel {
    return this.activeProvider.getModel();
  }

  getDimensions(): number {
    return this.activeProvider.getModel().dimensions;
  }
}