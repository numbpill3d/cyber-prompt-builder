/**
 * Memory Service Implementation
 * Base implementation of the MemoryService interface
 */

import { 
  MemoryService, 
  MemoryEntry, 
  MemoryMetadata, 
  MemorySearchParams, 
  MemorySearchResult,
  CollectionOptions,
  MemoryProviderConfig,
  MemoryType
} from '../interfaces/memory-engine';

/**
 * Base Memory Service Implementation
 * This is an abstract class that implements common functionality
 * while requiring specific storage implementations to be provided by subclasses
 */
export abstract class BaseMemoryService implements MemoryService {
  protected config: MemoryProviderConfig;
  
  constructor(config: MemoryProviderConfig = {}) {
    this.config = {
      persistencePath: './memory-data',
      embeddingModel: 'default',
      dimensions: 1536,
      ...config
    };
  }
  
  // Required implementations
  abstract initialize(): Promise<void>;
  abstract shutdown(): Promise<void>;
  abstract createCollection(options: CollectionOptions): Promise<void>;
  abstract deleteCollection(name: string): Promise<boolean>;
  abstract listCollections(): Promise<string[]>;
  abstract getCollectionInfo(name: string): Promise<CollectionOptions | null>;
  abstract addMemory(collection: string, content: string, metadata: MemoryMetadata): Promise<MemoryEntry>;
  abstract getMemory(collection: string, id: string): Promise<MemoryEntry | null>;
  abstract updateMemory(collection: string, id: string, updates: Partial<MemoryEntry>): Promise<MemoryEntry | null>;
  abstract deleteMemory(collection: string, id: string): Promise<boolean>;
  abstract searchMemories(collection: string, params: MemorySearchParams): Promise<MemorySearchResult>;
  abstract embedText(text: string): Promise<number[]>;
  
  /**
   * Default implementation for batch operations that calls single operations
   */
  async addMemories(
    collection: string, 
    entries: Array<{content: string, metadata: MemoryMetadata}>
  ): Promise<MemoryEntry[]> {
    const results: MemoryEntry[] = [];
    
    for (const entry of entries) {
      const result = await this.addMemory(collection, entry.content, entry.metadata);
      results.push(result);
    }
    
    return results;
  }
  
  /**
   * Default implementation for getting multiple memories
   */
  async getMemories(collection: string, ids: string[]): Promise<MemoryEntry[]> {
    const results: MemoryEntry[] = [];
    
    for (const id of ids) {
      const memory = await this.getMemory(collection, id);
      if (memory) {
        results.push(memory);
      }
    }
    
    return results;
  }
  
  /**
   * Find memories similar to the provided content
   */
  async findSimilar(
    collection: string, 
    content: string, 
    params: Partial<MemorySearchParams> = {}
  ): Promise<MemorySearchResult> {
    // Get embedding for the content
    const embedding = await this.embedText(content);
    
    // Search for similar memories using the embedding
    return this.searchMemories(collection, {
      threshold: 0.7,
      maxResults: 10,
      ...params,
      query: content
    });
  }
  
  /**
   * Get all memories associated with a session
   */
  async getSessionMemories(sessionId: string, types?: MemoryType[]): Promise<MemoryEntry[]> {
    const collections = await this.listCollections();
    const allMemories: MemoryEntry[] = [];
    
    for (const collection of collections) {
      const result = await this.searchMemories(collection, {
        sessionId,
        types: types as any[],
        maxResults: 1000
      });
      
      allMemories.push(...result.entries);
    }
    
    return allMemories;
  }
  
  /**
   * Clear all memories associated with a session
   */
  async clearSessionMemories(sessionId: string): Promise<boolean> {
    const memories = await this.getSessionMemories(sessionId);
    const collections = new Set(memories.map(m => m.metadata.sessionId));
    
    for (const collection of Array.from(collections)) {
      if (!collection) continue;
      
      const memoriesToDelete = memories.filter(m => m.metadata.sessionId === collection);
      
      for (const memory of memoriesToDelete) {
        await this.deleteMemory(collection, memory.id);
      }
    }
    
    return true;
  }
  
  /**
   * Export memories from a collection as a JSON string
   */
  async exportMemories(collection: string): Promise<string> {
    const result = await this.searchMemories(collection, {
      maxResults: 10000
    });
    
    return JSON.stringify(result.entries, null, 2);
  }
  
  /**
   * Import memories to a collection from a JSON string
   */
  async importMemories(collection: string, data: string): Promise<number> {
    try {
      const memories = JSON.parse(data) as MemoryEntry[];
      let importCount = 0;
      
      for (const memory of memories) {
        if (memory.content && memory.metadata) {
          await this.addMemory(collection, memory.content, memory.metadata);
          importCount++;
        }
      }
      
      return importCount;
    } catch (error) {
      console.error('Error importing memories:', error);
      return 0;
    }
  }
  
