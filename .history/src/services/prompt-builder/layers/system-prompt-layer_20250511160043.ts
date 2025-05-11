/**
 * System Prompt Layer Implementation
 * Represents the foundational system prompt that defines the AI's capabilities
 */

import { BasePromptLayer, LayerPriority, PromptLayer, PromptLayerFactory } from '../interfaces/prompt-layer';

/**
 * System prompt layer - defines core capabilities and constraints
 */
export class SystemPromptLayer extends BasePromptLayer {
  constructor(id: string, content: string, priority: number = LayerPriority.HIGH) {
    super(id, 'system', content, priority);
  }
  
  /**
   * Create a clone of this layer
   */
  clone(): PromptLayer {
    const clone = new SystemPromptLayer(this.id, this.content, this.priority);
    clone.enabled = this.enabled;
    return clone;
  }

  /**
   * Add a capability to the system prompt
   * @param capability The capability description to add
   */
  addCapability(capability: string): void {
    this.content += `\n- ${capability}`;
  }

  /**
   * Add a constraint to the system prompt
   * @param constraint The constraint description to add
   */
  addConstraint(constraint: string): void {
    this.content += `\n- MUST NOT ${constraint}`;
  }
}

/**
 * Factory for creating system prompt layers
 */
export class SystemPromptLayerFactory implements PromptLayerFactory {
  createLayer(id: string, content: string, priority?: number): PromptLayer {
    return new SystemPromptLayer(id, content, priority);
  }
}

// Default system prompts for different use cases
export const DEFAULT_SYSTEM_PROMPTS = {
  GENERAL: "You are a helpful, harmless, and honest AI assistant.",
  CODING: "You are an expert software engineer with deep knowledge of programming languages, frameworks, and best practices.",
  CREATIVE: "You are a creative AI assistant with a talent for generating imaginative and original content.",
  ACADEMIC: "You are a knowledgeable AI research assistant with expertise in academic subjects and formal writing."
};