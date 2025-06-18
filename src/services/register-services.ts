/**
 * Service Registration
 * Sets up all core services and registers them with the service locator
 */

import { registerService } from '../core/services/service-locator';
import { getMemoryService } from '../core/services/memory-service';
import { MemoryService } from '../core/interfaces/memory-engine';
import { ConversationManager } from '../core/interfaces/conversation-manager';
import { TTSService } from '../core/interfaces/tts-service';
import { EvolutionEngine } from '../core/interfaces/evolution-engine';
import { AutoImprovementSystem } from '../core/interfaces/auto-improvement-system';
import { SettingsManager } from '../core/interfaces/settings-manager';
import { PromptBuilderService } from '../core/interfaces/prompt-builder';

// Import our new services
import { Logger, LogLevel } from './logging/logger';
import { errorHandler } from './error/error-handler';
import { configService } from './config/config-service';
import { initializeServices as initializeCoreServices } from './initialize-services';

// Import service implementations
import { createConversationService } from './conversation/conversation-service';
import { createTTSService } from './tts/tts-service';
import { createEvolutionService } from './evolution/evolution-service';
import { createAutoImprovementService } from './auto-improvement/auto-improvement-service';
import { createSettingsService } from './settings/settings-service';
import { createPromptBuilderService } from './prompt-builder/prompt-builder-service';

/**
 * Initialize and register all core services
 */
export async function initializeServices(): Promise<void> {
  const logger = new Logger('ServiceRegistration');
  logger.info('Initializing core services...');
  
  try {
    // Initialize our core infrastructure services first
    await initializeCoreServices();
    
    // Register our infrastructure services
    registerService('errorHandler', errorHandler);
    registerService('configService', configService);
    logger.info('Infrastructure services registered');
    
    // Initialize settings
    const settingsManager = createSettingsService();
    registerService('settingsManager', settingsManager);
    logger.info('Settings manager initialized');
    
    // Initialize memory service
    const memoryService = await getMemoryService();
    registerService('memoryService', memoryService);
    logger.info('Memory service initialized');
    
    // Initialize conversation service
    const conversationService = createConversationService();
    registerService('conversationManager', conversationService);
    logger.info('Conversation service initialized');
    
    // Initialize TTS service
    const ttsService = createTTSService();
    await ttsService.initialize();
    registerService('ttsService', ttsService);
    logger.info('TTS service initialized');
    
    // Initialize evolution service
    const evolutionService = createEvolutionService();
    await evolutionService.initialize();
    registerService('evolutionEngine', evolutionService);
    logger.info('Evolution service initialized');
    
    // Initialize auto-improvement service
    const autoImprovementService = createAutoImprovementService();
    await autoImprovementService.initialize();
    registerService('autoImprovementSystem', autoImprovementService);
    logger.info('Auto-improvement service initialized');
    
    // Initialize prompt builder service
    const promptBuilderService = createPromptBuilderService();
    registerService('promptBuilderService', promptBuilderService);
    logger.info('PromptBuilder service initialized');
    
    logger.info('All core services initialized successfully');
  } catch (error) {
    logger.error('Failed to initialize core services:', { error });
    errorHandler.handleError(error as Error, { context: 'initializeServices' });
    throw error;
  }
}

/**
 * Get the service instances by type
 */
// Helper functions to get service instances from the locator
import { getService } from '../core/services/service-locator';

export function getConversationService(): ConversationManager {
  return getService<ConversationManager>('conversationManager');
}

export function getTTSService(): TTSService {
  return getService<TTSService>('ttsService');
}

export function getEvolutionService(): EvolutionEngine {
  return getService<EvolutionEngine>('evolutionEngine');
}

export function getAutoImprovementService(): AutoImprovementSystem {
  return getService<AutoImprovementSystem>('autoImprovementSystem');
}

export function getSettingsService(): SettingsManager {
  return getService<SettingsManager>('settingsManager');
}

/**
 * Get the PromptBuilder service
 */
export function getPromptBuilderService(): PromptBuilderService {
  return getService<PromptBuilderService>('promptBuilderService');
}

/**
 * Get the error handler service
 */
export function getErrorHandlerService() {
  return errorHandler;
}

/**
 * Get the configuration service
 */
export function getConfigService() {
  return configService;
}

/**
 * Create a logger for a specific source
 */
export function createLogger(source: string): Logger {
  return new Logger(source);
}