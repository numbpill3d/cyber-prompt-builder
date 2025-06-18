/**
 * Contextual Memory Service
 * Learns from user patterns, preferences, and coding habits to provide intelligent suggestions
 */
import { MemoryEntry, MemoryMetadata, MemoryType, MemorySearchParams } from './memory-types';

export interface UserPattern {
  id: string;
  type: 'coding_style' | 'language_preference' | 'framework_usage' | 'problem_solving' | 'naming_convention';
  pattern: string;
  confidence: number;
  frequency: number;
  lastSeen: number;
  examples: string[];
}

export interface ContextualInsight {
  type: 'suggestion' | 'warning' | 'optimization' | 'pattern';
  message: string;
  confidence: number;
  relevantMemories: string[];
  actionable: boolean;
}

export interface LearningContext {
  sessionId: string;
  userId?: string;
  timestamp: number;
  action: string;
  context: Record<string, any>;
  outcome?: 'success' | 'failure' | 'partial';
}

/**
 * Contextual Memory Service that learns and adapts
 */
export class ContextualMemoryService {
  private patterns: Map<string, UserPattern> = new Map();
  private learningHistory: LearningContext[] = [];
  private insights: ContextualInsight[] = [];
  private memoryService: BaseMemoryService; // Injected or passed in

  constructor(memoryService: BaseMemoryService, config = {}) {
    // super(config); // No longer extends BaseMemoryService
    this.memoryService = memoryService;
    this.loadPatterns();
  }

  /**
   * Learn from user interactions and code generation
   */
  async learnFromInteraction(context: LearningContext): Promise<void> {
    this.learningHistory.push(context);
    
    // Analyze patterns in the interaction
    await this.analyzePatterns(context);
    
    // Update user preferences
    await this.updatePreferences(context);
    
    // Generate insights
    await this.generateInsights(context);
    
    // Persist learning
    await this.persistLearning();
  }

  /**
   * Get contextual suggestions based on current input
   */
  async getContextualSuggestions(input: string, sessionId: string): Promise<ContextualInsight[]> {
    const suggestions: ContextualInsight[] = [];
    
    // Analyze input for patterns
    const inputPatterns = await this.analyzeInputPatterns(input);
    
    // Find similar past interactions
    const similarMemories = await this.findSimilarInteractions(input, sessionId);
    
    // Generate suggestions based on patterns
    for (const pattern of inputPatterns) {
      const suggestion = await this.generatePatternSuggestion(pattern, similarMemories);
      if (suggestion) {
        suggestions.push(suggestion);
      }
    }
    
    // Add framework/library suggestions
    const frameworkSuggestions = await this.getFrameworkSuggestions(input);
    suggestions.push(...frameworkSuggestions);
    
    // Add code style suggestions
    const styleSuggestions = await this.getStyleSuggestions(input);
    suggestions.push(...styleSuggestions);
    
    return suggestions.sort((a, b) => b.confidence - a.confidence);
  }

  /**
   * Get personalized code templates based on user patterns
   */
  async getPersonalizedTemplates(language: string, context: string): Promise<MemoryEntry[]> {
    const templates: MemoryEntry[] = [];
    
    // Find user's preferred patterns for this language
    const languagePatterns = Array.from(this.patterns.values())
      .filter(p => p.pattern.includes(language.toLowerCase()))
      .sort((a, b) => b.frequency - a.frequency);
    
    // Search for relevant code memories
    const codeMemories = await this.memoryService.searchMemories('code', {
      query: context,
      types: [MemoryType.CODE],
      maxResults: 10
    });
    
    // Create personalized templates
    for (const memory of codeMemories.entries) {
      if (this.matchesUserPatterns(memory.content, languagePatterns)) {
        templates.push({
          ...memory,
          metadata: {
            ...memory.metadata,
            tags: [...(memory.metadata.tags || []), 'personalized', 'template']
          }
        });
      }
    }
    
    return templates;
  }

  /**
   * Predict user intent based on partial input
   */
  async predictUserIntent(partialInput: string, sessionId: string): Promise<{
    intent: string;
    confidence: number;
    suggestions: string[];
  }> {
    const sessionMemories = await this.memoryService.getSessionMemories(sessionId);
    const recentPatterns = this.getRecentPatterns();
    
    // Analyze partial input
    const inputFeatures = this.extractInputFeatures(partialInput);
    
    // Find matching patterns
    const matchingPatterns = recentPatterns.filter(pattern => 
      this.patternMatches(inputFeatures, pattern)
    );
    
    // Predict most likely intent
    let bestIntent = 'code_generation';
    let confidence = 0.5;
    const suggestions: string[] = [];
    
    if (matchingPatterns.length > 0) {
      const topPattern = matchingPatterns[0];
      confidence = topPattern.confidence;
      
      // Generate suggestions based on pattern
      if (topPattern.type === 'coding_style') {
        bestIntent = 'code_generation';
        suggestions.push(...this.generateCodeSuggestions(topPattern, partialInput));
      } else if (topPattern.type === 'problem_solving') {
        bestIntent = 'problem_solving';
        suggestions.push(...this.generateProblemSuggestions(topPattern, partialInput));
      }
    }
    
    return {
      intent: bestIntent,
      confidence,
      suggestions
    };
  }

