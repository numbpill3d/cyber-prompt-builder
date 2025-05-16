/**
 * Mode Suggestions Service
 * Provides context-aware mode suggestions based on user input and behavior
 */

import { Logger } from '../logging/logger';
import { errorHandler } from '../error/error-handler';
import { Mode } from './mode-types';
import { modeService } from './mode-service';
import { modeAnalyticsService } from './mode-analytics';

/**
 * Mode suggestion with confidence score
 */
export interface ModeSuggestion {
  mode: Mode;
  confidence: number; // 0-1 score indicating confidence in the suggestion
  reason: string; // Reason for the suggestion
}

/**
 * Mode suggestions service
 */
export class ModeSuggestionsService {
  private static instance: ModeSuggestionsService;
  private logger: Logger;
  
  // Keywords that indicate a specific mode might be appropriate
  private modeKeywords: Record<string, string[]> = {
    code: [
      'write', 'code', 'function', 'class', 'implement', 'develop', 'programming',
      'algorithm', 'syntax', 'refactor', 'optimize', 'debug', 'fix', 'error'
    ],
    architect: [
      'design', 'architecture', 'structure', 'system', 'pattern', 'organize',
      'directory', 'folder', 'layout', 'framework', 'stack', 'infrastructure'
    ],
    ask: [
      'explain', 'what', 'how', 'why', 'when', 'where', 'who', 'which',
      'question', 'understand', 'concept', 'meaning', 'difference', 'compare'
    ],
    devops: [
      'deploy', 'ci/cd', 'pipeline', 'docker', 'kubernetes', 'container',
      'cloud', 'aws', 'azure', 'gcp', 'server', 'configuration', 'automate'
    ],
    debug: [
      'bug', 'issue', 'error', 'exception', 'crash', 'fix', 'troubleshoot',
      'problem', 'diagnose', 'investigate', 'resolve', 'failure', 'incorrect'
    ],
    test: [
      'test', 'unit test', 'integration test', 'e2e', 'end-to-end', 'qa',
      'quality', 'assert', 'verify', 'validate', 'mock', 'stub', 'coverage'
    ]
  };
  
  private constructor() {
    this.logger = new Logger('ModeSuggestionsService');
  }
  
  /**
   * Get the singleton instance
   */
  public static getInstance(): ModeSuggestionsService {
    if (!ModeSuggestionsService.instance) {
      ModeSuggestionsService.instance = new ModeSuggestionsService();
    }
    return ModeSuggestionsService.instance;
  }
  
  /**
   * Get mode suggestions based on user input
   * @param input The user's input text
   * @param count The number of suggestions to return (default: 3)
   * @returns Array of mode suggestions sorted by confidence
   */
  public getSuggestionsFromInput(input: string, count: number = 3): ModeSuggestion[] {
    try {
      const inputLower = input.toLowerCase();
      const suggestions: ModeSuggestion[] = [];
      
      // Get all available modes
      const availableModes = modeService.getAllModes();
      
      // Calculate confidence scores for each mode
      for (const mode of availableModes) {
        const keywords = this.modeKeywords[mode.id] || [];
        
        // Count keyword matches
        let matchCount = 0;
        let matchedKeywords: string[] = [];
        
        for (const keyword of keywords) {
          if (inputLower.includes(keyword.toLowerCase())) {
            matchCount++;
            matchedKeywords.push(keyword);
          }
        }
        
        // Calculate confidence score (0-1)
        let confidence = 0;
        if (keywords.length > 0) {
          confidence = Math.min(matchCount / Math.min(5, keywords.length), 1);
        }
        
        // Only include modes with some confidence
        if (confidence > 0) {
          suggestions.push({
            mode,
            confidence,
            reason: matchedKeywords.length > 0
              ? `Contains keywords: ${matchedKeywords.slice(0, 3).join(', ')}${matchedKeywords.length > 3 ? '...' : ''}`
              : 'Based on input analysis'
          });
        }
      }
      
      // Sort by confidence (highest first) and limit to requested count
      return suggestions
        .sort((a, b) => b.confidence - a.confidence)
        .slice(0, count);
    } catch (error) {
      this.logger.error('Failed to get mode suggestions from input', { error, input });
      errorHandler.handleError(error as Error, { context: 'mode-suggestions-input' });
      return [];
    }
  }
  
