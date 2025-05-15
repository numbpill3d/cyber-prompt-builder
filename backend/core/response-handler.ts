/**
 * Response Handler Service
 * Processes and standardizes AI responses from different providers
 */

import {
  AIResponse,
  StreamingResponseChunk
} from '../interfaces/ai-provider';

// Supported language types for syntax highlighting
export type SupportedLanguage = 
  'html' | 'css' | 'js' | 'javascript' | 'typescript' | 'ts' | 
  'python' | 'py' | 'java' | 'c' | 'cpp' | 'c#' | 'csharp' | 
  'go' | 'rust' | 'ruby' | 'php' | 'swift' | 'kotlin' | 'shell' | 
  'bash' | 'sql' | 'json' | 'yaml' | 'markdown' | 'md';

// Normalized language mapping
const languageNormalization: Record<string, string> = {
  'javascript': 'js',
  'typescript': 'ts',
  'python': 'py',
  'py': 'python',
  'csharp': 'c#',
  'shell': 'bash',
  'md': 'markdown'
};

// Metadata about the response
export interface ResponseMeta {
  model: string;
  provider: string;
  cost: number;
  tokens: {
    input: number;
    output: number;
    total: number;
  };
  timestamp: number;
  duration: number;
}

// Extracted code block from response
export interface CodeBlock {
  language: string;
  code: string;
}

// Structured response format
export interface StructuredResponse {
  content: string;
  codeBlocks: CodeBlock[];
  explanation?: string;
  meta: ResponseMeta;
  rawResponse?: any;
}

// Options for response processing
export interface ResponseProcessingOptions {
  extractCodeBlocks?: boolean;
  extractExplanation?: boolean;
  includeRawResponse?: boolean;
}

/**
 * Response Handler manages response processing and streaming
 */
export class ResponseHandler {
  /**
   * Process an AI response into a structured format
   * 
   * @param response The raw AI response
   * @param meta Response metadata
   * @param options Processing options
   * @returns Structured response
   */
  public processResponse(
    response: AIResponse, 
    meta: Partial<ResponseMeta>,
    options: ResponseProcessingOptions = {}
  ): StructuredResponse {
    const defaultOptions = {
      extractCodeBlocks: true,
      extractExplanation: true,
      includeRawResponse: false
    };
    
    const opts = { ...defaultOptions, ...options };
    
    const result: StructuredResponse = {
      content: response.content,
      codeBlocks: [],
      meta: {
        model: meta.model || 'unknown',
        provider: meta.provider || 'unknown',
        cost: meta.cost || 0,
        tokens: meta.tokens || { input: 0, output: 0, total: 0 },
        timestamp: Date.now(),
        duration: meta.duration || 0
      }
    };
    
    // Store raw response if requested
    if (opts.includeRawResponse) {
      result.rawResponse = response.raw;
    }
    
    // Extract code blocks and explanations if requested
    if (opts.extractCodeBlocks) {
      result.codeBlocks = this.extractCodeBlocks(response.content);
    }
    
    if (opts.extractExplanation) {
      result.explanation = this.extractExplanation(response.content, result.codeBlocks);
    }
    
    return result;
  }
  
  /**
   * Extract code blocks from a response
   * 
   * @param content Response content
   * @returns Array of code blocks
   */
  public extractCodeBlocks(content: string): CodeBlock[] {
    const codeBlocks: CodeBlock[] = [];
    
    // Extract code blocks using markdown code block format
    const codeBlockRegex = /```([\w#]+)?\s*\n([\s\S]*?)```/g;
    let match;
    
    while ((match = codeBlockRegex.exec(content)) !== null) {
      // Extract language and code
      const language = (match[1] || '').trim().toLowerCase();
      const code = match[2].trim();
      
      // Skip empty code blocks
      if (!code) continue;
      
      // Normalize language name
      const normalizedLanguage = languageNormalization[language] || language || 'text';
      
      // Store code block
      codeBlocks.push({
        language: normalizedLanguage,
        code
      });
    }
    
    // Handle case where no code blocks were found but content looks like code
    if (codeBlocks.length === 0 && this.looksLikeCode(content)) {
      // Simple heuristics to guess language
      let language = 'text';
      
      if (content.includes('<html') || content.includes('<!DOCTYPE')) {
        language = 'html';
      } else if (content.includes('function') || content.includes('const')) {
        language = 'js';
      } else if (content.includes('import ') && content.includes('from ')) {
        language = 'ts';
      } else if (content.includes('def ') && content.includes(':')) {
        language = 'python';
      }
      
      codeBlocks.push({
        language,
        code: content
      });
    }
    
    return codeBlocks;
  }
  