  /**
   * Get adaptive learning insights
   */
  getAdaptiveLearningInsights(): ContextualInsight[] {
    return this.insights.slice(-10); // Return last 10 insights
  }

  /**
   * Private methods for pattern analysis and learning
   */
  private async analyzePatterns(context: LearningContext): Promise<void> {
    const { action, context: ctx } = context;
    
    // Analyze coding patterns
    if (action === 'code_generated' && ctx.code) {
      await this.analyzeCodingPatterns(ctx.code, context);
    }
    
    // Analyze language preferences
    if (ctx.language) {
      await this.analyzeLanguagePreference(ctx.language, context);
    }
    
    // Analyze problem-solving patterns
    if (ctx.prompt) {
      await this.analyzeProblemSolvingPatterns(ctx.prompt, context);
    }
  }

  private async analyzeCodingPatterns(code: string, context: LearningContext): Promise<void> {
    const patterns = this.extractCodingPatterns(code);
    
    for (const pattern of patterns) {
      const existingPattern = this.patterns.get(pattern.id);
      
      if (existingPattern) {
        existingPattern.frequency++;
        existingPattern.lastSeen = Date.now();
        existingPattern.confidence = Math.min(1.0, existingPattern.confidence + 0.1);
        existingPattern.examples.push(code.substring(0, 200));
      } else {
        this.patterns.set(pattern.id, {
          ...pattern,
          frequency: 1,
          lastSeen: Date.now(),
          examples: [code.substring(0, 200)]
        });
      }
    }
  }

  private extractCodingPatterns(code: string): UserPattern[] {
    const patterns: UserPattern[] = [];
    
    // Function naming patterns
    const functionMatches = code.match(/function\s+(\w+)|const\s+(\w+)\s*=/g);
    if (functionMatches) {
      const namingStyle = this.detectNamingStyle(functionMatches);
      patterns.push({
        id: `naming_${namingStyle}`,
        type: 'naming_convention',
        pattern: namingStyle,
        confidence: 0.7,
        frequency: 0,
        lastSeen: 0,
        examples: []
      });
    }
    
    // Indentation patterns
    const indentationStyle = this.detectIndentationStyle(code);
    patterns.push({
      id: `indent_${indentationStyle}`,
      type: 'coding_style',
      pattern: indentationStyle,
      confidence: 0.8,
      frequency: 0,
      lastSeen: 0,
      examples: []
    });
    
    // Framework usage patterns
    const frameworks = this.detectFrameworks(code);
    for (const framework of frameworks) {
      patterns.push({
        id: `framework_${framework}`,
        type: 'framework_usage',
        pattern: framework,
        confidence: 0.9,
        frequency: 0,
        lastSeen: 0,
        examples: []
      });
    }
    
    return patterns;
  }

  private detectNamingStyle(matches: string[]): string {
    const camelCaseCount = matches.filter(m => /[a-z][A-Z]/.test(m)).length;
    const snakeCaseCount = matches.filter(m => /_/.test(m)).length;
    
    return camelCaseCount > snakeCaseCount ? 'camelCase' : 'snake_case';
  }

  private detectIndentationStyle(code: string): string {
    const lines = code.split('\n');
    let spaceCount = 0;
    let tabCount = 0;
    
    for (const line of lines) {
      if (line.startsWith('  ')) spaceCount++;
      if (line.startsWith('\t')) tabCount++;
    }
    
    return spaceCount > tabCount ? 'spaces' : 'tabs';
  }

  private detectFrameworks(code: string): string[] {
    const frameworks: string[] = [];
    
    if (code.includes('import React') || code.includes('from \'react\'')) {
      frameworks.push('React');
    }
    if (code.includes('import Vue') || code.includes('from \'vue\'')) {
      frameworks.push('Vue');
    }
    if (code.includes('import { Component }') || code.includes('@angular')) {
      frameworks.push('Angular');
    }
    if (code.includes('express') || code.includes('app.get')) {
      frameworks.push('Express');
    }
    
    return frameworks;
  }

