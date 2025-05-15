import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import { ModelRouter } from './model-router';
import { ServiceLocator } from './service-locator';
import { MemoryService } from '@backend/services/memory/memory-service';
import { ConversationService } from '@backend/services/conversation/conversation-service';
import { createMockAIProvider, createMockMemoryEngine, createMockConversationManager } from '@/test/mocks/service-mocks';

describe('ModelRouter Integration Test', () => {
  let serviceLocator: ServiceLocator;
  let modelRouter: ModelRouter;
  let mockClaudeProvider: ReturnType<typeof createMockAIProvider>;
  let mockOpenAIProvider: ReturnType<typeof createMockAIProvider>;
  let mockGeminiProvider: ReturnType<typeof createMockAIProvider>;
  let mockMemoryService: MemoryService;
  let mockConversationService: ConversationService;

  beforeEach(() => {
    // Create fresh mocks for each test
    serviceLocator = new ServiceLocator();
    
    // Create mock providers
    mockClaudeProvider = createMockAIProvider();
    vi.mocked(mockClaudeProvider.getName).mockReturnValue('Claude');
    
    mockOpenAIProvider = createMockAIProvider();
    vi.mocked(mockOpenAIProvider.getName).mockReturnValue('OpenAI');
    
    mockGeminiProvider = createMockAIProvider();
    vi.mocked(mockGeminiProvider.getName).mockReturnValue('Gemini');
    
    // Register mock providers
    serviceLocator.register('claudeProvider', mockClaudeProvider);
    serviceLocator.register('openaiProvider', mockOpenAIProvider);
    serviceLocator.register('geminiProvider', mockGeminiProvider);
    
    // Create and register mock memory service
    const mockMemoryEngine = createMockMemoryEngine();
    mockMemoryService = new MemoryService(mockMemoryEngine);
    serviceLocator.register('memoryEngine', mockMemoryService);
    
    // Create and register mock conversation service
    const mockConversationManager = createMockConversationManager();
    mockConversationService = { ...mockConversationManager } as ConversationService;
    serviceLocator.register('conversationManager', mockConversationService);
    
    // Create model router with service locator
    modelRouter = new ModelRouter(serviceLocator);
  });

  afterEach(() => {
    vi.resetAllMocks();
  });

  describe('sendMessage', () => {
    it('routes message to the correct provider based on configuration', async () => {
      // Arrange
      const message = 'Test message';
      const mockResponse = {
        id: 'response-123',
        content: 'Response from Claude',
        role: 'assistant'
      };
      
      vi.mocked(mockClaudeProvider.sendMessage).mockResolvedValue(mockResponse);
      
      // Configure router to use Claude
      modelRouter.setActiveProvider('Claude');
      
      // Act
      const result = await modelRouter.sendMessage(message);
      
      // Assert
      expect(mockClaudeProvider.sendMessage).toHaveBeenCalledWith(message, expect.anything());
      expect(mockOpenAIProvider.sendMessage).not.toHaveBeenCalled();
      expect(mockGeminiProvider.sendMessage).not.toHaveBeenCalled();
      expect(result).toEqual(mockResponse);
    });

    it('stores message in memory when memory integration is enabled', async () => {
      // Arrange
      const message = 'Test message for memory';
      const mockResponse = {
        id: 'response-456',
        content: 'This should be stored in memory',
        role: 'assistant'
      };
      
      vi.mocked(mockOpenAIProvider.sendMessage).mockResolvedValue(mockResponse);
      modelRouter.setActiveProvider('OpenAI');
      modelRouter.setMemoryEnabled(true);
      
      // Act
      await modelRouter.sendMessage(message);
      
      // Assert
      expect(mockMemoryService.storeMemory).toHaveBeenCalledTimes(2);
      // Should store both user message and assistant response
      expect(mockMemoryService.storeMemory).toHaveBeenCalledWith(
        expect.objectContaining({ content: message })
      );
      expect(mockMemoryService.storeMemory).toHaveBeenCalledWith(
        expect.objectContaining({ content: mockResponse.content })
      );
    });

    it('logs conversation when conversation logging is enabled', async () => {
      // Arrange
      const message = 'Test message for conversation';
      const mockResponse = {
        id: 'response-789',
        content: 'This should be logged in conversation',
        role: 'assistant'
      };
      
      vi.mocked(mockGeminiProvider.sendMessage).mockResolvedValue(mockResponse);
      modelRouter.setActiveProvider('Gemini');
      modelRouter.setConversationLoggingEnabled(true);
      
      // Set up current conversation
      vi.mocked(mockConversationService.getCurrentConversation).mockResolvedValue({
        id: 'conversation-123',
        messages: []
      });
      
      // Act
      await modelRouter.sendMessage(message);
      
      // Assert
      expect(mockConversationService.saveMessage).toHaveBeenCalledTimes(2);
      expect(mockConversationService.saveMessage).toHaveBeenCalledWith(
        'conversation-123',
        expect.objectContaining({ 
          content: message,
          role: 'user'
        })
      );
      expect(mockConversationService.saveMessage).toHaveBeenCalledWith(
        'conversation-123',
        expect.objectContaining({ 
          content: mockResponse.content,
          role: 'assistant'
        })
      );
    });
    
    it('handles errors from providers and falls back when configured', async () => {
      // Arrange
      const message = 'Test message for error handling';
      
      // Primary provider fails
      vi.mocked(mockClaudeProvider.sendMessage).mockRejectedValue(new Error('Rate limit exceeded'));
      
      // Fallback provider works
      const mockFallbackResponse = {
        id: 'fallback-response',
        content: 'Fallback response from OpenAI',
        role: 'assistant'
      };
      vi.mocked(mockOpenAIProvider.sendMessage).mockResolvedValue(mockFallbackResponse);
      
      // Configure router with fallback
      modelRouter.setActiveProvider('Claude');
      modelRouter.setFallbackProvider('OpenAI');
      modelRouter.setFallbackEnabled(true);
      
      // Act
      const result = await modelRouter.sendMessage(message);
      
      // Assert
      expect(mockClaudeProvider.sendMessage).toHaveBeenCalledWith(message, expect.anything());
      expect(mockOpenAIProvider.sendMessage).toHaveBeenCalledWith(message, expect.anything());
      expect(result).toEqual(mockFallbackResponse);
    });
  });

  describe('setActiveProvider', () => {
    it('changes the provider used for message routing', async () => {
      // Arrange
      const message = 'Provider switching test';
      
      vi.mocked(mockClaudeProvider.sendMessage).mockResolvedValue({
        id: 'claude-response',
        content: 'Response from Claude',
        role: 'assistant'
      });
      
      vi.mocked(mockOpenAIProvider.sendMessage).mockResolvedValue({
        id: 'openai-response',
        content: 'Response from OpenAI',
        role: 'assistant'
      });
      
      // Act & Assert - First with Claude
      modelRouter.setActiveProvider('Claude');
      let result = await modelRouter.sendMessage(message);
      expect(result.content).toBe('Response from Claude');
      expect(mockClaudeProvider.sendMessage).toHaveBeenCalledTimes(1);
      expect(mockOpenAIProvider.sendMessage).not.toHaveBeenCalled();
      
      // Switch to OpenAI
      modelRouter.setActiveProvider('OpenAI');
      result = await modelRouter.sendMessage(message);
      expect(result.content).toBe('Response from OpenAI');
      expect(mockOpenAIProvider.sendMessage).toHaveBeenCalledTimes(1);
      expect(mockClaudeProvider.sendMessage).toHaveBeenCalledTimes(1); // Still 1 from before
    });
  });
});