  /**
   * Get mode suggestions based on file extension
   * @param fileExtension The file extension (e.g., 'js', 'py', 'html')
   * @returns The suggested mode or null if no suggestion
   */
  public getSuggestionFromFileExtension(fileExtension: string): ModeSuggestion | null {
    try {
      const ext = fileExtension.toLowerCase().replace(/^\./, '');
      
      // Map file extensions to mode IDs
      const extensionModeMap: Record<string, string> = {
        // Code files
        'js': 'code', 'ts': 'code', 'jsx': 'code', 'tsx': 'code',
        'py': 'code', 'java': 'code', 'c': 'code', 'cpp': 'code',
        'cs': 'code', 'go': 'code', 'rb': 'code', 'php': 'code',
        'swift': 'code', 'kt': 'code', 'rs': 'code',
        
        // Web files
        'html': 'code', 'css': 'code', 'scss': 'code', 'sass': 'code',
        
        // Config files
        'json': 'code', 'yaml': 'code', 'yml': 'code', 'toml': 'code',
        'xml': 'code', 'ini': 'code', 'env': 'code',
        
        // Architecture files
        'md': 'architect', 'drawio': 'architect', 'puml': 'architect',
        'plantuml': 'architect', 'uml': 'architect',
        
        // DevOps files
        'dockerfile': 'devops', 'docker-compose.yml': 'devops',
        'jenkinsfile': 'devops', 'gitlab-ci.yml': 'devops',
        'github-workflow': 'devops', 'tf': 'devops', 'tfvars': 'devops',
        
        // Test files
        'test.js': 'test', 'test.ts': 'test', 'spec.js': 'test', 'spec.ts': 'test',
        'test.py': 'test', 'test.java': 'test', 'test.go': 'test'
      };
      
      const modeId = extensionModeMap[ext];
      if (modeId) {
        const mode = modeService.getMode(modeId);
        if (mode) {
          return {
            mode,
            confidence: 0.8,
            reason: `Based on file extension .${ext}`
          };
        }
      }
      
      return null;
    } catch (error) {
      this.logger.error('Failed to get mode suggestion from file extension', { error, fileExtension });
      errorHandler.handleError(error as Error, { context: 'mode-suggestions-file' });
      return null;
    }
  }
  
  /**
   * Get mode suggestions based on user history and analytics
   * @param count The number of suggestions to return (default: 3)
   * @returns Array of mode suggestions sorted by relevance
   */
  public getSuggestionsFromHistory(count: number = 3): ModeSuggestion[] {
    try {
      const suggestions: ModeSuggestion[] = [];
      
      // Get usage statistics
      const stats = modeAnalyticsService.getAllModeStats();
      
      // Get most used mode
      const mostUsedMode = modeAnalyticsService.getMostUsedMode();
      if (mostUsedMode) {
        suggestions.push({
          mode: mostUsedMode,
          confidence: 0.9,
          reason: 'Your most frequently used mode'
        });
      }
      
      // Get recently used modes
      const recentModes = stats
        .sort((a, b) => new Date(b.lastUsed).getTime() - new Date(a.lastUsed).getTime())
        .slice(0, 3)
        .map(stat => {
          const mode = modeService.getMode(stat.modeId);
          if (!mode) return null;
          
          return {
            mode,
            confidence: 0.7,
            reason: 'Recently used'
          };
        })
        .filter(Boolean) as ModeSuggestion[];
      
      // Add recent modes to suggestions
      suggestions.push(...recentModes);
      
      // Remove duplicates and limit to requested count
      const uniqueSuggestions: ModeSuggestion[] = [];
      const seenModeIds = new Set<string>();
      
      for (const suggestion of suggestions) {
        if (!seenModeIds.has(suggestion.mode.id)) {
          seenModeIds.add(suggestion.mode.id);
          uniqueSuggestions.push(suggestion);
          
          if (uniqueSuggestions.length >= count) {
            break;
          }
        }
      }
      
      return uniqueSuggestions;
    } catch (error) {
      this.logger.error('Failed to get mode suggestions from history', { error });
      errorHandler.handleError(error as Error, { context: 'mode-suggestions-history' });
      return [];
    }
  }
}

// Export singleton instance
export const modeSuggestionsService = ModeSuggestionsService.getInstance();
