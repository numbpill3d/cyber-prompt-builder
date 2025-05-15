import { AIProvider, AIPrompt, AIProviderOptions, AIResponse, AIProviderFactory, CostEstimate, PromptOptimizationResult } from './index';
import { settingsManager } from '../settings-manager';

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

  // Check if this provider is configured with a valid API key
  isConfigured(): boolean {
    const apiKey = settingsManager.getApiKey('claude');
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

  // Optimize a prompt specifically for Claude
  async optimizePrompt(prompt: AIPrompt, language?: string): Promise<PromptOptimizationResult> {
    // Claude-specific prompt optimization
    let optimized = { ...prompt };
    let rationale = "Applied Claude-specific optimizations: ";
    
    // Add language-specific instructions if provided
    if (language) {
      optimized.content = `Generate ${language} code for the following task:\n\n${prompt.content}\n\nPlease provide complete, well-commented ${language} code.`;
      rationale += `Added explicit ${language} instructions. `;
    }
    
    // Add Claude-specific formatting for better code extraction
    optimized.content = `${optimized.content}\n\nPresent your solution as complete code blocks using markdown triple backticks with the language specified.`;
    rationale += "Added formatting instructions for code blocks. ";
    
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
    let enhancedPrompt = { ...prompt };
    
    // Add specific instructions to help Claude generate better code
    const specificInstructions = [
      "You are a skilled software engineer tasked with writing high-quality, maintainable code.",
      "Focus on providing complete, working solutions that follow best practices."
    ];
    
    if (language) {
      specificInstructions.push(`Write your solution in ${language}.`);
    }
    
    specificInstructions.push(
      "Format your answer with code blocks using markdown triple backticks.",
      "Ensure your code is well-commented and handles edge cases appropriately."
    );
    
    enhancedPrompt.content = `${specificInstructions.join("\n\n")}\n\n${prompt.content}`;
    
    return enhancedPrompt;
  }
}

// Register the provider with the factory
AIProviderFactory.registerProvider('claude', () => new ClaudeProvider());