  /**
   * Get statistics about a memory collection
   */
  async getMemoryStats(collection: string): Promise<{
    count: number;
    lastUpdated: number;
    avgEmbeddingSize: number;
    types: Record<string, number>;
  }> {
    const result = await this.searchMemories(collection, {
      maxResults: 10000
    });
    
    const memories = result.entries;
    const types: Record<string, number> = {};
    let totalEmbeddingSize = 0;
    let lastUpdated = 0;
    
    for (const memory of memories) {
      const type = memory.metadata.type;
      types[type] = (types[type] || 0) + 1;
      
      if (memory.embedding) {
        totalEmbeddingSize += memory.embedding.length;
      }
      
      if (memory.updatedAt > lastUpdated) {
        lastUpdated = memory.updatedAt;
      }
    }
    
    return {
      count: memories.length,
      lastUpdated,
      avgEmbeddingSize: memories.length > 0 ? totalEmbeddingSize / memories.length : 0,
      types
    };
  }
}

/**
 * In-Memory implementation of MemoryService
 * Stores all data in memory without persistence
 */
export class InMemoryService extends BaseMemoryService {
  private collections: Map<string, CollectionOptions> = new Map();
  private memories: Map<string, Map<string, MemoryEntry>> = new Map();
  private initialized: boolean = false;
  
  async initialize(): Promise<void> {
    this.initialized = true;
    console.log('InMemoryService initialized');
  }
  
  async shutdown(): Promise<void> {
    this.initialized = false;
    console.log('InMemoryService shut down');
  }
  
  async createCollection(options: CollectionOptions): Promise<void> {
    this.collections.set(options.name, options);
    this.memories.set(options.name, new Map());
  }
  
  async deleteCollection(name: string): Promise<boolean> {
    if (!this.collections.has(name)) return false;
    
    this.collections.delete(name);
    this.memories.delete(name);
    return true;
  }
  
  async listCollections(): Promise<string[]> {
    return Array.from(this.collections.keys());
  }
  
  async getCollectionInfo(name: string): Promise<CollectionOptions | null> {
    const collection = this.collections.get(name);
    return collection || null;
  }
  
