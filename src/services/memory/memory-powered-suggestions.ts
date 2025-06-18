/**
 * Memory-Powered Code Suggestions Service
 * Provides intelligent code suggestions, auto-completion, and templates based on memory
 */

import { MemoryService } from './memory-service';
import { MemoryEntry, MemoryType, MemorySearchParams } from './memory-types';
import { ContextualInsight } from './contextual-memory-service';

export interface CodeSuggestion {
  id: string;
  type: 'completion' | 'template' | 'snippet' | 'refactor' | 'optimization';
  title: string;
  description: string;
  code: string;
  language: string;
  confidence: number;
  tags: string[];
  source: 'memory' | 'pattern' | 'template';
  relevantMemories: string[];
}

export interface AutoCompleteResult {
  suggestions: CodeSuggestion[];
  context: string;
  confidence: number;
}

export interface CodeTemplate {
  id: string;
  name: string;
  description: string;
  language: string;
  category: string;
  template: string;
  variables: TemplateVariable[];
  usageCount: number;
  lastUsed: number;
}

export interface TemplateVariable {
  name: string;
  type: 'string' | 'number' | 'boolean' | 'array' | 'object';
  description: string;
  defaultValue?: any;
  required: boolean;
}

/**
 * Memory-Powered Suggestions Service
 */
export class MemoryPoweredSuggestions {
  private memoryService: MemoryService;
  private templates: Map<string, CodeTemplate> = new Map();
  private recentSuggestions: CodeSuggestion[] = [];

  constructor(memoryService: MemoryService) {
    this.memoryService = memoryService;
    this.loadTemplates();
  }

  /**
   * Get code suggestions based on current context
   */
  async getCodeSuggestions(
    partialCode: string,
    language: string,
    sessionId: string,
    maxSuggestions: number = 5
  ): Promise<CodeSuggestion[]> {
    const suggestions: CodeSuggestion[] = [];

    // Get memory-based suggestions
    const memorySuggestions = await this.getMemoryBasedSuggestions(
      partialCode, 
      language, 
      sessionId
    );
    suggestions.push(...memorySuggestions);

    // Get template-based suggestions
    const templateSuggestions = await this.getTemplateSuggestions(
      partialCode, 
      language
    );
    suggestions.push(...templateSuggestions);

    // Get pattern-based suggestions
    const patternSuggestions = await this.getPatternBasedSuggestions(
      partialCode, 
      language, 
      sessionId
    );
    suggestions.push(...patternSuggestions);

    // Sort by confidence and return top suggestions
    return suggestions
      .sort((a, b) => b.confidence - a.confidence)
      .slice(0, maxSuggestions);
  }

  /**
   * Get auto-completion suggestions for partial input
   */
  async getAutoComplete(
    partialInput: string,
    cursorPosition: number,
    language: string,
    sessionId: string
  ): Promise<AutoCompleteResult> {
    const context = this.extractContext(partialInput, cursorPosition);
    const suggestions: CodeSuggestion[] = [];

    // Find similar code patterns from memory
    const similarCode = await this.findSimilarCodePatterns(context, language, sessionId);
    
    for (const memory of similarCode) {
      const completion = this.extractCompletion(memory.content, context);
      if (completion) {
        suggestions.push({
          id: `completion_${memory.id}`,
          type: 'completion',
          title: 'Code Completion',
          description: `Based on similar code: ${memory.content.substring(0, 50)}...`,
          code: completion,
          language,
          confidence: 0.8,
          tags: memory.metadata.tags || [],
          source: 'memory',
          relevantMemories: [memory.id]
        });
      }
    }

    return {
      suggestions: suggestions.slice(0, 10),
      context,
      confidence: suggestions.length > 0 ? Math.max(...suggestions.map(s => s.confidence)) : 0
    };
  }

  /**
   * Get personalized code templates
   */
  async getPersonalizedTemplates(
    category: string,
    language: string,
    sessionId: string
  ): Promise<CodeTemplate[]> {
    const templates: CodeTemplate[] = [];

    // Get user's frequently used patterns
    const userPatterns = await this.getUserCodePatterns(language, sessionId);
    
    // Create templates from patterns
    for (const pattern of userPatterns) {
      const template = await this.createTemplateFromPattern(pattern, language);
      if (template) {
        templates.push(template);
      }
    }

    // Add predefined templates that match user preferences
    const predefinedTemplates = Array.from(this.templates.values())
      .filter(t => t.language === language && t.category === category)
      .sort((a, b) => b.usageCount - a.usageCount);

    templates.push(...predefinedTemplates);

    return templates.slice(0, 10);
  }

