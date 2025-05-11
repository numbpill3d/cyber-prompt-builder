import {
  AIProvider,
  AIPrompt,
  AIProviderOptions,
  AIResponse,
  CostEstimate,
  EmbeddingResult,
  PromptOptimizationResult,
  StreamingResponseChunk
} from '../interfaces/ai-provider';
import { getService } from '../services/service-locator';
import { SettingsManager } from '../interfaces/settings-manager';

/**
 * Google Gemini Provider
 * Implements the AIProvider interface for Google's Gemini API
 */
export class GeminiProvider implements AIProvider {
  name = 'Gemini';
  private settingsManager: SettingsManager;
  private baseUrl = 'https://generativelanguage.googleapis.com/v1beta';

  constructor() {
    this.settingsManager = getService<SettingsManager>('settingsManager');
  }

  async generateResponse(prompt: AIPrompt, options: AIProviderOptions): Promise<AIResponse> {
    try {
      if (!options.apiKey) {
        return {
          content: "",
          error: "API key is required for Gemini"
        };
      }

      const modelName = options.model || 'gemini-1.5-pro';
      const url = `${this.baseUrl}/models/${modelName}:generateContent?key=${options.apiKey}`;

      // Build request content
      const contents = [];

      // Add system instructions if provided
      if (prompt.systemPrompt) {
        contents.push({
          role: 'user',
          parts: [{ text: `System Instructions: ${prompt.systemPrompt}` }]
        });
        
        contents.push({
          role: 'model',
          parts: [{ text: 'I understand these instructions and will follow them.' }]
        });
      }

      // Add context if provided
      if (prompt.context) {
        contents.push({
          role: 'user',
          parts: [{ text: prompt.context }]
        });
        
        contents.push({
          role: 'model',
          parts: [{ text: 'I understand the context. Please continue with your question or request.' }]
        });
      }

      // Add the main prompt
      contents.push({
        role: 'user',
        parts: [{ text: prompt.content }]
      });

      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          contents,
          generationConfig: {
            temperature: options.temperature || 0.7,
            maxOutputTokens: options.maxTokens || 2048,
          }
        })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(`Gemini API error: ${response.status} - ${errorData.error?.message || JSON.stringify(errorData)}`);
      }

      const data = await response.json();
      
      // Extract the response text
      let responseContent = '';
      if (data.candidates && data.candidates.length > 0) {
        const candidate = data.candidates[0];
        if (candidate.content && candidate.content.parts && candidate.content.parts.length > 0) {
          responseContent = candidate.content.parts.map((part: any) => part.text).join('');
        }
      }

      return {
        content: responseContent,
        raw: data
      };
    } catch (error: any) {
      console.error("Error generating response with Gemini:", error);
      return {
        content: "",
        error: `Failed to generate response with Gemini: ${error.message}`
      };
    }
  }

  async generateStreamingResponse(
    prompt: AIPrompt, 
    options: AIProviderOptions,
    onChunk: (chunk: StreamingResponseChunk) => void
  ): Promise<AIResponse> {
    if (!options.apiKey) {
      const errorChunk: StreamingResponseChunk = {
        content: "",
        isComplete: true,
        error: "API key is required for Gemini"
      };
      onChunk(errorChunk);
      return {
        content: "",
        error: "API key is required for Gemini"
      };
    }

    try {
      const modelName = options.model || 'gemini-1.5-pro';
      const url = `${this.baseUrl}/models/${modelName}:streamGenerateContent?key=${options.apiKey}`;

      // Build request content
      const contents = [];

      // Add system instructions if provided
      if (prompt.systemPrompt) {
        contents.push({
          role: 'user',
          parts: [{ text: `System Instructions: ${prompt.systemPrompt}` }]
        });
        
        contents.push({
          role: 'model',
          parts: [{ text: 'I understand these instructions and will follow them.' }]
        });
      }

      // Add context if provided
      if (prompt.context) {
        contents.push({
          role: 'user',
          parts: [{ text: prompt.context }]
        });
        
        contents.push({
          role: 'model',
          parts: [{ text: 'I understand the context. Please continue with your question or request.' }]
        });
      }

      // Add the main prompt
      contents.push({
        role: 'user',
        parts: [{ text: prompt.content }]
      });

      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          contents,
          generationConfig: {
            temperature: options.temperature || 0.7,
            maxOutputTokens: options.maxTokens || 2048,
          }
        })
      });

      if (!response.ok) {
        const errorData = await response.text();
        throw new Error(`Gemini API error: ${response.status} - ${errorData}`);
      }

      const reader = response.body?.getReader();
      if (!reader) {
        throw new Error("Failed to get response stream reader");
      }

      let fullContent = '';
      const decoder = new TextDecoder('utf-8');

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        // Decode chunk
        const chunk = decoder.decode(value, { stream: true });
        const lines = chunk.split('\n').filter(line => line.trim() !== '');

        for (const line of lines) {
          if (line.startsWith('data: ')) {
            const data = line.slice(6);
            
            if (data === '[DONE]') {
              onChunk({ content: '', isComplete: true });
              break;
            }

            try {
              const parsed = JSON.parse(data);
              
              if (parsed.candidates && parsed.candidates.length > 0) {
                const candidate = parsed.candidates[0];
                if (candidate.content && candidate.content.parts && candidate.content.parts.length > 0) {
                  const content = candidate.content.parts[0].text || '';
                  
                  if (content) {
                    fullContent += content;
                    onChunk({
                      content,
                      isComplete: false
                    });
                  }
                }
                
                // Check if this is the final chunk
                if (candidate.finishReason) {
                  onChunk({
                    content: '',
                    isComplete: true
                  });
                }
              }
            } catch (e) {
              console.error('Error parsing streaming data:', e);
            }
          }
        }
      }

      return { content: fullContent };
    } catch (error: any) {
      const errorChunk: StreamingResponseChunk = {
        content: "",
        isComplete: true,
        error: `Failed to generate streaming response with Gemini: ${error.message}`
      };
      onChunk(errorChunk);
      
      return {
        content: "",
        error: `Failed to generate streaming response with Gemini: ${error.message}`
      };
    }
  }

  async generateEmbedding(text: string, options: AIProviderOptions): Promise<EmbeddingResult> {
    try {
      if (!options.apiKey) {
        throw new Error("API key is required for Gemini embeddings");
      }

      const modelName = 'embedding-001';
      const url = `${this.baseUrl}/models/${modelName}:embedContent?key=${options.apiKey}`;

      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          content: {
            parts: [{ text }]
          }
        })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(`Gemini Embedding API error: ${response.status} - ${errorData.error?.message || JSON.stringify(errorData)}`);
      }

      const data = await response.json();
      
      return {
        embedding: data.embedding.values,
        tokenCount: Math.ceil(text.length / 4) // Approximate token count
      };
    } catch (error: any) {
      console.error("Error generating embedding with Gemini:", error);
      throw new Error(`Failed to generate embedding with Gemini: ${error.message}`);
    }
  }

  async listAvailableModels(): Promise<string[]> {
    return [
      'gemini-1.5-pro',
      'gemini-1.5-flash',
      'gemini-1.0-pro',
      'gemini-1.0-ultra'
    ];
  }

  async isApiKeyValid(apiKey: string): Promise<boolean> {
    if (!apiKey || apiKey.trim() === "") {
      return false;
    }
    
    try {
      // Make a minimal API call to verify the key
      const response = await fetch(`${this.baseUrl}/models?key=${apiKey}`, {
        method: 'GET'
      });
      
      return response.ok;
    } catch (error) {
      console.error("Error validating Gemini API key:", error);
      return false;
    }
  }

  isConfigured(): boolean {
    const apiKey = this.settingsManager.getApiKey('gemini');
    return !!apiKey && apiKey.trim() !== '';
  }

  async estimateCost(prompt: AIPrompt, options: AIProviderOptions): Promise<CostEstimate> {
    // Gemini pricing (approximate as of 2024)
    // Gemini 1.5 Pro: $3.50/1M input tokens, $10.50/1M output tokens
    // Gemini 1.5 Flash: $0.35/1M input tokens, $1.05/1M output tokens
    // Gemini 1.0 Pro: $0.125/1M input tokens, $0.375/1M output tokens
    
    // Default model rates (Gemini 1.5 Pro)
    let inputRate = 0.0035; // per 1K tokens
    let outputRate = 0.0105; // per 1K tokens
    
    // Adjust rates based on model
    const model = options.model || 'gemini-1.5-pro';
    
    if (model.includes('1.5-flash')) {
      inputRate = 0.00035;
      outputRate = 0.00105;
    } else if (model.includes('1.0-pro')) {
      inputRate = 0.000125;
      outputRate = 0.000375;
    } else if (model.includes('1.0-ultra')) {
      inputRate = 0.000375;
      outputRate = 0.001125;
    }
    
    // Estimate token count (rough approximation)
    const systemPromptTokens = prompt.systemPrompt ? Math.ceil(prompt.systemPrompt.length / 4) : 0;
    const contentTokens = Math.ceil(prompt.content.length / 4);
    const contextTokens = prompt.context ? Math.ceil(prompt.context.length / 4) : 0;
    const inputTokens = systemPromptTokens + contentTokens + contextTokens;
    
    const outputTokens = options.maxTokens || 2048;
    
    // Calculate costs
    const inputCost = (inputTokens / 1000) * inputRate;
    const outputCost = (outputTokens / 1000) * outputRate;
    
    return {
      inputCost,
      outputCost,
      totalCost: inputCost + outputCost,
      currency: 'USD'
    };
  }

  async optimizePrompt(prompt: AIPrompt, language?: string): Promise<PromptOptimizationResult> {
    // Gemini-specific prompt optimization
    let optimized = { ...prompt };
    let rationale = "Applied Gemini-specific optimizations: ";
    
    // Add language-specific instructions if provided
    if (language) {
      if (!optimized.systemPrompt) {
        optimized.systemPrompt = '';
      }
      
      optimized.systemPrompt += `\nWhen writing code, please use ${language} programming language unless specified otherwise.`;
      rationale += `Added explicit ${language} instructions. `;
    }
    
    return {
      optimizedPrompt: optimized,
      rationale
    };
  }

  getMaxContextLength(model?: string): number {
    const modelName = model || 'gemini-1.5-pro';
    
    // Gemini context windows (tokens)
    if (modelName.includes('1.5-pro')) {
      return 1000000; // 1M tokens
    } else if (modelName.includes('1.5-flash')) {
      return 1000000; // 1M tokens
    } else if (modelName.includes('1.0-pro')) {
      return 32768; // 32K tokens
    } else if (modelName.includes('1.0-ultra')) {
      return 32768; // 32K tokens
    }
    
    return 32768; // Default fallback
  }
  
  supportsStreaming(model?: string): boolean {
    // Check if the model supports streaming
    return true; // All current Gemini models support streaming
  }
  
  supportsEmbeddings(model?: string): boolean {
    // Only specific Gemini models support embeddings
    const embeddingModels = [
      'embedding-001'
    ];
    
    return model ? embeddingModels.includes(model) : false;
  }

  supportsLanguage(language: string): boolean {
    // Gemini supports most programming languages
    const supportedLanguages = [
      'javascript', 'typescript', 'python', 'java', 'c', 'c++', 'c#', 
      'go', 'rust', 'ruby', 'php', 'swift', 'kotlin', 'dart', 'html', 
      'css', 'sql', 'bash', 'powershell', 'r', 'scala', 'perl'
    ];
    
    return supportedLanguages.includes(language.toLowerCase());
  }

  getProviderSpecificPrompt(prompt: AIPrompt, language?: string): AIPrompt {
    const enhancedPrompt = { ...prompt };
    
    if (!enhancedPrompt.systemPrompt) {
      enhancedPrompt.systemPrompt = '';
    }
    
    // Add Gemini-specific system instructions
    const systemInstructions = [
      "You are a helpful AI coding assistant powered by Google Gemini.",
      "Provide practical, well-structured solutions to programming problems."
    ];
    
    if (language) {
      systemInstructions.push(`When writing code, use ${language} programming language unless specified otherwise.`);
    }
    
    enhancedPrompt.systemPrompt = `${systemInstructions.join("\n")}\n${enhancedPrompt.systemPrompt}`;
    
    return enhancedPrompt;
  }
}