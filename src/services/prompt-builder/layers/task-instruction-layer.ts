/**
 * Task Instruction Layer Implementation
 * Represents specific instructions for a task the AI is expected to perform
 */

import { BasePromptLayer, LayerPriority, PromptLayer, PromptLayerFactory } from '../interfaces/prompt-layer';

/**
 * Task instruction layer - defines what the AI should do for a specific task
 */
export class TaskInstructionLayer extends BasePromptLayer {
  /**
   * Examples provided for the task
   */
  private examples: string[] = [];
  
  constructor(id: string, content: string, priority: number = LayerPriority.MEDIUM) {
    super(id, 'task', content, priority);
  }
  
  /**
   * Create a clone of this layer
   */
  clone(): PromptLayer {
    const clone = new TaskInstructionLayer(this.id, this.content, this.priority);
    clone.enabled = this.enabled;
    clone.examples = [...this.examples];
    return clone;
  }
  
  /**
   * Get the task instruction with examples
   */
  override getContent(): string {
    let fullContent = this.content;
    
    // Add examples if present
    if (this.examples.length > 0) {
      fullContent += '\n\nExamples:\n' + this.examples.map(ex => `- ${ex}`).join('\n');
    }
    
    return fullContent;
  }
  
  /**
   * Add an example for the task
   * @param example The example to add
   */
  addExample(example: string): void {
    this.examples.push(example);
  }
  
  /**
   * Clear all examples
   */
  clearExamples(): void {
    this.examples = [];
  }
  
  /**
   * Get just the examples
   */
  getExamples(): string[] {
    return [...this.examples];
  }
  
  /**
   * Create a task with "step by step" instructions
   * @param steps The steps to include
   * @returns The updated content
   */
  formatAsStepByStep(steps: string[]): string {
    const stepContent = steps.map((step, i) => `${i + 1}. ${step}`).join('\n');
    this.content = `${this.content}\n\nPlease follow these steps:\n${stepContent}`;
    return this.content;
  }
}

/**
 * Factory for creating task instruction layers
 */
export class TaskInstructionLayerFactory implements PromptLayerFactory {
  createLayer(id: string, content: string, priority?: number): PromptLayer {
    return new TaskInstructionLayer(id, content, priority);
  }
}

// Common task instruction patterns
export const TASK_INSTRUCTION_TEMPLATES = {
  SUMMARIZE: "Summarize the following text concisely while retaining all key information.",
  CODE_REVIEW: "Review the following code and suggest improvements for readability, performance, and security.",
  EXPLAIN: "Explain the following concept in simple terms that would be understandable to a non-expert.",
  COMPARE: "Compare and contrast the following items, highlighting their similarities and differences.",
  BRAINSTORM: "Generate creative ideas related to the following topic."
};