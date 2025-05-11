/**
 * Claude Provider Implementation
 * Implements the AI Provider interface for Anthropic's Claude models
 */

import { registerAIProvider, AIProvider, AIProviderOptions, AIPrompt, CostEstimate, PromptOptimizationResult } from './provider';
import { AIResponse } from '../../core/models/response';
import { getService } from '../../core/services/service-locator';
import { SettingsManager } from '../../core/interfaces/settings-manager';

// Constants for Claude API
const API_BASE_URL = 'https://api.anthropic.com';
const API_VERSION = '2023-06-01';

// Cost per token (estimates, should be updated regularly)
const COST_PER_1K_INPUT_TOKENS = {
  'claude-3-opus': 0.015,
  'claude-3-sonnet': 0.008,
  'claude-3-haiku': 0.003,
  'claude-2.1': 0.008,
  'claude-2.0': 0.008,
  'claude-instant-1.2': 0.0008
};

const COST_PER_1K_OUTPUT_TOKENS = {
  'claude-3-opus': 0.075,
  'claude-3-sonnet': 0.024,
  'claude-3-haiku': 0.015,
  'claude-2.1': 0.024,
  'claude-2.0': 0.024,
  'claude-instant-1.2': 0.0024
};

const TOKEN_LIMITS = {
  'claude-3-opus': 200000,
  'claude-3-sonnet': 200000,
  'claude-3-haiku': 200000,
  'claude-2.1': 100000,
  'claude-2.0': 100000,
  'claude-instant-1.2': 100000
};

// Default model for code generation
const DEFAULT_MODEL = 'claude-3-sonnet';

/**
 * Claude AI Provider implementation
 */
@registerAIProvider('claude')
export class ClaudeProvider implements AIProvider {
  private apiKey: string | null = null;
  
  // Provider metadata
  getName(): string {
    return 'Claude';
  }
  
  getDescription(): string {
    return 'Anthropic\'s Claude AI models';
  }
  
  getVersion(): string {
    return '1.0.0';
  }
  
  // Model management
  async listAvailableModels(): Promise<string[]> {
    return Object.keys(TOKEN_LIMITS);
  }
  
  getDefaultModel(): string {
    return DEFAULT_MODEL;
  }
  
  supportsModel(model: string): boolean {
    return Object.keys(TOKEN_LIMITS).includes(model);
  }
  
  // API key management
  async isApiKeyValid(apiKey: string): Promise<boolean> {
    if (!apiKey || apiKey.trim() === '') {
      return false;
    }
    
    try {
      // Make a simple API call to check if the key is valid
      const response = await fetch(`${API_BASE_URL}/v1/models`, {
        method: 'GET',
        headers: {
          'x-api-key': apiKey,
          'anthropic-version': API_VERSION
        }
      });
      
      return response.status === 200;
    } catch (error) {
      console.error('Error validating Claude API key:', error);
      return false;
    }
  }
  
  isConfigured(): boolean {
    // Try to get API key from settings manager if not already set
    if (!this.apiKey) {
      try {
        // Use service locator to avoid direct dependency on settings manager
        const settingsManager = getService<SettingsManager>('SettingsManager');
        this.apiKey = settingsManager.getApiKey('claude');
      } catch (error) {
        return false;
      }
    }
    
    return !!this.apiKey && this.apiKey.trim() !== '';
  }
  
