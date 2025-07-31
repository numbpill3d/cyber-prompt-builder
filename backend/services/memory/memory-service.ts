/**
 * Memory Service
 * Defines the interface for interacting with the memory subsystem
 */

import {
  MemoryEntry,
  MemoryMetadata,
  MemorySearchParams,
  MemorySearchResult,
  CollectionOptions,
  MemoryProviderConfig
} from './memory-types';
import { getStorage, StorageInterface } from '@shared/services/storage';

// Re-export these types for consumers
export type { MemoryProviderConfig };

/**
 * Core Memory Service interface
 * Defines operations for storing, retrieving, and searching memory entries
 */
export interface MemoryService {
  // Initialization and lifecycle
  initialize(): Promise<void>;
  shutdown(): Promise<void>;
  
  // Collection management
  createCollection(options: CollectionOptions): Promise<void>;
  deleteCollection(name: string): Promise<boolean>;
  listCollections(): Promise<string[]>;
  getCollectionInfo(name: string): Promise<CollectionOptions | null>;
  
  // Memory operations
  addMemory(collection: string, content: string, metadata: MemoryMetadata): Promise<MemoryEntry>;
  getMemory(collection: string, id: string): Promise<MemoryEntry | null>;
  updateMemory(collection: string, id: string, updates: Partial<MemoryEntry>): Promise<MemoryEntry | null>;
  deleteMemory(collection: string, id: string): Promise<boolean>;
  
  // Batch operations
  addMemories(collection: string, entries: Array<{content: string, metadata: MemoryMetadata}>): Promise<MemoryEntry[]>;
  getMemories(collection: string, ids: string[]): Promise<MemoryEntry[]>;
  
  // Search operations
  searchMemories(collection: string, params: MemorySearchParams): Promise<MemorySearchResult>;
  findSimilar(collection: string, content: string, params?: Partial<MemorySearchParams>): Promise<MemorySearchResult>;
  
  // Vector operations
  embedText(text: string): Promise<number[]>;
  
  // Session context operations
  getSessionMemories(sessionId: string, types?: string[]): Promise<MemoryEntry[]>;
  clearSessionMemories(sessionId: string): Promise<boolean>;
  
  // Persistence operations
  exportMemories(collection: string): Promise<string>;
  importMemories(collection: string, data: string): Promise<number>;
  
  // Statistics
  getMemoryStats(collection: string): Promise<{
    count: number;
    lastUpdated: number;
    avgEmbeddingSize: number;
    types: Record<string, number>;
  }>;
}

/**
 * Base class that provides common implementation details for memory providers
 */
export abstract class BaseMemoryService implements MemoryService {
  protected config: MemoryProviderConfig;
  protected storage: StorageInterface;

  constructor(config: MemoryProviderConfig = {}) {
    this.config = {
      persistencePath: './memory-data',
      embeddingModel: 'default',
      dimensions: 1536,
      ...config
    };
    this.storage = getStorage();
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
  async getSessionMemories(sessionId: string, types?: string[]): Promise<MemoryEntry[]> {
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
    const cached = this.storage.getItem(`memory_${collection}`);
    if (cached) return cached;
    const result = await this.searchMemories(collection, {
      maxResults: 10000
    });
    const data = JSON.stringify(result.entries, null, 2);
    this.storage.setItem(`memory_${collection}`, data);
    return data;
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
    finally {
      this.storage.setItem(`memory_${collection}`, data);
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

// Create a factory function to get the appropriate memory service
export async function createMemoryService(type: string, config?: MemoryProviderConfig): Promise<MemoryService> {
  switch (type.toLowerCase()) {
    case 'chroma':
      // Dynamic import to avoid circular dependencies
      const { ChromaMemoryProvider } = await import('./chroma-memory-provider');
      return new ChromaMemoryProvider(config);
    default:
      throw new Error(`Unknown memory provider type: ${type}`);
  }
}

// Create a singleton instance for use throughout the app
let defaultMemoryService: MemoryService | null = null;
let memoryServiceInitializing = false;
let memoryServicePromise: Promise<MemoryService> | null = null;

/**
 * Get or initialize the memory service
 * This will initialize the service on first call and return the same instance for subsequent calls
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
  memoryServicePromise = createMemoryService('chroma', config).then(service => {
    defaultMemoryService = service;
    memoryServiceInitializing = false;
    return service;
  }).catch(error => {
    memoryServiceInitializing = false;
    console.error("Failed to initialize memory service:", error);
    throw error;
  });
  
  return memoryServicePromise;
}

/**
 * Synchronous check if memory service is ready
 */
export function isMemoryServiceReady(): boolean {
  return defaultMemoryService !== null;
}