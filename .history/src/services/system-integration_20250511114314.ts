/**
 * System Integration Service
 * 
 * Core integration service that connects all system components and provides
 * a unified API surface for the expanded system capabilities.
 */

import { getMemoryService, MemoryService } from './memory/memory-service';
import { conversationService } from './conversation/conversation-service';
import { ttsService } from './tts/tts-service';
import { evolutionService } from './evolution/evolution-service';
import { autoImprovementService } from './auto-improvement/auto-improvement-service';
import { settingsManager } from './settings-manager';
import { MemoryType } from './memory/memory-types';

/**
 * Service registry type definition
 */
export interface ServiceRegistry {
  memory: MemoryService;
  conversation: typeof conversationService;
  tts: typeof ttsService;
  evolution: typeof evolutionService;
  autoImprovement: typeof autoImprovementService;
  [key: string]: any;
}

/**
 * Integration initialization options
 */
export interface SystemIntegrationOptions {
  enableMemory: boolean;
  enableTts: boolean;
  enableEvolution: boolean;
  enableAutoImprovement: boolean;
  initializeOnStartup: boolean;
}

// Default options
const DEFAULT_OPTIONS: SystemIntegrationOptions = {
  enableMemory: true,
  enableTts: true,
  enableEvolution: true,
  enableAutoImprovement: true,
  initializeOnStartup: true
};

/**
 * System Integration Service implementation
 * Provides unified interface for accessing and coordinating all system components
 */
export class SystemIntegrationService {
  private options: SystemIntegrationOptions;
  private serviceRegistry: ServiceRegistry;
  private initialized: boolean = false;
  private initializationPromise: Promise<void> | null = null;
  
  constructor(options: Partial<SystemIntegrationOptions> = {}) {
    this.options = { ...DEFAULT_OPTIONS, ...options };
    
    // Initialize service registry with placeholder for memory service
    this.serviceRegistry = {
      memory: null as any, // Will be properly initialized during initialization
      conversation: conversationService,
      tts: ttsService,
      evolution: evolutionService,
      autoImprovement: autoImprovementService
    };
    
    // Auto-initialize if configured
    if (this.options.initializeOnStartup) {
      this.initialize();
    }
  }
  
  /**
   * Initialize all required services
   */
  public async initialize(): Promise<void> {
    // Return existing initialization promise if in progress
    if (this.initializationPromise) {
      return this.initializationPromise;
    }
    
    // If already initialized, return immediately
    if (this.initialized) {
      return Promise.resolve();
    }
    
    // Start initialization
    this.initializationPromise = this.performInitialization();
    return this.initializationPromise;
  }
  
  /**
   * Perform the actual initialization sequence
   */
  private async performInitialization(): Promise<void> {
    try {
      console.log('Starting system integration initialization...');
      
      // Initialize memory service first (as other services may depend on it)
      if (this.options.enableMemory) {
        console.log('Initializing memory service...');
        this.serviceRegistry.memory = await getMemoryService();
      }
      
      // Initialize TTS service
      if (this.options.enableTts) {
        console.log('Initializing TTS service...');
        await this.serviceRegistry.tts.initialize();
      }
      
      // Initialize evolution service
      if (this.options.enableEvolution) {
        console.log('Initializing evolution service...');
        await this.serviceRegistry.evolution.initialize();
      }
      
      // Initialize auto-improvement service (depends on evolution service)
      if (this.options.enableAutoImprovement && this.options.enableEvolution) {
        console.log('Initializing auto-improvement service...');
        await this.serviceRegistry.autoImprovement.initialize();
      }
      
      this.initialized = true;
      this.initializationPromise = null;
      console.log('System integration initialization complete.');
      
      return Promise.resolve();
    } catch (error) {
      this.initializationPromise = null;
      console.error('System integration initialization failed:', error);
      throw error;
    }
  }
  
  /**
   * Get access to the service registry
   */
  public getServiceRegistry(): ServiceRegistry {
    return this.serviceRegistry;
  }
  
  /**
   * Get a specific service from the registry
   */
  public getService<T>(serviceName: string): T {
    if (!this.serviceRegistry[serviceName]) {
      throw new Error(`Service not found: ${serviceName}`);
    }
    
    return this.serviceRegistry[serviceName] as T;
  }
  
  /**
   * Register an additional service
   */
  public registerService(name: string, service: any): void {
    this.serviceRegistry[name] = service;
  }
  
  /**
   * Check if the system is fully initialized
   */
  public isInitialized(): boolean {
    return this.initialized;
  }
  
  /**
   * Get the current configuration options
   */
  public getOptions(): SystemIntegrationOptions {
    return { ...this.options };
  }
  
  /**
   * Update configuration options
   */
  public updateOptions(options: Partial<SystemIntegrationOptions>): void {
    this.options = { ...this.options, ...options };
  }
  
