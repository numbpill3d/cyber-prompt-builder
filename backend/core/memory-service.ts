
/**
 * Memory Service Implementation
 * Provides memory storage and retrieval functionality
 */

import { MemoryService, MemoryEntry, MemoryMetadata, MemorySearchParams, MemorySearchResult, CollectionOptions, MemoryType } from '@shared/interfaces/memory-engine';

export class LocalMemoryService implements MemoryService {
  private collections: Map<string, Map<string, MemoryEntry>> = new Map();
  private initialized = false;

  async initialize(): Promise<void> {
    this.initialized = true;
    console.log('Local memory service initialized');
  }

  async shutdown(): Promise<void> {
    this.collections.clear();
    this.initialized = false;
  }

  async createCollection(options: CollectionOptions): Promise<void> {
    if (!this.collections.has(options.name)) {
      this.collections.set(options.name, new Map());
    }
  }

  async deleteCollection(name: string): Promise<boolean> {
    return this.collections.delete(name);
  }

  async listCollections(): Promise<string[]> {
    return Array.from(this.collections.keys());
  }

  async getCollectionInfo(name: string): Promise<CollectionOptions | null> {
    if (this.collections.has(name)) {
      return { name };
    }
    return null;
  }

  async addMemory(collection: string, content: string, metadata: MemoryMetadata): Promise<MemoryEntry> {
    if (!this.collections.has(collection)) {
      await this.createCollection({ name: collection });
    }

    const entry: MemoryEntry = {
      id: `mem_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      content,
      metadata,
      createdAt: Date.now(),
      updatedAt: Date.now()
    };

    this.collections.get(collection)!.set(entry.id, entry);
    return entry;
  }

  async getMemory(collection: string, id: string): Promise<MemoryEntry | null> {
    const coll = this.collections.get(collection);
    return coll?.get(id) || null;
  }

  async updateMemory(collection: string, id: string, updates: Partial<MemoryEntry>): Promise<MemoryEntry | null> {
    const coll = this.collections.get(collection);
    const existing = coll?.get(id);
    
    if (!existing) return null;

    const updated = {
      ...existing,
      ...updates,
      updatedAt: Date.now()
    };

    coll.set(id, updated);
    return updated;
  }

  async deleteMemory(collection: string, id: string): Promise<boolean> {
    const coll = this.collections.get(collection);
    return coll?.delete(id) || false;
  }

  async addMemories(collection: string, entries: Array<{content: string, metadata: MemoryMetadata}>): Promise<MemoryEntry[]> {
    const results: MemoryEntry[] = [];
    for (const entry of entries) {
      const result = await this.addMemory(collection, entry.content, entry.metadata);
      results.push(result);
    }
    return results;
  }

  async getMemories(collection: string, ids: string[]): Promise<MemoryEntry[]> {
    const results: MemoryEntry[] = [];
    for (const id of ids) {
      const entry = await this.getMemory(collection, id);
      if (entry) results.push(entry);
    }
    return results;
  }

  async searchMemories(collection: string, params: MemorySearchParams): Promise<MemorySearchResult> {
    const coll = this.collections.get(collection);
    if (!coll) {
      return { entries: [], totalFound: 0 };
    }

    let entries = Array.from(coll.values());

    // Apply filters
    if (params.sessionId) {
      entries = entries.filter(e => e.metadata.sessionId === params.sessionId);
    }

    if (params.types && params.types.length > 0) {
      entries = entries.filter(e => params.types!.includes(e.metadata.type));
    }

    if (params.tags && params.tags.length > 0) {
      entries = entries.filter(e => 
        e.metadata.tags && e.metadata.tags.some(tag => params.tags!.includes(tag))
      );
    }

    // Simple text search
    if (params.query) {
      const query = params.query.toLowerCase();
      entries = entries.filter(e => e.content.toLowerCase().includes(query));
    }

    // Limit results
    if (params.maxResults) {
      entries = entries.slice(0, params.maxResults);
    }

    return {
      entries,
      totalFound: entries.length
    };
  }

  async findSimilar(collection: string, content: string, params?: Partial<MemorySearchParams>): Promise<MemorySearchResult> {
    return this.searchMemories(collection, { query: content, ...params });
  }

  async embedText(text: string): Promise<number[]> {
    // Simple mock embedding
    const embedding = new Array(768).fill(0).map(() => Math.random());
    return embedding;
  }

  async getSessionMemories(sessionId: string, types?: MemoryType[]): Promise<MemoryEntry[]> {
    const allEntries: MemoryEntry[] = [];
    
    for (const coll of this.collections.values()) {
      for (const entry of coll.values()) {
        if (entry.metadata.sessionId === sessionId) {
          if (!types || types.includes(entry.metadata.type)) {
            allEntries.push(entry);
          }
        }
      }
    }

    return allEntries;
  }

  async clearSessionMemories(sessionId: string): Promise<boolean> {
    let cleared = false;
    
    for (const coll of this.collections.values()) {
      for (const [id, entry] of coll.entries()) {
        if (entry.metadata.sessionId === sessionId) {
          coll.delete(id);
          cleared = true;
        }
      }
    }

    return cleared;
  }

  async exportMemories(collection: string): Promise<string> {
    const coll = this.collections.get(collection);
    if (!coll) return '[]';
    
    const entries = Array.from(coll.values());
    return JSON.stringify(entries, null, 2);
  }

  async importMemories(collection: string, data: string): Promise<number> {
    const entries = JSON.parse(data) as MemoryEntry[];
    
    if (!this.collections.has(collection)) {
      await this.createCollection({ name: collection });
    }

    const coll = this.collections.get(collection)!;
    
    for (const entry of entries) {
      coll.set(entry.id, entry);
    }

    return entries.length;
  }

  async getMemoryStats(collection: string): Promise<{
    count: number;
    lastUpdated: number;
    avgEmbeddingSize: number;
    types: Record<string, number>;
  }> {
    const coll = this.collections.get(collection);
    if (!coll) {
      return {
        count: 0,
        lastUpdated: 0,
        avgEmbeddingSize: 0,
        types: {}
      };
    }

    const entries = Array.from(coll.values());
    const types: Record<string, number> = {};
    let lastUpdated = 0;

    for (const entry of entries) {
      types[entry.metadata.type] = (types[entry.metadata.type] || 0) + 1;
      lastUpdated = Math.max(lastUpdated, entry.updatedAt);
    }

    return {
      count: entries.length,
      lastUpdated,
      avgEmbeddingSize: 768, // Mock value
      types
    };
  }
}

export async function getMemoryService(): Promise<MemoryService> {
  const service = new LocalMemoryService();
  await service.initialize();
  return service;
}