  private async analyzeLanguagePreference(language: string, context: LearningContext): Promise<void> {
    const patternId = `lang_${language.toLowerCase()}`;
    const existingPattern = this.patterns.get(patternId);
    
    if (existingPattern) {
      existingPattern.frequency++;
      existingPattern.lastSeen = Date.now();
    } else {
      this.patterns.set(patternId, {
        id: patternId,
        type: 'language_preference',
        pattern: language,
        confidence: 0.6,
        frequency: 1,
        lastSeen: Date.now(),
        examples: []
      });
    }
  }

  private async analyzeProblemSolvingPatterns(prompt: string, context: LearningContext): Promise<void> {
    const problemType = this.classifyProblemType(prompt);
    const patternId = `problem_${problemType}`;
    
    const existingPattern = this.patterns.get(patternId);
    if (existingPattern) {
      existingPattern.frequency++;
      existingPattern.lastSeen = Date.now();
      existingPattern.examples.push(prompt.substring(0, 100));
    } else {
      this.patterns.set(patternId, {
        id: patternId,
        type: 'problem_solving',
        pattern: problemType,
        confidence: 0.7,
        frequency: 1,
        lastSeen: Date.now(),
        examples: [prompt.substring(0, 100)]
      });
    }
  }

  private classifyProblemType(prompt: string): string {
    const lowerPrompt = prompt.toLowerCase();
    
    if (lowerPrompt.includes('api') || lowerPrompt.includes('endpoint')) {
      return 'api_development';
    }
    if (lowerPrompt.includes('ui') || lowerPrompt.includes('component') || lowerPrompt.includes('interface')) {
      return 'ui_development';
    }
    if (lowerPrompt.includes('database') || lowerPrompt.includes('sql') || lowerPrompt.includes('query')) {
      return 'database_operations';
    }
    if (lowerPrompt.includes('algorithm') || lowerPrompt.includes('sort') || lowerPrompt.includes('search')) {
      return 'algorithm_implementation';
    }
    if (lowerPrompt.includes('test') || lowerPrompt.includes('unit') || lowerPrompt.includes('spec')) {
      return 'testing';
    }
    
    return 'general_coding';
  }

  private async updatePreferences(context: LearningContext): Promise<void> {
    // Update preferences based on successful outcomes
    if (context.outcome === 'success') {
      // Boost confidence of patterns used in successful interactions
      const relevantPatterns = Array.from(this.patterns.values())
        .filter(p => p.lastSeen > Date.now() - 60000); // Last minute
      
      for (const pattern of relevantPatterns) {
        pattern.confidence = Math.min(1.0, pattern.confidence + 0.05);
      }
    }
  }

  private async generateInsights(context: LearningContext): Promise<void> {
    const recentPatterns = this.getRecentPatterns();
    
    // Generate insights based on patterns
    if (recentPatterns.length > 5) {
      const topPattern = recentPatterns[0];
      
      this.insights.push({
        type: 'pattern',
        message: `You frequently use ${topPattern.pattern}. Consider exploring related patterns.`,
        confidence: topPattern.confidence,
        relevantMemories: [],
        actionable: true
      });
    }
    
    // Limit insights to prevent memory bloat
    if (this.insights.length > 50) {
      this.insights = this.insights.slice(-25);
    }
  }

  private getRecentPatterns(): UserPattern[] {
    const oneWeekAgo = Date.now() - (7 * 24 * 60 * 60 * 1000);
    
    return Array.from(this.patterns.values())
      .filter(p => p.lastSeen > oneWeekAgo)
      .sort((a, b) => b.frequency - a.frequency);
  }

  private async analyzeInputPatterns(input: string): Promise<UserPattern[]> {
    // Analyze current input for patterns
    const patterns: UserPattern[] = [];
    
    // Check for language indicators
    const language = this.detectLanguageFromInput(input);
    if (language) {
      patterns.push({
        id: `input_lang_${language}`,
        type: 'language_preference',
        pattern: language,
        confidence: 0.8,
        frequency: 1,
        lastSeen: Date.now(),
        examples: [input]
      });
    }
    
    return patterns;
  }

  private detectLanguageFromInput(input: string): string | null {
    const lowerInput = input.toLowerCase();
    
    if (lowerInput.includes('javascript') || lowerInput.includes('js') || lowerInput.includes('node')) {
      return 'javascript';
    }
    if (lowerInput.includes('python') || lowerInput.includes('py')) {
      return 'python';
    }
    if (lowerInput.includes('react') || lowerInput.includes('jsx')) {
      return 'react';
    }
    if (lowerInput.includes('html') || lowerInput.includes('css')) {
      return 'web';
    }
    
    return null;
  }