  // Generation
  async generateCode(prompt: AIPrompt, options: AIProviderOptions): Promise<AIResponse> {
    try {
      const apiKey = options.apiKey || this.apiKey;
      
      if (!apiKey) {
        throw new Error('API key not provided');
      }
      
      const model = options.model || this.getDefaultModel();
      const temperature = options.temperature !== undefined ? options.temperature : 0.7;
      const maxTokens = options.maxTokens || 4000;
      
      // Format prompt for Claude API
      const promptContent = this.formatPrompt(prompt, options.language);
      
      // Make API request to Claude
      const response = await fetch(`${API_BASE_URL}/v1/messages`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': apiKey,
          'anthropic-version': API_VERSION
        },
        body: JSON.stringify({
          model,
          messages: [
            { role: 'user', content: promptContent }
          ],
          max_tokens: maxTokens,
          temperature
        })
      });
      
      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Claude API Error: ${response.status} - ${errorText}`);
      }
      
      const result = await response.json();
      
      // Extract code from response
      return {
        code: result.content && result.content[0] && result.content[0].text || ''
      };
    } catch (error) {
      console.error('Error generating code with Claude:', error);
      return {
        code: '',
        error: error instanceof Error ? error.message : String(error)
      };
    }
  }
  
  // Cost estimation
  async estimateCost(prompt: AIPrompt, options: AIProviderOptions): Promise<CostEstimate> {
    const model = options.model || this.getDefaultModel();
    const maxOutputTokens = options.maxTokens || 4000;
    
    // Estimate token counts
    const promptContent = this.formatPrompt(prompt, options.language);
    const inputTokens = this.estimateTokenCount(promptContent);
    const outputTokens = Math.min(maxOutputTokens, TOKEN_LIMITS[model] - inputTokens);
    
    // Calculate costs
    const inputCostPer1k = COST_PER_1K_INPUT_TOKENS[model] || COST_PER_1K_INPUT_TOKENS[DEFAULT_MODEL];
    const outputCostPer1k = COST_PER_1K_OUTPUT_TOKENS[model] || COST_PER_1K_OUTPUT_TOKENS[DEFAULT_MODEL];
    
    const inputCost = (inputTokens / 1000) * inputCostPer1k;
    const outputCost = (outputTokens / 1000) * outputCostPer1k;
    
    return {
      inputCost,
      outputCost,
      totalCost: inputCost + outputCost,
      inputTokens,
      outputTokens,
      totalTokens: inputTokens + outputTokens
    };
  }
  
  // Prompt optimization
  async optimizePrompt(prompt: AIPrompt, language?: string): Promise<PromptOptimizationResult> {
    // Simple implementation - in a real scenario, this would use Claude itself to optimize the prompt
    let optimizedContent = prompt.content;
    
    // Ensure the prompt asks for code
    if (!optimizedContent.toLowerCase().includes('code') && !optimizedContent.toLowerCase().includes('program')) {
      optimizedContent = `Please write code for: ${optimizedContent}`;
    }
    
    // Add language if specified
    if (language && !optimizedContent.toLowerCase().includes(language.toLowerCase())) {
      optimizedContent = `Please write ${language} code for: ${optimizedContent}`;
    }
    
    // Add quality instructions
    if (!optimizedContent.includes('clear comments') && !optimizedContent.includes('well-commented')) {
      optimizedContent += ' Please include clear comments and well-structured code.';
    }
    
    return {
      optimizedPrompt: {
        content: optimizedContent,
        context: prompt.context
      },
      changes: ['Added code generation instruction', 'Added quality guidelines'],
      reasoning: 'Optimized prompt to improve code quality and clarity'
    };
  }
  
  // Advanced capabilities
  supportsChatMode(): boolean {
    return true;
  }
  
  supportsStreaming(): boolean {
    return true;
  }
  
  supportsImageInput(): boolean {
    return true; // Claude 3 models support image input
  }
  
  supportsFunctionCalling(): boolean {
    return true; // Claude 3 models support function calling
  }
  
  // Limits and constraints
  getTokenLimit(model: string): number {
    return TOKEN_LIMITS[model] || TOKEN_LIMITS[DEFAULT_MODEL];
  }
  
  getRateLimit(): { requests: number, period: string } {
    return {
      requests: 100,
      period: 'minute'
    };
  }
  
  // Helper methods
  private formatPrompt(prompt: AIPrompt, language?: string): string {
    let formattedPrompt = '';
    
    // Add context if provided
    if (prompt.context) {
      formattedPrompt += `Context:\n${prompt.context}\n\n`;
    }
    
    // Add main prompt content
    formattedPrompt += prompt.content;
    
    // Add language instruction if provided
    if (language) {
      formattedPrompt += `\n\nPlease write the solution in ${language}.`;
    }
    
    return formattedPrompt;
  }
  
  private estimateTokenCount(text: string): number {
    // Simple estimation - on average, 1 token is about 4 characters for English text
    return Math.ceil(text.length / 4);
  }
}