/**
 * AI Providers Entry Point
 * This file imports and exports all available AI providers
 */

// Import the provider interface and factory
import { AIProvider, AIProviderFactory, AIPrompt, AIResponse, AIProviderOptions, CostEstimate } from './index';
import { settingsManager } from '../settings-manager';

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
 * Get configured providers (those with API keys)
 * @returns Array of providers that have API keys configured
 */
export function getConfiguredProviders(): string[] {
  return getAvailableProviders().filter(provider => {
    const apiKey = settingsManager.getApiKey(provider);
    return !!apiKey && apiKey.trim() !== '';
  });
}

/**
 * Check if a provider is properly configured with an API key
 * @param name The name of the provider to check
 * @returns True if the provider is configured, false otherwise
 */
export function isProviderConfigured(name: string): boolean {
  try {
    const provider = getProvider(name);
    return provider.isConfigured();
  } catch (error) {
    return false;
  }
}

/**
 * Estimate the cost of a prompt across multiple providers
 * @param prompt The prompt to estimate cost for
 * @param options Provider options
 * @returns A map of provider names to cost estimates
 */
export async function estimateCostAcrossProviders(
  prompt: AIPrompt, 
  options?: Partial<AIProviderOptions>
): Promise<Record<string, CostEstimate>> {
  const providers = getConfiguredProviders();
  const results: Record<string, CostEstimate> = {};
  
  for (const providerName of providers) {
    try {
      const provider = getProvider(providerName);
      const apiKey = settingsManager.getApiKey(providerName);
      const model = options?.model || settingsManager.getPreferredModel(providerName);
      
      const estimate = await provider.estimateCost(prompt, {
        apiKey,
        model,
        ...options
      });
      
      results[providerName] = estimate;
    } catch (error) {
      console.error(`Error estimating cost for ${providerName}:`, error);
    }
  }
  
  return results;
}

/**
 * Optimize a prompt for a specific provider
 * @param providerName The name of the provider to optimize for
 * @param prompt The prompt to optimize
 * @param language Optional programming language
 * @returns The optimized prompt
 */
export async function optimizePromptForProvider(
  providerName: string,
  prompt: AIPrompt,
  language?: string
): Promise<AIPrompt> {
  try {
    const provider = getProvider(providerName);
    const result = await provider.optimizePrompt(prompt, language);
    return result.optimizedPrompt;
  } catch (error) {
    console.error(`Error optimizing prompt for ${providerName}:`, error);
    return prompt; // Return original prompt on error
  }
}

/**
 * Default provider (used when no provider is specified)
 */
export const DEFAULT_PROVIDER = 'claude';