/**
 * API Key Validator
 * Validates API keys and provides fallback mechanisms
 */

import { Logger } from '@shared/services/logging/logger';
import { configService } from '@backend/services/config/config-service';

// Logger instance
const logger = new Logger('ApiKeyValidator');

// API Provider types
export type ApiProvider = 'openai' | 'claude' | 'gemini';

/**
 * Validates if an API key is present for a given provider
 * @param provider The API provider to check
 * @returns True if the API key is present, false otherwise
 */
export const hasApiKey = (provider: ApiProvider): boolean => {
  try {
    const key = getApiKey(provider);
    return !!key && key.length > 0;
  } catch (error) {
    return false;
  }
};

/**
 * Gets the API key for a given provider
 * @param provider The API provider
 * @returns The API key
 * @throws Error if the API key is not found
 */
export const getApiKey = (provider: ApiProvider): string => {
  try {
    let key: string | undefined;
    
    // Try to get from config service
    try {
      key = configService.get<string>('providers', `${provider}_api_key`);
    } catch (error) {
      logger.debug(`API key not found in config for ${provider}`);
    }
    
    // Fallback to direct environment variable
    if (!key) {
      const envKey = `REACT_APP_PROVIDERS_${provider.toUpperCase()}_API_KEY`;
      key = process.env[envKey];
    }
    
    if (!key) {
      throw new Error(`API key not found for ${provider}`);
    }
    
    return key;
  } catch (error) {
    logger.error(`Failed to get API key for ${provider}`, { error });
    throw error;
  }
};

/**
 * Gets the default provider
 * @returns The default provider
 */
export const getDefaultProvider = (): ApiProvider => {
  try {
    // Try to get from config service
    try {
      const provider = configService.get<string>('providers', 'default_provider');
      if (isValidProvider(provider)) {
        return provider as ApiProvider;
      }
    } catch (error) {
      logger.debug('Default provider not found in config');
    }
    
    // Fallback to direct environment variable
    const envProvider = process.env.REACT_APP_PROVIDERS_DEFAULT_PROVIDER;
    if (envProvider && isValidProvider(envProvider)) {
      return envProvider as ApiProvider;
    }
    
    // Final fallback
    return 'openai';
  } catch (error) {
    logger.warn('Failed to get default provider, using openai', { error });
    return 'openai';
  }
};

/**
 * Checks if a provider is valid
 * @param provider The provider to check
 * @returns True if the provider is valid, false otherwise
 */
const isValidProvider = (provider: string | undefined): boolean => {
  if (!provider) return false;
  return ['openai', 'claude', 'gemini'].includes(provider);
};

/**
 * Gets all available providers with valid API keys
 * @returns Array of available providers
 */
export const getAvailableProviders = (): ApiProvider[] => {
  const providers: ApiProvider[] = [];
  
  if (hasApiKey('openai')) providers.push('openai');
  if (hasApiKey('claude')) providers.push('claude');
  if (hasApiKey('gemini')) providers.push('gemini');
  
  return providers;
};

export default {
  hasApiKey,
  getApiKey,
  getDefaultProvider,
  getAvailableProviders
};
