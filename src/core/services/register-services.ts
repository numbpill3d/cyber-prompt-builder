/**
 * Service Registration
 * Sets up all core services and registers them with the service locator
 */

import { registerService, getService } from './service-locator';
import { MemoryService } from '../interfaces/memory-engine';
import { ConversationManager } from '../interfaces/conversation-manager';
import { TTSService } from '../interfaces/tts-service';
import { EvolutionEngine } from '../interfaces/evolution-engine';
import { AutoImprovementSystem } from '../interfaces/auto-improvement-system';
import { SettingsManager } from '../interfaces/settings-manager';

// Import provider integrations
import { registerProviders } from './register-providers';
import { ProviderFactory } from './provider-factory';
import { ModelRouter } from './model-router';
import { ResponseHandler, responseHandler } from './response-handler';

/**
 * Initialize and register all core services
 */
export async function initializeServices(): Promise<void> {
  console.log('Initializing core services...');
  
  try {
    // Register Settings Manager (must be first)
    const settingsManager = await createSettingsService();
    registerService('settingsManager', settingsManager);
    console.log('Settings manager initialized');
    
    // Register AI providers
    registerProviders();
    console.log('AI providers registered');
    
    // Register provider factory
    registerService('providerFactory', ProviderFactory);
    console.log('Provider factory registered');
    
    // Register model router
    const modelRouter = new ModelRouter();
    registerService('modelRouter', modelRouter);
    console.log('Model router registered');
    
    // Register response handler
    registerService('responseHandler', responseHandler);
    console.log('Response handler registered');
    
    // Register memory service
    const memoryService = await createMemoryService();
    registerService('memoryService', memoryService);
    console.log('Memory service initialized');
    
    // Register conversation service
    const conversationService = await createConversationService();
    registerService('conversationManager', conversationService);
    console.log('Conversation service initialized');
    
    // Register TTS service
    const ttsService = await createTTSService();
    registerService('ttsService', ttsService);
    console.log('TTS service initialized');
    
    // Register evolution service
    const evolutionService = await createEvolutionService();
    registerService('evolutionEngine', evolutionService);
    console.log('Evolution service initialized');
    
    // Register auto-improvement service
    const autoImprovementService = await createAutoImprovementService();
    registerService('autoImprovementSystem', autoImprovementService);
    console.log('Auto-improvement service initialized');
    
    console.log('All core services initialized successfully');
  } catch (error) {
    console.error('Failed to initialize core services:', error);
    throw error;
  }
}

/**
 * Create settings service instance
 */
async function createSettingsService(): Promise<SettingsManager> {
  // Placeholder - actual implementation would be imported from a service file
  return {} as SettingsManager;
}

/**
 * Create memory service instance
 */
async function createMemoryService(): Promise<MemoryService> {
  // Placeholder - actual implementation would be imported from a service file
  return {} as MemoryService;
}

/**
 * Create conversation service instance
 */
async function createConversationService(): Promise<ConversationManager> {
  // Placeholder - actual implementation would be imported from a service file
  return {} as ConversationManager;
}

/**
 * Create TTS service instance
 */
async function createTTSService(): Promise<TTSService> {
  // Placeholder - actual implementation would be imported from a service file
  return {} as TTSService;
}

/**
 * Create evolution service instance
 */
async function createEvolutionService(): Promise<EvolutionEngine> {
  // Placeholder - actual implementation would be imported from a service file
  return {} as EvolutionEngine;
}

/**
 * Create auto-improvement service instance
 */
async function createAutoImprovementService(): Promise<AutoImprovementSystem> {
  // Placeholder - actual implementation would be imported from a service file
  return {} as AutoImprovementSystem;
}

/**
 * Get service by type from service locator
 */
export function getModelRouter(): ModelRouter {
  return getService<ModelRouter>('modelRouter');
}

/**
 * Get provider factory from service locator
 */
export function getProviderFactory(): typeof ProviderFactory {
  return getService<typeof ProviderFactory>('providerFactory');
}

/**
 * Get response handler from service locator
 */
export function getResponseHandler(): ResponseHandler {
  return getService<ResponseHandler>('responseHandler');
}