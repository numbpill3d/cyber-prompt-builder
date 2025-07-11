/**
 * System Prompt Layer
 * Handles system-level instructions and context
 */

import { BasePromptLayer, LayerPriority } from '../interfaces/prompt-layer';

/**
 * System prompt layer implementation
 */
export class SystemPromptLayer extends BasePromptLayer {
  constructor(id: string, content: string = '') {
    super(id, 'system', content, LayerPriority.CRITICAL);
  }

  clone(): SystemPromptLayer {
    return new SystemPromptLayer(this.id, this.content);
  }

  /**
   * Set system prompt with validation
   */
  setSystemPrompt(prompt: string): void {
    if (!prompt || typeof prompt !== 'string') {
      throw new Error('System prompt must be a non-empty string');
    }
    this.setContent(prompt);
  }

  /**
   * Get formatted system prompt
   */
  getContent(): string {
    const content = super.getContent();
    if (!content) {
      return 'You are a helpful AI assistant.';
    }
    return content;
  }
}

/**
 * Create a system prompt layer
 */
export function createSystemPromptLayer(id: string, content?: string): SystemPromptLayer {
  return new SystemPromptLayer(id, content);
}