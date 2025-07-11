/**
 * Prompt Composition Interfaces
 * Defines how prompt layers are composed together
 */

import { PromptLayer } from './prompt-layer';

/**
 * Result of composing prompt layers
 */
export interface ComposedPrompt {
  /**
   * The final composed prompt text
   */
  text: string;
  
  /**
   * Metadata about the composition
   */
  metadata: Record<string, unknown>;
}

/**
 * Filter function for selecting layers during composition
 */
export type LayerFilter = (layer: PromptLayer) => boolean;

/**
 * Composition strategy interface
 */
export interface CompositionStrategy {
  /**
   * Name of the composition strategy
   */
  name: string;
  
  /**
   * Compose layers using this strategy
   * @param layers Array of layers to compose
   * @returns Composed prompt result
   */
  compose(layers: PromptLayer[]): ComposedPrompt;
}

/**
 * Simple composition strategy that concatenates layers by priority
 */
export class SimpleCompositionStrategy implements CompositionStrategy {
  name = 'simple';
  
  compose(layers: PromptLayer[]): ComposedPrompt {
    // Filter enabled layers
    const enabledLayers = layers.filter(layer => layer.enabled);
    
    // Sort by priority (highest first)
    const sortedLayers = enabledLayers.sort((a, b) => b.priority - a.priority);
    
    // Compose text
    const sections: string[] = [];
    sortedLayers.forEach(layer => {
      const content = layer.getContent();
      if (content && content.trim()) {
        sections.push(content.trim());
      }
    });
    
    return {
      text: sections.join('\n\n'),
      metadata: {
        strategy: this.name,
        layerCount: sortedLayers.length,
        layers: sortedLayers.map(layer => ({
          id: layer.id,
          type: layer.type,
          priority: layer.priority
        }))
      }
    };
  }
}

/**
 * Structured composition strategy that organizes layers by type
 */
export class StructuredCompositionStrategy implements CompositionStrategy {
  name = 'structured';
  
  compose(layers: PromptLayer[]): ComposedPrompt {
    // Filter enabled layers
    const enabledLayers = layers.filter(layer => layer.enabled);
    
    // Group by type
    const layersByType = new Map<string, PromptLayer[]>();
    enabledLayers.forEach(layer => {
      if (!layersByType.has(layer.type)) {
        layersByType.set(layer.type, []);
      }
      layersByType.get(layer.type)!.push(layer);
    });
    
    // Define type order
    const typeOrder = ['system', 'task', 'memory', 'user_preferences'];
    const sections: string[] = [];
    
    typeOrder.forEach(type => {
      const typeLayers = layersByType.get(type);
      if (typeLayers && typeLayers.length > 0) {
        // Sort by priority within type
        const sortedTypeLayers = typeLayers.sort((a, b) => b.priority - a.priority);
        
        sortedTypeLayers.forEach(layer => {
          const content = layer.getContent();
          if (content && content.trim()) {
            sections.push(content.trim());
          }
        });
      }
    });
    
    // Add any remaining types not in the predefined order
    layersByType.forEach((typeLayers, type) => {
      if (!typeOrder.includes(type)) {
        const sortedTypeLayers = typeLayers.sort((a, b) => b.priority - a.priority);
        sortedTypeLayers.forEach(layer => {
          const content = layer.getContent();
          if (content && content.trim()) {
            sections.push(content.trim());
          }
        });
      }
    });
    
    return {
      text: sections.join('\n\n'),
      metadata: {
        strategy: this.name,
        layerCount: enabledLayers.length,
        typeGroups: Array.from(layersByType.keys()),
        layers: enabledLayers.map(layer => ({
          id: layer.id,
          type: layer.type,
          priority: layer.priority
        }))
      }
    };
  }
}

/**
 * Composition options
 */
export interface CompositionOptions {
  /**
   * Strategy to use for composition
   */
  strategy?: CompositionStrategy;
  
  /**
   * Filter to apply to layers before composition
   */
  filter?: LayerFilter;
  
  /**
   * Maximum length of the composed prompt
   */
  maxLength?: number;
  
  /**
   * Whether to include metadata in the result
   */
  includeMetadata?: boolean;
}

/**
 * Default composition options
 */
export const DEFAULT_COMPOSITION_OPTIONS: CompositionOptions = {
  strategy: new SimpleCompositionStrategy(),
  includeMetadata: true
};