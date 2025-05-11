/**
 * Memory Engine Interface
 * Defines the contract for memory storage and retrieval services
 */

/**
 * Memory metadata type
 */
export interface MemoryMetadata {
  type: MemoryType;
  source: string;
  sessionId?: string;
  tags?: string[];
  custom?: Record<string, any>;
}

/**
 * Memory entry type
 */
export interface MemoryEntry {
  id: string;
  content: string;
  metadata: MemoryMetadata;
  embedding?: number[];
  createdAt: number;
  updatedAt: number;
}

/**
 * Memory collection options
 */
export interface CollectionOptions {
  name: string;
  metadata?: Record<string, any>;
  dimensions?: number;
}

/**
 * Memory search parameters
 */
export interface MemorySearchParams {
  query?: string;
  embedding?: number[];
  filter?: Record<string, any>;
  sessionId?: string;
  types?: MemoryType[];
  tags?: string[];
  maxResults?: number;
  threshold?: number;
  includeEmbeddings?: boolean;
  sortBy?: 'similarity' | 'createdAt' | 'updatedAt';
  sortDirection?: 'asc' | 'desc';
}

/**
 * Memory search result
 */
export interface MemorySearchResult {
  entries: MemoryEntry[];
  totalFound: number;
  searchTime?: number;
}

/**
 * Memory provider configuration
 */
export interface MemoryProviderConfig {
  persistencePath?: string;
  embeddingModel?: string;
  dimensions?: number;
  serverUrl?: string;
  apiKey?: string;
}

/**
 * Memory type enum
 */
export enum MemoryType {
  CONTEXT = 'context',
  CODE = 'code',
  CHAT = 'chat',
  PROMPT = 'prompt',
  RESPONSE = 'response',
  USER_INPUT = 'user_input',
  METADATA = 'metadata'
}

/**
 * Memory service interface
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
  getSessionMemories(sessionId: string, types?: MemoryType[]): Promise<MemoryEntry[]>;
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