/**
 * Usage Demo for Cyber Prompt Builder
 * Demonstrates the functionality described in the README
 */

import { promptBuilderService } from './prompt-builder-service';
import { MemoryEntryType } from './layers/memory-layer';
import { enhancePrompt } from './model-router-extensions';

/**
 * Demo: Basic usage as shown in README
 */
export async function readmeBasicUsageDemo() {
  console.log('=== README Basic Usage Demo ===');
  
  // Create a system prompt
  const systemId = promptBuilderService.createSystemPrompt(
    'You are an expert TypeScript developer.'
  );
  
  // Create a task instruction
  const taskId = promptBuilderService.createTaskInstruction(
    'Create a utility function that formats dates.'
  );
  
  // Add a specific example
  promptBuilderService.addTaskExample(
    taskId,
    'formatDate(new Date(), "YYYY-MM-DD") → "2025-05-11"'
  );
  
  // Create a memory layer with context
  const memoryId = promptBuilderService.createMemoryLayer();
  promptBuilderService.addMemoryEntry(
    memoryId,
    MemoryEntryType.CODE,
    'function getISODate(date) { return date.toISOString().split("T")[0]; }',
    'project_code'
  );
  
  // Compose the prompt
  const prompt = promptBuilderService.compose();
  
  console.log('Generated prompt:');
  console.log('---');
  console.log(prompt.text);
  console.log('---');
  
  return prompt;
}

/**
 * Demo: Model Router Integration as shown in README
 */
export async function readmeModelRouterDemo() {
  console.log('\n=== README Model Router Demo ===');
  
  // Enhance a raw prompt with the builder
  const enhancedPrompt = await enhancePrompt(
    { content: 'Create a React component for a to-do list' },
    {
      isCodeTask: true,
      language: 'typescript',
      provider: 'claude'
    }
  );
  
  console.log('Enhanced prompt:');
  console.log('---');
  console.log(enhancedPrompt.content);
  console.log('---');
  console.log('Metadata:', enhancedPrompt.metadata);
  
  return enhancedPrompt;
}

/**
 * Demo: Complete prompt creation
 */
export async function readmeCompletePromptDemo() {
  console.log('\n=== README Complete Prompt Demo ===');
  
  const completePrompt = promptBuilderService.createCompletePrompt({
    systemPrompt: 'You are an expert web developer.',
    taskInstruction: 'Create a responsive navigation component.',
    memoryEntries: [
      {
        type: MemoryEntryType.CODE,
        content: 'const theme = { primary: "#007bff", secondary: "#6c757d" };',
        source: 'project_theme'
      }
    ]
  });
  
  console.log('Complete prompt:');
  console.log('---');
  console.log(completePrompt.text);
  console.log('---');
  
  return completePrompt;
}

/**
 * Run all README demos
 */
export async function runReadmeDemos() {
  try {
    await readmeBasicUsageDemo();
    await readmeModelRouterDemo();
    await readmeCompletePromptDemo();
    
    console.log('\n✅ All README demos completed successfully!');
    console.log('The Cyber Prompt Builder is working as intended!');
    
    return true;
  } catch (error) {
    console.error('❌ Demo failed:', error);
    return false;
  }
}

// Auto-run demos if this file is executed directly
if (typeof window === 'undefined' && require.main === module) {
  runReadmeDemos();
}