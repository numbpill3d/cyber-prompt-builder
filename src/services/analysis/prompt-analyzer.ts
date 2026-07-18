/**
 * Prompt Analyzer Service
 * Analyzes prompts for quality, structure, and optimization opportunities
 */

export interface PromptAnalysis {
  quality: number; // 0-100
  structure: 'good' | 'fair' | 'poor';
  suggestions: string[];
  wordCount: number;
  hasContext: boolean;
  hasInstructions: boolean;
  hasExamples: boolean;
}

export class PromptAnalyzer {
  /**
   * Analyze a prompt for quality and structure
   */
  analyze(prompt: string): PromptAnalysis {
    const wordCount = prompt.trim().split(/\s+/).length;
    const hasContext = this.hasContext(prompt);
    const hasInstructions = this.hasInstructions(prompt);
    const hasExamples = this.hasExamples(prompt);
    
    const quality = this.calculateQuality(prompt, hasContext, hasInstructions, hasExamples);
    const structure = this.determineStructure(quality);
    const suggestions = this.generateSuggestions(prompt, hasContext, hasInstructions, hasExamples);
    
    return {
      quality,
      structure,
      suggestions,
      wordCount,
      hasContext,
      hasInstructions,
      hasExamples
    };
  }

  private hasContext(prompt: string): boolean {
    const contextKeywords = ['context', 'background', 'situation', 'scenario', 'given'];
    return contextKeywords.some(keyword => 
      prompt.toLowerCase().includes(keyword)
    );
  }

  private hasInstructions(prompt: string): boolean {
    const instructionKeywords = ['do', 'create', 'generate', 'write', 'build', 'make', 'please'];
    return instructionKeywords.some(keyword => 
      prompt.toLowerCase().includes(keyword)
    );
  }

  private hasExamples(prompt: string): boolean {
    const exampleKeywords = ['example', 'for instance', 'such as', 'like'];
    return exampleKeywords.some(keyword => 
      prompt.toLowerCase().includes(keyword)
    );
  }

  private calculateQuality(prompt: string, hasContext: boolean, hasInstructions: boolean, hasExamples: boolean): number {
    let quality = 0;
    
    // Base quality from length
    const wordCount = prompt.trim().split(/\s+/).length;
    if (wordCount >= 10) quality += 20;
    if (wordCount >= 50) quality += 20;
    if (wordCount >= 100) quality += 10;
    
    // Quality from structure
    if (hasContext) quality += 15;
    if (hasInstructions) quality += 15;
    if (hasExamples) quality += 10;
    
    // Quality from clarity indicators
    if (prompt.includes('?')) quality += 5;
    if (prompt.includes(':')) quality += 5;
    
    return Math.min(quality, 100);
  }

  private determineStructure(quality: number): 'good' | 'fair' | 'poor' {
    if (quality >= 70) return 'good';
    if (quality >= 40) return 'fair';
    return 'poor';
  }

  private generateSuggestions(prompt: string, hasContext: boolean, hasInstructions: boolean, hasExamples: boolean): string[] {
    const suggestions: string[] = [];
    
    if (!hasContext) {
      suggestions.push('Consider adding context or background information');
    }
    
    if (!hasInstructions) {
      suggestions.push('Make your instructions more explicit and clear');
    }
    
    if (!hasExamples) {
      suggestions.push('Add examples to clarify your expectations');
    }
    
    const wordCount = prompt.trim().split(/\s+/).length;
    if (wordCount < 10) {
      suggestions.push('Consider providing more detail in your prompt');
    }
    
    if (wordCount > 500) {
      suggestions.push('Consider breaking down your prompt into smaller, focused parts');
    }
    
    return suggestions;
  }
}

// Export singleton instance
export const promptAnalyzer = new PromptAnalyzer();