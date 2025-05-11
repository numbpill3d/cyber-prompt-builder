import { vi, Mock } from 'vitest';
import { AIProvider } from '@/core/interfaces/ai-provider';
import { MemoryEngine } from '@/core/interfaces/memory-engine';
import { ConversationManager } from '@/core/interfaces/conversation-manager';
import { TTSService } from '@/core/interfaces/tts-service';
import { EvolutionEngine } from '@/core/interfaces/evolution-engine';
import { AutoImprovementSystem } from '@/core/interfaces/auto-improvement-system';
import { ServiceLocator } from '@/core/services/service-locator';

/**
 * Creates a complete mock implementation of the MemoryEngine interface
 */
export function createMockMemoryEngine(): MemoryEngine {
  return {
    storeMemory: vi.fn().mockResolvedValue(undefined),
    searchMemories: vi.fn().mockResolvedValue([]),
    getAllMemories: vi.fn().mockResolvedValue([]),
    clearAllMemories: vi.fn().mockResolvedValue(undefined),
    deleteMemory: vi.fn().mockResolvedValue(undefined),
    initializeMemory: vi.fn().mockResolvedValue(undefined)
  };
}

/**
 * Creates a complete mock implementation of the ConversationManager interface
 */
export function createMockConversationManager(): ConversationManager {
  return {
    saveMessage: vi.fn().mockResolvedValue(undefined),
    getMessages: vi.fn().mockResolvedValue([]),
    clearConversation: vi.fn().mockResolvedValue(undefined),
    saveCodeBlock: vi.fn().mockResolvedValue(undefined),
    getCodeBlocks: vi.fn().mockResolvedValue([]),
    getConversationById: vi.fn().mockResolvedValue(null),
    getAllConversations: vi.fn().mockResolvedValue([]),
    createNewConversation: vi.fn().mockResolvedValue({ id: 'mock-conversation-id' }),
    deleteConversation: vi.fn().mockResolvedValue(undefined),
    getCurrentConversation: vi.fn().mockResolvedValue({ id: 'mock-conversation-id', messages: [] })
  };
}

/**
 * Creates a complete mock implementation of the TTSService interface
 */
export function createMockTTSService(): TTSService {
  return {
    speak: vi.fn().mockResolvedValue(undefined),
    stop: vi.fn(),
    isPlaying: vi.fn().mockReturnValue(false),
    setVoice: vi.fn(),
    getAvailableVoices: vi.fn().mockReturnValue([]),
    getCurrentVoice: vi.fn().mockReturnValue(null)
  };
}

/**
 * Creates a complete mock implementation of the EvolutionEngine interface
 */
export function createMockEvolutionEngine(): EvolutionEngine {
  return {
    recordInteraction: vi.fn().mockResolvedValue(undefined),
    getPerformanceMetrics: vi.fn().mockResolvedValue({ accuracy: 0.9, responseTime: 500 }),
    generateEvolutionReport: vi.fn().mockResolvedValue({ improvements: [], metrics: {} }),
    applyEvolution: vi.fn().mockResolvedValue(true)
  };
}

/**
 * Creates a complete mock implementation of the AutoImprovementSystem interface
 */
export function createMockAutoImprovementSystem(): AutoImprovementSystem {
  return {
    generateImprovement: vi.fn().mockResolvedValue({ suggestions: [], reasoning: '' }),
    applyImprovement: vi.fn().mockResolvedValue(true),
    analyzePerformance: vi.fn().mockResolvedValue({ areas: [], metrics: {} })
  };
}

/**
 * Creates a complete mock implementation of the AIProvider interface
 */
export function createMockAIProvider(): AIProvider {
  return {
    sendMessage: vi.fn().mockResolvedValue({
      content: 'Mock response from AI provider',
      id: 'mock-message-id',
      role: 'assistant'
    }),
    getName: vi.fn().mockReturnValue('MockProvider'),
    getModelOptions: vi.fn().mockReturnValue([{ id: 'mock-model', name: 'Mock Model' }])
  };
}

/**
 * Creates a ServiceLocator with mock services
 */
export function createMockServiceLocator(): ServiceLocator {
  const serviceLocator = new ServiceLocator();
  
  // Register mock services
  serviceLocator.register('memoryEngine', createMockMemoryEngine());
  serviceLocator.register('conversationManager', createMockConversationManager());
  serviceLocator.register('ttsService', createMockTTSService());
  serviceLocator.register('evolutionEngine', createMockEvolutionEngine());
  serviceLocator.register('autoImprovementSystem', createMockAutoImprovementSystem());
  serviceLocator.register('aiProvider', createMockAIProvider());
  
  return serviceLocator;
}

/**
 * Type-safe way to get a mocked function from an object
 */
export function getMockFunction<T, K extends keyof T>(
  obj: T,
  key: K
): T[K] extends (...args: unknown[]) => unknown ? Mock : never {
  const fn = obj[key];
  if (typeof fn === 'function' && 'mockReset' in fn) {
    return fn as T[K] extends (...args: unknown[]) => unknown ? Mock : never;
  }
  throw new Error(`Function ${String(key)} is not a mock function`);
}

/**
 * Resets all mock functions in an object
 */
export function resetAllMocks<T>(obj: T): void {
  for (const key in obj) {
    const value = obj[key];
    if (typeof value === 'function' && 'mockReset' in value) {
      (value as unknown as Mock).mockReset();
    }
  }
}