  /**
   * Generate code from template with variables
   */
  generateCodeFromTemplate(template: CodeTemplate, variables: Record<string, any>): string {
    let code = template.template;

    // Replace template variables
    for (const variable of template.variables) {
      const value = variables[variable.name] || variable.defaultValue || '';
      const placeholder = `{{${variable.name}}}`;
      code = code.replace(new RegExp(placeholder, 'g'), String(value));
    }

    // Update usage statistics
    template.usageCount++;
    template.lastUsed = Date.now();

    return code;
  }

  /**
   * Learn from user's code to improve suggestions
   */
  async learnFromCode(
    code: string,
    language: string,
    sessionId: string,
    wasAccepted: boolean
  ): Promise<void> {
    // Store the code in memory for future suggestions
    await this.memoryService.addMemory('code', code, {
      type: MemoryType.CODE,
      source: 'user_generated',
      sessionId,
      tags: [language, wasAccepted ? 'accepted' : 'rejected'],
      language,
      custom: {
        wasAccepted,
        timestamp: Date.now()
      }
    });

    // Extract patterns from the code
    const patterns = this.extractCodePatterns(code, language);
    
    // Store patterns as templates if they're useful
    for (const pattern of patterns) {
      if (pattern.confidence > 0.7) {
        await this.createTemplateFromPattern(pattern, language);
      }
    }
  }

  /**
   * Get refactoring suggestions based on memory
   */
  async getRefactoringSuggestions(
    code: string,
    language: string,
    sessionId: string
  ): Promise<CodeSuggestion[]> {
    const suggestions: CodeSuggestion[] = [];

    // Find similar code that was refactored
    const refactoredExamples = await this.memoryService.searchMemories('code', {
      query: code,
      tags: ['refactored', language],
      maxResults: 5
    });

    for (const example of refactoredExamples.entries) {
      if (example.metadata.custom?.beforeRefactor && example.metadata.custom?.afterRefactor) {
        suggestions.push({
          id: `refactor_${example.id}`,
          type: 'refactor',
          title: 'Refactoring Suggestion',
          description: 'Based on similar code refactoring',
          code: example.metadata.custom.afterRefactor,
          language,
          confidence: 0.7,
          tags: ['refactoring', language],
          source: 'memory',
          relevantMemories: [example.id]
        });
      }
    }

    // Add common refactoring patterns
    const commonRefactors = this.getCommonRefactoringPatterns(code, language);
    suggestions.push(...commonRefactors);

    return suggestions;
  }

  /**
   * Private helper methods
   */
  private async getMemoryBasedSuggestions(
    partialCode: string,
    language: string,
    sessionId: string
  ): Promise<CodeSuggestion[]> {
    const suggestions: CodeSuggestion[] = [];

    // Search for similar code in memory
    const similarMemories = await this.memoryService.searchMemories('code', {
      query: partialCode,
      types: [MemoryType.CODE],
      tags: [language],
      maxResults: 10,
      threshold: 0.6
    });

    for (const memory of similarMemories.entries) {
      // Extract useful code snippets
      const snippet = this.extractRelevantSnippet(memory.content, partialCode);
      if (snippet) {
        suggestions.push({
          id: `memory_${memory.id}`,
          type: 'snippet',
          title: 'From Previous Code',
          description: `Similar to: ${memory.content.substring(0, 50)}...`,
          code: snippet,
          language,
          confidence: 0.7,
          tags: memory.metadata.tags || [],
          source: 'memory',
          relevantMemories: [memory.id]
        });
      }
    }

    return suggestions;
  }

  private async getTemplateSuggestions(
    partialCode: string,
    language: string
  ): Promise<CodeSuggestion[]> {
    const suggestions: CodeSuggestion[] = [];

    // Find matching templates
    const matchingTemplates = Array.from(this.templates.values())
      .filter(t => t.language === language)
      .filter(t => this.templateMatches(t, partialCode))
      .sort((a, b) => b.usageCount - a.usageCount);

    for (const template of matchingTemplates.slice(0, 3)) {
      suggestions.push({
        id: `template_${template.id}`,
        type: 'template',
        title: template.name,
        description: template.description,
        code: template.template,
        language,
        confidence: 0.8,
        tags: [template.category],
        source: 'template',
        relevantMemories: []
      });
    }

    return suggestions;
  }

