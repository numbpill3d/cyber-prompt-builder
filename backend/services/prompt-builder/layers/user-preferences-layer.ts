/**
 * User Preferences/Style Guide Layer Implementation
 * Represents user preferences for AI responses, styling, and behavior
 */

import { BasePromptLayer, LayerPriority, PromptLayer, PromptLayerFactory } from '../interfaces/prompt-layer';

/**
 * Tone preferences for AI responses
 */
export enum ResponseTone {
  FORMAL = 'formal',
  CASUAL = 'casual',
  TECHNICAL = 'technical',
  FRIENDLY = 'friendly',
  CONCISE = 'concise',
  DETAILED = 'detailed'
}

/**
 * Format preferences for AI responses
 */
export enum ResponseFormat {
  DEFAULT = 'default',
  BULLET_POINTS = 'bullet_points',
  NUMBERED_LIST = 'numbered_list',
  MARKDOWN = 'markdown',
  CODE_FOCUSED = 'code_focused',
  CONVERSATIONAL = 'conversational'
}

/**
 * User preference categories
 */
export interface UserPreferences {
  /**
   * Preferred tone for responses
   */
  tone?: ResponseTone;
  
  /**
   * Preferred format for responses
   */
  format?: ResponseFormat;
  
  /**
   * Maximum response length preference
   */
  maxResponseLength?: number;
  
  /**
   * Whether to include explanations
   */
  includeExplanations?: boolean;
  
  /**
   * Whether to include examples
   */
  includeExamples?: boolean;
  
  /**
   * Custom instructions
   */
  customInstructions?: string;
  
  /**
   * Custom styles
   */
  styles?: Record<string, string>;
  
  /**
   * Additional preferences
   */
  [key: string]: unknown;
}

/**
 * User preferences layer - configures AI behavior and response style
 */
export class UserPreferencesLayer extends BasePromptLayer {
  /**
   * The user's preferences
   */
  private preferences: UserPreferences;
  
  constructor(id: string, content: string = '', preferences: UserPreferences = {}, priority: number = LayerPriority.MEDIUM) {
    super(id, 'preferences', content, priority);
    this.preferences = { ...preferences };
  }
  
  /**
   * Create a clone of this layer
   */
  clone(): PromptLayer {
    const clone = new UserPreferencesLayer(this.id, this.content, { ...this.preferences }, this.priority);
    clone.enabled = this.enabled;
    return clone;
  }
  
  /**
   * Get the content with formatted preferences
   */
  override getContent(): string {
    // Start with any custom content
    let result = this.content ? `${this.content}\n\n` : '';
    
    // Add preferences section
    result += 'USER PREFERENCES:\n\n';
    
    // Add tone preference if set
    if (this.preferences.tone) {
      result += `TONE: Use a ${this.preferences.tone} tone in your responses.\n`;
    }
    
    // Add format preference if set
    if (this.preferences.format) {
      result += `FORMAT: Structure your responses using ${this.formatInstructions(this.preferences.format)}.\n`;
    }
    
    // Add length preference if set
    if (this.preferences.maxResponseLength) {
      result += `LENGTH: Keep responses under approximately ${this.preferences.maxResponseLength} words.\n`;
    }
    
    // Add explanation preference
    if (this.preferences.includeExplanations !== undefined) {
      result += `EXPLANATIONS: ${this.preferences.includeExplanations ? 'Include' : 'Avoid'} detailed explanations.\n`;
    }
    
    // Add examples preference
    if (this.preferences.includeExamples !== undefined) {
      result += `EXAMPLES: ${this.preferences.includeExamples ? 'Include' : 'Avoid'} examples in your responses.\n`;
    }
    
    // Add custom instructions if provided
    if (this.preferences.customInstructions) {
      result += `\nCUSTOM INSTRUCTIONS:\n${this.preferences.customInstructions}\n`;
    }
    
    // Add style preferences if provided
    if (this.preferences.styles && Object.keys(this.preferences.styles).length > 0) {
      result += '\nSTYLE PREFERENCES:\n';
      for (const [key, value] of Object.entries(this.preferences.styles)) {
        result += `- ${key}: ${value}\n`;
      }
    }
    
    // Add other custom preferences
    const otherPrefs = Object.entries(this.preferences)
      .filter(([key]) => !['tone', 'format', 'maxResponseLength', 'includeExplanations', 
                          'includeExamples', 'customInstructions', 'styles'].includes(key));
    
    if (otherPrefs.length > 0) {
      result += '\nADDITIONAL PREFERENCES:\n';
      for (const [key, value] of otherPrefs) {
        result += `- ${key}: ${value}\n`;
      }
    }
    
    return result;
  }
  
  /**
   * Get format instructions for a response format
   * @param format The format to get instructions for
   * @returns Formatted instructions
   */
  private formatInstructions(format: ResponseFormat): string {
    switch (format) {
      case ResponseFormat.BULLET_POINTS:
        return 'bullet points';
      case ResponseFormat.NUMBERED_LIST:
        return 'numbered lists';
      case ResponseFormat.MARKDOWN:
        return 'markdown formatting';
      case ResponseFormat.CODE_FOCUSED:
        return 'code blocks and technical explanations';
      case ResponseFormat.CONVERSATIONAL:
        return 'a conversational style';
      case ResponseFormat.DEFAULT:
      default:
        return 'a clear, well-structured format';
    }
  }
  
  /**
   * Set a preference value
   * @param key The preference key
   * @param value The preference value
   */
  setPreference<K extends keyof UserPreferences>(key: K, value: UserPreferences[K]): void {
    this.preferences[key] = value;
  }
  
  /**
   * Get a preference value
   * @param key The preference key
   * @returns The preference value
   */
  getPreference<K extends keyof UserPreferences>(key: K): UserPreferences[K] | undefined {
    return this.preferences[key];
  }
  
  /**
   * Set multiple preferences at once
   * @param preferences The preferences to set
   */
  setPreferences(preferences: Partial<UserPreferences>): void {
    this.preferences = {
      ...this.preferences,
      ...preferences
    };
  }
  
  /**
   * Get all preferences
   * @returns All preferences
   */
  getAllPreferences(): UserPreferences {
    return { ...this.preferences };
  }
  
  /**
   * Clear all preferences
   */
  clearPreferences(): void {
    this.preferences = {};
  }
}

/**
 * Factory for creating user preferences layers
 */
export class UserPreferencesLayerFactory implements PromptLayerFactory {
  createLayer(id: string, content: string, priority?: number): PromptLayer {
    return new UserPreferencesLayer(id, content, {}, priority);
  }
}

// Common user preference presets
export const USER_PREFERENCE_PRESETS = {
  DEVELOPER: {
    tone: ResponseTone.TECHNICAL,
    format: ResponseFormat.CODE_FOCUSED,
    includeExplanations: true,
    includeExamples: true,
    customInstructions: 'Focus on clean, efficient, and maintainable code. Include code comments.'
  },
  EXECUTIVE: {
    tone: ResponseTone.FORMAL,
    format: ResponseFormat.BULLET_POINTS,
    maxResponseLength: 300,
    includeExplanations: false,
    customInstructions: 'Focus on business impact, costs, and strategic implications.'
  },
  BEGINNER: {
    tone: ResponseTone.FRIENDLY,
    format: ResponseFormat.CONVERSATIONAL,
    includeExplanations: true,
    includeExamples: true,
    customInstructions: 'Avoid jargon. Explain concepts in simple terms.'
  }
};