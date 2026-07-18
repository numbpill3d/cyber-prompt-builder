/**
 * Chroma Memory Provider
 * Implements the MemoryService interface using Chroma DB as the vector store
 * 
 * Note: Requires the chromadb package to be installed:
 * npm install chromadb
 */

import { 
  MemoryEntry, 
  MemoryMetadata, 
  MemorySearchParams, 
  MemorySearchResult,
  CollectionOptions
} from './memory-types';
import { BaseMemoryService, MemoryService, MemoryProviderConfig } from './memory-service';
import { sessionManager } from '../session-manager';

// Mock implementation of the ChromaDB client for development
// In production, this would be replaced with real ChromaDB imports
// import { ChromaClient, Collection } from 'chromadb';

/**
 * Interface matching ChromaDB's expected API shape
 */
interface ChromaCollection {
  name: string;
  add: (args: {
    ids: string[];
    embeddings?: number[][];
    metadatas?: Record<string, any>[];
    documents?: string[];
  }) => Promise<void>;
  get: (args: {
    ids?: string[];
    where?: Record<string, any>;
    limit?: number;
    offset?: number;
  }) => Promise<{
    ids: string[];
    embeddings: number[][];
    metadatas: Record<string, any>[];
    documents: string[];
  }>;
  query: (args: {
    queryEmbeddings?: number[][];
    queryTexts?: string[];
    nResults?: number;
    where?: Record<string, any>;
  }) => Promise<{
    ids: string[][];
    distances: number[][];
    metadatas: Record<string, any>[][];
    documents: string[][];
  }>;
  delete: (args: { ids?: string[]; where?: Record<string, any> }) => Promise<void>;
  update: (args: {
    ids: string[];
    embeddings?: number[][];
    metadatas?: Record<string, any>[];
    documents?: string[];
  }) => Promise<void>;
  peek: (count?: number) => Promise<{
    ids: string[];
    embeddings: number[][];
    metadatas: Record<string, any>[];
    documents: string[];
  }>;
  count: () => Promise<number>;
}

interface ChromaClient {
  createCollection: (args: {
    name: string;
    metadata?: Record<string, any>;
    embeddingFunction?: any;
  }) => Promise<ChromaCollection>;
  getCollection: (args: {
    name: string;
    embeddingFunction?: any;
  }) => Promise<ChromaCollection>;
  listCollections: () => Promise<{ name: string; metadata?: Record<string, any> }[]>;
  deleteCollection: (name: string) => Promise<void>;
}

// Placeholder for text embedding function
// In production, this would use a proper embedding model
class BasicEmbeddingFunction {
  private dimensions: number;
  
  constructor(dimensions: number = 1536) {
    this.dimensions = dimensions;
  }
  
  async generate(texts: string[]): Promise<number[][]> {
    // Simple deterministic hash-based embedding for testing
    // Not suitable for production use - would use a real embedding model
    return texts.map(text => {
      const bytes = new TextEncoder().encode(text);
      const embedding = new Array(this.dimensions).fill(0);
      
      for (let i = 0; i < bytes.length; i++) {
        const idx = i % this.dimensions;
        embedding[idx] = (embedding[idx] + bytes[i] / 255) / 2;
      }
      
      // Normalize the vector
      const magnitude = Math.sqrt(embedding.reduce((sum, val) => sum + val * val, 0));
      return embedding.map(val => val / (magnitude || 1));
    });
  }
}

/**
 * ChromaDB implementation of the Memory Service
 */
export class ChromaMemoryProvider extends BaseMemoryService {
  private client: ChromaClient | null = null;
  private collections: Map<string, ChromaCollection> = new Map();
  private embedder: BasicEmbeddingFunction;
  private isInitialized: boolean = false;
  
  constructor(config: MemoryProviderConfig = {}) {
    super(config);
    
    // Use basic embedder for development
    // In production, would use a more sophisticated embedding model
    this.embedder = new BasicEmbeddingFunction(this.config.dimensions);
  }
  
