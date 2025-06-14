
/**
 * Google Gemini Provider Implementation
 */

import { AIProvider, AIProviderOptions, AIPrompt, AIResponse, StreamingResponseChunk, CostEstimate, PromptOptimizationResult, EmbeddingResult } from '@shared/interfaces/ai-provider';

export class GeminiProvider implements AIProvider {
  name = 'Gemini';

  async generateResponse(prompt: AIPrompt, options: AIProviderOptions): Promise<AIResponse> {
    try {
      const apiUrl = `https://generativelanguage.googleapis.com/v1beta/models/${options.model || 'gemini-pro'}/generateContent?key=${options.apiKey}`;
      
      const response = await fetch(apiUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          contents: [
            {
              parts: [
                {
                  text: prompt.context ? `${prompt.context}\n\n${prompt.content}` : prompt.content
                }
              ]
            }
          ],
          generationConfig: {
            temperature: options.temperature || 0.7,
            maxOutputTokens: options.maxTokens || 4000,
          }
        })
      });

      if (!response.ok) {
        const errorData = await response.json();
        return {
          content: '',
          error: `Gemini API error: ${response.status} - ${errorData.error?.message || 'Unknown error'}`
        };
      }

      const data = await response.json();
      const content = data.candidates?.[0]?.content?.parts?.[0]?.text || '';
      
      return {
        content,
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
    throw new Error('Gemini embedding not implemented');
  }

  async listAvailableModels(): Promise<string[]> {
    return [
      'gemini-pro',
      'gemini-pro-vision'
    ];
  }

  async isApiKeyValid(apiKey: string): Promise<boolean> {
    try {
      const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models?key=${apiKey}`);
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
      inputCost: (inputTokens / 1000) * 0.0001,
      outputCost: (outputTokens / 1000) * 0.0002,
      totalCost: (inputTokens / 1000) * 0.0001 + (outputTokens / 1000) * 0.0002,
      currency: 'USD'
    };
  }

  async optimizePrompt(prompt: AIPrompt, language?: string): Promise<PromptOptimizationResult> {
    return {
      optimizedPrompt: prompt,
      rationale: 'No optimization needed for Gemini'
    };
  }

  getMaxContextLength(model?: string): number {
    return 32768;
  }

  supportsStreaming(model?: string): boolean {
    return false;
  }

  supportsEmbeddings(model?: string): boolean {
    return false;
  }

  supportsLanguage(language: string): boolean {
    return true;
  }

  getProviderSpecificPrompt(prompt: AIPrompt, language?: string): AIPrompt {
    return prompt;
  }
}
