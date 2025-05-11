/**
 * PromptBuilder Service Implementation
 * Wrapper around the core PromptBuilder functionality that conforms to the service interface
 */

import { PromptBuilderService } from '../../core/interfaces/prompt-builder';
import { 
  PromptLayer,
  LayerPriority 
} from './interfaces/prompt-layer';
import {
  ComposedPrompt,
  LayerFilter
} from './interfaces/prompt-composition';
import { MemoryEntryType } from './layers/memory-layer';
import { ResponseFormat, ResponseTone } from './layers/user-preferences-layer';

// Import existing implementation
import { 
  builder,
  createSystemPrompt,
  createTaskInstruction,
  createMemoryLayer,
  createUserPreferences,
  createCompletePrompt as buildCompletePrompt,
  DEFAULT_SYSTEM_PROMPTS,
  TASK_INSTRUCTION_TEMPLATES,
  USER_PREFERENCE_PRESETS
} from './index';

/**
 * PromptBuilder service implementation
 * Wraps the core PromptBuilder functionality and provides a service interface
 */
export class PromptBuilderServiceImpl implements PromptBuilderService {
  /**
   * Create a system prompt layer
   */
  createSystemPrompt(content?: string, preset?: string): string {
    const validPreset = preset as keyof typeof DEFAULT_SYSTEM_PROMPTS;
    return createSystemPrompt(content, validPreset);
  }
  
  /**
   * Create a task instruction layer
   */
  createTaskInstruction(content?: string, template?: string): string {
    const validTemplate = template as keyof typeof TASK_INSTRUCTION_TEMPLATES;
    return createTaskInstruction(content, validTemplate);
  }
  
  /**
   * Create a memory layer
   */
  createMemoryLayer(content?: string): string {
    return createMemoryLayer(content);
  }
  
  /**
   * Create a user preferences layer
   */
  createUserPreferences(content?: string, preset?: string): string {
    const validPreset = preset as keyof typeof USER_PREFERENCE_PRESETS;
    return createUserPreferences(content, validPreset);
  }
  
  /**
   * Add a memory entry to a memory layer
   */
  addMemoryEntry(layerId: string, type: MemoryEntryType, content: string, source?: string): boolean {
    const layer = builder.getLayer(layerId);
    if (layer && 'addEntry' in layer) {
      const typedMemoryLayer = layer as import('./layers/memory-layer').MemoryLayer;
      typedMemoryLayer.addEntry({
        type,
        content,
        source,
        timestamp: new Date()
      });
      return true;
    }
    return false;
  }
  
  /**
   * Set user preferences for a preferences layer
   */
  setUserPreferences(layerId: string, preferences: {
    tone?: ResponseTone;
    format?: ResponseFormat;
    includeExplanations?: boolean;
    includeExamples?: boolean;
    styles?: Record<string, string>;
    customInstructions?: string;
  }): boolean {
    const layer = builder.getLayer(layerId);
    if (layer && 'setPreferences' in layer) {
      const typedPrefsLayer = layer as import('./layers/user-preferences-layer').UserPreferencesLayer;
      typedPrefsLayer.setPreferences(preferences);
      return true;
    }
    return false;
  }
  
  /**
   * Add an example to a task instruction layer
   */
  addTaskExample(layerId: string, example: string): boolean {
    const layer = builder.getLayer(layerId);
    if (layer && 'addExample' in layer) {
      const typedTaskLayer = layer as import('./layers/task-instruction-layer').TaskInstructionLayer;
      typedTaskLayer.addExample(example);
      return true;
    }
    return false;
  }
  
  /**
   * Get a layer by ID
   */
  getLayer(id: string): PromptLayer | undefined {
    return builder.getLayer(id);
  }
  
  /**
   * Compose the current layers into a prompt
   */
  compose(filter?: LayerFilter): ComposedPrompt {
    return builder.compose(filter);
  }
  
  /**
   * Create a complete prompt with all layer types
   */
  createCompletePrompt(options: {
    systemPrompt?: string;
    systemPreset?: string;
    taskInstruction?: string;
    taskTemplate?: string;
    userPreferences?: Record<string, unknown>;
    userPreset?: string;
    memoryEntries?: Array<{
      type: MemoryEntryType;
      content: string;
      source?: string;
    }>;
  }): ComposedPrompt {
    // Convert string types to the correct enum types
    const typedOptions = {
      systemPrompt: options.systemPrompt,
      systemPreset: options.systemPreset as keyof typeof DEFAULT_SYSTEM_PROMPTS,
      taskInstruction: options.taskInstruction,
      taskTemplate: options.taskTemplate as keyof typeof TASK_INSTRUCTION_TEMPLATES,
      userPreferences: options.userPreferences,
      userPreset: options.userPreset as keyof typeof USER_PREFERENCE_PRESETS,
      memoryEntries: options.memoryEntries
    };
    
    return buildCompletePrompt(typedOptions);
  }
  
  /**
   * Clear all layers
   */
  clearLayers(): void {
    builder.clearLayers();
  }
  
  /**
   * Enable or disable debug mode
   */
  setDebugMode(enabled: boolean): void {
    builder.setDebugMode(enabled);
  }
  
  /**
   * Generate a debug preview of the current prompt state
   */
  debugPreview(): string {
    return builder.debugPreview();
  }
}

/**
 * Create a new instance of the PromptBuilder service
 */
export function createPromptBuilderService(): PromptBuilderService {
  return new PromptBuilderServiceImpl();
}

// Export a singleton instance
export const promptBuilderService = createPromptBuilderService();