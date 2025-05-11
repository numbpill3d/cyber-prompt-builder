/**
 * PromptBuilder Provider Integrations
 * Utilities for integrating the PromptBuilder with AI providers
 */

import { ComposedPrompt } from './interfaces/prompt-composition';
import { AIPrompt } from '../providers/providers';
import { MemoryEntryType } from './layers/memory-layer';
import { ResponseFormat, ResponseTone } from './layers/user-preferences-layer';
import { promptBuilderService } from './prompt-builder-service';

/**
 * Provider-specific format options
 */
export interface ProviderFormatOptions {
  /**
   * Include system instructions with specific format
   */
  systemInstructionsFormat?: 'prefix' | 'separate';
  
  /**
   * Apply provider-specific structural changes
   */
  structureFormat?: 'basic' | 'chat' | 'custom';
  
  /**
   * Add specific markers around sections
   */
  addSectionMarkers?: boolean;
  
  /**
   * Custom post-processing function for provider-specific modifications
   */
  postProcess?: (text: string) => string;
}

/**
 * Convert a composed prompt to an AIPrompt for provider consumption
 */
export function toProviderPrompt(
  composedPrompt: ComposedPrompt,
  options: ProviderFormatOptions = {}
): AIPrompt {
  // Extract the composed text
  const { text } = composedPrompt;
  
  // Apply provider-specific post-processing if provided
  const processedText = options.postProcess 
    ? options.postProcess(text)
    : text;
  
  // Create the provider prompt
  return {
    content: processedText,
  };
}

/**
 * Convert a composed prompt to a Claude-specific format
 */
export function toClaudePrompt(composedPrompt: ComposedPrompt): AIPrompt {
  return toProviderPrompt(composedPrompt, {
    systemInstructionsFormat: 'separate',
    addSectionMarkers: true,
    postProcess: (text) => {
      // Claude-specific formatting tweaks
      return text
        .replace(/\n{3,}/g, '\n\n') // Normalize multiple line breaks
        .trim();
    }
  });
}

/**
 * Convert a composed prompt to an OpenAI-specific format
 */
export function toOpenAIPrompt(composedPrompt: ComposedPrompt): AIPrompt {
  return toProviderPrompt(composedPrompt, {
    systemInstructionsFormat: 'separate',
    structureFormat: 'chat',
    postProcess: (text) => {
      // OpenAI-specific formatting tweaks
      return text
        .replace(/\n{3,}/g, '\n\n') // Normalize multiple line breaks
        .trim();
    }
  });
}

/**
 * Convert a composed prompt to a Gemini-specific format
 */
export function toGeminiPrompt(composedPrompt: ComposedPrompt): AIPrompt {
  return toProviderPrompt(composedPrompt, {
    systemInstructionsFormat: 'prefix',
    postProcess: (text) => {
      // Gemini-specific formatting tweaks
      return text
        .replace(/\n{3,}/g, '\n\n') // Normalize multiple line breaks
        .trim();
    }
  });
}

/**
 * Build a complete prompt for code generation
 */
export function buildCodeGenerationPrompt(options: {
  task: string;
  language: string;
  provider: 'claude' | 'openai' | 'gemini';
  context?: string;
  examples?: string[];
  preferences?: {
    tone?: ResponseTone;
    format?: ResponseFormat;
    includeExplanations?: boolean;
    includeExamples?: boolean;
  }
}): AIPrompt {
  // Clear previous layers
  promptBuilderService.clearLayers();
  
  // Create a system prompt
  promptBuilderService.createSystemPrompt(
    `You are an expert ${options.language} developer focused on writing clean, maintainable code.`,
    'CODING'
  );
  
  // Create a task instruction
  const taskId = promptBuilderService.createTaskInstruction(
    `Generate ${options.language} code for the following task: ${options.task}`
  );
  
  // Add examples if provided
  if (options.examples && options.examples.length > 0) {
    for (const example of options.examples) {
      promptBuilderService.addTaskExample(taskId, example);
    }
  }
  
  // Create a memory layer if context is provided
  if (options.context) {
    const memoryId = promptBuilderService.createMemoryLayer();
    promptBuilderService.addMemoryEntry(
      memoryId,
      MemoryEntryType.CODE,
      options.context,
      'project_context'
    );
  }
  
  // Set user preferences
  const prefsId = promptBuilderService.createUserPreferences();
  promptBuilderService.setUserPreferences(prefsId, {
    tone: options.preferences?.tone || ResponseTone.TECHNICAL,
    format: options.preferences?.format || ResponseFormat.CODE_FOCUSED,
    includeExplanations: options.preferences?.includeExplanations ?? true,
    includeExamples: options.preferences?.includeExamples ?? true,
    styles: {
      'code': options.language,
      'comments': 'standard',
      'naming': 'idiomatic'
    }
  });
  
  // Compose the prompt
  const composedPrompt = promptBuilderService.compose();
  
  // Convert to provider-specific format
  switch (options.provider) {
    case 'claude':
      return toClaudePrompt(composedPrompt);
    case 'openai':
      return toOpenAIPrompt(composedPrompt);
    case 'gemini':
      return toGeminiPrompt(composedPrompt);
    default:
      return toProviderPrompt(composedPrompt);
  }
}

/**
 * Build a complete prompt for text generation
 */
export function buildTextGenerationPrompt(options: {
  task: string;
  provider: 'claude' | 'openai' | 'gemini';
  context?: string;
  style?: 'technical' | 'creative' | 'academic' | 'casual';
  preferences?: {
    tone?: ResponseTone;
    format?: ResponseFormat;
    includeExplanations?: boolean;
    includeExamples?: boolean;
  }
}): AIPrompt {
  // Clear previous layers
  promptBuilderService.clearLayers();
  
  // Map style to system preset
  let systemPreset: string;
  switch (options.style) {
    case 'technical':
      systemPreset = 'CODING';
      break;
    case 'creative':
      systemPreset = 'CREATIVE';
      break;
    case 'academic':
      systemPreset = 'ACADEMIC';
      break;
    default:
      systemPreset = 'GENERAL';
  }
  
  // Create a system prompt
  promptBuilderService.createSystemPrompt(undefined, systemPreset);
  
  // Create a task instruction
  promptBuilderService.createTaskInstruction(options.task);
  
  // Create a memory layer if context is provided
  if (options.context) {
    const memoryId = promptBuilderService.createMemoryLayer();
    promptBuilderService.addMemoryEntry(
      memoryId,
      MemoryEntryType.TEXT,
      options.context,
      'user_context'
    );
  }
  
  // Set user preferences
  const prefsId = promptBuilderService.createUserPreferences();
  promptBuilderService.setUserPreferences(prefsId, {
    tone: options.preferences?.tone || ResponseTone.BALANCED,
    format: options.preferences?.format || ResponseFormat.TEXT,
    includeExplanations: options.preferences?.includeExplanations ?? true,
    includeExamples: options.preferences?.includeExamples ?? false
  });
  
  // Compose the prompt
  const composedPrompt = promptBuilderService.compose();
  
  // Convert to provider-specific format
  switch (options.provider) {
    case 'claude':
      return toClaudePrompt(composedPrompt);
    case 'openai':
      return toOpenAIPrompt(composedPrompt);
    case 'gemini':
      return toGeminiPrompt(composedPrompt);
    default:
      return toProviderPrompt(composedPrompt);
  }
}