  /**
   * Initialize the ChromaDB client and ensure persistence directory exists
   */
  async initialize(): Promise<void> {
    if (this.isInitialized) return;
    
    try {
      // In production, this would use the actual ChromaDB client
      // this.client = new ChromaClient({ path: this.config.persistencePath });
      
      // Mock client for development
      this.client = {
        createCollection: async ({ name, metadata }) => {
          console.log(`Creating collection ${name}`);
          const store: {
            ids: string[];
            embeddings: number[][];
            metadatas: Record<string, any>[];
            documents: string[];
          } = {
            ids: [],
            embeddings: [],
            metadatas: [],
            documents: []
          };
          
          const collection: ChromaCollection = {
            name,
            add: async ({ ids, embeddings = [], metadatas = [], documents = [] }) => {
              for (let i = 0; i < ids.length; i++) {
                const index = store.ids.indexOf(ids[i]);
                if (index >= 0) {
                  // Update existing
                  if (embeddings[i]) store.embeddings[index] = embeddings[i];
                  if (metadatas[i]) store.metadatas[index] = metadatas[i];
                  if (documents[i]) store.documents[index] = documents[i];
                } else {
                  // Add new
                  store.ids.push(ids[i]);
                  store.embeddings.push(embeddings[i] || []);
                  store.metadatas.push(metadatas[i] || {});
                  store.documents.push(documents[i] || "");
                }
              }
            },
            get: async ({ ids, where, limit = 10, offset = 0 }) => {
              let filteredIndices: number[] = [];
              
              if (ids && ids.length > 0) {
                filteredIndices = ids.map(id => store.ids.indexOf(id)).filter(idx => idx >= 0);
              } else if (where) {
                filteredIndices = store.metadatas
                  .map((metadata, idx) => ({ metadata, idx }))
                  .filter(({ metadata }) => {
                    for (const [key, value] of Object.entries(where)) {
                      if (metadata[key] !== value) return false;
                    }
                    return true;
                  })
                  .map(({ idx }) => idx);
              } else {
                filteredIndices = store.ids.map((_, idx) => idx);
              }
              
              // Apply pagination
              filteredIndices = filteredIndices.slice(offset, offset + limit);
              
              return {
                ids: filteredIndices.map(idx => store.ids[idx]),
                embeddings: filteredIndices.map(idx => store.embeddings[idx]),
                metadatas: filteredIndices.map(idx => store.metadatas[idx]),
                documents: filteredIndices.map(idx => store.documents[idx])
              };
            },
            query: async ({ queryEmbeddings, queryTexts, nResults = 10, where }) => {
              // For development, just return the most recently added items
              // In production, this would use vector similarity search
              let filteredIndices: number[] = [];
              
              if (where) {
                filteredIndices = store.metadatas
                  .map((metadata, idx) => ({ metadata, idx }))
                  .filter(({ metadata }) => {
                    for (const [key, value] of Object.entries(where)) {
                      if (metadata[key] !== value) return false;
                    }
                    return true;
                  })
                  .map(({ idx }) => idx);
              } else {
                filteredIndices = store.ids.map((_, idx) => idx);
              }
              
              // Sort by recency (assuming newer items are at the end)
              filteredIndices.sort((a, b) => b - a);
              filteredIndices = filteredIndices.slice(0, nResults);
              
              return {
                ids: [filteredIndices.map(idx => store.ids[idx])],
                distances: [filteredIndices.map(_ => 0.1)], // Mock distances
                metadatas: [filteredIndices.map(idx => store.metadatas[idx])],
                documents: [filteredIndices.map(idx => store.documents[idx])]
              };
            },
            delete: async ({ ids, where }) => {
              if (ids) {
                for (const id of ids) {
                  const idx = store.ids.indexOf(id);
                  if (idx >= 0) {
                    store.ids.splice(idx, 1);
                    store.embeddings.splice(idx, 1);
                    store.metadatas.splice(idx, 1);
                    store.documents.splice(idx, 1);
                  }
                }
              } else if (where) {
                // Find all items that match the where clause
                const indicesToDelete: number[] = [];
                store.metadatas.forEach((metadata, idx) => {
                  let matches = true;
                  for (const [key, value] of Object.entries(where)) {
                    if (metadata[key] !== value) {
                      matches = false;
                      break;
                    }
                  }
                  if (matches) {
                    indicesToDelete.push(idx);
                  }
                });
                
                // Delete items in reverse order to avoid shifting indices
                for (let i = indicesToDelete.length - 1; i >= 0; i--) {
                  const idx = indicesToDelete[i];
                  store.ids.splice(idx, 1);
                  store.embeddings.splice(idx, 1);
                  store.metadatas.splice(idx, 1);
                  store.documents.splice(idx, 1);
                }
              }
            },
            update: async ({ ids, embeddings, metadatas, documents }) => {
              for (let i = 0; i < ids.length; i++) {
                const idx = store.ids.indexOf(ids[i]);
                if (idx >= 0) {
                  if (embeddings && embeddings[i]) store.embeddings[idx] = embeddings[i];
                  if (metadatas && metadatas[i]) store.metadatas[idx] = metadatas[i];
                  if (documents && documents[i]) store.documents[idx] = documents[i];
                }
              }
            },
            peek: async (count = 10) => {
              const numItems = Math.min(count, store.ids.length);
              return {
                ids: store.ids.slice(0, numItems),
                embeddings: store.embeddings.slice(0, numItems),
                metadatas: store.metadatas.slice(0, numItems),
                documents: store.documents.slice(0, numItems)
              };
            },
            count: async () => store.ids.length
          };
          
          return collection;
        },
        getCollection: async ({ name }) => {
          const collection = this.collections.get(name);
          if (!collection) {
            throw new Error(`Collection ${name} not found`);
          }
          return collection;
        },
        listCollections: async () => {
          return Array.from(this.collections.entries()).map(([name]) => ({ name }));
        },
        deleteCollection: async (name: string) => {
          this.collections.delete(name);
        }
      };
      
      // Create default collections
      await this.createCollection({ name: 'code' });
      await this.createCollection({ name: 'context' });
      await this.createCollection({ name: 'chat' });
      
      this.isInitialized = true;
      console.log('ChromaMemoryProvider initialized');
    } catch (error) {
      console.error('Failed to initialize ChromaMemoryProvider:', error);
      throw error;
    }
  }
  
