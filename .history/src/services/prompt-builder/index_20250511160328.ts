/**
 * Prompt Builder System
 * A modular system for composing structured AI prompts
 */

// Re-export core interfaces and types
export * from './interfaces/prompt-layer';
export * from './interfaces/prompt-composition';

// Re-export the PromptBuilder service
export * from './prompt-builder';

// Re-export layer implementations
export * from './layers/system-prompt-layer';
export * from './layers/task-instruction-layer';
export * from './layers/memory-layer';
export * from './layers/user-preferences-layer';

// Import layer factories
import { SystemPromptLayerFactory, DEFAULT_SYSTEM_PROMPTS } from './layers/system-prompt-layer';
import { TaskInstructionLayerFactory, TASK_INSTRUCTION_TEMPLATES } from './layers/task-instruction-layer';
import { MemoryLayerFactory, MemoryEntryType } from './layers/memory-layer';
import { 
  UserPreferencesLayerFactory, 
  ResponseTone, 
  ResponseFormat,
  USER_PREFERENCE_PRESETS 
} from './layers/user-preferences-layer';

// Import the PromptBuilder service
import { promptBuilder, PromptBuilder } from './prompt-builder';

// Configure the default PromptBuilder instance
function configureDefaultPromptBuilder() {
  // Register layer factories
  promptBuilder.registerLayerFactory('system', new SystemPromptLayerFactory());
  promptBuilder.registerLayerFactory('task', new TaskInstructionLayerFactory());
  promptBuilder.registerLayerFactory('memory', new MemoryLayerFactory());
  promptBuilder.registerLayerFactory('preferences', new UserPreferencesLayerFactory());
  
  // Return the configured instance
  return promptBuilder;
}

// Initialize the prompt builder
export const builder = configureDefaultPromptBuilder();

/**
 * Quick-create a system prompt layer
 * @param content The system prompt content
 * @param preset Optional preset to use
 * @returns The layer ID
 */
export function createSystemPrompt(content?: string, preset?: keyof typeof DEFAULT_SYSTEM_PROMPTS): string {
  const presetContent = preset ? DEFAULT_SYSTEM_PROMPTS[preset] : '';
  return builder.createLayer('system', content || presetContent);
}

/**
 * Quick-create a task instruction layer
 * @param content The task instruction content
 * @param template Optional template to use
 * @returns The layer ID
 */
export function createTaskInstruction(content?: string, template?: keyof typeof TASK_INSTRUCTION_TEMPLATES): string {
  const templateContent = template ? TASK_INSTRUCTION_TEMPLATES[template] : '';
  return builder.createLayer('task', content || templateContent);
}

/**
 * Quick-create a memory layer
 * @param content Optional initial content
 * @returns The layer ID
 */
export function createMemoryLayer(content?: string): string {
  return builder.createLayer('memory', content || '');
}

/**
 * Quick-create a user preferences layer
 * @param content Optional initial content
 * @param preset Optional preference preset
 * @returns The layer ID
 */
export function createUserPreferences(content?: string, preset?: keyof typeof USER_PREFERENCE_PRESETS): string {
  const layerId = builder.createLayer('preferences', content || '');
  
  if (preset && USER_PREFERENCE_PRESETS[preset]) {
    const layer = builder.getLayer(layerId);
    if (layer && 'setPreferences' in layer) {
      (layer as any).setPreferences(USER_PREFERENCE_PRESETS[preset]);
    }
  }
  
  return layerId;
}

/**
 * Create a complete prompt with all layer types
 * @param options Configuration options
 * @returns The composed prompt
 */
export function createCompletePrompt(options: {
  systemPrompt?: string;
  systemPreset?: keyof typeof DEFAULT_SYSTEM_PROMPTS;
  taskInstruction?: string;
  taskTemplate?: keyof typeof TASK_INSTRUCTION_TEMPLATES;
  userPreferences?: Record<string, unknown>;
  userPreset?: keyof typeof USER_PREFERENCE_PRESETS;
  memoryEntries?: Array<{
    type: MemoryEntryType;
    content: string;
    source?: string;
  }>;
}) {
  // Clear existing layers
  builder.clearLayers();
  
  // Create system prompt layer
  const systemId = createSystemPrompt(
    options.systemPrompt, 
    options.systemPreset
  );
  
  // Create task instruction layer
  const taskId = createTaskInstruction(
    options.taskInstruction,
    options.taskTemplate
  );
  
  // Create user preferences layer
  const prefsId = createUserPreferences(
    '',
    options.userPreset
  );
  
  // Set custom preferences if provided
  if (options.userPreferences) {
    const layer = builder.getLayer(prefsId);
    if (layer && 'setPreferences' in layer) {
      (layer as any).setPreferences(options.userPreferences);
    }
  }
  
  // Create memory layer and add entries
  const memoryId = createMemoryLayer();
  if (options.memoryEntries && options.memoryEntries.length > 0) {
    const layer = builder.getLayer(memoryId);
    if (layer && 'addEntry' in layer) {
      for (const entry of options.memoryEntries) {
        (layer as any).addEntry({
          ...entry,
          timestamp: new Date()
        });
      }
    }
  }
  
  // Compose the final prompt
  return builder.compose();
}

/**
 * Example usage demonstrating the composition pipeline
 */
export function examplePromptComposition() {
  // Clear any existing layers
  builder.clearLayers();
  
  // Create system prompt (high priority)
  const systemId = builder.createLayer('system', DEFAULT_SYSTEM_PROMPTS.CODING);
  
  // Create task instruction (medium priority)
  const taskId = builder.createLayer('task', 'Implement a TypeScript function that converts a string to camelCase.');
  const taskLayer = builder.getLayer(taskId);
  if (taskLayer && 'addExample' in taskLayer) {
    (taskLayer as any).addExample('Input: "hello world" → Output: "helloWorld"');
    (taskLayer as any).addExample('Input: "user-profile-data" → Output: "userProfileData"');
  }
  
  // Create memory context (medium priority)
  const memoryId = builder.createLayer('memory');
  const memoryLayer = builder.getLayer(memoryId);
  if (memoryLayer && 'addEntry' in memoryLayer) {
    (memoryLayer as any).addEntry({
      type: MemoryEntryType.CODE,
      content: 'function kebabToCamelCase(str: string): string {\n  return str.replace(/-([a-z])/g, (_, char) => char.toUpperCase());\n}',
      source: 'user_code',
      timestamp: new Date()
    });
  }
  
  // Create user preferences (medium priority)
  const prefsId = builder.createLayer('preferences');
  const prefsLayer = builder.getLayer(prefsId);
  if (prefsLayer && 'setPreferences' in prefsLayer) {
    (prefsLayer as any).setPreferences({
      tone: ResponseTone.TECHNICAL,
      format: ResponseFormat.CODE_FOCUSED,
      includeExplanations: true,
      includeExamples: true
    });
  }
  
  // Compose the final prompt
  const composition = builder.compose();
  
  // Output debug information
  builder.setDebugMode(true);
  console.log(builder.debugPreview());
  
  return composition;
}