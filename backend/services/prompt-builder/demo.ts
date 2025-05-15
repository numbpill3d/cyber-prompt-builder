/**
 * Demonstration of the PromptBuilder System
 * Shows practical usage of the modular prompt composition
 */

import { 
  builder, 
  createSystemPrompt,
  createTaskInstruction, 
  createMemoryLayer,
  createUserPreferences
} from './index';

import { LayerPriority } from './interfaces/prompt-layer';
import { ResponseTone, ResponseFormat } from './layers/user-preferences-layer';
import { MemoryEntryType } from './layers/memory-layer';
import { SimpleLayerFilter } from './interfaces/prompt-composition';

/**
 * Run a complete demonstration of the PromptBuilder system
 */
export function runPromptBuilderDemo() {
  console.log('=== PROMPT BUILDER DEMONSTRATION ===\n');
  
  // Clear any existing layers
  builder.clearLayers();
  builder.setDebugMode(true);
  
  console.log('Step 1: Creating a system prompt layer');
  const systemId = createSystemPrompt(
    'You are an expert TypeScript developer focused on building clean, modular, and maintainable code.',
  );
  console.log(`Created system layer with ID: ${systemId}`);
  
  console.log('\nStep 2: Creating a task instruction layer');
  const taskId = createTaskInstruction(
    'Create a utility function that formats dates in a customizable way.'
  );
  
  // Get the task layer to add examples
  const taskLayer = builder.getLayer(taskId);
  if (taskLayer && 'addExample' in taskLayer) {
    const typedTaskLayer = taskLayer as import('./layers/task-instruction-layer').TaskInstructionLayer;
    typedTaskLayer.addExample('formatDate(new Date(), "YYYY-MM-DD") → "2025-05-11"');
    typedTaskLayer.addExample('formatDate(new Date(), "MM/DD/YYYY") → "05/11/2025"');
    console.log('Added examples to task layer');
  }
  
  console.log('\nStep 3: Creating a memory/context layer');
  const memoryId = createMemoryLayer();
  
  // Add context entries
  const memoryLayer = builder.getLayer(memoryId);
  if (memoryLayer && 'addEntry' in memoryLayer) {
    const typedMemoryLayer = memoryLayer as import('./layers/memory-layer').MemoryLayer;
    
    // Add code context
    typedMemoryLayer.addEntry({
      type: MemoryEntryType.CODE,
      content: 
`// Example of an existing date helper
export function getFormattedDate(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return \`\${year}-\${month}-\${day}\`;
}`,
      source: 'project_codebase',
      timestamp: new Date()
    });
    
    // Add user preference context
    typedMemoryLayer.addEntry({
      type: MemoryEntryType.USER_PREFERENCE,
      content: 'The user prefers using the Intl.DateTimeFormat API when appropriate for better internationalization support.',
      source: 'user_history',
      timestamp: new Date()
    });
    
    console.log('Added memory entries for context');
  }
  
  console.log('\nStep 4: Creating a user preferences layer');
  const prefsId = createUserPreferences();
  
  // Configure user preferences
  const prefsLayer = builder.getLayer(prefsId);
  if (prefsLayer && 'setPreferences' in prefsLayer) {
    const typedPrefsLayer = prefsLayer as import('./layers/user-preferences-layer').UserPreferencesLayer;
    typedPrefsLayer.setPreferences({
      tone: ResponseTone.TECHNICAL,
      format: ResponseFormat.CODE_FOCUSED,
      includeExplanations: true,
      includeExamples: true,
      styles: {
        'code': 'TypeScript',
        'comments': 'JSDoc style',
        'naming': 'camelCase'
      },
      customInstructions: 'Include TypeScript type definitions. Consider edge cases. Add some unit tests.'
    });
    console.log('Configured user preferences');
  }
  
  console.log('\nStep 5: Composing the prompt');
  // Compose the prompt with all layers
  const composedPrompt = builder.compose();
  
  console.log(`Composed prompt with ${composedPrompt.layers.length} layers and approximately ${composedPrompt.tokenEstimate} tokens`);
  
  // Display debug info
  console.log('\nFull debug preview:');
  console.log(builder.debugPreview());
  
  console.log('\nStep 6: Modifying layer priority');
  // Update task layer to higher priority
  const updatedTaskLayer = builder.getLayer(taskId);
  if (updatedTaskLayer && 'update' in updatedTaskLayer) {
    const typedTaskLayer = updatedTaskLayer as import('./interfaces/prompt-layer').MutablePromptLayer;
    typedTaskLayer.update({ priority: LayerPriority.CRITICAL });
    console.log('Updated task layer to CRITICAL priority');
  }
  
  console.log('\nStep 7: Creating a filtered prompt');
  // Create a filter for only system and task layers
  const filter = new SimpleLayerFilter(layer => 
    layer.type === 'system' || layer.type === 'task'
  );
  
  // Compose with the filter
  const filteredPrompt = builder.compose(filter);
  console.log(`Created filtered prompt with only ${filteredPrompt.layers.length} layers (system and task only)`);
  
  return {
    fullPrompt: composedPrompt,
    filteredPrompt: filteredPrompt
  };
}

// If this file is executed directly, run the demo
if (require.main === module) {
  runPromptBuilderDemo();
}