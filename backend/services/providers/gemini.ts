import { AIProvider, AIPrompt, AIProviderOptions, AIResponse, AIProviderFactory, CostEstimate, PromptOptimizationResult } from './index';
import { settingsManager } from '../settings-manager';

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

  // Check if this provider is configured with a valid API key
  isConfigured(): boolean {
    const apiKey = settingsManager.getApiKey('gemini');
    return !!apiKey && apiKey.trim() !== '';
  }

  // Estimate the cost of a prompt based on token count
  async estimateCost(prompt: AIPrompt, options: AIProviderOptions): Promise<CostEstimate> {
    // Gemini token cost estimate (approximations as of 2024)
    // Gemini Pro: $0.0001/1K input tokens, $0.0002/1K output tokens (much cheaper than competitors)
    
    // Default model rates for Gemini Pro
    const inputRate = 0.0001; // per 1K tokens
    const outputRate = 0.0002; // per 1K tokens
    
    // Estimate token count (rough approximation)
    const fullPrompt = prompt.context 
      ? `${prompt.context}\n\n${prompt.content}`
      : prompt.content;
    
    const inputTokens = Math.ceil(fullPrompt.length / 4); // Rough estimate: 4 chars per token
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

  // Optimize a prompt specifically for Gemini
  async optimizePrompt(prompt: AIPrompt, language?: string): Promise<PromptOptimizationResult> {
    // Gemini-specific prompt optimization
    let optimized = { ...prompt };
    let rationale = "Applied Gemini-specific optimizations: ";
    
    // Add language-specific instructions if provided
    if (language) {
      optimized.content = `Write ${language} code that solves this problem:\n\n${prompt.content}\n\nProvide only the ${language} code.`;
      rationale += `Added explicit ${language} instructions. `;
    }
    
    // Add Gemini-specific formatting for better code extraction
    optimized.content = `${optimized.content}\n\nFormat your answer with code blocks using triple backticks and language tag.`;
    rationale += "Added formatting instructions for code blocks. ";
    
    return {
      optimizedPrompt: optimized,
      rationale
    };
  }

  // Get the maximum context length for the specified model
  getMaxContextLength(model?: string): number {
    const modelName = model || 'gemini-pro';
    
    // Gemini context windows (tokens)
    if (modelName.includes('gemini-pro')) {
      return 32768; // 32K tokens for Gemini Pro
    } else if (modelName.includes('gemini-pro-vision')) {
      return 16384; // 16K tokens for vision model (approximate)
    }
    
    return 32768; // Default fallback
  }

  // Check if this provider supports the specified language
  supportsLanguage(language: string): boolean {
    // Gemini supports most programming languages
    const supportedLanguages = [
      'javascript', 'typescript', 'python', 'java', 'c', 'c++', 'c#', 
      'go', 'rust', 'ruby', 'php', 'swift', 'kotlin', 'dart', 'html', 
      'css', 'sql', 'bash', 'powershell'
    ];
    
    return supportedLanguages.includes(language.toLowerCase());
  }

  // Get provider-specific prompt
  getProviderSpecificPrompt(prompt: AIPrompt, language?: string): AIPrompt {
    let enhancedPrompt = { ...prompt };
    
    // Gemini tends to be more verbose, so we need to be explicit about code-only output
    let content = prompt.content;
    
    if (language) {
      content = `As an expert software engineer, write ${language} code for this task:\n\n${content}\n\nPlease provide ONLY the ${language} code with no explanations. Use code blocks with triple backticks.`;
    } else {
      content = `As an expert software engineer, write code for this task:\n\n${content}\n\nPlease provide ONLY the code with no explanations. Use code blocks with triple backticks.`;
    }
    
    enhancedPrompt.content = content;
    return enhancedPrompt;
  }
}

// Register the provider with the factory
AIProviderFactory.registerProvider('gemini', () => new GeminiProvider());