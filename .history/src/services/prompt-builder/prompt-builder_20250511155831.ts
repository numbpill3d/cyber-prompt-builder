/**
 * Core PromptBuilder service
 * Manages and composes different prompt layers
 */

import { v4 as uuidv4 } from 'uuid';
import { 
  PromptLayer, 
  LayerPriority, 
  MutablePromptLayer,
  PromptLayerFactory
} from './interfaces/prompt-layer';
import {
  ComposedPrompt,
  CompositionStrategy,
  LayerFilter,
  CompositionConfig,
  SimpleLayerFilter,
  TokenEstimator
} from './interfaces/prompt-composition';

/**
 * Default token estimator (rough approximation)
 * @param text Text to estimate tokens for
 * @returns Estimated token count
 */
const defaultTokenEstimator: TokenEstimator = (text: string): number => {
  // Rough approximation: 4 characters per token
  return Math.ceil(text.length / 4);
};

/**
 * Basic priority-based composition strategy
 */
export class PriorityCompositionStrategy implements CompositionStrategy {
  name = 'priority-based';
  
  compose(layers: PromptLayer[]): ComposedPrompt {
    const startTime = performance.now();
    // Filter enabled layers and sort by priority (highest first)
    const enabledLayers = layers
      .filter(layer => layer.enabled)
      .sort((a, b) => b.priority - a.priority);
    
    // Compose the prompt text by joining layer contents
    const text = enabledLayers
      .map(layer => layer.getContent().trim())
      .filter(content => content.length > 0)
      .join('\n\n');
    
    // Calculate time taken
    const endTime = performance.now();
    
    return {
      text,
      layers: enabledLayers,
      tokenEstimate: defaultTokenEstimator(text),
      metadata: {
        composedAt: new Date(),
        compositionTimeMs: endTime - startTime,
        excludedLayers: layers.filter(layer => !layer.enabled)
      }
    };
  }
}