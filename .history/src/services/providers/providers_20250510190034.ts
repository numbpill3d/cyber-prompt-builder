/**
 * AI Providers Entry Point
 * This file imports and exports all available AI providers
 */

// Import the provider interface and factory
import { AIProvider, AIProviderFactory } from './index';

// Import provider implementations
import './claude';
import './openai';
import './gemini';

// Re-export the provider interfaces and factory
export * from './index';

/**
 * Get a provider by name
 * @param name The name of the provider to get
 * @returns The provider instance
 */
export function getProvider(name: string): AIProvider {
  return AIProviderFactory.createProvider(name);
}

/**
 * Get all available provider names
 * @returns Array of provider names
 */
export function getAvailableProviders(): string[] {
  return AIProviderFactory.getAvailableProviders();
}

/**
 * Default provider (used when no provider is specified)
 */
export const DEFAULT_PROVIDER = 'claude';