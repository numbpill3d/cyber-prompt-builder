/**
 * Integration test for the Prompt Builder system
 * This file demonstrates and tests the complete functionality
 */

import { promptBuilderService } from './prompt-builder-service';
import { MemoryEntryType } from './layers/memory-layer';
import { ResponseTone, ResponseFormat } from './layers/user-preferences-layer';
import { enhancePrompt } from './model-router-extensions';

/**
 * Test the basic prompt builder functionality
 */
export async function testBasicPromptBuilder() {
  console.log('=== Testing Basic Prompt Builder ===');
  
  // Clear any existing layers
  promptBuilderService.clearLayers();
  
  // Create a system prompt
  const systemId = promptBuilderService.createSystemPrompt(
    'You are an expert TypeScript developer.'
  );
  console.log('Created system prompt:', systemId);
  
  // Create a task instruction
  const taskId = promptBuilderService.createTaskInstruction(
    'Create a utility function that formats dates.'
  );
  console.log('Created task instruction:', taskId);
  
  // Add an example
  const exampleAdded = promptBuilderService.addTaskExample(
    taskId,
    'formatDate(new Date(), "YYYY-MM-DD") → "2025-05-11"'
  );
  console.log('Added example:', exampleAdded);
  
  // Create a memory layer
  const memoryId = promptBuilderService.createMemoryLayer();
  console.log('Created memory layer:', memoryId);
  
  // Add memory entries
  const memoryAdded = promptBuilderService.addMemoryEntry(
    memoryId,
    MemoryEntryType.CODE,
    'function getISODate(date) { return date.toISOString().split("T")[0]; }',
    'project_code'
  );
  console.log('Added memory entry:', memoryAdded);
  
  // Create user preferences
  const prefsId = promptBuilderService.createUserPreferences();
  console.log('Created user preferences:', prefsId);
  
  // Set preferences
  const prefsSet = promptBuilderService.setUserPreferences(prefsId, {
    tone: ResponseTone.TECHNICAL,
    format: ResponseFormat.CODE_FOCUSED,
    includeExplanations: true,
    includeExamples: true
  });
  console.log('Set preferences:', prefsSet);
  
  // Compose the prompt
  const composed = promptBuilderService.compose();
  console.log('Composed prompt:');
  console.log('---');
  console.log(composed.text);
  console.log('---');
  console.log('Token estimate:', composed.tokenEstimate);
  console.log('Layer count:', composed.layers.length);
  
  return composed;
}

/**
 * Test the complete prompt creation functionality
 */
export async function testCompletePromptCreation() {
  console.log('\n=== Testing Complete Prompt Creation ===');
  
  const completePrompt = promptBuilderService.createCompletePrompt({
    systemPrompt: 'You are a helpful coding assistant.',
    taskInstruction: 'Help me create a React component.',
    memoryEntries: [
      {
        type: MemoryEntryType.CODE,
        content: 'import React from "react";',
        source: 'existing_project'
      }
    ]
  });
  
  console.log('Complete prompt:');
  console.log('---');
  console.log(completePrompt.text);
  console.log('---');
  console.log('Token estimate:', completePrompt.tokenEstimate);
  
  return completePrompt;
}

/**
 * Test the model router extensions
 */
export async function testModelRouterExtensions() {
  console.log('\n=== Testing Model Router Extensions ===');
  
  const enhanced = await enhancePrompt(
    { content: 'Create a TypeScript function to validate email addresses' },
    {
      isCodeTask: true,
      language: 'typescript',
      provider: 'claude',
      includeMemory: true,
      sessionId: 'test-session'
    }
  );
  
  console.log('Enhanced prompt:');
  console.log('---');
  console.log(enhanced.content);
  console.log('---');
  console.log('Metadata:', enhanced.metadata);
  
  return enhanced;
}

/**
 * Test debug functionality
 */
export async function testDebugFunctionality() {
  console.log('\n=== Testing Debug Functionality ===');
  
  // Enable debug mode
  promptBuilderService.setDebugMode(true);
  
  // Create some layers
  promptBuilderService.clearLayers();
  promptBuilderService.createSystemPrompt('Debug test system prompt');
  promptBuilderService.createTaskInstruction('Debug test task');
  
  // Get debug preview
  const debugInfo = promptBuilderService.debugPreview();
  console.log('Debug preview:');
  console.log(debugInfo);
  
  // Disable debug mode
  promptBuilderService.setDebugMode(false);
  
  return debugInfo;
}

/**
 * Run all tests
 */
export async function runAllTests() {
  try {
    await testBasicPromptBuilder();
    await testCompletePromptCreation();
    await testModelRouterExtensions();
    await testDebugFunctionality();
    
    console.log('\n✅ All tests completed successfully!');
    return true;
  } catch (error) {
    console.error('❌ Test failed:', error);
    return false;
  }
}

// Export for use in other modules
export {
  testBasicPromptBuilder,
  testCompletePromptCreation,
  testModelRouterExtensions,
  testDebugFunctionality
};