  private async getPatternBasedSuggestions(
    partialCode: string,
    language: string,
    sessionId: string
  ): Promise<CodeSuggestion[]> {
    const suggestions: CodeSuggestion[] = [];

    // Get user patterns from contextual service
    const sessionMemories = await this.memoryService.getSessionMemories(sessionId, [MemoryType.CODE]);
    const patterns = this.analyzeCodePatterns(sessionMemories.map(m => m.content));

    for (const pattern of patterns) {
      if (this.patternApplies(pattern, partialCode)) {
        suggestions.push({
          id: `pattern_${pattern.id}`,
          type: 'snippet',
          title: 'Pattern Suggestion',
          description: `Based on your coding patterns: ${pattern.description}`,
          code: pattern.code,
          language,
          confidence: pattern.confidence,
          tags: ['pattern', language],
          source: 'pattern',
          relevantMemories: []
        });
      }
    }

    return suggestions;
  }

  private extractContext(input: string, cursorPosition: number): string {
    // Extract relevant context around cursor position
    const start = Math.max(0, cursorPosition - 100);
    const end = Math.min(input.length, cursorPosition + 100);
    return input.substring(start, end);
  }

  private async findSimilarCodePatterns(
    context: string,
    language: string,
    sessionId: string
  ): Promise<MemoryEntry[]> {
    const result = await this.memoryService.searchMemories('code', {
      query: context,
      types: [MemoryType.CODE],
      tags: [language],
      sessionId,
      maxResults: 5,
      threshold: 0.5
    });

    return result.entries;
  }

  private extractCompletion(fullCode: string, context: string): string | null {
    // Simple completion extraction - in practice, this would be more sophisticated
    const contextIndex = fullCode.indexOf(context);
    if (contextIndex >= 0) {
      const afterContext = fullCode.substring(contextIndex + context.length);
      const nextLine = afterContext.split('\n')[0];
      return nextLine.trim();
    }
    return null;
  }

  private async getUserCodePatterns(language: string, sessionId: string): Promise<any[]> {
    const sessionMemories = await this.memoryService.getSessionMemories(sessionId, [MemoryType.CODE]);
    return this.analyzeCodePatterns(sessionMemories.map(m => m.content));
  }

  private analyzeCodePatterns(codeSnippets: string[]): any[] {
    const patterns: any[] = [];

    // Analyze common patterns across code snippets
    const functionPatterns = this.extractFunctionPatterns(codeSnippets);
    const variablePatterns = this.extractVariablePatterns(codeSnippets);
    const structurePatterns = this.extractStructurePatterns(codeSnippets);

    patterns.push(...functionPatterns, ...variablePatterns, ...structurePatterns);

    return patterns;
  }