  private async findSimilarInteractions(input: string, sessionId: string): Promise<MemoryEntry[]> {
    return this.memoryService.searchMemories('context', {
      query: input,
      sessionId,
      maxResults: 5
    }).then(result => result.entries);
  }

  private async generatePatternSuggestion(pattern: UserPattern, memories: MemoryEntry[]): Promise<ContextualInsight | null> {
    if (pattern.confidence < 0.5) return null;
    
    return {
      type: 'suggestion',
      message: `Based on your patterns, consider using ${pattern.pattern}`,
      confidence: pattern.confidence,
      relevantMemories: memories.map(m => m.id),
      actionable: true
    };
  }

  private async getFrameworkSuggestions(input: string): Promise<ContextualInsight[]> {
    const suggestions: ContextualInsight[] = [];
    const frameworks = Array.from(this.patterns.values())
      .filter(p => p.type === 'framework_usage')
      .sort((a, b) => b.frequency - a.frequency);
    
    if (frameworks.length > 0 && input.toLowerCase().includes('component')) {
      suggestions.push({
        type: 'suggestion',
        message: `Consider using ${frameworks[0].pattern} based on your usage patterns`,
        confidence: frameworks[0].confidence,
        relevantMemories: [],
        actionable: true
      });
    }
    
    return suggestions;
  }

  private async getStyleSuggestions(input: string): Promise<ContextualInsight[]> {
    const suggestions: ContextualInsight[] = [];
    const stylePatterns = Array.from(this.patterns.values())
      .filter(p => p.type === 'coding_style' || p.type === 'naming_convention');
    
    for (const pattern of stylePatterns) {
      if (pattern.confidence > 0.7) {
        suggestions.push({
          type: 'optimization',
          message: `Use ${pattern.pattern} style for consistency`,
          confidence: pattern.confidence,
          relevantMemories: [],
          actionable: true
        });
      }
    }
    
    return suggestions;
  }

  private matchesUserPatterns(content: string, patterns: UserPattern[]): boolean {
    return patterns.some(pattern => 
      content.toLowerCase().includes(pattern.pattern.toLowerCase())
    );
  }

  private extractInputFeatures(input: string): Record<string, any> {
    return {
      length: input.length,
      hasCode: /[{}();]/.test(input),
      isQuestion: input.includes('?'),
      language: this.detectLanguageFromInput(input),
      complexity: input.split(' ').length
    };
  }

  private patternMatches(features: Record<string, any>, pattern: UserPattern): boolean {
    // Simple pattern matching logic
    if (pattern.type === 'language_preference' && features.language) {
      return pattern.pattern.toLowerCase() === features.language.toLowerCase();
    }
    
    return false;
  }

  private generateCodeSuggestions(pattern: UserPattern, input: string): string[] {
    const suggestions: string[] = [];
    
    if (pattern.pattern === 'camelCase') {
      suggestions.push('Use camelCase for variable names');
    }
    if (pattern.pattern === 'React') {
      suggestions.push('Create a React component');
      suggestions.push('Use React hooks');
    }
    
    return suggestions;
  }

  private generateProblemSuggestions(pattern: UserPattern, input: string): string[] {
    const suggestions: string[] = [];
    
    if (pattern.pattern === 'api_development') {
      suggestions.push('Create REST API endpoints');
      suggestions.push('Add error handling');
    }
    
    return suggestions;
  }

  private async persistLearning(): Promise<void> {
    // Persist patterns to memory
    try {
      const patternsData = JSON.stringify(Array.from(this.patterns.entries()));
      await this.memoryService.addMemory('context', patternsData, {
        type: MemoryType.METADATA,
        source: 'contextual_learning',
        tags: ['patterns', 'learning']
      });
    } catch (error) {
      console.error('Failed to persist learning data:', error);
    }
  }

  private loadPatterns(): void {
    // Load patterns from localStorage or memory
    try {
      const stored = localStorage.getItem('user_patterns');
      if (stored) {
        const patternsArray = JSON.parse(stored);
        this.patterns = new Map(patternsArray);
      }
    } catch (error) {
      console.error('Failed to load patterns:', error);
    }
  }

  // These methods are no longer needed here as it doesn't extend BaseMemoryService
  /*
  async initialize(): Promise<void> {
    // Initialization logic if any, or rely on constructor
  }

  async shutdown(): Promise<void> {
    // Save patterns before shutdown
    // Persist patterns if needed, e.g. via this.persistLearning() or specific save method
  }
  */
}