  /**
   * Check if content looks like code
   * 
   * @param content Text content to check
   * @returns Boolean indicating if content looks like code
   */
  private looksLikeCode(content: string): boolean {
    // Simple heuristics to detect if content is likely code
    const codeIndicators = [
      // Structure indicators
      /\{[\s\S]*?\}/,          // Has curly braces blocks
      /\n\s*function\s+\w+\(/, // Has function definitions
      /\n\s*(public|private|protected)\s/, // Has access modifiers
      /\n\s*(class|interface|enum)\s+\w+/, // Has class/interface declarations
      /\n\s*(def|fn|func)\s+\w+\(/, // Has function definitions (py, rust, go)
      /\n\s*import\s+[\w\s{},*]+\s+from/, // Has import statements
      /[<>].*[<>]/,            // Has HTML-like tags
      /\n\s*@\w+/,             // Has decorators
      /\n\s*#include/,         // Has C-style includes
      
      // Syntax indicators
      /;\s*$/m,                // Lines end with semicolons
      /\n\s*\/\//,             // Has line comments
      /\n\s*#\s+\w+/,          // Has shell-style comments
      /\"\w+\":\s*[{\["\d]/,   // Has JSON-like structure
    ];
    
    // If 3 or more indicators match, likely code
    const matches = codeIndicators.filter(regex => regex.test(content)).length;
    return matches >= 3;
  }
  
  /**
   * Extract explanation text from content by removing code blocks
   * 
   * @param content Full response content
   * @param codeBlocks Extracted code blocks
   * @returns Explanation text
   */
  public extractExplanation(content: string, codeBlocks: CodeBlock[]): string {
    if (codeBlocks.length === 0) {
      return content.trim();
    }
    
    // Replace code blocks with placeholders
    let explanationText = content;
    const codeBlockRegex = /```([\w#]+)?\s*\n([\s\S]*?)```/g;
    
    // Remove code blocks
    explanationText = explanationText.replace(codeBlockRegex, '').trim();
    
    // Clean up any leftover markdown or double line breaks
    explanationText = explanationText
      .replace(/\n\n+/g, '\n\n')
      .trim();
    
    return explanationText;
  }
  
  /**
   * Process streaming response chunks
   * 
   * @param chunk The streaming response chunk
   * @param accumulatedContent Previous accumulated content
   * @returns Updated accumulated content
   */
  public processStreamingChunk(
    chunk: StreamingResponseChunk,
    accumulatedContent: string
  ): string {
    // Simply append the chunk content to the accumulated content
    return accumulatedContent + chunk.content;
  }
  
  /**
   * Estimate token count from text
   * 
   * @param text Text to estimate tokens for
   * @returns Estimated token count
   */
  public estimateTokenCount(text: string): number {
    // Simple approximation: ~4 chars per token
    return Math.ceil(text.length / 4);
  }
  
  /**
   * Generate detailed cost estimate for a response
   * 
   * @param content Response content
   * @param inputLength Input prompt length
   * @param provider Provider name
   * @param model Model name
   * @returns Cost estimate
   */
  public generateCostEstimate(
    content: string,
    inputLength: number,
    provider: string,
    model: string
  ): { cost: number, tokens: { input: number, output: number, total: number } } {
    const inputTokens = Math.ceil(inputLength / 4);
    const outputTokens = this.estimateTokenCount(content);
    const totalTokens = inputTokens + outputTokens;
    
    // Approximate cost calculation based on provider and model
    let inputRate = 0;
    let outputRate = 0;
    
    switch (provider.toLowerCase()) {
      case 'claude':
        if (model.includes('opus')) {
          inputRate = 0.015; // per 1K tokens
          outputRate = 0.075;
        } else if (model.includes('sonnet')) {
          inputRate = 0.003;
          outputRate = 0.015;
        } else if (model.includes('haiku')) {
          inputRate = 0.00025;
          outputRate = 0.00125;
        }
        break;
        
      case 'openai':
        if (model.includes('gpt-4o')) {
          inputRate = 0.005;
          outputRate = 0.015;
        } else if (model.includes('gpt-4')) {
          inputRate = 0.01;
          outputRate = 0.03;
        } else if (model.includes('gpt-3.5')) {
          inputRate = 0.0005;
          outputRate = 0.0015;
        }
        break;
        
      case 'gemini':
        if (model.includes('1.5-pro')) {
          inputRate = 0.0035;
          outputRate = 0.0105;
        } else if (model.includes('1.5-flash')) {
          inputRate = 0.00035;
          outputRate = 0.00105;
        } else if (model.includes('1.0-pro')) {
          inputRate = 0.000125;
          outputRate = 0.000375;
        }
        break;
    }
    
    // Calculate cost
    const inputCost = (inputTokens / 1000) * inputRate;
    const outputCost = (outputTokens / 1000) * outputRate;
    const totalCost = inputCost + outputCost;
    
    return {
      cost: totalCost,
      tokens: {
        input: inputTokens,
        output: outputTokens,
        total: totalTokens
      }
    };
  }
  
  /**
   * Merge multiple responses into one
   * 
   * @param responses Array of structured responses to merge
   * @returns Merged response
   */
  public mergeResponses(responses: StructuredResponse[]): StructuredResponse {
    if (responses.length === 0) {
      throw new Error("Cannot merge empty array of responses");
    }
    
    if (responses.length === 1) {
      return responses[0];
    }
    
    // Use the first response as base
    const merged: StructuredResponse = {
      ...responses[0],
      content: responses.map(r => r.content).join('\n\n'),
      codeBlocks: [],
      meta: {
        ...responses[0].meta,
        cost: 0,
        tokens: {
          input: 0,
          output: 0,
          total: 0
        }
      }
    };
    
    // Combine code blocks and deduplicate by language
    const codeBlockMap = new Map<string, CodeBlock>();
    
    for (const response of responses) {
      for (const block of response.codeBlocks) {
        // More recent blocks override earlier ones with the same language
        codeBlockMap.set(block.language, block);
      }
      
      // Sum up costs and tokens
      merged.meta.cost += response.meta.cost;
      merged.meta.tokens.input += response.meta.tokens.input;
      merged.meta.tokens.output += response.meta.tokens.output;
      merged.meta.tokens.total += response.meta.tokens.total;
    }
    
    merged.codeBlocks = Array.from(codeBlockMap.values());
    
    // Combine explanations
    merged.explanation = responses
      .map(r => r.explanation)
      .filter(Boolean)
      .join('\n\n');
    
    return merged;
  }
}

// Export a singleton instance
export const responseHandler = new ResponseHandler();