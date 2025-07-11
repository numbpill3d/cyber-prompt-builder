/**
 * Core Prompt Builder Implementation
 * Manages prompt layers and composition
 */

import { PromptLayer, LayerPriority, BasePromptLayer } from './interfaces/prompt-layer';
import { ComposedPrompt, LayerFilter } from './interfaces/prompt-composition';

/**
 * Simple prompt layer implementation
 */
class SimplePromptLayer extends BasePromptLayer {
  constructor(id: string, type: string, content: string = '', priority: number = LayerPriority.MEDIUM) {
    super(id, type, content, priority);
  }

  clone(): PromptLayer {
    return new SimplePromptLayer(this.id, this.type, this.content, this.priority);
  }
}

/**
 * Core prompt builder class
 */
export class PromptBuilder {
  private layers: Map<string, PromptLayer> = new Map();
  private debugMode: boolean = false;

  /**
   * Create a new layer
   */
  createLayer(type: string, content: string, priority: number = LayerPriority.MEDIUM): string {
    const id = `${type}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const layer = new SimplePromptLayer(id, type, content, priority);
    this.layers.set(id, layer);
    
    if (this.debugMode) {
      console.log(`Created layer: ${id} (${type})`);
    }
    
    return id;
  }

  /**
   * Get a layer by ID
   */
  getLayer(id: string): PromptLayer | undefined {
    return this.layers.get(id);
  }

  /**
   * Remove a layer
   */
  removeLayer(id: string): boolean {
    return this.layers.delete(id);
  }

  /**
   * Clear all layers
   */
  clearLayers(): void {
    this.layers.clear();
    
    if (this.debugMode) {
      console.log('Cleared all layers');
    }
  }

  /**
   * Get all layers
   */
  getAllLayers(): PromptLayer[] {
    return Array.from(this.layers.values());
  }

  /**
   * Compose layers into a prompt
   */
  compose(filter?: LayerFilter): ComposedPrompt {
    let layers = Array.from(this.layers.values());
    
    // Apply filter if provided
    if (filter) {
      layers = layers.filter(filter);
    }

    // Filter enabled layers
    layers = layers.filter(layer => layer.enabled);

    // Sort by priority (highest first)
    layers.sort((a, b) => b.priority - a.priority);

    // Compose the prompt text
    const sections: string[] = [];
    const metadata: Record<string, unknown> = {
      layerCount: layers.length,
      layers: layers.map(layer => ({
        id: layer.id,
        type: layer.type,
        priority: layer.priority
      }))
    };

    layers.forEach(layer => {
      const content = layer.getContent();
      if (content && content.trim()) {
        sections.push(content.trim());
      }
    });

    const text = sections.join('\n\n');

    if (this.debugMode) {
      console.log(`Composed prompt with ${layers.length} layers, ${text.length} characters`);
    }

    return {
      text,
      metadata
    };
  }

  /**
   * Enable or disable debug mode
   */
  setDebugMode(enabled: boolean): void {
    this.debugMode = enabled;
  }

  /**
   * Generate debug preview
   */
  debugPreview(): string {
    const layers = Array.from(this.layers.values());
    const preview: string[] = [];
    
    preview.push(`=== Prompt Builder Debug Preview ===`);
    preview.push(`Total layers: ${layers.length}`);
    preview.push('');

    layers
      .sort((a, b) => b.priority - a.priority)
      .forEach(layer => {
        preview.push(`Layer: ${layer.id}`);
        preview.push(`  Type: ${layer.type}`);
        preview.push(`  Priority: ${layer.priority}`);
        preview.push(`  Enabled: ${layer.enabled}`);
        preview.push(`  Content: ${layer.getContent().substring(0, 100)}${layer.getContent().length > 100 ? '...' : ''}`);
        preview.push('');
      });

    const composed = this.compose();
    preview.push(`=== Composed Prompt (${composed.text.length} chars) ===`);
    preview.push(composed.text);

    return preview.join('\n');
  }
}

// Export singleton instance
export const promptBuilder = new PromptBuilder();