  /**
   * Shut down the ChromaDB client and save any pending changes
   */
  async shutdown(): Promise<void> {
    // No explicit shutdown needed for mock implementation
    this.collections.clear();
    this.isInitialized = false;
    console.log('ChromaMemoryProvider shut down');
    return Promise.resolve();
  }
  
  /**
   * Create a new collection in ChromaDB
   */
  async createCollection(options: CollectionOptions): Promise<void> {
    if (!this.client) await this.initialize();
    if (!this.client) throw new Error('ChromaMemoryProvider not initialized');
    
    try {
      let collection = await this.client.createCollection({
        name: options.name,
        metadata: options.metadata
      });
      
      this.collections.set(options.name, collection);
      console.log(`Created collection: ${options.name}`);
    } catch (error) {
      console.error(`Error creating collection ${options.name}:`, error);
      throw error;
    }
  }
  
  /**
   * Delete a collection from ChromaDB
   */
  async deleteCollection(name: string): Promise<boolean> {
    if (!this.client) await this.initialize();
    if (!this.client) throw new Error('ChromaMemoryProvider not initialized');
    
    try {
      await this.client.deleteCollection(name);
      this.collections.delete(name);
      console.log(`Deleted collection: ${name}`);
      return true;
    } catch (error) {
      console.error(`Error deleting collection ${name}:`, error);
      return false;
    }
  }
  
  /**
   * List all collections in ChromaDB
   */
  async listCollections(): Promise<string[]> {
    if (!this.client) await this.initialize();
    if (!this.client) throw new Error('ChromaMemoryProvider not initialized');
    
    try {
      const collections = await this.client.listCollections();
      return collections.map(c => c.name);
    } catch (error) {
      console.error('Error listing collections:', error);
      return [];
    }
  }
  
  /**
   * Get information about a collection
   */
  async getCollectionInfo(name: string): Promise<CollectionOptions | null> {
    if (!this.client) await this.initialize();
    if (!this.client) throw new Error('ChromaMemoryProvider not initialized');
    
    try {
      const collections = await this.client.listCollections();
      const collection = collections.find(c => c.name === name);
      
      if (!collection) return null;
      
      return {
        name: collection.name,
        metadata: collection.metadata
      };
    } catch (error) {
      console.error(`Error getting collection info for ${name}:`, error);
      return null;
    }
  }
  
  /**
   * Add a new memory entry to a collection
   */
  async addMemory(
    collection: string, 
    content: string, 
    metadata: MemoryMetadata
  ): Promise<MemoryEntry> {
    if (!this.client) await this.initialize();
    if (!this.client) throw new Error('ChromaMemoryProvider not initialized');
    
    let chromaCollection: ChromaCollection | null = null;
    try {
      // Get or create the collection
      try {
        chromaCollection = await this.client.getCollection({ name: collection });
      } catch (collectionError) {
        // Collection doesn't exist, create it
        await this.createCollection({ name: collection });
        chromaCollection = await this.client.getCollection({ name: collection });
      }

      if (!chromaCollection) {
        throw new Error(`Failed to get or create collection ${collection}`);
      }
      
      // Generate embedding for the content
      const embeddings = await this.embedText(content);
      
      // Create the memory entry
      const id = `mem_${Date.now().toString(36)}_${Math.random().toString(36).substring(2, 7)}`;
      const now = Date.now();
      
      const entry: MemoryEntry = {
        id,
        content,
        embedding: embeddings,
        metadata,
        createdAt: now,
        updatedAt: now
      };
      
      // Store in ChromaDB
      await chromaCollection.add({
        ids: [id],
        embeddings: [embeddings],
        documents: [content],
        metadatas: [{
          ...metadata,
          createdAt: now,
          updatedAt: now
        }]
      });
      
      console.log(`Added memory ${id} to collection ${collection}`);
      return entry;
    } catch (error) {
      console.error(`Error adding memory to collection ${collection}:`, error);
      // Re-throw the error after logging
      throw error;
    }
  }
  
