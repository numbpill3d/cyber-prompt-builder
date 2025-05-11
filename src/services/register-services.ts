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

// Import service implementations
import { createConversationService } from './conversation/conversation-service';
import { createTTSService } from './tts/tts-service';
import { createEvolutionService } from './evolution/evolution-service';
import { createAutoImprovementService } from './auto-improvement/auto-improvement-service';
import { createSettingsService } from './settings/settings-service';

/**
 * Initialize and register all core services
 */
export async function initializeServices(): Promise<void> {
  console.log('Initializing core services...');
  
  try {
    // Initialize settings first
    const settingsManager = createSettingsService();
    registerService('settingsManager', settingsManager);
    console.log('Settings manager initialized');
    
    // Initialize memory service
    const memoryService = await getMemoryService();
    registerService('memoryService', memoryService);
    console.log('Memory service initialized');
    
    // Initialize conversation service
    const conversationService = createConversationService();
    registerService('conversationManager', conversationService);
    console.log('Conversation service initialized');
    
    // Initialize TTS service
    const ttsService = createTTSService();
    await ttsService.initialize();
    registerService('ttsService', ttsService);
    console.log('TTS service initialized');
    
    // Initialize evolution service
    const evolutionService = createEvolutionService();
    await evolutionService.initialize();
    registerService('evolutionEngine', evolutionService);
    console.log('Evolution service initialized');
    
    // Initialize auto-improvement service
    const autoImprovementService = createAutoImprovementService();
    await autoImprovementService.initialize();
    registerService('autoImprovementSystem', autoImprovementService);
    console.log('Auto-improvement service initialized');
    
    console.log('All core services initialized successfully');
  } catch (error) {
    console.error('Failed to initialize core services:', error);
    throw error;
  }
}

/**
 * Get the service instances by type
 */
// Helper functions to get service instances from the locator
import { getService } from '../core/services/service-locator';

export function getConversationService(): ConversationManager {
  const service = createConversationService();
  registerService('conversationManager', service);
  return service;
}

export function getTTSService(): TTSService {
  const service = createTTSService();
  registerService('ttsService', service);
  return service;
}

export function getEvolutionService(): EvolutionEngine {
  const service = createEvolutionService();
  registerService('evolutionEngine', service);
  return service;
}

export function getAutoImprovementService(): AutoImprovementSystem {
  const service = createAutoImprovementService();
  registerService('autoImprovementSystem', service);
  return service;
}

export function getSettingsService(): SettingsManager {
  const service = createSettingsService();
  registerService('settingsManager', service);
  return service;
}