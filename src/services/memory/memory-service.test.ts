import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import { MemoryService } from './memory-service';
import { ChromaMemoryProvider } from './chroma-memory-provider';
import { Memory } from './memory-types';

// Mock dependencies
vi.mock('./chroma-memory-provider', () => ({
  ChromaMemoryProvider: vi.fn().mockImplementation(() => ({
    storeMemory: vi.fn().mockResolvedValue(undefined),
    searchMemories: vi.fn().mockResolvedValue([]),
    getAllMemories: vi.fn().mockResolvedValue([]),
    clearAllMemories: vi.fn().mockResolvedValue(undefined),
    deleteMemory: vi.fn().mockResolvedValue(undefined),
    initializeMemory: vi.fn().mockResolvedValue(undefined)
  }))
}));

describe('MemoryService', () => {
  let memoryService: MemoryService;
  let mockProvider: ChromaMemoryProvider;

  beforeEach(() => {
    vi.clearAllMocks();
    mockProvider = new ChromaMemoryProvider();
    memoryService = new MemoryService(mockProvider);
  });

  afterEach(() => {
    vi.resetAllMocks();
  });

  describe('storeMemory', () => {
    it('should store a memory using the provider', async () => {
      // Arrange
      const memory: Memory = {
        id: '123',
        content: 'Test memory',
        metadata: { source: 'test', timestamp: Date.now() }
      };

      // Act
      await memoryService.storeMemory(memory);

      // Assert
      expect(mockProvider.storeMemory).toHaveBeenCalledWith(memory);
      expect(mockProvider.storeMemory).toHaveBeenCalledTimes(1);
    });

    it('should handle errors when storing memory', async () => {
      // Arrange
      const memory: Memory = {
        id: '123',
        content: 'Test memory',
        metadata: { source: 'test', timestamp: Date.now() }
      };
      const error = new Error('Storage failed');
      vi.mocked(mockProvider.storeMemory).mockRejectedValueOnce(error);

      // Act & Assert
      await expect(memoryService.storeMemory(memory)).rejects.toThrow('Storage failed');
    });
  });

  describe('searchMemories', () => {
    it('should return memories matching the query', async () => {
      // Arrange
      const query = 'test query';
      const mockMemories: Memory[] = [
        {
          id: '1',
          content: 'Memory 1',
          metadata: { source: 'test', timestamp: Date.now() }
        },
        {
          id: '2',
          content: 'Memory 2',
          metadata: { source: 'test', timestamp: Date.now() }
        }
      ];
      vi.mocked(mockProvider.searchMemories).mockResolvedValueOnce(mockMemories);

      // Act
      const result = await memoryService.searchMemories(query);

      // Assert
      expect(mockProvider.searchMemories).toHaveBeenCalledWith(query);
      expect(result).toEqual(mockMemories);
    });

    it('should handle empty results', async () => {
      // Arrange
      const query = 'non-existent';
      vi.mocked(mockProvider.searchMemories).mockResolvedValueOnce([]);

      // Act
      const result = await memoryService.searchMemories(query);

      // Assert
      expect(mockProvider.searchMemories).toHaveBeenCalledWith(query);
      expect(result).toEqual([]);
    });
  });

  describe('getAllMemories', () => {
    it('should return all memories', async () => {
      // Arrange
      const mockMemories: Memory[] = [
        {
          id: '1',
          content: 'Memory 1',
          metadata: { source: 'test', timestamp: Date.now() }
        },
        {
          id: '2',
          content: 'Memory 2',
          metadata: { source: 'test', timestamp: Date.now() }
        }
      ];
      vi.mocked(mockProvider.getAllMemories).mockResolvedValueOnce(mockMemories);

      // Act
      const result = await memoryService.getAllMemories();

      // Assert
      expect(mockProvider.getAllMemories).toHaveBeenCalled();
      expect(result).toEqual(mockMemories);
    });
  });

  describe('clearAllMemories', () => {
    it('should clear all memories', async () => {
      // Act
      await memoryService.clearAllMemories();

      // Assert
      expect(mockProvider.clearAllMemories).toHaveBeenCalled();
    });
  });

  describe('deleteMemory', () => {
    it('should delete a specific memory by id', async () => {
      // Arrange
      const memoryId = '123';

      // Act
      await memoryService.deleteMemory(memoryId);

      // Assert
      expect(mockProvider.deleteMemory).toHaveBeenCalledWith(memoryId);
    });
  });

  describe('initializeMemory', () => {
    it('should initialize the memory engine', async () => {
      // Act
      await memoryService.initializeMemory();

      // Assert
      expect(mockProvider.initializeMemory).toHaveBeenCalled();
    });
  });
});