  /**
   * Get a memory entry by ID
   */
  async getMemory(collection: string, id: string): Promise<MemoryEntry | null> {
    if (!this.client) await this.initialize();
    if (!this.client) throw new Error('ChromaMemoryProvider not initialized');
    
    try {
      // Get the collection
      let chromaCollection: ChromaCollection;
      try {
        chromaCollection = await this.client.getCollection({ name: collection });
      } catch (error) {
        return null; // Collection doesn't exist
      }
      
      // Get the memory entry
      let result = await chromaCollection.get({ ids: [id] });
      
      if (result.ids.length === 0) return null;
      
      // Construct the memory entry
      const entry: MemoryEntry = {
        id: result.ids[0],
        content: result.documents[0],
        embedding: result.embeddings[0],
        metadata: result.metadatas[0] as MemoryMetadata,
        createdAt: result.metadatas[0].createdAt,
        updatedAt: result.metadatas[0].updatedAt
      };
      
      return entry;
    } catch (error) {
      console.error(`Error getting memory ${id} from collection ${collection}:`, error);
      return null;
    }
  }
  
  /**
   * Update a memory entry
   */
  async updateMemory(
    collection: string, 
    id: string, 
    updates: Partial<MemoryEntry>
  ): Promise<MemoryEntry | null> {
    if (!this.client) await this.initialize();
    if (!this.client) throw new Error('ChromaMemoryProvider not initialized');
    
    try {
      // Get the collection
      let chromaCollection: ChromaCollection;
      try {
        chromaCollection = await this.client.getCollection({ name: collection });
      } catch (error) {
        return null; // Collection doesn't exist
      }
      
      // Get the existing memory entry
      const existing = await this.getMemory(collection, id);
      if (!existing) return null;
      
      // Prepare updates
      const now = Date.now();
      let newEmbedding = existing.embedding;
      
      // Generate new embedding if content changed
      if (updates.content && updates.content !== existing.content) {
        newEmbedding = await this.embedText(updates.content);
      }
      
      // Update the entry
      await chromaCollection.update({
        ids: [id],
        embeddings: updates.content ? [newEmbedding!] : undefined,
        documents: updates.content ? [updates.content] : undefined,
        metadatas: [{
          ...existing.metadata,
          ...(updates.metadata || {}),
          updatedAt: now
        }]
      });
      
      // Construct the updated memory entry
      const updated: MemoryEntry = {
        ...existing,
        ...updates,
        embedding: newEmbedding,
        updatedAt: now,
        metadata: {
          ...existing.metadata,
          ...(updates.metadata || {})
        }
      };
      
      console.log(`Updated memory ${id} in collection ${collection}`);
      return updated;
    } catch (error) {
      console.error(`Error updating memory ${id} in collection ${collection}:`, error);
      return null;
    }
  }
  
  /**
   * Delete a memory entry
   */
  async deleteMemory(collection: string, id: string): Promise<boolean> {
    if (!this.client) await this.initialize();
    if (!this.client) throw new Error('ChromaMemoryProvider not initialized');
    
    try {
      // Get the collection
      let chromaCollection: ChromaCollection;
      try {
        chromaCollection = await this.client.getCollection({ name: collection });
      } catch (error) {
        return false; // Collection doesn't exist
      }
      
      // Delete the memory entry
      await chromaCollection.delete({ ids: [id] });
      
      console.log(`Deleted memory ${id} from collection ${collection}`);
      return true;
    } catch (error) {
      console.error(`Error deleting memory ${id} from collection ${collection}:`, error);
      return false;
    }
  }
  