  private extractFunctionPatterns(codeSnippets: string[]): any[] {
    const patterns: any[] = [];
    const functionRegex = /function\s+(\w+)\s*\([^)]*\)\s*{[^}]*}/g;

    for (const code of codeSnippets) {
      const matches = Array.from(code.matchAll(functionRegex));
      for (const match of matches) {
        patterns.push({
          id: `func_${Date.now()}_${Math.random()}`,
          type: 'function',
          description: `Function pattern: ${match[1]}`,
          code: match[0],
          confidence: 0.6
        });
      }
    }

    return patterns;
  }

  private extractVariablePatterns(codeSnippets: string[]): any[] {
    const patterns: any[] = [];
    const varRegex = /(const|let|var)\s+(\w+)\s*=\s*([^;]+);/g;

    for (const code of codeSnippets) {
      const matches = Array.from(code.matchAll(varRegex));
      for (const match of matches) {
        patterns.push({
          id: `var_${Date.now()}_${Math.random()}`,
          type: 'variable',
          description: `Variable pattern: ${match[2]}`,
          code: match[0],
          confidence: 0.5
        });
      }
    }

    return patterns;
  }

  private extractStructurePatterns(codeSnippets: string[]): any[] {
    const patterns: any[] = [];

    // Look for common structural patterns
    for (const code of codeSnippets) {
      if (code.includes('if (') && code.includes('} else {')) {
        patterns.push({
          id: `struct_if_else_${Date.now()}`,
          type: 'structure',
          description: 'If-else pattern',
          code: 'if (condition) {\n  // code\n} else {\n  // code\n}',
          confidence: 0.7
        });
      }

      if (code.includes('for (') || code.includes('forEach(')) {
        patterns.push({
          id: `struct_loop_${Date.now()}`,
          type: 'structure',
          description: 'Loop pattern',
          code: 'for (let i = 0; i < array.length; i++) {\n  // code\n}',
          confidence: 0.7
        });
      }
    }

    return patterns;
  }

  private async createTemplateFromPattern(pattern: any, language: string): Promise<CodeTemplate | null> {
    if (pattern.confidence < 0.6) return null;

    const template: CodeTemplate = {
      id: `template_${Date.now()}_${Math.random()}`,
      name: `${pattern.type} Template`,
      description: pattern.description,
      language,
      category: pattern.type,
      template: pattern.code,
      variables: this.extractTemplateVariables(pattern.code),
      usageCount: 0,
      lastUsed: 0
    };

    this.templates.set(template.id, template);
    return template;
  }

  private extractTemplateVariables(code: string): TemplateVariable[] {
    const variables: TemplateVariable[] = [];
    
    // Extract common variable patterns
    const identifierRegex = /\b([a-zA-Z_][a-zA-Z0-9_]*)\b/g;
    const matches = Array.from(code.matchAll(identifierRegex));
    
    const commonVariables = ['condition', 'array', 'item', 'index', 'value', 'name', 'id'];
    
    for (const variable of commonVariables) {
      if (code.includes(variable)) {
        variables.push({
          name: variable,
          type: 'string',
          description: `${variable} variable`,
          required: true
        });
      }
    }

    return variables;
  }

  private extractRelevantSnippet(fullCode: string, partialCode: string): string | null {
    // Extract relevant code snippet based on partial code
    const lines = fullCode.split('\n');
    const partialLines = partialCode.split('\n');
    const lastPartialLine = partialLines[partialLines.length - 1].trim();

    for (let i = 0; i < lines.length; i++) {
      if (lines[i].trim().includes(lastPartialLine)) {
        // Return next few lines as suggestion
        const snippet = lines.slice(i + 1, i + 4).join('\n');
        return snippet.trim();
      }
    }

    return null;
  }

  private templateMatches(template: CodeTemplate, partialCode: string): boolean {
    // Simple matching logic - check if template keywords appear in partial code
    const templateKeywords = template.template.toLowerCase().split(/\s+/);
    const codeKeywords = partialCode.toLowerCase().split(/\s+/);
    
    const matchCount = templateKeywords.filter(keyword => 
      codeKeywords.some(codeKeyword => codeKeyword.includes(keyword))
    ).length;

    return matchCount > templateKeywords.length * 0.3; // 30% match threshold
  }

  private patternApplies(pattern: any, partialCode: string): boolean {
    // Check if pattern is relevant to current partial code
    return partialCode.toLowerCase().includes(pattern.type.toLowerCase());
  }

  private getCommonRefactoringPatterns(code: string, language: string): CodeSuggestion[] {
    const suggestions: CodeSuggestion[] = [];

    // Check for common refactoring opportunities
    if (code.includes('var ') && language === 'javascript') {
      suggestions.push({
        id: 'refactor_var_to_const',
        type: 'refactor',
        title: 'Use const/let instead of var',
        description: 'Modern JavaScript prefers const/let over var',
        code: code.replace(/var /g, 'const '),
        language,
        confidence: 0.8,
        tags: ['refactoring', 'modernization'],
        source: 'pattern',
        relevantMemories: []
      });
    }

    if (code.includes('function(') && language === 'javascript') {
      suggestions.push({
        id: 'refactor_arrow_function',
        type: 'refactor',
        title: 'Convert to arrow function',
        description: 'Use arrow function for cleaner syntax',
        code: code.replace(/function\s*\(/g, '('),
        language,
        confidence: 0.7,
        tags: ['refactoring', 'modernization'],
        source: 'pattern',
        relevantMemories: []
      });
    }

    return suggestions;
  }

  private loadTemplates(): void {
    // Load predefined templates
    const defaultTemplates: CodeTemplate[] = [
      {
        id: 'react_component',
        name: 'React Component',
        description: 'Basic React functional component',
        language: 'javascript',
        category: 'component',
        template: `import React from 'react';

const {{componentName}} = () => {
  return (
    <div>
      {{content}}
    </div>
  );
};

export default {{componentName}};`,
        variables: [
          { name: 'componentName', type: 'string', description: 'Component name', required: true },
          { name: 'content', type: 'string', description: 'Component content', defaultValue: 'Hello World', required: false }
        ],
        usageCount: 0,
        lastUsed: 0
      },
      {
        id: 'express_route',
        name: 'Express Route',
        description: 'Express.js route handler',
        language: 'javascript',
        category: 'api',
        template: `app.{{method}}('{{path}}', (req, res) => {
  try {
    {{logic}}
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});`,
        variables: [
          { name: 'method', type: 'string', description: 'HTTP method', defaultValue: 'get', required: true },
          { name: 'path', type: 'string', description: 'Route path', defaultValue: '/api/endpoint', required: true },
          { name: 'logic', type: 'string', description: 'Route logic', defaultValue: '// Your logic here', required: false }
        ],
        usageCount: 0,
        lastUsed: 0
      }
    ];

    for (const template of defaultTemplates) {
      this.templates.set(template.id, template);
    }
  }
}n/**
 * Memory-Powered Code Suggestions Service
 * Provides intelligent code suggestions, auto-completion, and templates based on memory
 */

