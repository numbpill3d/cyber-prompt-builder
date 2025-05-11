import { AIProvider, AIPrompt, AIProviderOptions, AIResponse, AIProviderFactory } from './index';

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
}

// Register the provider with the factory
AIProviderFactory.registerProvider('openai', () => new OpenAIProvider());