  /**
   * Search for memories in a collection
   */
  async searchMemories(
    collection: string, 
    params: MemorySearchParams
  ): Promise<MemorySearchResult> {
    if (!this.client) await this.initialize();
    if (!this.client) throw new Error('ChromaMemoryProvider not initialized');
    
    try {
      // Get the collection
      let chromaCollection: ChromaCollection;
      try {
        chromaCollection = await this.client.getCollection({ name: collection });
      } catch (error) {
        // Collection doesn't exist, return empty result
        return { entries: [], totalCount: 0 };
      }
      
      const nResults = params.maxResults || 10;
      const threshold = params.threshold || 0.7;
      
      // Construct where clause from metadata filters
      const where: Record<string, any> = {};
      
      if (params.sessionId) where.sessionId = params.sessionId;
      if (params.tags && params.tags.length > 0) where.tags = { $in: params.tags };
      if (params.types && params.types.length > 0) where.type = { $in: params.types };
      if (params.source) where.source = params.source;
      if (params.language) where.language = params.language;
      
      if (params.startDate || params.endDate) {
        where.createdAt = {};
        if (params.startDate) where.createdAt.$gte = params.startDate;
        if (params.endDate) where.createdAt.$lte = params.endDate;
      }
      
      let results;
      
      // Semantic search
      if (params.query) {
        try {
          // Convert query to embedding - using let to allow reassignment in error handling
          let queryEmbedding = await this.embedText(params.query);
          
          // Search by vector similarity
          results = await chromaCollection.query({
            queryEmbeddings: [queryEmbedding],
            nResults,
            where: Object.keys(where).length > 0 ? where : undefined
          });
        } catch (error) {
          console.error('Error during semantic search:', error);
          // Fallback to metadata-only search in case of embedding/query errors
          results = {
            ids: [[]],
            distances: [[]],
            metadatas: [[]],
            documents: [[]]
          };
        }
      } else {
        try {
          // Metadata-only search - using let to allow reassignment in error handling
          let getResults = await chromaCollection.get({
            where: Object.keys(where).length > 0 ? where : undefined,
            limit: nResults
          });
          
          // Format to match query results
          results = {
            ids: [getResults.ids],
            distances: [getResults.ids.map(() => 0)], // No distance for metadata search
            metadatas: [getResults.metadatas],
            documents: [getResults.documents]
          };
        } catch (error) {
          console.error('Error during metadata search:', error);
          // Return empty results in case of error
          results = {
            ids: [[]],
            distances: [[]],
            metadatas: [[]],
            documents: [[]]
          };
      }
      
      // Convert to MemoryEntry objects
      const entries: MemoryEntry[] = [];
      
      if (results.ids[0]) {
        for (let i = 0; i < results.ids[0].length; i++) {
          // Skip results with distance > threshold (for semantic search)
          if (params.query && results.distances[0][i] > threshold) continue;
          
          entries.push({
            id: results.ids[0][i],
            content: results.documents[0][i],
            embedding: undefined, // Don't include embeddings in results for efficiency
            metadata: results.metadatas[0][i] as MemoryMetadata,
            createdAt: results.metadatas[0][i].createdAt,
            updatedAt: results.metadatas[0][i].updatedAt
          });
        }
      }
      
      return {
        entries,
        totalCount: await chromaCollection.count()
      };
    } catch (error) {
      console.error(`Error searching memories in collection ${collection}:`, error);
      return { entries: [], totalCount: 0 };
    }
  }
  
  /**
   * Generate an embedding for text
   */
  async embedText(text: string): Promise<number[]> {
    let embeddings = await this.embedder.generate([text]);
    return embeddings[0];
  }
  
  /**
   * Connect with session manager to retrieve session memories
   */
  async getMemoriesForCurrentSession(): Promise<MemoryEntry[]> {
    const currentSession = sessionManager.getCurrentSession();
    if (!currentSession) return [];
    
    return this.getSessionMemories(currentSession.id);
  }
  
  /**
   * Associate a memory with the current active session
   */
  async addMemoryToCurrentSession(
    content: string, 
    type: string, 
    source: string = 'user',
    tags: string[] = []
  ): Promise<MemoryEntry | null> {
    const currentSession = sessionManager.getCurrentSession();
    if (!currentSession) return null;
    
    // Create metadata with session info
    const metadata: MemoryMetadata = {
      sessionId: currentSession.id,
      type: type as any,
      source,
      tags
    };
    
    // Add to appropriate collection based on type
    const collection = this.getCollectionForType(type);
    return this.addMemory(collection, content, metadata);
  }
  
  /**
   * Get the appropriate collection name for a memory type
   */
  private getCollectionForType(type: string): string {
    // Map memory types to collections
    const typeToCollection: Record<string, string> = {
      code: 'code',
      chat: 'chat',
      reference: 'reference',
      snippet: 'code',
      feedback: 'chat',
      context: 'context'
    };
    
    return typeToCollection[type] || 'context';
  }
}