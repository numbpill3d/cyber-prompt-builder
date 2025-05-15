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
 * OpenAI Provider
 * Implements the AIProvider interface for OpenAI API
 */
export class OpenAIProvider implements AIProvider {
  name = 'OpenAI';
  private settingsManager: SettingsManager;

  constructor() {
    this.settingsManager = getService<SettingsManager>('settingsManager');
  }

  async generateResponse(prompt: AIPrompt, options: AIProviderOptions): Promise<AIResponse> {
    try {
      if (!options.apiKey) {
        return {
          content: "",
          error: "API key is required for OpenAI"
        };
      }

      // Build messages array
      const messages = [];
      
      // Add system message if provided
      if (prompt.systemPrompt) {
        messages.push({
          role: 'system',
          content: prompt.systemPrompt
        });
      }

      // Add context if provided
      if (prompt.context) {
        messages.push({
          role: 'user',
          content: prompt.context
        });
        
        // Add an assistant response to maintain conversation flow
        messages.push({
          role: 'assistant',
          content: 'I understand the context. Please continue with your question or request.'
        });
      }
      
      // Add the main user message
      messages.push({
        role: 'user',
        content: prompt.content
      });

      const response = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${options.apiKey}`
        },
        body: JSON.stringify({
          model: options.model || 'gpt-4o',
          messages: messages,
          temperature: options.temperature || 0.7,
          max_tokens: options.maxTokens || 4000
        })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(`OpenAI API error: ${response.status} - ${errorData.error?.message || JSON.stringify(errorData)}`);
      }

      const data = await response.json();
      const responseContent = data.choices[0]?.message?.content || '';

      return {
        content: responseContent,
        raw: data
      };
    } catch (error: any) {
      console.error("Error generating response with OpenAI:", error);
      return {
        content: "",
        error: `Failed to generate response with OpenAI: ${error.message}`
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
        error: "API key is required for OpenAI"
      };
      onChunk(errorChunk);
      return {
        content: "",
        error: "API key is required for OpenAI"
      };
    }

    try {
      // Build messages array
      const messages = [];
      
      // Add system message if provided
      if (prompt.systemPrompt) {
        messages.push({
          role: 'system',
          content: prompt.systemPrompt
        });
      }

      // Add context if provided
      if (prompt.context) {
        messages.push({
          role: 'user',
          content: prompt.context
        });
        
        // Add an assistant response to maintain conversation flow
        messages.push({
          role: 'assistant',
          content: 'I understand the context. Please continue with your question or request.'
        });
      }
      
      // Add the main user message
      messages.push({
        role: 'user',
        content: prompt.content
      });

      const response = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${options.apiKey}`
        },
        body: JSON.stringify({
          model: options.model || 'gpt-4o',
          messages: messages,
          temperature: options.temperature || 0.7,
          max_tokens: options.maxTokens || 4000,
          stream: true
        })
      });

      if (!response.ok) {
        const errorData = await response.text();
        throw new Error(`OpenAI API error: ${response.status} - ${errorData}`);
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
              const content = parsed.choices[0]?.delta?.content || '';
              
              if (content) {
                fullContent += content;
                onChunk({
                  content,
                  isComplete: false
                });
              }
              
              if (parsed.choices[0]?.finish_reason === 'stop') {
                onChunk({
                  content: '',
                  isComplete: true
                });
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
        error: `Failed to generate streaming response with OpenAI: ${error.message}`
      };
      onChunk(errorChunk);
      
      return {
        content: "",
        error: `Failed to generate streaming response with OpenAI: ${error.message}`
      };
    }
  }

  async generateEmbedding(text: string, options: AIProviderOptions): Promise<EmbeddingResult> {
    try {
      const response = await fetch('https://api.openai.com/v1/embeddings', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${options.apiKey}`
        },
        body: JSON.stringify({
          model: 'text-embedding-3-small',
          input: text
        })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(`OpenAI Embedding API error: ${response.status} - ${errorData.error?.message || JSON.stringify(errorData)}`);
      }

      const data = await response.json();
      
      return {
        embedding: data.data[0].embedding,
        tokenCount: data.usage.total_tokens
      };
    } catch (error: any) {
      console.error("Error generating embedding with OpenAI:", error);
      throw new Error(`Failed to generate embedding with OpenAI: ${error.message}`);
    }
  }

  async listAvailableModels(): Promise<string[]> {
    // Static list of common models
    return [
      'gpt-4o',
      'gpt-4-turbo',
      'gpt-4',
      'gpt-3.5-turbo'
    ];
  }

  async isApiKeyValid(apiKey: string): Promise<boolean> {
    if (!apiKey || apiKey.trim() === "") {
      return false;
    }
    
    try {
      // Make a minimal API call to verify the key
      const response = await fetch('https://api.openai.com/v1/models', {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${apiKey}`
        }
      });
      
      return response.ok;
    } catch (error) {
      console.error("Error validating OpenAI API key:", error);
      return false;
    }
  }

  isConfigured(): boolean {
    const apiKey = this.settingsManager.getApiKey('openai');
    return !!apiKey && apiKey.trim() !== '';
  }

  async estimateCost(prompt: AIPrompt, options: AIProviderOptions): Promise<CostEstimate> {
    // OpenAI pricing (approximate as of 2024)
    // GPT-4o: $5/1M input tokens, $15/1M output tokens
    // GPT-4: $10/1M input tokens, $30/1M output tokens 
    // GPT-3.5-Turbo: $0.5/1M input tokens, $1.5/1M output tokens
    
    // Default model rates (GPT-4o)
    let inputRate = 0.005; // per 1K tokens
    let outputRate = 0.015; // per 1K tokens
    
    // Adjust rates based on model
    const model = options.model || 'gpt-4o';
    
    if (model.includes('gpt-4-turbo')) {
      inputRate = 0.01;
      outputRate = 0.03;
    } else if (model.includes('gpt-4') && !model.includes('gpt-4o')) {
      inputRate = 0.01;
      outputRate = 0.03;
    } else if (model.includes('gpt-3.5')) {
      inputRate = 0.0005;
      outputRate = 0.0015;
    }
    
    // Estimate token count (rough approximation)
    const systemPromptTokens = prompt.systemPrompt ? Math.ceil(prompt.systemPrompt.length / 4) : 0;
    const contentTokens = Math.ceil(prompt.content.length / 4);
    const contextTokens = prompt.context ? Math.ceil(prompt.context.length / 4) : 0;
    const inputTokens = systemPromptTokens + contentTokens + contextTokens;
    
    const outputTokens = options.maxTokens || 4000;
    
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
    // OpenAI-specific prompt optimization
    let optimized = { ...prompt };
    let rationale = "Applied OpenAI-specific optimizations: ";
    
    // Add language-specific instructions if provided
    if (language) {
      if (!optimized.systemPrompt) {
        optimized.systemPrompt = '';
      }
      
      optimized.systemPrompt += `\nWhen writing code, please use the ${language} programming language unless specified otherwise.`;
      rationale += `Added explicit ${language} instructions. `;
    }
    
    return {
      optimizedPrompt: optimized,
      rationale
    };
  }

  getMaxContextLength(model?: string): number {
    const modelName = model || 'gpt-4o';
    
    // OpenAI context windows (tokens)
    if (modelName.includes('gpt-4o')) {
      return 128000; // 128K tokens
    } else if (modelName.includes('gpt-4-turbo')) {
      return 128000; // 128K tokens
    } else if (modelName.includes('gpt-4') && !modelName.includes('turbo')) {
      return 8192; // 8K tokens for base GPT-4
    } else if (modelName.includes('gpt-3.5')) {
      return 16385; // 16K tokens for gpt-3.5-turbo
    }
    
    return 8192; // Default fallback
  }
  
  supportsStreaming(model?: string): boolean {
    return true; // All current OpenAI chat models support streaming
  }
  
  supportsEmbeddings(model?: string): boolean {
    // Only specific OpenAI models support embeddings
    const embeddingModels = [
      'text-embedding-ada-002',
      'text-embedding-3-small',
      'text-embedding-3-large'
    ];
    
    return model ? embeddingModels.includes(model) : false;
  }

  supportsLanguage(language: string): boolean {
    // OpenAI supports most programming languages
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
    
    // Add OpenAI-specific system instructions
    const systemInstructions = [
      "You are a helpful AI programming assistant.",
      "Provide clear, concise, and accurate responses to help with software development tasks."
    ];
    
    if (language) {
      systemInstructions.push(`When asked to write code, use ${language} unless specified otherwise.`);
    }
    
    enhancedPrompt.systemPrompt = `${systemInstructions.join("\n")}\n${enhancedPrompt.systemPrompt}`;
    
    return enhancedPrompt;
  }
}