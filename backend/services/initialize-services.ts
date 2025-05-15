/**
 * Service Initialization
 * Sets up error handling, logging, and configuration systems
 */

import { Logger, LogLevel } from './logging/logger';
import { errorHandler } from './error/error-handler';
import { configService } from './config/config-service';

// Initialize logger
const logger = new Logger('ServiceInitializer');

/**
 * Initialize all core services
 * This should be called early in the application lifecycle
 */
export const initializeServices = async (): Promise<void> => {
  try {
    logger.info('Initializing services');
    
    // Initialize configuration service first
    await initializeConfig();
    
    // Initialize logging system with config
    await initializeLogging();
    
    // Initialize error handling system
    await initializeErrorHandling();
    
    logger.info('Services initialized successfully');
  } catch (error) {
    console.error('Failed to initialize services:', error);
    throw error;
  }
};

/**
 * Initialize configuration service
 */
const initializeConfig = async (): Promise<void> => {
  try {
    logger.info('Initializing configuration service');
    
    // Initialize configuration from environment variables
    configService.initialize();
    
    logger.info('Configuration service initialized');
  } catch (error) {
    logger.error('Failed to initialize configuration service', { error });
    throw error;
  }
};

/**
 * Initialize logging system
 */
const initializeLogging = async (): Promise<void> => {
  try {
    logger.info('Initializing logging system');
    
    // Set global log level from configuration
    try {
      const configLogLevel = configService.get<string>('logging', 'level');
      if (configLogLevel) {
        const logLevel = parseLogLevel(configLogLevel);
        Logger.setGlobalLogLevel(logLevel);
        logger.info(`Log level set to ${LogLevel[logLevel]}`);
      }
    } catch (error) {
      logger.warn('Failed to get log level from config, using default', { error });
    }
    
    logger.info('Logging system initialized');
  } catch (error) {
    logger.error('Failed to initialize logging system', { error });
    throw error;
  }
};

/**
 * Initialize error handling system
 */
const initializeErrorHandling = async (): Promise<void> => {
  try {
    logger.info('Initializing error handling system');
    
    // Add global error listener for uncaught errors
    errorHandler.addErrorListener((error) => {
      logger.error('Uncaught error', { error });
    });
    
    // Set up global error handlers for browser environment
    if (typeof window !== 'undefined') {
      // Handle uncaught exceptions
      window.addEventListener('error', (event) => {
        logger.error('Uncaught exception', { 
          message: event.message,
          filename: event.filename,
          lineno: event.lineno,
          colno: event.colno,
          error: event.error
        });
      });
      
      // Handle unhandled promise rejections
      window.addEventListener('unhandledrejection', (event) => {
        logger.error('Unhandled promise rejection', { 
          reason: event.reason
        });
      });
    }
    
    logger.info('Error handling system initialized');
  } catch (error) {
    logger.error('Failed to initialize error handling system', { error });
    throw error;
  }
};

/**
 * Parse log level string to LogLevel enum
 */
const parseLogLevel = (level: string): LogLevel => {
  switch (level.toLowerCase()) {
    case 'debug':
      return LogLevel.DEBUG;
    case 'info':
      return LogLevel.INFO;
    case 'warn':
      return LogLevel.WARN;
    case 'error':
      return LogLevel.ERROR;
    case 'critical':
      return LogLevel.CRITICAL;
    case 'none':
      return LogLevel.NONE;
    default:
      return LogLevel.INFO;
  }
};

// Export individual initialization functions for testing
export { initializeConfig, initializeLogging, initializeErrorHandling };