import { MemoryService } from './memory-service';
import { MemoryEntry, MemoryType, MemorySearchParams } from './memory-types';
import { ContextualInsight } from './contextual-memory-service';

export interface CodeSuggestion {
  id: string;
  type: 'completion' | 'template' | 'snippet' | 'refactor' | 'optimization';
  title: string;
  description: string;
  code: string;
  language: string;
  confidence: number;
  tags: string[];
  source: 'memory' | 'pattern' | 'template';
  relevantMemories: string[];
}

export interface AutoCompleteResult {
  suggestions: CodeSuggestion[];
  context: string;
  confidence: number;
}

export interface CodeTemplate {
  id: string;
  name: string;
  description: string;
  language: string;
  category: string;
  template: string;
  variables: TemplateVariable[];
  usageCount: number;
  lastUsed: number;
}

export interface TemplateVariable {
  name: string;
  type: 'string' | 'number' | 'boolean' | 'array' | 'object';
  description: string;
  defaultValue?: any;
  required: boolean;
}

/**
 * Memory-Powered Suggestions Service
 */
export class MemoryPoweredSuggestions {
  private memoryService: MemoryService;
  private templates: Map<string, CodeTemplate> = new Map();
  private recentSuggestions: CodeSuggestion[] = [];

  constructor(memoryService: MemoryService) {
    this.memoryService = memoryService;
    this.loadTemplates();
  }

  /**
   * Get code suggestions based on current context
   */
  async getCodeSuggestions(
    partialCode: string,
    language: string,
    sessionId: string,
    maxSuggestions: number = 5
  ): Promise<CodeSuggestion[]> {
    const suggestions: CodeSuggestion[] = [];

    // Get memory-based suggestions
    const memorySuggestions = await this.getMemoryBasedSuggestions(
      partialCode, 
      language, 
      sessionId
    );
    suggestions.push(...memorySuggestions);

    // Get template-based suggestions
    const templateSuggestions = await this.getTemplateSuggestions(
      partialCode, 
      language
    );
    suggestions.push(...templateSuggestions);

    // Get pattern-based suggestions
    const patternSuggestions = await this.getPatternBasedSuggestions(
      partialCode, 
      language, 
      sessionId
    );
    suggestions.push(...patternSuggestions);

    // Sort by confidence and return top suggestions
    return suggestions
      .sort((a, b) => b.confidence - a.confidence)
      .slice(0, maxSuggestions);
  }

  /**
   * Get auto-completion suggestions for partial input
   */
  async getAutoComplete(
    partialInput: string,
    cursorPosition: number,
    language: string,
    sessionId: string
  ): Promise<AutoCompleteResult> {
    const context = this.extractContext(partialInput, cursorPosition);
    const suggestions: CodeSuggestion[] = [];

    // Find similar code patterns from memory
    const similarCode = await this.findSimilarCodePatterns(context, language, sessionId);
    
    for (const memory of similarCode) {
      const completion = this.extractCompletion(memory.content, context);
      if (completion) {
        suggestions.push({
          id: `completion_${memory.id}`,
          type: 'completion',
          title: 'Code Completion',
          description: `Based on similar code: ${memory.content.substring(0, 50)}...`,
          code: completion,
          language,
          confidence: 0.8,
          tags: memory.metadata.tags || [],
          source: 'memory',
          relevantMemories: [memory.id]
        });
      }
    }

    return {
      suggestions: suggestions.slice(0, 10),
      context,
      confidence: suggestions.length > 0 ? Math.max(...suggestions.map(s => s.confidence)) : 0
    };
  }

  /**
   * Get personalized code templates
   */
  async getPersonalizedTemplates(
    category: string,
    language: string,
    sessionId: string
  ): Promise<CodeTemplate[]> {
    const templates: CodeTemplate[] = [];

    // Get user's frequently used patterns
    const userPatterns = await this.getUserCodePatterns(language, sessionId);
    
    // Create templates from patterns
    for (const pattern of userPatterns) {
      const template = await this.createTemplateFromPattern(pattern, language);
      if (template) {
        templates.push(template);
      }
    }

    // Add predefined templates that match user preferences
    const predefinedTemplates = Array.from(this.templates.values())
      .filter(t => t.language === language && t.category === category)
      .sort((a, b) => b.usageCount - a.usageCount);

    templates.push(...predefinedTemplates);

    return templates.slice(0, 10);
  }

