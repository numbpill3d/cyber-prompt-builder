/**
 * Service Initialization
 * Initializes all application services in the correct order
 */

import { Logger, LogLevel } from './logging/logger';
import { errorHandler } from './error/error-handler';
import { configService } from './config/config-service';

const logger = new Logger('ServiceInitializer');

/**
 * Initialize all application services
 * Services are initialized in dependency order
 */
export async function initializeServices(): Promise<void> {
  try {
    logger.info('Initializing application services...');

    // 1. Initialize configuration service (loads env vars and validates)
    try {
      configService.initialize();
      logger.info('✓ Configuration service initialized');
    } catch (error) {
      // Config service may fail if required env vars are missing
      // This is acceptable for client-side app where API keys come from localStorage
      logger.warn('Configuration service initialization skipped (client-side mode)');
    }

    // 2. Set up global error handler
    // Add a global error listener for unhandled errors
    window.addEventListener('error', (event) => {
      errorHandler.handleError(
        new Error(event.message),
        {
          filename: event.filename,
          lineno: event.lineno,
          colno: event.colno
        }
      );
    });

    window.addEventListener('unhandledrejection', (event) => {
      errorHandler.handleError(
        new Error(event.reason?.message || 'Unhandled promise rejection'),
        { reason: event.reason }
      );
    });

    logger.info('✓ Global error handlers registered');

    // 3. Set log level based on environment
    const isDevelopment = import.meta.env.DEV || process.env.NODE_ENV !== 'production';
    if (isDevelopment) {
      Logger.setGlobalLogLevel(LogLevel.DEBUG);
      logger.debug('Debug logging enabled');
    } else {
      Logger.setGlobalLogLevel(LogLevel.INFO);
    }

    logger.info('✓ All services initialized successfully');
  } catch (error) {
    logger.error('Failed to initialize services', { error });
    throw error;
  }
}