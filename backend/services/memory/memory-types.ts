/**
 * Memory Engine - Type Definitions
 * Defines the core data structures for the memory system
 */

/**
 * Represents a single memory entry with vector embeddings
 */
export interface MemoryEntry {
  id: string;
  content: string;
  embedding?: number[];
  metadata: MemoryMetadata;
  createdAt: number;
  updatedAt: number;
}

/**
 * Metadata associated with memory entries for filtering and organization
 */
export interface MemoryMetadata {
  // Core metadata
  sessionId?: string;      // Associated session ID
  type: MemoryType;        // Type of memory (code, chat, etc)
  source: string;          // Source of the memory (user, ai, system)
  
  // Tagging system
  tags: string[];          // User-defined tags for memory organization
  
  // Optional metadata fields
  language?: string;       // Programming language if applicable
  title?: string;          // Optional title for the memory
  importance?: number;     // Importance score (0-10)
  custom?: Record<string, any>; // Additional custom metadata
}

/**
 * Types of memories that can be stored
 */
export enum MemoryType {
  CODE = 'code',
  CHAT = 'chat',
  REFERENCE = 'reference',
  SNIPPET = 'snippet',
  FEEDBACK = 'feedback',
  CONTEXT = 'context'
}

/**
 * Memory search parameters
 */
export interface MemorySearchParams {
  // Content-based search
  query?: string;          // Text query for semantic search
  threshold?: number;      // Similarity threshold (0.0-1.0)
  maxResults?: number;     // Maximum number of results to return
  
  // Metadata-based filters
  tags?: string[];         // Filter by specific tags
  types?: MemoryType[];    // Filter by memory types
  sessionId?: string;      // Filter by session ID
  source?: string;         // Filter by source
  language?: string;       // Filter by programming language
  
  // Time-based filters
  startDate?: number;      // Filter by created/updated date
  endDate?: number;        // Filter by created/updated date
}

/**
 * Result of a memory search operation
 */
export interface MemorySearchResult {
  entries: MemoryEntry[];
  totalCount: number;
  nextCursor?: string;     // Pagination cursor for fetching more results
}

/**
 * Collection management options for vector stores
 */
export interface CollectionOptions {
  name: string;
  metadata?: Record<string, any>;
  embeddingDimension?: number;
}

/**
 * Configuration for memory providers
 */
export interface MemoryProviderConfig {
  persistencePath?: string; // Path for persistence storage
  embeddingModel?: string;  // Model to use for embeddings
  dimensions?: number;      // Vector dimensions
}