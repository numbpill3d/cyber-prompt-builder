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
 * Anthropic Claude AI Provider
 * Implements the AIProvider interface for Anthropic Claude
 */
export class ClaudeProvider implements AIProvider {
  name = 'Claude';
  private settingsManager: SettingsManager;
  
  constructor() {
    this.settingsManager = getService<SettingsManager>('settingsManager');
  }

  async generateResponse(prompt: AIPrompt, options: AIProviderOptions): Promise<AIResponse> {
    try {
      if (!options.apiKey) {
        return {
          content: "",
          error: "API key is required for Claude"
        };
      }
      
      // Build messages array with system prompt if provided
      const messages = [];
      if (prompt.systemPrompt) {
        messages.push({
          role: 'system',
          content: prompt.systemPrompt
        });
      }
      
      // Add context if provided
      const userContent = prompt.context 
        ? `${prompt.context}\n\n${prompt.content}`
        : prompt.content;
        
      messages.push({
        role: 'user',
        content: userContent
      });

      const response = await fetch('https://api.anthropic.com/v1/messages', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': options.apiKey,
          'anthropic-version': '2023-06-01'
        },
        body: JSON.stringify({
          model: options.model || 'claude-3-opus-20240229',
          max_tokens: options.maxTokens || 4000,
          temperature: options.temperature || 0.7,
          messages: messages
        })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(`Claude API error: ${response.status} - ${errorData.error?.message || JSON.stringify(errorData)}`);
      }

      const data = await response.json();
      
      // Parse the response
      let responseContent = '';
      
      if (data.content && Array.isArray(data.content)) {
        responseContent = data.content.map((block: any) => block.text).join('');
      }

      return { 
        content: responseContent,
        raw: data 
      };

    } catch (error: any) {
      console.error("Error generating response with Claude:", error);
      return {
        content: "",
        error: `Failed to generate response with Claude: ${error.message}`
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
        error: "API key is required for Claude"
      };
      onChunk(errorChunk);
      return {
        content: "",
        error: "API key is required for Claude"
      };
    }