  async addMemory(collection: string, content: string, metadata: MemoryMetadata): Promise<MemoryEntry> {
    if (!this.collections.has(collection)) {
      await this.createCollection({ name: collection });
    }
    
    const id = `mem_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
    const timestamp = Date.now();
    const embedding = await this.embedText(content);
    
    const entry: MemoryEntry = {
      id,
      content,
      metadata,
      embedding,
      createdAt: timestamp,
      updatedAt: timestamp
    };
    
    this.memories.get(collection)!.set(id, entry);
    
    return entry;
  }
  
  async getMemory(collection: string, id: string): Promise<MemoryEntry | null> {
    if (!this.collections.has(collection)) return null;
    
    const memory = this.memories.get(collection)!.get(id);
    return memory || null;
  }
  
  async updateMemory(collection: string, id: string, updates: Partial<MemoryEntry>): Promise<MemoryEntry | null> {
    if (!this.collections.has(collection)) return null;
    
    const memory = this.memories.get(collection)!.get(id);
    if (!memory) return null;
    
    const updatedMemory: MemoryEntry = {
      ...memory,
      ...updates,
      updatedAt: Date.now()
    };
    
    // Re-embed if content changed
    if (updates.content && updates.content !== memory.content) {
      updatedMemory.embedding = await this.embedText(updates.content);
    }
    
    this.memories.get(collection)!.set(id, updatedMemory);
    
    return updatedMemory;
  }
  
  async deleteMemory(collection: string, id: string): Promise<boolean> {
    if (!this.collections.has(collection)) return false;
    
    return this.memories.get(collection)!.delete(id);
  }
  
  async searchMemories(collection: string, params: MemorySearchParams): Promise<MemorySearchResult> {
    if (!this.collections.has(collection)) {
      return {
        entries: [],
        totalFound: 0
      };
    }
    
    const startTime = Date.now();
    let entries = Array.from(this.memories.get(collection)!.values());
    
    // Basic filter implementation
    if (params.sessionId) {
      entries = entries.filter(entry => entry.metadata.sessionId === params.sessionId);
    }
    
    if (params.types && params.types.length > 0) {
      entries = entries.filter(entry => params.types!.includes(entry.metadata.type));
    }
    
    if (params.tags && params.tags.length > 0) {
      entries = entries.filter(entry => {
        if (!entry.metadata.tags) return false;
        return params.tags!.some(tag => entry.metadata.tags!.includes(tag));
      });
    }
    
    if (params.filter) {
      entries = entries.filter(entry => {
        for (const [key, value] of Object.entries(params.filter!)) {
          if (key.startsWith('metadata.')) {
            const metadataKey = key.substring(9);
            if (entry.metadata[metadataKey] !== value) return false;
          } else {
            if (entry[key] !== value) return false;
          }
        }
        return true;
      });
    }
    
    // Very simple embedding similarity search (cosine similarity)
    if (params.query) {
      const queryEmbedding = await this.embedText(params.query);
      
      // Add similarity score to each entry
      entries = entries.map(entry => {
        const similarity = this.cosineSimilarity(queryEmbedding, entry.embedding || []);
        return { ...entry, similarity };
      });
      
      // Filter by threshold
      if (params.threshold) {
        entries = entries.filter(entry => (entry as any).similarity >= params.threshold);
      }
      
      // Sort by similarity
      entries = entries.sort((a, b) => (b as any).similarity - (a as any).similarity);
    }
    
    // Apply sort
    if (params.sortBy) {
      entries = entries.sort((a, b) => {
        const aVal = a[params.sortBy!];
        const bVal = b[params.sortBy!];
        
        if (params.sortDirection === 'asc') {
          return aVal < bVal ? -1 : aVal > bVal ? 1 : 0;
        } else {
          return aVal > bVal ? -1 : aVal < bVal ? 1 : 0;
        }
      });
    }
    
    // Apply limit
    const totalFound = entries.length;
    if (params.maxResults) {
      entries = entries.slice(0, params.maxResults);
    }
    
    // Remove embedding if not requested
    if (!params.includeEmbeddings) {
      entries = entries.map(({ embedding, ...rest }) => rest) as MemoryEntry[];
    }
    
    return {
      entries,
      totalFound,
      searchTime: Date.now() - startTime
    };
  }
  
  async embedText(text: string): Promise<number[]> {
    // This is a mock implementation
    // In a real implementation, this would call an embedding API
    const embedding: number[] = [];
    const hash = this.simpleHash(text);
    
    // Generate a deterministic embedding based on the text hash
    for (let i = 0; i < this.config.dimensions!; i++) {
      // Generate values between -1 and 1 using text hash
      embedding.push(Math.sin(hash * (i + 1)) * 0.5);
    }
    
    // Normalize the embedding
    const magnitude = Math.sqrt(embedding.reduce((sum, val) => sum + val * val, 0));
    return embedding.map(val => val / magnitude);
  }
  
  // Helper methods
  private simpleHash(text: string): number {
    let hash = 0;
    for (let i = 0; i < text.length; i++) {
      hash = ((hash << 5) - hash) + text.charCodeAt(i);
      hash |= 0; // Convert to 32bit integer
    }
    return hash;
  }
  
  private cosineSimilarity(a: number[], b: number[]): number {
    if (a.length !== b.length || a.length === 0) return 0;
    
    let dotProduct = 0;
    let aMagnitude = 0;
    let bMagnitude = 0;
    
    for (let i = 0; i < a.length; i++) {
      dotProduct += a[i] * b[i];
      aMagnitude += a[i] * a[i];
      bMagnitude += b[i] * b[i];
    }
    
    aMagnitude = Math.sqrt(aMagnitude);
    bMagnitude = Math.sqrt(bMagnitude);
    
    if (aMagnitude === 0 || bMagnitude === 0) return 0;
    
    return dotProduct / (aMagnitude * bMagnitude);
  }
}

// Factory function to create memory service
export async function createMemoryService(type: string = 'in-memory', config?: MemoryProviderConfig): Promise<MemoryService> {
  switch (type.toLowerCase()) {
    case 'in-memory':
      return new InMemoryService(config);
    default:
      throw new Error(`Unknown memory provider type: ${type}`);
  }
}

// Singleton instance
let defaultMemoryService: MemoryService | null = null;
let memoryServiceInitializing = false;
let memoryServicePromise: Promise<MemoryService> | null = null;

/**
 * Get or initialize the memory service
 */
export async function getMemoryService(config?: MemoryProviderConfig): Promise<MemoryService> {
  // Return existing instance if available
  if (defaultMemoryService) {
    return defaultMemoryService;
  }
  
  // Return in-progress initialization if happening
  if (memoryServiceInitializing && memoryServicePromise) {
    return memoryServicePromise;
  }
  
  // Start initialization
  memoryServiceInitializing = true;
  memoryServicePromise = createMemoryService('in-memory', config).then(service => {
    return service.initialize().then(() => {
      defaultMemoryService = service;
      memoryServiceInitializing = false;
      return service;
    });
  }).catch(error => {
    memoryServiceInitializing = false;
    console.error("Failed to initialize memory service:", error);
    throw error;
  });
  
  return memoryServicePromise;
}

/**
 * Check if memory service is ready
 */
export function isMemoryServiceReady(): boolean {
  return defaultMemoryService !== null;
}