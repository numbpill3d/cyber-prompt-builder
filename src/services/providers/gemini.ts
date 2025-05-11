import { AIProvider, AIPrompt, AIProviderOptions, AIResponse, AIProviderFactory } from './index';

/**
 * Google Gemini AI Provider
 * Implements the AIProvider interface for Google Gemini models
 */
export class GeminiProvider implements AIProvider {
  name = 'Google Gemini';
  
  async generateCode(prompt: AIPrompt, options: AIProviderOptions): Promise<AIResponse> {
    try {
      if (!options.apiKey) {
        return {
          code: "",
          error: "API key is required for Gemini"
        };
      }
      
      // Add context if provided
      const fullPrompt = prompt.context 
        ? `${prompt.context}\n\n${prompt.content}`
        : prompt.content;

      // Gemini API URL with API key
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
                  text: `As an expert software engineer, write code that satisfies this requirement: ${fullPrompt}\nProvide only the code without explanations unless comments are needed.`
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
        throw new Error(`Gemini API error: ${response.status} - ${errorData.error?.message || JSON.stringify(errorData)}`);
      }

      const data = await response.json();
      
      // Parse the response based on Gemini's API structure
      let generatedCode = '';
      
      if (data.candidates && data.candidates.length > 0 && 
          data.candidates[0].content && 
          data.candidates[0].content.parts && 
          data.candidates[0].content.parts.length > 0) {
        
        const content = data.candidates[0].content.parts[0].text;
        
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
      console.error("Error generating code with Gemini:", error);
      return {
        code: "",
        error: `Failed to generate code with Gemini: ${error.message}`
      };
    }
  }

  async listAvailableModels(): Promise<string[]> {
    return [
      'gemini-pro',
      'gemini-pro-vision'
    ];
  }

  async isApiKeyValid(apiKey: string): Promise<boolean> {
    if (!apiKey || apiKey.trim() === "") {
      return false;
    }
    
    try {
      // Make a minimal API call to verify the key
      const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models?key=${apiKey}`, {
        method: 'GET'
      });
      
      return response.ok;
    } catch (error) {
      console.error("Error validating Gemini API key:", error);
      return false;
    }
  }
}

// Register the provider with the factory
AIProviderFactory.registerProvider('gemini', () => new GeminiProvider());