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

/**
 * Core PromptBuilder service
 */
export class PromptBuilder {
  /**
   * All registered prompt layers
   */
  private layers: Map<string, PromptLayer> = new Map();
  
  /**
   * The composition configuration
   */
  private config: CompositionConfig;
  
  /**
   * Layer factories by type
   */
  private factories: Map<string, PromptLayerFactory> = new Map();
  
  /**
   * Debug mode status
   */
  private debugMode = false;
  
  /**
   * Create a new PromptBuilder instance
   * @param config Optional composition configuration
   */
  constructor(config?: Partial<CompositionConfig>) {
    // Set default configuration
    this.config = {
      strategy: new PriorityCompositionStrategy(),
      tokenEstimator: defaultTokenEstimator,
      deterministicOrder: true,
      maxTokens: 4000,
      ...config
    };
  }
  
  /**
   * Register a layer factory for a specific type
   * @param type Layer type
   * @param factory Factory function for creating layers of this type
   */
  registerLayerFactory(type: string, factory: PromptLayerFactory): void {
    this.factories.set(type, factory);
  }
  
  /**
   * Create a new layer of the specified type
   * @param type Layer type
   * @param content Layer content
   * @param priority Optional priority (defaults to MEDIUM)
   * @returns The created layer ID
   */
  createLayer(type: string, content: string, priority: number = LayerPriority.MEDIUM): string {
    const factory = this.factories.get(type);
    if (!factory) {
      throw new Error(`No factory registered for layer type: ${type}`);
    }
    
    const id = uuidv4();
    const layer = factory.createLayer(id, content, priority);
    this.addLayer(layer);
    return id;
  }
  
  /**
   * Add a layer to the builder
   * @param layer The layer to add
   */
  addLayer(layer: PromptLayer): void {
    this.layers.set(layer.id, layer);
    this.debugLog(`Added layer: ${layer.id} (${layer.type})`);
  }
  
  /**
   * Get a layer by ID
   * @param id Layer ID
   * @returns The layer or undefined if not found
   */
  getLayer(id: string): PromptLayer | undefined {
    return this.layers.get(id);
  }
  
  /**
   * Get all layers
   * @returns Array of all layers
   */
  getAllLayers(): PromptLayer[] {
    return Array.from(this.layers.values());
  }
  
  /**
   * Remove a layer by ID
   * @param id Layer ID
   * @returns True if the layer was removed
   */
  removeLayer(id: string): boolean {
    const result = this.layers.delete(id);
    if (result) {
      this.debugLog(`Removed layer: ${id}`);
    }
    return result;
  }
  
  /**
   * Clear all layers
   */
  clearLayers(): void {
    this.layers.clear();
    this.debugLog('Cleared all layers');
  }
  
  /**
   * Update a layer's content
   * @param id Layer ID
   * @param content New content
   * @returns True if the layer was updated
   */
  updateLayerContent(id: string, content: string): boolean {
    const layer = this.layers.get(id);
    if (!layer) return false;
    
    layer.setContent(content);
    this.debugLog(`Updated content for layer: ${id}`);
    return true;
  }
  
  /**
   * Enable or disable a layer
   * @param id Layer ID
   * @param enabled Whether the layer should be enabled
   * @returns True if the layer was updated
   */
  setLayerEnabled(id: string, enabled: boolean): boolean {
    const layer = this.layers.get(id);
    if (!layer) return false;
    
    if (layer instanceof MutablePromptLayer) {
      layer.update({ enabled });
      this.debugLog(`${enabled ? 'Enabled' : 'Disabled'} layer: ${id}`);
      return true;
    }
    
    return false;
  }
  
  /**
   * Find layers matching a filter
   * @param filter The filter to apply
   * @returns Matching layers
   */
  findLayers(filter: LayerFilter): PromptLayer[] {
    return this.getAllLayers().filter(layer => filter.matches(layer));
  }
  
