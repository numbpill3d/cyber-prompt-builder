/**
 * Interfaces for prompt composition and layer manipulation
 */

import { PromptLayer } from './prompt-layer';

/**
 * Interface for a composed prompt
 */
export interface ComposedPrompt {
  /**
   * The fully composed prompt text
   */
  text: string;
  
  /**
   * The layers that were used in composition
   */
  layers: PromptLayer[];
  
  /**
   * Total token estimate for the composed prompt
   */
  tokenEstimate: number;
  
  /**
   * Additional metadata about the composition
   */
  metadata: {
    /**
     * Timestamp when the prompt was composed
     */
    composedAt: Date;
    
    /**
     * Time taken to compose in milliseconds
     */
    compositionTimeMs?: number;
    
    /**
     * Any layers that were excluded from composition
     */
    excludedLayers?: PromptLayer[];
    
    /**
     * Additional composition metadata
     */
    [key: string]: unknown;
  };
}

/**
 * Strategy for composing layers into a prompt
 */
export interface CompositionStrategy {
  /**
   * Name of the strategy
   */
  name: string;
  
  /**
   * Compose multiple layers into a single prompt
   * @param layers The layers to compose
   * @returns The composed prompt
   */
  compose(layers: PromptLayer[]): ComposedPrompt;
}

/**
 * Format function for a layer
 */
export type LayerFormatter = (layer: PromptLayer) => string;

/**
 * Token estimator function
 */
export type TokenEstimator = (text: string) => number;

/**
 * Configuration for a prompt composition
 */
export interface CompositionConfig {
  /**
   * The composition strategy to use
   */
  strategy: CompositionStrategy;
  
  /**
   * Optional custom formatters for specific layer types
   */
  formatters?: Map<string, LayerFormatter>;
  
  /**
   * Function to estimate token count of text
   */
  tokenEstimator?: TokenEstimator;
  
  /**
   * Maximum token limit for the composed prompt
   */
  maxTokens?: number;
  
  /**
   * Should composition be done in a deterministic order
   */
  deterministicOrder?: boolean;
}

/**
 * Interface for filtering layers
 */
export interface LayerFilter {
  /**
   * Test if a layer matches this filter
   * @param layer The layer to test
   * @returns True if the layer matches
   */
  matches(layer: PromptLayer): boolean;
}

/**
 * Simple implementation of a layer filter
 */
export class SimpleLayerFilter implements LayerFilter {
  constructor(private predicate: (layer: PromptLayer) => boolean) {}
  
  matches(layer: PromptLayer): boolean {
    return this.predicate(layer);
  }
  
  /**
   * Create a filter for layers of a specific type
   * @param type The layer type to match
   * @returns A filter for the specified type
   */
  static byType(type: string): LayerFilter {
    return new SimpleLayerFilter(layer => layer.type === type);
  }
  
  /**
   * Create a filter for layers with a minimum priority
   * @param minPriority The minimum priority to match
   * @returns A filter for the specified priority threshold
   */
  static byMinPriority(minPriority: number): LayerFilter {
    return new SimpleLayerFilter(layer => layer.priority >= minPriority);
  }
}