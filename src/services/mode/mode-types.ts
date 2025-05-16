/**
 * Mode Types
 * Defines types for the Mode system that allows switching between different operational personas
 */

import { ResponseFormat, ResponseTone } from '../prompt-builder/layers/user-preferences-layer';

/**
 * Mode interface - represents an operational persona
 */
export interface Mode {
  id: string;
  name: string;
  description: string;
  icon: string; // Icon name from Lucide icons
  systemPrompt: string;
  userPreferences: {
    tone: ResponseTone;
    format: ResponseFormat;
    includeExplanations: boolean;
    includeExamples: boolean;
    customInstructions?: string;
  };
  isCustom?: boolean;
  customSettings?: Record<string, any>;
}

/**
 * Mode settings in app configuration
 */
export interface ModeSettings {
  activeMode: string;
  modes: {
    [key: string]: Mode;
  };
  customModes: {
    [key: string]: Mode;
  };
}

/**
 * Default modes
 */
export const DEFAULT_MODES: Record<string, Mode> = {
  code: {
    id: 'code',
    name: 'Code Mode',
    description: 'Default behavior for writing and editing code',
    icon: 'Code',
    systemPrompt: 'You are an expert software engineer focused on writing clean, maintainable code. Prioritize code quality, readability, and best practices.',
    userPreferences: {
      tone: ResponseTone.TECHNICAL,
      format: ResponseFormat.CODE_FOCUSED,
      includeExplanations: true,
      includeExamples: true,
      customInstructions: 'Focus on writing efficient, well-documented code with appropriate error handling.'
    }
  },
  architect: {
    id: 'architect',
    name: 'Architect Mode',
    description: 'Focuses on system design, directory structure, and tech stacks',
    icon: 'Building2',
    systemPrompt: 'You are a software architect specializing in system design, application structure, and technology selection. Focus on scalability, maintainability, and following architectural best practices.',
    userPreferences: {
      tone: ResponseTone.TECHNICAL,
      format: ResponseFormat.MARKDOWN,
      includeExplanations: true,
      includeExamples: true,
      customInstructions: 'Provide detailed explanations of architectural decisions, trade-offs, and recommended directory structures.'
    }
  },
  ask: {
    id: 'ask',
    name: 'Ask Mode',
    description: 'For codebase queries and explanations',
    icon: 'HelpCircle',
    systemPrompt: 'You are a helpful assistant specializing in explaining code concepts and answering questions about programming. Focus on clear explanations and educational content.',
    userPreferences: {
      tone: ResponseTone.FRIENDLY,
      format: ResponseFormat.MARKDOWN,
      includeExplanations: true,
      includeExamples: true,
      customInstructions: 'Provide thorough explanations with examples when possible. Break down complex concepts into simpler parts.'
    }
  }
};