  /**
   * Process a conversation response using integrated services
   * This provides a single entry point for handling model responses with
   * additional processing like TTS, memory storage, and evolution tracking
   */
  public async processResponse(
    sessionId: string,
    prompt: string,
    response: string,
    modelId: string,
    options: {
      speakResponse?: boolean;
      storeInMemory?: boolean;
      trackMetrics?: boolean;
    } = {}
  ): Promise<void> {
    const defaultOptions = {
      speakResponse: true,
      storeInMemory: true,
      trackMetrics: true
    };
    
    const opts = { ...defaultOptions, ...options };
    
    // Process with TTS if enabled
    if (opts.speakResponse && this.options.enableTts) {
      this.serviceRegistry.tts.speak(response);
    }
    
    // Store in memory if enabled
    if (opts.storeInMemory && this.options.enableMemory) {
      await this.serviceRegistry.memory.addMemory('conversation-history', response, {
        sessionId,
        type: MemoryType.CHAT,
        source: 'ai',
        tags: ['conversation'],
        custom: {
          model: modelId,
          prompt
        }
      });
    }
    
    // Track metrics for evolution if enabled
    if (opts.trackMetrics && this.options.enableEvolution) {
      await this.serviceRegistry.evolution.recordMetrics({
        timestamp: Date.now(),
        modelId,
        // Only include properties that are part of EvolutionMetrics
        accuracy: 0.8, // Placeholder
        responsiveness: 0.95, // Placeholder
        relevance: 0.9, // Placeholder
        complexity: 0.7 // Placeholder
      }, sessionId, modelId);
    }
  }
  
  /**
   * Create an error handler that provides fallbacks when services fail
   */
  public createErrorHandler(
    serviceName: string, 
    operation: string
  ): (error: Error) => void {
    return (error: Error) => {
      console.error(`Error in ${serviceName}.${operation}:`, error);
      
      // Log the error for tracking
      if (this.options.enableEvolution) {
        this.serviceRegistry.evolution.recordMetrics({
          timestamp: Date.now(),
          accuracy: 0.5, // Reduced accuracy due to error
          successRate: 0.0, // Failure
          userSatisfaction: 0.2 // Low satisfaction due to error
        }, 'system', 'error-handler');
      }
      
      // Announce the error via TTS if enabled
      if (this.options.enableTts) {
        this.serviceRegistry.tts.speakRaw(`Error in ${serviceName} during ${operation}. ${error.message}`);
      }
    };
  }
  
  /**
   * Run a complete auto-improvement cycle integrating all components
   */
  public async runImprovementCycle(sessionId?: string): Promise<any> {
    if (!this.options.enableAutoImprovement || !this.options.enableEvolution) {
      throw new Error('Auto-improvement or evolution services are not enabled');
    }
    
    // Generate evolution report
    const report = sessionId ? 
      await this.serviceRegistry.evolution.generateReport(sessionId) :
      { sessionId: 'system', timestamp: Date.now() }; // Fallback report
    
    // Run auto-improvement cycle based on report
    return this.serviceRegistry.autoImprovement.runImprovementCycle(
      report.sessionId
    );
  }
  
  /**
   * Retrieve and combine context from multiple sources
   */
  public async getCombinedContext(
    query: string,
    sessionId: string,
    options: {
      includeConversation?: boolean;
      includeMemory?: boolean;
      maxResults?: number;
    } = {}
  ): Promise<any> {
    const defaultOptions = {
      includeConversation: true,
      includeMemory: true,
      maxResults: 5
    };
    
    const opts = { ...defaultOptions, ...options };
    const context: any = { query, results: [] };
    
    // Get conversation context if enabled
    if (opts.includeConversation) {
      try {
        const relatedTurns = await this.serviceRegistry.conversation.findRelatedTurns(
          query, opts.maxResults
        );
        
        if (relatedTurns.length > 0) {
          context.results.push({
            source: 'conversation',
            items: relatedTurns
          });
        }
      } catch (error) {
        this.createErrorHandler('conversation', 'findRelatedTurns')(error);
      }
    }
    
    // Get memory context if enabled
    if (opts.includeMemory && this.options.enableMemory) {
      try {
        const memoryResults = await this.serviceRegistry.memory.searchMemories(
          'conversation-history',
          {
            query,
            maxResults: opts.maxResults,
            sessionId
          }
        );
        
        if (memoryResults.entries.length > 0) {
          context.results.push({
            source: 'memory',
            items: memoryResults.entries
          });
        }
      } catch (error) {
        this.createErrorHandler('memory', 'searchMemories')(error);
      }
    }
    
    return context;
  }
}

// Create a singleton instance for use throughout the app
export const systemIntegration = new SystemIntegrationService();