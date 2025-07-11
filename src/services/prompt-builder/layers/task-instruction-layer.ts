/**
 * Task Instruction Layer
 * Handles specific task instructions and examples
 */

import { BasePromptLayer, LayerPriority } from '../interfaces/prompt-layer';

/**
 * Task instruction layer implementation
 */
export class TaskInstructionLayer extends BasePromptLayer {
  private examples: string[] = [];

  constructor(id: string, content: string = '') {
    super(id, 'task', content, LayerPriority.HIGH);
  }

  clone(): TaskInstructionLayer {
    const cloned = new TaskInstructionLayer(this.id, this.content);
    cloned.examples = [...this.examples];
    return cloned;
  }

  /**
   * Add an example to the task instruction
   */
  addExample(example: string): void {
    if (example && typeof example === 'string') {
      this.examples.push(example.trim());
    }
  }

  /**
   * Remove an example
   */
  removeExample(index: number): void {
    if (index >= 0 && index < this.examples.length) {
      this.examples.splice(index, 1);
    }
  }

  /**
   * Get all examples
   */
  getExamples(): string[] {
    return [...this.examples];
  }

  /**
   * Clear all examples
   */
  clearExamples(): void {
    this.examples = [];
  }

  /**
   * Get formatted content with examples
   */
  getContent(): string {
    const baseContent = super.getContent();
    const parts: string[] = [];

    if (baseContent) {
      parts.push(baseContent);
    }

    if (this.examples.length > 0) {
      parts.push('Examples:');
      this.examples.forEach((example, index) => {
        parts.push(`${index + 1}. ${example}`);
      });
    }

    return parts.join('\n');
  }
}

/**
 * Create a task instruction layer
 */
export function createTaskInstructionLayer(id: string, content?: string): TaskInstructionLayer {
  return new TaskInstructionLayer(id, content);
}