  /**
   * Find layers by type
   * @param type The layer type to find
   * @returns Matching layers
   */
  findLayersByType(type: string): PromptLayer[] {
    return this.findLayers(SimpleLayerFilter.byType(type));
  }
  
  /**
   * Compose the current layers into a prompt
   * @param filter Optional filter to select specific layers
   * @returns The composed prompt
   */
  compose(filter?: LayerFilter): ComposedPrompt {
    let layers = this.getAllLayers();
    
    // Apply filter if provided
    if (filter) {
      layers = layers.filter(layer => filter.matches(layer));
    }
    
    // Compose using the configured strategy
    const result = this.config.strategy.compose(layers);
    
    this.debugLog(`Composed prompt with ${result.layers.length} layers, ${result.tokenEstimate} tokens`);
    return result;
  }
  
  /**
   * Set the composition strategy
   * @param strategy The new strategy to use
   */
  setCompositionStrategy(strategy: CompositionStrategy): void {
    this.config.strategy = strategy;
    this.debugLog(`Set composition strategy to: ${strategy.name}`);
  }
  
  /**
   * Set the token estimator
   * @param estimator The new estimator to use
   */
  setTokenEstimator(estimator: TokenEstimator): void {
    this.config.tokenEstimator = estimator;
    this.debugLog('Updated token estimator');
  }
  
  /**
   * Set the maximum token limit
   * @param maxTokens The new token limit
   */
  setMaxTokens(maxTokens: number): void {
    this.config.maxTokens = maxTokens;
    this.debugLog(`Set max tokens to: ${maxTokens}`);
  }
  
  /**
   * Enable or disable debug mode
   * @param enabled Whether debug mode should be enabled
   */
  setDebugMode(enabled: boolean): void {
    this.debugMode = enabled;
    console.log(`PromptBuilder debug mode: ${enabled ? 'ON' : 'OFF'}`);
  }
  
  /**
   * Get current debug mode status
   * @returns Whether debug mode is enabled
   */
  isDebugMode(): boolean {
    return this.debugMode;
  }
  
  /**
   * Generate a debug preview of the current prompt state
   * @returns Debug information about layers and composition
   */
  debugPreview(): string {
    const allLayers = this.getAllLayers();
    const composed = this.compose();
    
    let output = '=== PROMPT BUILDER DEBUG ===\n\n';
    
    // Overview
    output += `Total layers: ${allLayers.length}\n`;
    output += `Enabled layers: ${allLayers.filter(l => l.enabled).length}\n`;
    output += `Composition strategy: ${this.config.strategy.name}\n`;
    output += `Estimated tokens: ${composed.tokenEstimate}\n`;
    output += `Max tokens: ${this.config.maxTokens}\n\n`;
    
    // Layer details
    output += '=== LAYERS ===\n\n';
    
    const sortedLayers = [...allLayers].sort((a, b) => b.priority - a.priority);
    
    for (const layer of sortedLayers) {
      output += `ID: ${layer.id}\n`;
      output += `Type: ${layer.type}\n`;
      output += `Priority: ${layer.priority}\n`;
      output += `Enabled: ${layer.enabled}\n`;
      output += `Content (${Math.ceil(layer.getContent().length / 4)} tokens):\n`;
      output += '---\n';
      output += layer.getContent().substring(0, 100) + (layer.getContent().length > 100 ? '...' : '');
      output += '\n---\n\n';
    }
    
    // Composed preview
    output += '=== COMPOSED PROMPT PREVIEW ===\n\n';
    output += composed.text.substring(0, 200) + (composed.text.length > 200 ? '...' : '');
    output += '\n\n';
    
    output += `=== END DEBUG (${new Date().toISOString()}) ===`;
    
    return output;
  }
  
  /**
   * Log a debug message if debug mode is enabled
   * @param message The message to log
   */
  private debugLog(message: string): void {
    if (this.debugMode) {
      console.log(`[PromptBuilder] ${message}`);
    }
  }
}

/**
 * Create a singleton instance of the PromptBuilder
 */
export const promptBuilder = new PromptBuilder();