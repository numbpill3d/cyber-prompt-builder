
/**
 * Claude AI Provider Implementation
 */

import { AIProvider, AIProviderOptions, AIPrompt, AIResponse, StreamingResponseChunk, CostEstimate, PromptOptimizationResult, EmbeddingResult } from '@shared/interfaces/ai-provider';

export class ClaudeProvider implements AIProvider {
  name = 'Claude';

  async generateResponse(prompt: AIPrompt, options: AIProviderOptions): Promise<AIResponse> {
    try {
      const response = await fetch('https://api.anthropic.com/v1/messages', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': options.apiKey,
          'anthropic-version': '2023-06-01'
        },
        body: JSON.stringify({
          model: options.model || 'claude-3-sonnet-20240229',
          max_tokens: options.maxTokens || 4000,
          temperature: options.temperature || 0.7,
          messages: [
            {
              role: 'user',
              content: prompt.context ? `${prompt.context}\n\n${prompt.content}` : prompt.content
            }
          ],
          system: prompt.systemPrompt
        })
      });

      if (!response.ok) {
        const errorData = await response.json();
        return {
          content: '',
          error: `Claude API error: ${response.status} - ${errorData.error?.message || 'Unknown error'}`
        };
      }

      const data = await response.json();
      return {
        content: data.content?.[0]?.text || '',
        raw: data
      };
    } catch (error) {
      return {
        content: '',
        error: `Failed to generate response: ${error}`
      };
    }
  }

  async generateStreamingResponse(
    prompt: AIPrompt, 
    options: AIProviderOptions, 
    onChunk: (chunk: StreamingResponseChunk) => void
  ): Promise<AIResponse> {
    // Simplified implementation - would need proper streaming
    const response = await this.generateResponse(prompt, options);
    onChunk({
      content: response.content,
      isComplete: true,
      error: response.error
    });
    return response;
  }

  async generateEmbedding(text: string, options: AIProviderOptions): Promise<EmbeddingResult> {
    throw new Error('Claude does not support embeddings');
  }

  async listAvailableModels(): Promise<string[]> {
    return [
      'claude-3-opus-20240229',
      'claude-3-sonnet-20240229',
      'claude-3-haiku-20240307'
    ];
  }

  async isApiKeyValid(apiKey: string): Promise<boolean> {
    try {
      const response = await fetch('https://api.anthropic.com/v1/messages', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': apiKey,
          'anthropic-version': '2023-06-01'
        },
        body: JSON.stringify({
          model: 'claude-3-haiku-20240307',
          max_tokens: 10,
          messages: [{ role: 'user', content: 'test' }]
        })
      });
      return response.ok;
    } catch {
      return false;
    }
  }

  isConfigured(): boolean {
    // This would check if the provider has all necessary configuration
    return true;
  }

  async estimateCost(prompt: AIPrompt, options: AIProviderOptions): Promise<CostEstimate> {
    const inputTokens = Math.ceil(prompt.content.length / 4);
    const outputTokens = options.maxTokens || 1000;
    
    return {
      inputCost: (inputTokens / 1000) * 0.003,
      outputCost: (outputTokens / 1000) * 0.015,
      totalCost: (inputTokens / 1000) * 0.003 + (outputTokens / 1000) * 0.015,
      currency: 'USD'
    };
  }

  async optimizePrompt(prompt: AIPrompt, language?: string): Promise<PromptOptimizationResult> {
    return {
      optimizedPrompt: prompt,
      rationale: 'No optimization needed for Claude'
    };
  }

  getMaxContextLength(model?: string): number {
    return 200000; // Claude's context window
  }

  supportsStreaming(model?: string): boolean {
    return true;
  }

  supportsEmbeddings(model?: string): boolean {
    return false;
  }

  supportsLanguage(language: string): boolean {
    return true; // Claude supports most languages
  }

  getProviderSpecificPrompt(prompt: AIPrompt, language?: string): AIPrompt {
    return prompt;
  }
}