  /**
   * Generate code from template with variables
   */
  generateCodeFromTemplate(template: CodeTemplate, variables: Record<string, any>): string {
    let code = template.template;

    // Replace template variables
    for (const variable of template.variables) {
      const value = variables[variable.name] || variable.defaultValue || '';
      const placeholder = `{{${variable.name}}}`;
      code = code.replace(new RegExp(placeholder, 'g'), String(value));
    }

    // Update usage statistics
    template.usageCount++;
    template.lastUsed = Date.now();

    return code;
  }

  /**
   * Learn from user's code to improve suggestions
   */
  async learnFromCode(
    code: string,
    language: string,
    sessionId: string,
    wasAccepted: boolean
  ): Promise<void> {
    // Store the code in memory for future suggestions
    await this.memoryService.addMemory('code', code, {
      type: MemoryType.CODE,
      source: 'user_generated',
      sessionId,
      tags: [language, wasAccepted ? 'accepted' : 'rejected'],
      language,
      custom: {
        wasAccepted,
        timestamp: Date.now()
      }
    });

    // Extract patterns from the code
    const patterns = this.extractCodePatterns(code, language);
    
    // Store patterns as templates if they're useful
    for (const pattern of patterns) {
      if (pattern.confidence > 0.7) {
        await this.createTemplateFromPattern(pattern, language);
      }
    }
  }

  /**
   * Get refactoring suggestions based on memory
   */
  async getRefactoringSuggestions(
    code: string,
    language: string,
    sessionId: string
  ): Promise<CodeSuggestion[]> {
    const suggestions: CodeSuggestion[] = [];

    // Find similar code that was refactored
    const refactoredExamples = await this.memoryService.searchMemories('code', {
      query: code,
      tags: ['refactored', language],
      maxResults: 5
    });

    for (const example of refactoredExamples.entries) {
      if (example.metadata.custom?.beforeRefactor && example.metadata.custom?.afterRefactor) {
        suggestions.push({
          id: `refactor_${example.id}`,
          type: 'refactor',
          title: 'Refactoring Suggestion',
          description: 'Based on similar code refactoring',
          code: example.metadata.custom.afterRefactor,
          language,
          confidence: 0.7,
          tags: ['refactoring', language],
          source: 'memory',
          relevantMemories: [example.id]
        });
      }
    }

    // Add common refactoring patterns
    const commonRefactors = this.getCommonRefactoringPatterns(code, language);
    suggestions.push(...commonRefactors);

    return suggestions;
  }

  /**
   * Private helper methods
   */
  private async getMemoryBasedSuggestions(
    partialCode: string,
    language: string,
    sessionId: string
  ): Promise<CodeSuggestion[]> {
    const suggestions: CodeSuggestion[] = [];

    // Search for similar code in memory
    const similarMemories = await this.memoryService.searchMemories('code', {
      query: partialCode,
      types: [MemoryType.CODE],
      tags: [language],
      maxResults: 10,
      threshold: 0.6
    });

    for (const memory of similarMemories.entries) {
      // Extract useful code snippets
      const snippet = this.extractRelevantSnippet(memory.content, partialCode);
      if (snippet) {
        suggestions.push({
          id: `memory_${memory.id}`,
          type: 'snippet',
          title: 'From Previous Code',
          description: `Similar to: ${memory.content.substring(0, 50)}...`,
          code: snippet,
          language,
          confidence: 0.7,
          tags: memory.metadata.tags || [],
          source: 'memory',
          relevantMemories: [memory.id]
        });
      }
    }

    return suggestions;
  }

  private async getTemplateSuggestions(
    partialCode: string,
    language: string
  ): Promise<CodeSuggestion[]> {
    const suggestions: CodeSuggestion[] = [];

    // Find matching templates
    const matchingTemplates = Array.from(this.templates.values())
      .filter(t => t.language === language)
      .filter(t => this.templateMatches(t, partialCode))
      .sort((a, b) => b.usageCount - a.usageCount);

    for (const template of matchingTemplates.slice(0, 3)) {
      suggestions.push({
        id: `template_${template.id}`,
        type: 'template',
        title: template.name,
        description: template.description,
        code: template.template,
        language,
        confidence: 0.8,
        tags: [template.category],
        source: 'template',
        relevantMemories: []
      });
    }

    return suggestions;
  }

