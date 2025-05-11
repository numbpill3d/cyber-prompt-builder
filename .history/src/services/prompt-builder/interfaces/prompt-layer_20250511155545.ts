/**
 * Core interfaces for prompt layers
 */

/**
 * Priority levels for prompt layers
 * Higher values represent higher priority in the composition
 */
export enum LayerPriority {
  LOW = 100,
  MEDIUM = 500,
  HIGH = 900,
  CRITICAL = 1000
}

/**
 * Base interface for all prompt layers
 */
export interface PromptLayer {
  /**
   * Unique identifier for the layer
   */
  id: string;
  
  /**
   * Type of the layer
   */
  type: string;
  
  /**
   * Priority level for composition ordering
   * Higher priority layers will be composed first
   */
  priority: number;
  
  /**
   * Whether this layer is enabled
   */
  enabled: boolean;
  
  /**
   * Get the content of this layer
   * @returns The layer content string
   */
  getContent(): string;
  
  /**
   * Set or update the content of this layer
   * @param content The new content
   */
  setContent(content: string): void;
  
  /**
   * Clone this layer
   * @returns A new instance of this layer with the same properties
   */
  clone(): PromptLayer;
}

/**
 * Interface for layers that can be dynamically mutated
 */
export interface MutablePromptLayer extends PromptLayer {
  /**
   * Modify the layer content using a transformer function
   * @param transformer Function that receives current content and returns modified content 
   */
  transform(transformer: (content: string) => string): void;
  
  /**
   * Update layer metadata/properties
   * @param updates Partial updates to apply to the layer
   */
  update(updates: Partial<Omit<PromptLayer, 'clone' | 'getContent' | 'setContent'>>): void;
}

/**
 * A basic layer implementation with standard functionality
 */
export abstract class BasePromptLayer implements MutablePromptLayer {
  id: string;
  type: string;
  priority: number;
  enabled: boolean;
  protected content: string;
  
  constructor(id: string, type: string, content: string = '', priority: number = LayerPriority.MEDIUM) {
    this.id = id;
    this.type = type;
    this.content = content;
    this.priority = priority;
    this.enabled = true;
  }
  
  getContent(): string {
    return this.content;
  }
  
  setContent(content: string): void {
    this.content = content;
  }
  
  transform(transformer: (content: string) => string): void {
    this.content = transformer(this.content);
  }
  
  update(updates: Partial<Omit<PromptLayer, 'clone' | 'getContent' | 'setContent'>>): void {
    Object.assign(this, updates);
  }
  
  abstract clone(): PromptLayer;
}

/**
 * Metadata for a prompt layer
 */
export interface PromptLayerMetadata {
  /**
   * Timestamp when the layer was created
   */
  created: Date;
  
  /**
   * Timestamp when the layer was last modified
   */
  lastModified: Date;
  
  /**
   * Source of this layer (user, system, etc.)
   */
  source?: string;
  
  /**
   * Additional custom metadata
   */
  [key: string]: unknown;
}

/**
 * Interface for layers that support metadata
 */
export interface MetadataPromptLayer extends MutablePromptLayer {
  /**
   * Get the layer metadata
   */
  metadata: PromptLayerMetadata;
  
  /**
   * Update the layer metadata
   * @param updates Partial updates to apply to the metadata
   */
  updateMetadata(updates: Partial<PromptLayerMetadata>): void;
}

/**
 * Factory interface for creating new prompt layers
 */
export interface PromptLayerFactory {
  /**
   * Create a new prompt layer of the specified type
   * @param id Unique identifier for the layer
   * @param content Initial content for the layer
   * @param priority Priority level for the layer
   * @returns A new prompt layer instance
   */
  createLayer(id: string, content: string, priority?: number): PromptLayer;
}