/**
 * Prompt Builder Interface
 * Defines the contract for the prompt builder service
 */

import { ComposedPrompt, LayerFilter } from '../../services/prompt-builder/interfaces/prompt-composition';
import { PromptLayer } from '../../services/prompt-builder/interfaces/prompt-layer';
import { MemoryEntryType } from '../../services/prompt-builder/layers/memory-layer';
import { ResponseFormat, ResponseTone } from '../../services/prompt-builder/layers/user-preferences-layer';

/**
 * Interface for the PromptBuilder service
 */
export interface PromptBuilderService {
  /**
   * Create a system prompt layer
   * @param content The system prompt content
   * @param preset Optional preset to use
   * @returns The layer ID
   */
  createSystemPrompt(content?: string, preset?: string): string;
  
  /**
   * Create a task instruction layer
   * @param content The task instruction content
   * @param template Optional template to use
   * @returns The layer ID
   */
  createTaskInstruction(content?: string, template?: string): string;
  
  /**
   * Create a memory/context layer
   * @param content Optional initial content
   * @returns The layer ID
   */
  createMemoryLayer(content?: string): string;
  
  /**
   * Create a user preferences layer
   * @param content Optional initial content
   * @param preset Optional preference preset
   * @returns The layer ID
   */
  createUserPreferences(content?: string, preset?: string): string;
  
  /**
   * Add a memory entry to a memory layer
   * @param layerId The memory layer ID
   * @param type The type of memory entry
   * @param content The content of the entry
   * @param source Optional source information
   * @returns True if successful
   */
  addMemoryEntry(layerId: string, type: MemoryEntryType, content: string, source?: string): boolean;
  
  /**
   * Set user preferences for a preferences layer
   * @param layerId The preferences layer ID
   * @param preferences The preference settings
   * @returns True if successful
   */
  setUserPreferences(layerId: string, preferences: {
    tone?: ResponseTone;
    format?: ResponseFormat;
    includeExplanations?: boolean;
    includeExamples?: boolean;
    styles?: Record<string, string>;
    customInstructions?: string;
  }): boolean;
  
  /**
   * Add an example to a task instruction layer
   * @param layerId The task layer ID
   * @param example The example to add
   * @returns True if successful
   */
  addTaskExample(layerId: string, example: string): boolean;
  
  /**
   * Get a layer by ID
   * @param id Layer ID
   * @returns The layer or undefined if not found
   */
  getLayer(id: string): PromptLayer | undefined;
  
  /**
   * Compose the current layers into a prompt
   * @param filter Optional filter to select specific layers
   * @returns The composed prompt
   */
  compose(filter?: LayerFilter): ComposedPrompt;
  
  /**
   * Create a complete prompt with all layer types
   * @param options Configuration options
   * @returns The composed prompt
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
  }): ComposedPrompt;
  
  /**
   * Clear all layers
   */
  clearLayers(): void;
  
  /**
   * Enable or disable debug mode
   * @param enabled Whether debug mode should be enabled
   */
  setDebugMode(enabled: boolean): void;
  
  /**
   * Generate a debug preview of the current prompt state
   * @returns Debug information about layers and composition
   */
  debugPreview(): string;
}