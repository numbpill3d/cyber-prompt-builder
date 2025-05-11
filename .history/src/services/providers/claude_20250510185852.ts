import { AIProvider, AIPrompt, AIProviderOptions, AIResponse, AIProviderFactory } from './index';

/**
 * Anthropic Claude AI Provider
 * Implements the AIProvider interface for Anthropic Claude
 */
export class ClaudeProvider implements AIProvider {
  name = 'Anthropic Claude';
  
  async generateCode(prompt: AIPrompt, options: AIProviderOptions): Promise<AIResponse> {
    try {
      if (!options.apiKey) {
        return {
          code: "",
          error: "API key is required for Claude"
        };
      }
      
      // Add context if provided
      const fullPrompt = prompt.context 
        ? `${prompt.context}\n\n${prompt.content}`
        : prompt.content;

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
          messages: [
            {
              role: 'user',
              content: fullPrompt
            }
          ]
        })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(`Claude API error: ${response.status} - ${errorData.error?.message || JSON.stringify(errorData)}`);
      }

      const data = await response.json();
      
      // Parse the response based on Claude's API structure
      let generatedCode = '';
      
      if (data.content && Array.isArray(data.content)) {
        // Extract code blocks from the response
        const codeRegex = /```(?:.*?)\n([\s\S]*?)```/g;
        const fullText = data.content.map((block: any) => block.text).join('');
        
        let matches = [...fullText.matchAll(codeRegex)];
        if (matches.length > 0) {
          // Use all code blocks
          generatedCode = matches.map(match => match[1]).join('\n\n');
        } else {
          // If no code blocks, use the full text
          generatedCode = fullText;
        }
      }

      return { 
        code: generatedCode,
        raw: data 
      };

    } catch (error: any) {
      console.error("Error generating code with Claude:", error);
      return {
        code: "",
        error: `Failed to generate code with Claude: ${error.message}`
      };
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
}

// Register the provider with the factory
AIProviderFactory.registerProvider('claude', () => new ClaudeProvider());