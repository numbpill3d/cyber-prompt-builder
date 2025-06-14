
/**
 * OpenAI Provider Implementation
 */

import { AIProvider, AIProviderOptions, AIPrompt, AIResponse, StreamingResponseChunk, CostEstimate, PromptOptimizationResult, EmbeddingResult } from '@shared/interfaces/ai-provider';

export class OpenAIProvider implements AIProvider {
  name = 'OpenAI';

  async generateResponse(prompt: AIPrompt, options: AIProviderOptions): Promise<AIResponse> {
    try {
      const response = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${options.apiKey}`
        },
        body: JSON.stringify({
          model: options.model || 'gpt-4',
          messages: [
            ...(prompt.systemPrompt ? [{ role: 'system', content: prompt.systemPrompt }] : []),
            {
              role: 'user',
              content: prompt.context ? `${prompt.context}\n\n${prompt.content}` : prompt.content
            }
          ],
          max_tokens: options.maxTokens || 4000,
          temperature: options.temperature || 0.7
        })
      });

      if (!response.ok) {
        const errorData = await response.json();
        return {
          content: '',
          error: `OpenAI API error: ${response.status} - ${errorData.error?.message || 'Unknown error'}`
        };
      }

      const data = await response.json();
      return {
        content: data.choices?.[0]?.message?.content || '',
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
    const response = await this.generateResponse(prompt, options);
    onChunk({
      content: response.content,
      isComplete: true,
      error: response.error
    });
    return response;
  }

  async generateEmbedding(text: string, options: AIProviderOptions): Promise<EmbeddingResult> {
    const response = await fetch('https://api.openai.com/v1/embeddings', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${options.apiKey}`
      },
      body: JSON.stringify({
        model: 'text-embedding-ada-002',
        input: text
      })
    });

    const data = await response.json();
    return {
      embedding: data.data[0].embedding,
      tokenCount: data.usage.total_tokens
    };
  }

  async listAvailableModels(): Promise<string[]> {
    return [
      'gpt-4',
      'gpt-4-turbo',
      'gpt-3.5-turbo'
    ];
  }

  async isApiKeyValid(apiKey: string): Promise<boolean> {
    try {
      const response = await fetch('https://api.openai.com/v1/models', {
        headers: {
          'Authorization': `Bearer ${apiKey}`
        }
      });
      return response.ok;
    } catch {
      return false;
    }
  }

  isConfigured(): boolean {
    return true;
  }

  async estimateCost(prompt: AIPrompt, options: AIProviderOptions): Promise<CostEstimate> {
    const inputTokens = Math.ceil(prompt.content.length / 4);
    const outputTokens = options.maxTokens || 1000;
    
    return {
      inputCost: (inputTokens / 1000) * 0.01,
      outputCost: (outputTokens / 1000) * 0.03,
      totalCost: (inputTokens / 1000) * 0.01 + (outputTokens / 1000) * 0.03,
      currency: 'USD'
    };
  }

  async optimizePrompt(prompt: AIPrompt, language?: string): Promise<PromptOptimizationResult> {
    return {
      optimizedPrompt: prompt,
      rationale: 'No optimization needed for OpenAI'
    };
  }

  getMaxContextLength(model?: string): number {
    return 128000;
  }

  supportsStreaming(model?: string): boolean {
    return true;
  }

  supportsEmbeddings(model?: string): boolean {
    return true;
  }

  supportsLanguage(language: string): boolean {
    return true;
  }

  getProviderSpecificPrompt(prompt: AIPrompt, language?: string): AIPrompt {
    return prompt;
  }
}
