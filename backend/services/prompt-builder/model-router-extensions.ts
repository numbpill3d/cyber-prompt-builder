/**
 * ModelRouter Extensions for PromptBuilder
 * Enhances the ModelRouter with PromptBuilder capabilities
 */

import { AIPrompt } from '../providers/providers';
import { modelRouter } from '../model-router';
import { promptBuilderService } from './prompt-builder-service';
import { 
  buildCodeGenerationPrompt, 
  buildTextGenerationPrompt,
  toClaudePrompt,
  toOpenAIPrompt,
  toGeminiPrompt
} from './provider-integration';
import { MemoryEntryType } from './layers/memory-layer';
import { LayerPriority, MutablePromptLayer } from './interfaces/prompt-layer';
import { SimpleLayerFilter } from './interfaces/prompt-composition';
import { settingsManager } from '../settings-manager';

// Type for supported providers
type SupportedProvider = 'claude' | 'openai' | 'gemini';

/**
 * Enhance a prompt using the PromptBuilder system
 * Rewrites the given prompt with improved structure and context
 * @param prompt The original prompt to enhance
 * @param options Enhancement options
 * @returns Enhanced prompt
 */
export async function enhancePrompt(
  prompt: AIPrompt, 
  options: {
    isCodeTask?: boolean;
    language?: string;
    includePrevContext?: boolean;
    optimizationLevel?: 'basic' | 'advanced';
    provider?: string;
  } = {}
): Promise<AIPrompt> {
  // Create appropriate prompt based on task type
  let enhancedPrompt: AIPrompt;
  
  // Clear existing layers
  promptBuilderService.clearLayers();
  
  // Convert provider to supported type with fallback
  const providerType = (options.provider || 'claude') as SupportedProvider;
  
  if (options.isCodeTask) {
    // Use code generation prompt builder
    enhancedPrompt = buildCodeGenerationPrompt({
      task: prompt.content,
      language: options.language || 'typescript',
      provider: providerType,
      context: prompt.context,
    });
  } else {
    // Use text generation prompt builder
    enhancedPrompt = buildTextGenerationPrompt({
      task: prompt.content,
      provider: providerType,
      context: prompt.context,
      style: 'technical',
    });
  }
  
  return enhancedPrompt;
}

/**
 * Extend the ModelRouter with PromptBuilder capabilities
 * This patches the optimization method to use PromptBuilder when appropriate
 */
export function extendModelRouterWithPromptBuilder() {
  // Store original method reference
  const originalOptimizeMethod = modelRouter.optimizePromptForProvider.bind(modelRouter);
  
  // Override the optimize method
  modelRouter.optimizePromptForProvider = async (provider: string, prompt: AIPrompt): Promise<AIPrompt> => {
    const routingOptions = modelRouter.getRoutingOptions();
    
    // Determine if we should use the prompt builder enhancement
    const shouldUsePromptBuilder = (): boolean => {
      // Settings check (if a setting exists that enables this feature)
      const settings = settingsManager.getAppSettings();
      const promptBuilderEnabled = settings?.features?.usePromptBuilder !== false;
      
      // Don't use for very simple prompts
      const isSimplePrompt = prompt.content.length < 100 && !prompt.context;
      
      return promptBuilderEnabled && !isSimplePrompt;
    };
    
    // Only use PromptBuilder for complex tasks if enabled
    if (shouldUsePromptBuilder() && 
        (routingOptions.promptComplexity === 'medium' || routingOptions.promptComplexity === 'high')) {
      console.log('Using PromptBuilder for prompt optimization');
      
      // Detect if this is a code-related task
      const isCodeTask = /code|function|class|implement|programming|algorithm/i.test(prompt.content);
      
      return enhancePrompt(prompt, {
        isCodeTask,
        language: routingOptions.languageSpecific,
        provider
      });
    }
    
    // Fall back to original optimization method
    return originalOptimizeMethod(provider, prompt);
  };
  
  console.log('ModelRouter extended with PromptBuilder capabilities');
}

/**
 * Convert a raw prompt directly to an optimized prompt using PromptBuilder
 * @param prompt The original prompt to optimize
 * @param provider Target provider
 * @param language Optional programming language
 * @returns Optimized prompt
 */
export function optimizeWithPromptBuilder(
  prompt: AIPrompt, 
  provider: string, 
  language?: string
): AIPrompt {
  // Clear existing layers
  promptBuilderService.clearLayers();
  
  // Create a system prompt
  promptBuilderService.createSystemPrompt(undefined, 'CODING');
  
  // Create a task instruction layer with high priority
  const taskId = promptBuilderService.createTaskInstruction(prompt.content);
  const taskLayer = promptBuilderService.getLayer(taskId);
  if (taskLayer && 'update' in taskLayer) {
    const mutableLayer = taskLayer as MutablePromptLayer;
    mutableLayer.update({ priority: LayerPriority.HIGH });
  }
  
  // Create a memory layer with the context if available
  if (prompt.context) {
    const memoryId = promptBuilderService.createMemoryLayer();
    promptBuilderService.addMemoryEntry(
      memoryId,
      MemoryEntryType.TEXT,
      prompt.context,
      'context'
    );
  }
  
  // Compose the prompt
  const composedPrompt = promptBuilderService.compose();
  
  // Convert to provider-specific format
  switch (provider) {
    case 'claude':
      return toClaudePrompt(composedPrompt);
    case 'openai':
      return toOpenAIPrompt(composedPrompt);
    case 'gemini':
      return toGeminiPrompt(composedPrompt);
    default:
      return {
        content: composedPrompt.text,
        context: prompt.context
      };
  }
}

/**
 * Apply the extension to the ModelRouter when this module is imported
 */
extendModelRouterWithPromptBuilder();