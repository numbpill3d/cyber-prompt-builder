import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import { MemoryService, getMemoryService, createMemoryService } from './memory-service';
import { ChromaMemoryProvider } from './chroma-memory-provider';
import { MemoryEntry, MemoryMetadata, MemoryType, MemorySearchParams, MemorySearchResult } from './memory-types';

// Mock dependencies
vi.mock('./chroma-memory-provider', () => ({
  ChromaMemoryProvider: vi.fn().mockImplementation(() => ({
    initialize: vi.fn().mockResolvedValue(undefined),
    shutdown: vi.fn().mockResolvedValue(undefined),
    createCollection: vi.fn().mockResolvedValue(undefined),
    deleteCollection: vi.fn().mockResolvedValue(true),
    listCollections: vi.fn().mockResolvedValue(['test_collection']),
    getCollectionInfo: vi.fn().mockResolvedValue({ name: 'test_collection' }),
    addMemory: vi.fn().mockImplementation(async (collection, content, metadata) => ({
      id: 'new_id',
      content,
      metadata,
      createdAt: Date.now(),
      updatedAt: Date.now(),
      embedding: [0.1, 0.2],
    })),
    getMemory: vi.fn().mockResolvedValue(null),
    updateMemory: vi.fn().mockResolvedValue(null),
    deleteMemory: vi.fn().mockResolvedValue(true),
    searchMemories: vi.fn().mockResolvedValue({ entries: [], totalCount: 0 }),
    embedText: vi.fn().mockResolvedValue([0.1, 0.2, 0.3]),
    // Mock methods from BaseMemoryService that might be called if not overridden
    addMemories: vi.fn(async function (collection, entries) { return Promise.all(entries.map(e => this.addMemory(collection, e.content, e.metadata))); }),
    getMemories: vi.fn().mockResolvedValue([]),
    findSimilar: vi.fn().mockResolvedValue({ entries: [], totalCount: 0 }),
    getSessionMemories: vi.fn().mockResolvedValue([]),
    clearSessionMemories: vi.fn().mockResolvedValue(true),
    exportMemories: vi.fn().mockResolvedValue("[]"),
    importMemories: vi.fn().mockResolvedValue(0),
    getMemoryStats: vi.fn().mockResolvedValue({ count: 0, lastUpdated: 0, avgEmbeddingSize: 0, types: {} }),
  }))
}));

describe('ChromaMemoryProvider (as MemoryService implementation)', () => {
  let memoryService: MemoryService;
  let mockChromaProviderInstance: ReturnType<typeof ChromaMemoryProvider>;

  beforeEach(() => {
    vi.clearAllMocks();
    // Directly instantiate ChromaMemoryProvider as it's being mocked.
    // In a real test, you might use `createMemoryService('chroma')`.
    memoryService = new ChromaMemoryProvider() as unknown as MemoryService;
    mockChromaProviderInstance = memoryService as any;
  });

  afterEach(() => {
    vi.resetAllMocks();
  });

  describe('addMemory', () => {
    it('should add a memory using the provider', async () => {
      // Arrange
      const collectionName = 'test_collection';
      const content = 'Test memory content';
      const metadata: MemoryMetadata = {
        type: MemoryType.CHAT,
        source: 'test',
        tags: ['test_tag']
      };
      const expectedMemory: Partial<MemoryEntry> = {
        content: 'Test memory',
        metadata
      };
      vi.mocked(mockChromaProviderInstance.addMemory).mockResolvedValueOnce({
        id: 'mock_id_123',
        content,
        metadata,
        embedding: [0.1, 0.2],
        createdAt: Date.now(),
        updatedAt: Date.now(),
      });

      // Act
      const result = await memoryService.addMemory(collectionName, content, metadata);

      // Assert
      expect(mockChromaProviderInstance.addMemory).toHaveBeenCalledWith(collectionName, content, metadata);
      expect(result.content).toBe(content);
      expect(result.metadata).toEqual(metadata);
    });

    it('should handle errors when adding memory', async () => {
      // Arrange
      const collectionName = 'test_collection';
      const content = 'Test memory content';
      const metadata: MemoryMetadata = { type: MemoryType.CHAT, source: 'test', tags: [] };
      const error = new Error('Storage failed');
      vi.mocked(mockChromaProviderInstance.addMemory).mockRejectedValueOnce(error);

      // Act & Assert
      await expect(memoryService.addMemory(collectionName, content, metadata)).rejects.toThrow('Storage failed');
    });
  });

  describe('searchMemories', () => {
    it('should return memories matching the query', async () => {
      // Arrange
      const collectionName = 'test_collection';
      const query = 'test query';
      const mockMemoriesResult: MemorySearchResult = {
        entries: [
          {
            id: '1',
            content: 'Memory 1',
            metadata: { type: MemoryType.CODE, source: 'test', tags: [] },
            createdAt: Date.now(),
            updatedAt: Date.now()
          },
        ],
        totalCount: 1
      };
      vi.mocked(mockChromaProviderInstance.searchMemories).mockResolvedValueOnce(mockMemoriesResult);
      const searchParams: MemorySearchParams = { query };

      // Act
      const result = await memoryService.searchMemories(collectionName, searchParams);

      // Assert
      expect(mockChromaProviderInstance.searchMemories).toHaveBeenCalledWith(collectionName, searchParams);
      expect(result).toEqual(mockMemoriesResult);
    });
  });

  describe('deleteMemory', () => {
    it('should delete a specific memory by id', async () => {
      // Arrange
      const collectionName = 'test_collection';
      const memoryId = '123';
      vi.mocked(mockChromaProviderInstance.deleteMemory).mockResolvedValueOnce(true);

      // Act
      const result = await memoryService.deleteMemory(collectionName, memoryId);

      // Assert
      expect(mockChromaProviderInstance.deleteMemory).toHaveBeenCalledWith(collectionName, memoryId);
      expect(result).toBe(true);
    });
  });

  describe('initialize (from MemoryService interface)', () => {
    it('should initialize the memory engine', async () => {
      // Act
      await memoryService.initialize();

      // Assert
      expect(mockChromaProviderInstance.initialize).toHaveBeenCalled();
    });
  });

  // Example test for a BaseMemoryService method if ChromaMemoryProvider doesn't override it
  describe('findSimilar (BaseMemoryService method)', () => {
    it('should call embedText and searchMemories', async () => {
      const collectionName = 'test_collection';
      const contentToFind = "similar content";
      const mockEmbedding = [0.5, 0.5];
      const mockSearchResult: MemorySearchResult = {
        entries: [
        {
          id: '1',
          content: 'Found similar memory',
          metadata: { type: MemoryType.SNIPPET, source: 'test', tags: [] },
          createdAt: Date.now(),
          updatedAt: Date.now()
        }
        ],
        totalCount: 1
      };

      vi.mocked(mockChromaProviderInstance.embedText).mockResolvedValueOnce(mockEmbedding);
      vi.mocked(mockChromaProviderInstance.searchMemories).mockResolvedValueOnce(mockSearchResult);

      // Act
      const result = await memoryService.findSimilar(collectionName, contentToFind, { maxResults: 1 });

      // Assert
      expect(mockChromaProviderInstance.embedText).toHaveBeenCalledWith(contentToFind);
      expect(mockChromaProviderInstance.searchMemories).toHaveBeenCalledWith(collectionName, {
        query: contentToFind, // BaseMemoryService passes content as query
        threshold: 0.7,       // Default threshold
        maxResults: 1         // Overridden maxResults
      });
      expect(result).toEqual(mockSearchResult);
    });
  });
});