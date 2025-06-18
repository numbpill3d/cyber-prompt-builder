
/**
 * AI Provider Implementations Index
 * Exports all AI provider implementations
 */

// Export provider implementations
export * from './claude-provider';
export * from './openai-provider';
export * from './gemini-provider';

// Export a default map of provider implementations
import { ClaudeProvider } from './claude-provider';
import { OpenAIProvider } from './openai-provider';
import { GeminiProvider } from './gemini-provider';
import { AIProvider } from '@shared/interfaces/ai-provider';

// Create provider instances
const createClaudeProvider = () => new ClaudeProvider();
const createOpenAIProvider = () => new OpenAIProvider();
const createGeminiProvider = () => new GeminiProvider();

// Provider registration map
export const providerImplementations: Record<string, () => AIProvider> = {
  'claude': createClaudeProvider,
  'openai': createOpenAIProvider,
  'gemini': createGeminiProvider
};