    try {
      // Build messages array with system prompt if provided
      const messages = [];
      if (prompt.systemPrompt) {
        messages.push({
          role: 'system',
          content: prompt.systemPrompt
        });
      }
      
      // Add context if provided
      const userContent = prompt.context 
        ? `${prompt.context}\n\n${prompt.content}`
        : prompt.content;
        
      messages.push({
        role: 'user',
        content: userContent
      });

      const response = await fetch('https://api.anthropic.com/v1/messages', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': options.apiKey,
          'anthropic-version': '2023-06-01',
          'anthropic-beta': 'messages-2023-12-15'
        },
        body: JSON.stringify({
          model: options.model || 'claude-3-opus-20240229',
          max_tokens: options.maxTokens || 4000,
          temperature: options.temperature || 0.7,
          messages: messages,
          stream: true
        })
      });

      if (!response.ok) {
        const errorData = await response.text();
        throw new Error(`Claude API error: ${response.status} - ${errorData}`);
      }

      const reader = response.body?.getReader();
      if (!reader) {
        throw new Error("Failed to get response stream reader");
      }

      let fullContent = '';
      let decoder = new TextDecoder('utf-8');

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        // Decode and process the chunk
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
              if (parsed.type === 'content_block_delta' && parsed.delta?.text) {
                fullContent += parsed.delta.text;
                onChunk({
                  content: parsed.delta.text,
                  isComplete: false
                });
              }
              
              if (parsed.type === 'message_stop') {
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
        error: `Failed to generate streaming response with Claude: ${error.message}`
      };
      onChunk(errorChunk);
      
      return {
        content: "",
        error: `Failed to generate streaming response with Claude: ${error.message}`
      };
    }
  }

  async generateEmbedding(text: string, options: AIProviderOptions): Promise<EmbeddingResult> {
    try {
      const response = await fetch('https://api.anthropic.com/v1/embeddings', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': options.apiKey,
          'anthropic-version': '2023-06-01'
        },
        body: JSON.stringify({
          model: 'claude-3-sonnet-20240229-embedding',
          text: text,
          dimensions: 1536
        })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(`Claude Embedding API error: ${response.status} - ${errorData.error?.message || JSON.stringify(errorData)}`);
      }

      const data = await response.json();
      
      return {
        embedding: data.embedding,
        tokenCount: data.usage?.input_tokens || Math.ceil(text.length / 4)
      };
    } catch (error: any) {
      console.error("Error generating embedding with Claude:", error);
      throw new Error(`Failed to generate embedding with Claude: ${error.message}`);
    }
  }

  async listAvailableModels(): Promise<string[]> {
    return [
      'claude-3-opus-20240229',
      'claude-3-sonnet-20240229',
      'claude-3-haiku-20240307'
    ];
  }

  async isApiKeyValid(apiKey: string): Promise<boolean> {
    if (!apiKey || apiKey.trim() === "") {
      return false;
    }
    
    try {
      // Make a minimal API call to verify the key
      const response = await fetch('https://api.anthropic.com/v1/models', {
        method: 'GET',
        headers: {
          'x-api-key': apiKey,
          'anthropic-version': '2023-06-01'
        }
      });
      
      return response.ok;
    } catch (error) {
      console.error("Error validating Claude API key:", error);
      return false;
    }
  }

  // Check if this provider is configured with a valid API key
  isConfigured(): boolean {
    const apiKey = this.settingsManager.getApiKey('claude');
    return !!apiKey && apiKey.trim() !== '';
  }

  // Estimate the cost of a prompt based on token count
  async estimateCost(prompt: AIPrompt, options: AIProviderOptions): Promise<CostEstimate> {
    // Claude token cost estimate (approximations as of 2024)
    // Opus: $15/1M input tokens, $75/1M output tokens
    // Sonnet: $3/1M input tokens, $15/1M output tokens
    // Haiku: $0.25/1M input tokens, $1.25/1M output tokens
    
    // Default model rates
    let inputRate = 0.015; // per 1K tokens for opus
    let outputRate = 0.075; // per 1K tokens for opus
    
    // Adjust rates based on model
    const model = options.model || 'claude-3-opus-20240229';
    if (model.includes('sonnet')) {
      inputRate = 0.003;
      outputRate = 0.015;
    } else if (model.includes('haiku')) {
      inputRate = 0.00025;
      outputRate = 0.00125;
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

  // Optimize a prompt specifically for Claude
  async optimizePrompt(prompt: AIPrompt, language?: string): Promise<PromptOptimizationResult> {
    // Claude-specific prompt optimization
    let optimized = { ...prompt };
    let rationale = "Applied Claude-specific optimizations: ";
    
    // Add language-specific instructions if provided
    if (language) {
      if (!optimized.systemPrompt) {
        optimized.systemPrompt = '';
      }
      
      optimized.systemPrompt += `\nPlease provide your response in ${language}.`;
      rationale += `Added explicit ${language} instructions. `;
    }
    
    return {
      optimizedPrompt: optimized,
      rationale
    };
  }

  // Get the maximum context length for the specified model
  getMaxContextLength(model?: string): number {
    const modelName = model || 'claude-3-opus-20240229';
    
    // Claude context windows (tokens)
    if (modelName.includes('opus')) {
      return 200000; // 200K tokens
    } else if (modelName.includes('sonnet')) {
      return 180000; // 180K tokens
    } else if (modelName.includes('haiku')) {
      return 150000; // 150K tokens
    }
    
    return 100000; // Default fallback
  }
  
  // Check if the model supports streaming
  supportsStreaming(model?: string): boolean {
    return true; // All Claude models support streaming
  }
  
  // Check if the model supports embeddings
  supportsEmbeddings(model?: string): boolean {
    // Only specific Claude models support embeddings
    return model ? model.includes('embedding') : false;
  }

  // Check if this provider supports the specified language
  supportsLanguage(language: string): boolean {
    // Claude supports most programming languages
    const supportedLanguages = [
      'javascript', 'typescript', 'python', 'java', 'c', 'c++', 'c#', 
      'go', 'rust', 'ruby', 'php', 'swift', 'kotlin', 'dart', 'html', 
      'css', 'sql', 'bash', 'powershell', 'r', 'scala', 'perl'
    ];
    
    return supportedLanguages.includes(language.toLowerCase());
  }

  // Get provider-specific prompt
  getProviderSpecificPrompt(prompt: AIPrompt, language?: string): AIPrompt {
    const enhancedPrompt = { ...prompt };
    
    if (!enhancedPrompt.systemPrompt) {
      enhancedPrompt.systemPrompt = '';
    }
    
    // Add Claude-specific system instructions
    const systemInstructions = [
      "You are a helpful AI assistant with expertise in software engineering and programming.",
      "Provide accurate, helpful, and concise responses."
    ];
    
    if (language) {
      systemInstructions.push(`When asked to write code, provide it in ${language} unless specified otherwise.`);
    }
    
    enhancedPrompt.systemPrompt = `${systemInstructions.join("\n")}\n${enhancedPrompt.systemPrompt}`;
    
    return enhancedPrompt;
  }
}