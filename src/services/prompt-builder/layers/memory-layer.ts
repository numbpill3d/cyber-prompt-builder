/**
 * Memory Layer
 * Handles contextual memory and previous interactions
 */

import { BasePromptLayer, LayerPriority } from '../interfaces/prompt-layer';

/**
 * Memory entry types
 */
export enum MemoryEntryType {
  CONVERSATION = 'conversation',
  CODE = 'code',
  CONTEXT = 'context',
  FEEDBACK = 'feedback',
  ERROR = 'error',
  SUCCESS = 'success'
}

/**
 * Memory entry interface
 */
export interface MemoryEntry {
  type: MemoryEntryType;
  content: string;
  source?: string;
  timestamp: Date;
}

/**
 * Memory layer implementation
 */
export class MemoryLayer extends BasePromptLayer {
  private entries: MemoryEntry[] = [];
  private maxEntries: number = 10;

  constructor(id: string, content: string = '') {
    super(id, 'memory', content, LayerPriority.MEDIUM);
  }

  clone(): MemoryLayer {
    const cloned = new MemoryLayer(this.id, this.content);
    cloned.entries = this.entries.map(entry => ({ ...entry }));
    cloned.maxEntries = this.maxEntries;
    return cloned;
  }

  /**
   * Add a memory entry
   */
  addEntry(entry: MemoryEntry): void {
    this.entries.push(entry);
    
    // Keep only the most recent entries
    if (this.entries.length > this.maxEntries) {
      this.entries = this.entries.slice(-this.maxEntries);
    }
  }

  /**
   * Get all memory entries
   */
  getEntries(): MemoryEntry[] {
    return [...this.entries];
  }

  /**
   * Get entries by type
   */
  getEntriesByType(type: MemoryEntryType): MemoryEntry[] {
    return this.entries.filter(entry => entry.type === type);
  }

  /**
   * Clear all entries
   */
  clearEntries(): void {
    this.entries = [];
  }

  /**
   * Set maximum number of entries to keep
   */
  setMaxEntries(max: number): void {
    if (max > 0) {
      this.maxEntries = max;
      if (this.entries.length > max) {
        this.entries = this.entries.slice(-max);
      }
    }
  }

  /**
   * Get formatted content with memory entries
   */
  getContent(): string {
    const baseContent = super.getContent();
    const parts: string[] = [];

    if (baseContent) {
      parts.push(baseContent);
    }

    if (this.entries.length > 0) {
      parts.push('Relevant context from previous interactions:');
      
      this.entries.forEach((entry, index) => {
        const timestamp = entry.timestamp.toLocaleTimeString();
        const source = entry.source ? ` (${entry.source})` : '';
        parts.push(`${index + 1}. [${entry.type}${source}] ${entry.content}`);
      });
    }

    return parts.join('\n');
  }
}

/**
 * Create a memory layer
 */
export function createMemoryLayer(id: string, content?: string): MemoryLayer {
  return new MemoryLayer(id, content);
}