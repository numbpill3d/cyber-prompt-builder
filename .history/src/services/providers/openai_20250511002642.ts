import { AIProvider, AIPrompt, AIProviderOptions, AIResponse, AIProviderFactory, CostEstimate, PromptOptimizationResult } from './index';
import { settingsManager } from '../settings-manager';

/**
 * OpenAI GPT Provider
 * Implements the AIProvider interface for OpenAI GPT models
 */
export class OpenAIProvider implements AIProvider {
  name = 'OpenAI GPT';
  
  async generateCode(prompt: AIPrompt, options: AIProviderOptions): Promise<AIResponse> {
    try {
      if (!options.apiKey) {
        return {
          code: "",
          error: "API key is required for OpenAI"
        };
      }
      
      // Add context if provided
      const fullPrompt = prompt.context 
        ? `${prompt.context}\n\n${prompt.content}`
        : prompt.content;

      const response = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${options.apiKey}`
        },
        body: JSON.stringify({
          model: options.model || 'gpt-4',
          temperature: options.temperature || 0.7,
          max_tokens: options.maxTokens || 4000,
          messages: [
            {
              role: 'system',
              content: 'You are a skilled programmer tasked with generating high-quality code. Provide only the code without explanations unless specifically asked for comments.'
            },
            {
              role: 'user',
              content: fullPrompt
            }
          ]
        })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(`OpenAI API error: ${response.status} - ${errorData.error?.message || JSON.stringify(errorData)}`);
      }

      const data = await response.json();
      
      // Parse the response based on OpenAI's API structure
      let generatedCode = '';
      
      if (data.choices && data.choices.length > 0) {
        const content = data.choices[0].message.content;
        
        // Extract code blocks from the response
        const codeRegex = /```(?:.*?)\n([\s\S]*?)```/g;
        let matches = [...content.matchAll(codeRegex)];
        
        if (matches.length > 0) {
          // Use all code blocks
          generatedCode = matches.map(match => match[1]).join('\n\n');
        } else {
          // If no code blocks, use the full text
          generatedCode = content;
        }
      }

      return { 
        code: generatedCode,
        raw: data 
      };

    } catch (error: any) {
      console.error("Error generating code with OpenAI:", error);
      return {
        code: "",
        error: `Failed to generate code with OpenAI: ${error.message}`
      };
    }
  }

  async listAvailableModels(): Promise<string[]> {
    return [
      'gpt-4',
      'gpt-4-turbo',
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

  // Check if this provider is configured with a valid API key
  isConfigured(): boolean {
    const apiKey = settingsManager.getApiKey('openai');
    return !!apiKey && apiKey.trim() !== '';
  }

  // Estimate the cost of a prompt based on token count
  async estimateCost(prompt: AIPrompt, options: AIProviderOptions): Promise<CostEstimate> {
    // OpenAI token cost estimate (approximations as of 2024)
    // GPT-4: $0.03/1K input tokens, $0.06/1K output tokens
    // GPT-4 Turbo: $0.01/1K input tokens, $0.03/1K output tokens
    // GPT-3.5 Turbo: $0.0015/1K input tokens, $0.002/1K output tokens
    
    // Default model rates (GPT-4)
    let inputRate = 0.03; // per 1K tokens
    let outputRate = 0.06; // per 1K tokens
    
    // Adjust rates based on model
    const model = options.model || 'gpt-4';
    if (model.includes('turbo')) {
      if (model.includes('3.5')) {
        inputRate = 0.0015;
        outputRate = 0.002;
      } else {
        // GPT-4 Turbo
        inputRate = 0.01;
        outputRate = 0.03;
      }
    }
    
    // Estimate token count (rough approximation)
    const fullPrompt = prompt.context 
      ? `${prompt.context}\n\n${prompt.content}`
      : prompt.content;
    
    // Add system message tokens
    const systemMessage = 'You are a skilled programmer tasked with generating high-quality code. Provide only the code without explanations unless specifically asked for comments.';
    const systemTokens = Math.ceil(systemMessage.length / 4);
    const inputTokens = Math.ceil(fullPrompt.length / 4) + systemTokens; // Rough estimate: 4 chars per token
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

  // Optimize a prompt specifically for OpenAI
  async optimizePrompt(prompt: AIPrompt, language?: string): Promise<PromptOptimizationResult> {
    // OpenAI-specific prompt optimization
    let optimized = { ...prompt };
    let rationale = "Applied OpenAI-specific optimizations: ";
    
    // Add language-specific instructions if provided
    if (language) {
      optimized.content = `Write ${language} code that accomplishes this task:\n\n${prompt.content}\n\nProvide the code in ${language}.`;
      rationale += `Added explicit ${language} instructions. `;
    }
    
    // Add OpenAI-specific formatting for better code extraction
    optimized.content = `${optimized.content}\n\nEnclose your code in markdown code blocks with the appropriate language tag.`;
    rationale += "Added formatting instructions for code blocks. ";
    
    return {
      optimizedPrompt: optimized,
      rationale
    };
  }

  // Get the maximum context length for the specified model
  getMaxContextLength(model?: string): number {
    const modelName = model || 'gpt-4';
    
    // OpenAI context windows (tokens)
    if (modelName.includes('gpt-4-turbo')) {
      return 128000; // 128K tokens
    } else if (modelName.includes('gpt-4')) {
      return 8192; // 8K tokens for standard GPT-4
    } else if (modelName.includes('gpt-3.5-turbo')) {
      return 16384; // 16K tokens
    }
    
    return 8192; // Default fallback
  }

  // Check if this provider supports the specified language
  supportsLanguage(language: string): boolean {
    // OpenAI supports most programming languages
    const supportedLanguages = [
      'javascript', 'typescript', 'python', 'java', 'c', 'c++', 'c#', 
      'go', 'rust', 'ruby', 'php', 'swift', 'kotlin', 'dart', 'html', 
      'css', 'sql', 'bash', 'powershell', 'r', 'scala', 'perl'
    ];
    
    return supportedLanguages.includes(language.toLowerCase());
  }

  // Get provider-specific prompt
  getProviderSpecificPrompt(prompt: AIPrompt, language?: string): AIPrompt {
    let enhancedPrompt = { ...prompt };
    
    // System message is handled separately in the API call
    // This modifies the user prompt to be more effective with OpenAI
    let content = prompt.content;
    
    if (language) {
      content = `I need ${language} code for the following task:\n\n${content}\n\nProvide only the code in ${language} without explanations. Use markdown code blocks with language tag.`;
    } else {
      content = `${content}\n\nProvide only the code without explanations. Use markdown code blocks with appropriate language tags.`;
    }
    
    enhancedPrompt.content = content;
    return enhancedPrompt;
  }
}

// Register the provider with the factory
AIProviderFactory.registerProvider('openai', () => new OpenAIProvider());