  private async getPatternBasedSuggestions(
    partialCode: string,
    language: string,
    sessionId: string
  ): Promise<CodeSuggestion[]> {
    const suggestions: CodeSuggestion[] = [];

    // Get user patterns from contextual service
    const sessionMemories = await this.memoryService.getSessionMemories(sessionId, [MemoryType.CODE]);
    const patterns = this.analyzeCodePatterns(sessionMemories.map(m => m.content));

    for (const pattern of patterns) {
      if (this.patternApplies(pattern, partialCode)) {
        suggestions.push({
          id: `pattern_${pattern.id}`,
          type: 'snippet',
          title: 'Pattern Suggestion',
          description: `Based on your coding patterns: ${pattern.description}`,
          code: pattern.code,
          language,
          confidence: pattern.confidence,
          tags: ['pattern', language],
          source: 'pattern',
          relevantMemories: []
        });
      }
    }

    return suggestions;
  }

  private extractContext(input: string, cursorPosition: number): string {
    // Extract relevant context around cursor position
    const start = Math.max(0, cursorPosition - 100);
    const end = Math.min(input.length, cursorPosition + 100);
    return input.substring(start, end);
  }

  private async findSimilarCodePatterns(
    context: string,
    language: string,
    sessionId: string
  ): Promise<MemoryEntry[]> {
    const result = await this.memoryService.searchMemories('code', {
      query: context,
      types: [MemoryType.CODE],
      tags: [language],
      sessionId,
      maxResults: 5,
      threshold: 0.5
    });

    return result.entries;
  }

  private extractCompletion(fullCode: string, context: string): string | null {
    // Simple completion extraction - in practice, this would be more sophisticated
    const contextIndex = fullCode.indexOf(context);
    if (contextIndex >= 0) {
      const afterContext = fullCode.substring(contextIndex + context.length);
      const nextLine = afterContext.split('\n')[0];
      return nextLine.trim();
    }
    return null;
  }

  private async getUserCodePatterns(language: string, sessionId: string): Promise<any[]> {
    const sessionMemories = await this.memoryService.getSessionMemories(sessionId, [MemoryType.CODE]);
    return this.analyzeCodePatterns(sessionMemories.map(m => m.content));
  }

  private analyzeCodePatterns(codeSnippets: string[]): any[] {
    const patterns: any[] = [];

    // Analyze common patterns across code snippets
    const functionPatterns = this.extractFunctionPatterns(codeSnippets);
    const variablePatterns = this.extractVariablePatterns(codeSnippets);
    const structurePatterns = this.extractStructurePatterns(codeSnippets);

    patterns.push(...functionPatterns, ...variablePatterns, ...structurePatterns);

    return patterns;
  }

