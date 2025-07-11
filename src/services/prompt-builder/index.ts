/**
 * Prompt Builder Service
 * Main entry point for the prompt builder system
 */

export * from './interfaces/prompt-layer';
export * from './interfaces/prompt-composition';
export * from './layers/system-prompt-layer';
export * from './layers/task-instruction-layer';
export * from './layers/memory-layer';
export * from './layers/user-preferences-layer';
export * from './prompt-builder';
export * from './prompt-builder-service';

// Re-export the main builder instance and convenience functions
import { promptBuilderService } from './prompt-builder-service';
import { LayerPriority } from './interfaces/prompt-layer';
import { DEFAULT_SYSTEM_PROMPTS } from './layers/system-prompt-layer';
import { TASK_INSTRUCTION_TEMPLATES } from './layers/task-instruction-layer';
import { USER_PREFERENCE_PRESETS } from './layers/user-preferences-layer';

// Main builder instance
export const builder = promptBuilderService;

/**
 * Convenience function to create a system prompt layer
 */
export function createSystemPrompt(content?: string, preset?: keyof typeof DEFAULT_SYSTEM_PROMPTS): string {
  return builder.createSystemPrompt(content, preset);
}

/**
 * Convenience function to create a task instruction layer
 */
export function createTaskInstruction(content?: string, template?: keyof typeof TASK_INSTRUCTION_TEMPLATES): string {
  return builder.createTaskInstruction(content, template);
}

/**
 * Convenience function to create a memory layer
 */
export function createMemoryLayer(content?: string): string {
  return builder.createMemoryLayer(content);
}

/**
 * Convenience function to create a user preferences layer
 */
export function createUserPreferences(content?: string, preset?: keyof typeof USER_PREFERENCE_PRESETS): string {
  return builder.createUserPreferences(content, preset);
}

/**
 * Convenience function to compose the current prompt
 */
export function compose() {
  return builder.compose();
}

/**
 * Create a complete prompt with all layer types
 */
export function createCompletePrompt(options: {
  systemPrompt?: string;
  systemPreset?: keyof typeof DEFAULT_SYSTEM_PROMPTS;
  taskInstruction?: string;
  taskTemplate?: keyof typeof TASK_INSTRUCTION_TEMPLATES;
  userPreferences?: Record<string, unknown>;
  userPreset?: keyof typeof USER_PREFERENCE_PRESETS;
  memoryEntries?: Array<{
    type: import('./layers/memory-layer').MemoryEntryType;
    content: string;
    source?: string;
  }>;
}) {
  return builder.createCompletePrompt(options);
}

/**
 * Export presets and templates
 */
export { DEFAULT_SYSTEM_PROMPTS, TASK_INSTRUCTION_TEMPLATES, USER_PREFERENCE_PRESETS };

/**
 * Export LayerPriority for external use
 */
export { LayerPriority };