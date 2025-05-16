/**
 * Mode Integration with Prompt Builder
 * Connects the Mode system with the Prompt Builder to apply mode-specific templates
 */

import { modeService } from '../mode/mode-service';
import { Mode } from '../mode/mode-types';
import { 
  builder, 
  createSystemPrompt, 
  createTaskInstruction, 
  createUserPreferences 
} from './index';
import { ResponseFormat, ResponseTone } from './layers/user-preferences-layer';

/**
 * Apply mode to prompt builder
 * Sets up the prompt builder with the current mode's settings
 */
export function applyModeToPromptBuilder(): void {
  const activeMode = modeService.getActiveMode();
  
  if (!activeMode) {
    console.warn('No active mode found, using default settings');
    return;
  }
  
  // Clear existing layers
  builder.clearLayers();
  
  // Apply system prompt from mode
  const systemId = createSystemPrompt(activeMode.systemPrompt);
  
  // Create user preferences layer
  const prefsId = createUserPreferences();
  
  // Set preferences from mode
  builder.setLayerContent(prefsId, JSON.stringify(activeMode.userPreferences));
  
  console.log(`Applied mode "${activeMode.name}" to prompt builder`);
}

/**
 * Create a task instruction with mode-specific context
 * @param taskContent The task instruction content
 * @returns The layer ID
 */
export function createModeAwareTaskInstruction(taskContent: string): string {
  const activeMode = modeService.getActiveMode();
  
  // Create task instruction layer
  const taskId = createTaskInstruction(taskContent);
  
  // Add mode-specific context if available
  if (activeMode && activeMode.customSettings?.taskPrefix) {
    const currentContent = builder.getLayerContent(taskId);
    const updatedContent = `${activeMode.customSettings.taskPrefix}\n\n${currentContent}`;
    builder.setLayerContent(taskId, updatedContent);
  }
  
  return taskId;
}

/**
 * Build a complete prompt with mode-specific settings
 * @param options Configuration options
 */
export function buildModeAwarePrompt(options: {
  taskInstruction: string;
  additionalContext?: string;
}): string {
  // Apply current mode settings
  applyModeToPromptBuilder();
  
  // Create task instruction
  createModeAwareTaskInstruction(options.taskInstruction);
  
  // Add additional context if provided
  if (options.additionalContext) {
    const contextId = builder.createLayer('context', options.additionalContext);
    builder.setLayerPriority(contextId, 50); // Medium priority
  }
  
  // Compose the prompt
  const composedPrompt = builder.compose();
  
  return composedPrompt.text;
}

/**
 * Subscribe to mode changes to update prompt builder
 */
export function initializeModeIntegration(): void {
  // Apply current mode on initialization
  applyModeToPromptBuilder();
  
  // Subscribe to mode changes
  modeService.onModeChange((event) => {
    console.log(`Mode changed from ${event.previousMode} to ${event.currentMode}`);
    applyModeToPromptBuilder();
  });
}

/**
 * Get mode-specific prompt template
 * @param modeId The mode ID to get template for (defaults to active mode)
 */
export function getModePromptTemplate(modeId?: string): string {
  const mode = modeId 
    ? modeService.getMode(modeId) 
    : modeService.getActiveMode();
  
  if (!mode) {
    return 'You are a helpful AI assistant.';
  }
  
  return mode.systemPrompt;
}

/**
 * Get mode-specific user preferences
 * @param modeId The mode ID to get preferences for (defaults to active mode)
 */
export function getModeUserPreferences(modeId?: string): {
  tone: ResponseTone;
  format: ResponseFormat;
  includeExplanations: boolean;
  includeExamples: boolean;
  customInstructions?: string;
} {
  const mode = modeId 
    ? modeService.getMode(modeId) 
    : modeService.getActiveMode();
  
  if (!mode) {
    return {
      tone: ResponseTone.BALANCED,
      format: ResponseFormat.DEFAULT,
      includeExplanations: true,
      includeExamples: false
    };
  }
  
  return mode.userPreferences;
}