  private extractFunctionPatterns(codeSnippets: string[]): any[] {
    const patterns: any[] = [];
    const functionRegex = /function\s+(\w+)\s*\([^)]*\)\s*{[^}]*}/g;

    for (const code of codeSnippets) {
      const matches = Array.from(code.matchAll(functionRegex));
      for (const match of matches) {
        patterns.push({
          id: `func_${Date.now()}_${Math.random()}`,
          type: 'function',
          description: `Function pattern: ${match[1]}`,
          code: match[0],
          confidence: 0.6
        });
      }
    }

    return patterns;
  }

  private extractVariablePatterns(codeSnippets: string[]): any[] {
    const patterns: any[] = [];
    const varRegex = /(const|let|var)\s+(\w+)\s*=\s*([^;]+);/g;

    for (const code of codeSnippets) {
      const matches = Array.from(code.matchAll(varRegex));
      for (const match of matches) {
        patterns.push({
          id: `var_${Date.now()}_${Math.random()}`,
          type: 'variable',
          description: `Variable pattern: ${match[2]}`,
          code: match[0],
          confidence: 0.5
        });
      }
    }

    return patterns;
  }

  private extractStructurePatterns(codeSnippets: string[]): any[] {
    const patterns: any[] = [];

    // Look for common structural patterns
    for (const code of codeSnippets) {
      if (code.includes('if (') && code.includes('} else {')) {
        patterns.push({
          id: `struct_if_else_${Date.now()}`,
          type: 'structure',
          description: 'If-else pattern',
          code: 'if (condition) {\n  // code\n} else {\n  // code\n}',
          confidence: 0.7
        });
      }

      if (code.includes('for (') || code.includes('forEach(')) {
        patterns.push({
          id: `struct_loop_${Date.now()}`,
          type: 'structure',
          description: 'Loop pattern',
          code: 'for (let i = 0; i < array.length; i++) {\n  // code\n}',
          confidence: 0.7
        });
      }
    }

    return patterns;
  }

  private async createTemplateFromPattern(pattern: any, language: string): Promise<CodeTemplate | null> {
    if (pattern.confidence < 0.6) return null;

    const template: CodeTemplate = {
      id: `template_${Date.now()}_${Math.random()}`,
      name: `${pattern.type} Template`,
      description: pattern.description,
      language,
      category: pattern.type,
      template: pattern.code,
      variables: this.extractTemplateVariables(pattern.code),
      usageCount: 0,
      lastUsed: 0
    };

    this.templates.set(template.id, template);
    return template;
  }

  private extractTemplateVariables(code: string): TemplateVariable[] {
    const variables: TemplateVariable[] = [];
    
    // Extract common variable patterns
    const identifierRegex = /\b([a-zA-Z_][a-zA-Z0-9_]*)\b/g;
    const matches = Array.from(code.matchAll(identifierRegex));
    
    const commonVariables = ['condition', 'array', 'item', 'index', 'value', 'name', 'id'];
    
    for (const variable of commonVariables) {
      if (code.includes(variable)) {
        variables.push({
          name: variable,
          type: 'string',
          description: `${variable} variable`,
          required: true
        });
      }
    }

    return variables;
  }

  private extractRelevantSnippet(fullCode: string, partialCode: string): string | null {
    // Extract relevant code snippet based on partial code
    const lines = fullCode.split('\n');
    const partialLines = partialCode.split('\n');
    const lastPartialLine = partialLines[partialLines.length - 1].trim();

    for (let i = 0; i < lines.length; i++) {
      if (lines[i].trim().includes(lastPartialLine)) {
        // Return next few lines as suggestion
        const snippet = lines.slice(i + 1, i + 4).join('\n');
        return snippet.trim();
      }
    }

    return null;
  }

  private templateMatches(template: CodeTemplate, partialCode: string): boolean {
    // Simple matching logic - check if template keywords appear in partial code
    const templateKeywords = template.template.toLowerCase().split(/\s+/);
    const codeKeywords = partialCode.toLowerCase().split(/\s+/);
    
    const matchCount = templateKeywords.filter(keyword => 
      codeKeywords.some(codeKeyword => codeKeyword.includes(keyword))
    ).length;

    return matchCount > templateKeywords.length * 0.3; // 30% match threshold
  }

  private patternApplies(pattern: any, partialCode: string): boolean {
    // Check if pattern is relevant to current partial code
    return partialCode.toLowerCase().includes(pattern.type.toLowerCase());
  }

  private getCommonRefactoringPatterns(code: string, language: string): CodeSuggestion[] {
    const suggestions: CodeSuggestion[] = [];

    // Check for common refactoring opportunities
    if (code.includes('var ') && language === 'javascript') {
      suggestions.push({
        id: 'refactor_var_to_const',
        type: 'refactor',
        title: 'Use const/let instead of var',
        description: 'Modern JavaScript prefers const/let over var',
        code: code.replace(/var /g, 'const '),
        language,
        confidence: 0.8,
        tags: ['refactoring', 'modernization'],
        source: 'pattern',
        relevantMemories: []
      });
    }

    if (code.includes('function(') && language === 'javascript') {
      suggestions.push({
        id: 'refactor_arrow_function',
        type: 'refactor',
        title: 'Convert to arrow function',
        description: 'Use arrow function for cleaner syntax',
        code: code.replace(/function\s*\(/g, '('),
        language,
        confidence: 0.7,
        tags: ['refactoring', 'modernization'],
        source: 'pattern',
        relevantMemories: []
      });
    }

    return suggestions;
  }

  private loadTemplates(): void {
    // Load predefined templates
    const defaultTemplates: CodeTemplate[] = [
      {
        id: 'react_component',
        name: 'React Component',
        description: 'Basic React functional component',
        language: 'javascript',
        category: 'component',
        template: `import React from 'react';

const {{componentName}} = () => {
  return (
    <div>
      {{content}}
    </div>
  );
};

export default {{componentName}};`,
        variables: [
          { name: 'componentName', type: 'string', description: 'Component name', required: true },
          { name: 'content', type: 'string', description: 'Component content', defaultValue: 'Hello World', required: false }
        ],
        usageCount: 0,
        lastUsed: 0
      },
      {
        id: 'express_route',
        name: 'Express Route',
        description: 'Express.js route handler',
        language: 'javascript',
        category: 'api',
        template: `app.{{method}}('{{path}}', (req, res) => {
  try {
    {{logic}}
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});`,
        variables: [
          { name: 'method', type: 'string', description: 'HTTP method', defaultValue: 'get', required: true },
          { name: 'path', type: 'string', description: 'Route path', defaultValue: '/api/endpoint', required: true },
          { name: 'logic', type: 'string', description: 'Route logic', defaultValue: '// Your logic here', required: false }
        ],
        usageCount: 0,
        lastUsed: 0
      }
    ];

    for (const template of defaultTemplates) {
      this.templates.set(template.id, template);
    }
  }
}