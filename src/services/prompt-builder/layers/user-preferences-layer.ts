/**
 * User Preferences Layer
 * Handles user preferences for response tone, format, and behavior
 */

import { PromptLayer, LayerPriority } from '../interfaces/prompt-layer';

/**
 * Response tone options
 */
export enum ResponseTone {
  PROFESSIONAL = 'professional',
  FRIENDLY = 'friendly',
  TECHNICAL = 'technical',
  CASUAL = 'casual',
  FORMAL = 'formal',
  ANALYTICAL = 'analytical',
  METHODICAL = 'methodical'
}

/**
 * Response format options
 */
export enum ResponseFormat {
  DEFAULT = 'default',
  STRUCTURED = 'structured',
  CONVERSATIONAL = 'conversational',
  STEP_BY_STEP = 'step_by_step',
  CODE_FOCUSED = 'code_focused',
  BULLET_POINTS = 'bullet_points'
}

/**
 * User preferences configuration
 */
export interface UserPreferences {
  tone: ResponseTone;
  format: ResponseFormat;
  includeExplanations: boolean;
  includeExamples: boolean;
  customInstructions?: string;
}

/**
 * User Preferences Layer implementation
 */
export class UserPreferencesLayer extends import('../interfaces/prompt-layer').BasePromptLayer {
  private preferences: UserPreferences;

  constructor(id: string, preferences: UserPreferences) {
    super(id, 'user_preferences', '', import('../interfaces/prompt-layer').LayerPriority.MEDIUM);
    this.preferences = { ...preferences };
  }
  
  /**
   * Create a clone of this layer
   */
  clone(): import('../interfaces/prompt-layer').PromptLayer {
    const clone = new UserPreferencesLayer(this.id, this.preferences);
    clone.enabled = this.enabled;
    clone.priority = this.priority;
    return clone;
  }

  /**
   * Get the layer content as a formatted string
   */
  getContent(): string {
    const parts: string[] = [];

    // Add tone instruction
    parts.push(this.getToneInstruction());

    // Add format instruction
    parts.push(this.getFormatInstruction());

    // Add explanation preference
    if (this.preferences.includeExplanations) {
      parts.push('Always provide clear explanations for your reasoning and decisions.');
    }

    // Add examples preference
    if (this.preferences.includeExamples) {
      parts.push('Include relevant examples to illustrate your points when appropriate.');
    }

    // Add custom instructions
    if (this.preferences.customInstructions) {
      parts.push(`Additional instructions: ${this.preferences.customInstructions}`);
    }

    return parts.join('\n');
  }

  /**
   * Set the layer content (expects JSON string of preferences)
   */
  override setContent(content: string): void {
    try {
      const parsed = JSON.parse(content);
      this.updatePreferences(parsed);
    } catch (error) {
      console.warn('Failed to parse user preferences content:', error);
    }
  }

  /**
   * Update user preferences
   */
  updatePreferences(newPreferences: Partial<UserPreferences>): void {
    this.preferences = { ...this.preferences, ...newPreferences };
  }
  
  /**
   * Set user preferences (alias for updatePreferences)
   */
  setPreferences(newPreferences: Partial<UserPreferences>): void {
    this.updatePreferences(newPreferences);
  }

  /**
   * Get current preferences
   */
  getPreferences(): UserPreferences {
    return { ...this.preferences };
  }

  /**
   * Get tone instruction based on selected tone
   */
  private getToneInstruction(): string {
    switch (this.preferences.tone) {
      case ResponseTone.PROFESSIONAL:
        return 'Maintain a professional and business-appropriate tone in all responses.';
      case ResponseTone.FRIENDLY:
        return 'Use a friendly, approachable, and conversational tone.';
      case ResponseTone.TECHNICAL:
        return 'Use precise technical language appropriate for developers and technical professionals.';
      case ResponseTone.CASUAL:
        return 'Keep the tone casual and relaxed, as if talking to a colleague.';
      case ResponseTone.FORMAL:
        return 'Maintain a formal and respectful tone throughout the interaction.';
      case ResponseTone.ANALYTICAL:
        return 'Approach responses with an analytical mindset, focusing on logic and systematic thinking.';
      case ResponseTone.METHODICAL:
        return 'Be methodical and systematic in your approach, breaking down complex topics step by step.';
      default:
        return 'Maintain an appropriate and helpful tone.';
    }
  }

  /**
   * Get format instruction based on selected format
   */
  private getFormatInstruction(): string {
    switch (this.preferences.format) {
      case ResponseFormat.STRUCTURED:
        return 'Structure your responses with clear headings, sections, and organized information.';
      case ResponseFormat.CONVERSATIONAL:
        return 'Format responses in a natural, conversational style.';
      case ResponseFormat.STEP_BY_STEP:
        return 'Break down complex processes into clear, numbered steps.';
      case ResponseFormat.CODE_FOCUSED:
        return 'Focus on code examples and technical implementation details.';
      case ResponseFormat.BULLET_POINTS:
        return 'Use bullet points and lists to organize information clearly.';
      case ResponseFormat.DEFAULT:
      default:
        return 'Format responses in a clear and readable manner.';
    }
  }
}

/**
 * Factory for creating user preferences layers
 */
export class UserPreferencesLayerFactory implements import('../interfaces/prompt-layer').PromptLayerFactory {
  createLayer(id: string, content: string, priority?: number): import('../interfaces/prompt-layer').PromptLayer {
    // Parse content as JSON if it's a string, otherwise use defaults
    let preferences: UserPreferences;
    try {
      preferences = content ? JSON.parse(content) : DEFAULT_USER_PREFERENCES;
    } catch {
      preferences = DEFAULT_USER_PREFERENCES;
    }
    return new UserPreferencesLayer(id, preferences);
  }
}

/**
 * Create a new user preferences layer
 */
export function createUserPreferencesLayer(
  id: string,
  preferences: UserPreferences
): UserPreferencesLayer {
  return new UserPreferencesLayer(id, preferences);
}

/**
 * Default user preferences
 */
export const DEFAULT_USER_PREFERENCES: UserPreferences = {
  tone: ResponseTone.TECHNICAL,
  format: ResponseFormat.DEFAULT,
  includeExplanations: true,
  includeExamples: false
};

/**
 * Predefined user preference presets
 */
export const USER_PREFERENCE_PRESETS = {
  DEVELOPER: {
    tone: ResponseTone.TECHNICAL,
    format: ResponseFormat.CODE_FOCUSED,
    includeExplanations: true,
    includeExamples: true
  },
  BEGINNER: {
    tone: ResponseTone.FRIENDLY,
    format: ResponseFormat.STEP_BY_STEP,
    includeExplanations: true,
    includeExamples: true
  },
  PROFESSIONAL: {
    tone: ResponseTone.PROFESSIONAL,
    format: ResponseFormat.STRUCTURED,
    includeExplanations: true,
    includeExamples: false
  },
  CASUAL: {
    tone: ResponseTone.CASUAL,
    format: ResponseFormat.CONVERSATIONAL,
    includeExplanations: false,
    includeExamples: true
  }
};