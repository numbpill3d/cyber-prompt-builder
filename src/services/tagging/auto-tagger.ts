/**
 * Auto Tagger Service
 * Automatically generates tags for prompts and content
 */

export interface Tag {
  name: string;
  category: string;
  confidence: number;
}

export class AutoTagger {
  private readonly tagCategories = {
    language: ['javascript', 'typescript', 'python', 'java', 'c++', 'html', 'css', 'react', 'vue', 'angular'],
    domain: ['web', 'mobile', 'backend', 'frontend', 'database', 'api', 'ui', 'ux', 'testing', 'deployment'],
    complexity: ['beginner', 'intermediate', 'advanced', 'expert'],
    type: ['code', 'documentation', 'tutorial', 'example', 'debug', 'optimization', 'refactor']
  };

  /**
   * Generate tags for a given prompt or content
   */
  generateTags(content: string): Tag[] {
    const tags: Tag[] = [];
    const lowerContent = content.toLowerCase();
    
    // Language tags
    for (const language of this.tagCategories.language) {
      if (lowerContent.includes(language)) {
        tags.push({
          name: language,
          category: 'language',
          confidence: this.calculateConfidence(lowerContent, language)
        });
      }
    }
    
    // Domain tags
    for (const domain of this.tagCategories.domain) {
      if (lowerContent.includes(domain)) {
        tags.push({
          name: domain,
          category: 'domain',
          confidence: this.calculateConfidence(lowerContent, domain)
        });
      }
    }
    
    // Complexity tags
    for (const complexity of this.tagCategories.complexity) {
      if (lowerContent.includes(complexity)) {
        tags.push({
          name: complexity,
          category: 'complexity',
          confidence: this.calculateConfidence(lowerContent, complexity)
        });
      }
    }
    
    // Type tags
    for (const type of this.tagCategories.type) {
      if (lowerContent.includes(type)) {
        tags.push({
          name: type,
          category: 'type',
          confidence: this.calculateConfidence(lowerContent, type)
        });
      }
    }
    
    // Sort by confidence and return top tags
    return tags
      .sort((a, b) => b.confidence - a.confidence)
      .slice(0, 10);
  }

  private calculateConfidence(content: string, keyword: string): number {
    const occurrences = (content.match(new RegExp(keyword, 'g')) || []).length;
    const contentLength = content.length;
    const keywordLength = keyword.length;
    
    // Base confidence from frequency
    let confidence = Math.min(occurrences * 20, 80);
    
    // Boost confidence for longer keywords
    if (keywordLength > 5) confidence += 10;
    
    // Boost confidence for exact matches
    if (content.includes(` ${keyword} `) || content.includes(`${keyword}.`) || content.includes(`${keyword},`)) {
      confidence += 10;
    }
    
    return Math.min(confidence, 100);
  }

  /**
   * Get suggested tags based on content analysis
   */
  getSuggestedTags(content: string): string[] {
    const tags = this.generateTags(content);
    return tags
      .filter(tag => tag.confidence > 30)
      .map(tag => tag.name);
  }
}

// Export singleton instance
export const autoTagger = new AutoTagger();