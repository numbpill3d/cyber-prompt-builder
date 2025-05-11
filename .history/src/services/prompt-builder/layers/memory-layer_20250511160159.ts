/**
 * Memory/Context Recall Layer Implementation
 * Represents relevant context and history for the AI's responses
 */

import { BasePromptLayer, LayerPriority, PromptLayer, PromptLayerFactory, MetadataPromptLayer, PromptLayerMetadata } from '../interfaces/prompt-layer';

/**
 * Types of memory entries
 */
export enum MemoryEntryType {
  CONVERSATION = 'conversation',
  DOCUMENT = 'document',
  CODE = 'code',
  FACT = 'fact',
  USER_PREFERENCE = 'user_preference'
}

/**
 * A single memory/context entry
 */
export interface MemoryEntry {
  /**
   * Type of memory
   */
  type: MemoryEntryType;
  
  /**
   * Content of the memory
   */
  content: string;
  
  /**
   * Optional timestamp for when this memory was created/observed
   */
  timestamp?: Date;
  
  /**
   * Optional relevance score (higher = more relevant)
   */
  relevance?: number;
  
  /**
   * Source of this memory (conversation, file, etc.)
   */
  source?: string;
}

/**
 * Memory context layer - provides relevant history and context
 */
export class MemoryLayer extends BasePromptLayer implements MetadataPromptLayer {
  /**
   * Memory entries stored in this layer
   */
  private entries: MemoryEntry[] = [];
  
  /**
   * Layer metadata
   */
  metadata: PromptLayerMetadata = {
    created: new Date(),
    lastModified: new Date(),
    source: 'system'
  };
  
  constructor(id: string, content: string = '', priority: number = LayerPriority.MEDIUM) {
    super(id, 'memory', content, priority);
  }
  
  /**
   * Create a clone of this layer
   */
  clone(): PromptLayer {
    const clone = new MemoryLayer(this.id, this.content, this.priority);
    clone.enabled = this.enabled;
    clone.entries = [...this.entries];
    clone.metadata = { ...this.metadata };
    return clone;
  }
  
  /**
   * Get the memory content with all entries
   */
  override getContent(): string {
    if (this.entries.length === 0) {
      return this.content;
    }

    // If we have entries, format them nicely
    let result = this.content ? `${this.content}\n\n` : '';
    result += 'RELEVANT CONTEXT:\n\n';
    
    // Sort entries by relevance if available, otherwise keep insertion order
    const sortedEntries = [...this.entries].sort((a, b) => 
      (b.relevance ?? 0) - (a.relevance ?? 0)
    );
    
    for (const entry of sortedEntries) {
      result += `[${entry.type.toUpperCase()}]`;
      
      if (entry.source) {
        result += ` (from ${entry.source})`;
      }
      
      if (entry.timestamp) {
        result += ` ${entry.timestamp.toISOString()}`;
      }
      
      result += ':\n';
      result += entry.content;
      result += '\n\n';
    }
    
    return result;
  }
  
  /**
   * Add a memory entry
   * @param entry The entry to add
   */
  addEntry(entry: MemoryEntry): void {
    this.entries.push(entry);
    this.metadata.lastModified = new Date();
  }
  
  /**
   * Get all memory entries
   */
  getEntries(): MemoryEntry[] {
    return [...this.entries];
  }
  
  /**
   * Clear all memory entries
   */
  clearEntries(): void {
    this.entries = [];
    this.metadata.lastModified = new Date();
  }
  
  /**
   * Filter entries by type
   * @param type The type to filter by
   * @returns Entries of the specified type
   */
  getEntriesByType(type: MemoryEntryType): MemoryEntry[] {
    return this.entries.filter(entry => entry.type === type);
  }
  
  /**
   * Update metadata
   * @param updates The updates to apply
   */
  updateMetadata(updates: Partial<PromptLayerMetadata>): void {
    this.metadata = {
      ...this.metadata,
      ...updates,
      lastModified: new Date()
    };
  }
}

/**
 * Factory for creating memory layers
 */
export class MemoryLayerFactory implements PromptLayerFactory {
  createLayer(id: string, content: string, priority?: number): PromptLayer {
    return new MemoryLayer(id, content, priority);
  }
}