import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import { ClaudeProvider } from './claude-provider';
import { server } from '@/test/setup';
import { http, HttpResponse } from 'msw';

// Mock fetch
global.fetch = vi.fn();

describe('ClaudeProvider', () => {
  let provider: ClaudeProvider;
  const mockApiKey = 'test-api-key';
  
  beforeEach(() => {
    vi.clearAllMocks();
    provider = new ClaudeProvider(mockApiKey, 'claude-3-opus-20240229');
  });

  afterEach(() => {
    vi.resetAllMocks();
  });

  describe('constructor', () => {
    it('should initialize with correct properties', () => {
      expect(provider).toBeDefined();
      expect(provider.getName()).toBe('Claude');
    });

    it('should throw an error if initialized without an API key', () => {
      expect(() => new ClaudeProvider('', 'claude-3-opus-20240229')).toThrow('API key is required');
    });
  });

  describe('getModelOptions', () => {
    it('should return available model options', () => {
      const models = provider.getModelOptions();
      expect(models).toBeInstanceOf(Array);
      expect(models.length).toBeGreaterThan(0);
      expect(models[0]).toHaveProperty('id');
      expect(models[0]).toHaveProperty('name');
    });
  });

  describe('sendMessage', () => {
    const message = 'Hello, Claude!';
    const mockResponse = {
      id: 'msg_012345678',
      model: 'claude-3-opus-20240229',
      type: 'message',
      role: 'assistant',
      content: [
        {
          type: 'text',
          text: 'Hello! How can I help you today?'
        }
      ],
      usage: {
        input_tokens: 10,
        output_tokens: 8
      }
    };

    beforeEach(() => {
      // Reset handlers to default
      server.resetHandlers();
    });

    it('should send a message and return a response', async () => {
      // Override the default handler for this specific test
      server.use(
        http.post('https://api.anthropic.com/v1/messages', () => {
          return HttpResponse.json(mockResponse);
        })
      );

      // Act
      const response = await provider.sendMessage(message);

      // Assert
      expect(response).toBeDefined();
      expect(response.content).toBe('Hello! How can I help you today?');
      expect(response.role).toBe('assistant');
    });

    it('should handle API errors gracefully', async () => {
      // Override default handler to simulate an error
      server.use(
        http.post('https://api.anthropic.com/v1/messages', () => {
          return new HttpResponse(null, {
            status: 401,
            statusText: 'Unauthorized'
          });
        })
      );

      // Act & Assert
      await expect(provider.sendMessage(message)).rejects.toThrow();
    });

    it('should handle rate limiting', async () => {
      // Override default handler to simulate rate limiting
      server.use(
        http.post('https://api.anthropic.com/v1/messages', () => {
          return new HttpResponse(
            JSON.stringify({ error: { type: 'rate_limit_error', message: 'Rate limit exceeded' } }),
            { status: 429 }
          );
        })
      );

      // Act & Assert
      await expect(provider.sendMessage(message)).rejects.toThrow('Rate limit exceeded');
    });

    it('should pass system prompt when provided', async () => {
      // Create a spy to monitor the request
      const fetchSpy = vi.fn().mockResolvedValue({
        ok: true,
        json: () => Promise.resolve(mockResponse)
      });
      global.fetch = fetchSpy;

      // Act
      await provider.sendMessage(message, {
        systemPrompt: 'You are a helpful assistant'
      });

      // Assert request contains system prompt
      expect(fetchSpy).toHaveBeenCalled();
      const [url, options] = fetchSpy.mock.calls[0];
      const body = JSON.parse(options.body as string);
      expect(body.system).toBe('You are a helpful assistant');
    });

    it('should respect message history when provided', async () => {
      // Create a spy to monitor the request
      const fetchSpy = vi.fn().mockResolvedValue({
        ok: true,
        json: () => Promise.resolve(mockResponse)
      });
      global.fetch = fetchSpy;

      // Prepare message history
      const history = [
        { role: 'user' as const, content: 'Previous message' },
        { role: 'assistant' as const, content: 'Previous response' }
      ];

      // Act
      await provider.sendMessage(message, { messageHistory: history });

      // Assert request contains message history
      expect(fetchSpy).toHaveBeenCalled();
      const [url, options] = fetchSpy.mock.calls[0];
      const body = JSON.parse(options.body as string);
      expect(body.messages.length).toBe(3); // 2 history + 1 current
      expect(body.messages[0]).toEqual(history[0]);
      expect(body.messages[1]).toEqual(history[1]);
    });
  });
});