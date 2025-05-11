/**
 * Provider Registration
 * Registers all AI provider implementations with the provider factory
 */

import { ProviderFactory } from './provider-factory';
import { providerImplementations } from '../providers';

/**
 * Register all available providers with the factory
 */
export function registerProviders(): void {
  console.log('Registering AI providers...');
  
  // Register each provider implementation
  for (const [providerName, factory] of Object.entries(providerImplementations)) {
    ProviderFactory.registerProvider(providerName, factory);
    console.log(`Registered provider: ${providerName}`);
  }
  
  console.log(`Total providers registered: ${Object.keys(providerImplementations).length}`);
}