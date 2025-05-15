/**
 * Error Handler Service
 * Centralized error handling system with fallback strategies
 */

import { Logger } from '../logging/logger';

// Error severity levels
export enum ErrorSeverity {
  DEBUG = 'debug',
  INFO = 'info',
  WARNING = 'warning',
  ERROR = 'error',
  CRITICAL = 'critical'
}

// Error categories for better organization
export enum ErrorCategory {
  NETWORK = 'network',
  AUTHENTICATION = 'authentication',
  AUTHORIZATION = 'authorization',
  VALIDATION = 'validation',
  PROVIDER = 'provider',
  SYSTEM = 'system',
  TASK = 'task',
  USER = 'user',
  UNKNOWN = 'unknown'
}

// Base error class for the application
export class AppError extends Error {
  severity: ErrorSeverity;
  category: ErrorCategory;
  timestamp: Date;
  originalError?: Error;
  context?: Record<string, any>;

  constructor(
    message: string,
    category: ErrorCategory = ErrorCategory.UNKNOWN,
    severity: ErrorSeverity = ErrorSeverity.ERROR,
    originalError?: Error,
    context?: Record<string, any>
  ) {
    super(message);
    this.name = this.constructor.name;
    this.severity = severity;
    this.category = category;
    this.timestamp = new Date();
    this.originalError = originalError;
    this.context = context;

    // Maintains proper stack trace for where our error was thrown
    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, this.constructor);
    }
  }

  // Format error for logging
  toJSON(): Record<string, any> {
    return {
      name: this.name,
      message: this.message,
      severity: this.severity,
      category: this.category,
      timestamp: this.timestamp.toISOString(),
      stack: this.stack,
      originalError: this.originalError ? {
        name: this.originalError.name,
        message: this.originalError.message,
        stack: this.originalError.stack
      } : undefined,
      context: this.context
    };
  }
}

// Specific error types
export class NetworkError extends AppError {
  constructor(message: string, originalError?: Error, context?: Record<string, any>) {
    super(message, ErrorCategory.NETWORK, ErrorSeverity.ERROR, originalError, context);
  }
}

export class AuthenticationError extends AppError {
  constructor(message: string, originalError?: Error, context?: Record<string, any>) {
    super(message, ErrorCategory.AUTHENTICATION, ErrorSeverity.ERROR, originalError, context);
  }
}

export class ProviderError extends AppError {
  constructor(message: string, originalError?: Error, context?: Record<string, any>) {
    super(message, ErrorCategory.PROVIDER, ErrorSeverity.ERROR, originalError, context);
  }
}

export class TaskError extends AppError {
  constructor(message: string, originalError?: Error, context?: Record<string, any>) {
    super(message, ErrorCategory.TASK, ErrorSeverity.ERROR, originalError, context);
  }
}

export class ValidationError extends AppError {
  constructor(message: string, originalError?: Error, context?: Record<string, any>) {
    super(message, ErrorCategory.VALIDATION, ErrorSeverity.WARNING, originalError, context);
  }
}

// Error handler service
export class ErrorHandler {
  private static instance: ErrorHandler;
  private logger: Logger;
  private errorListeners: Array<(error: AppError) => void> = [];

  private constructor() {
    this.logger = new Logger('ErrorHandler');
  }

  // Get singleton instance
  public static getInstance(): ErrorHandler {
    if (!ErrorHandler.instance) {
      ErrorHandler.instance = new ErrorHandler();
    }
    return ErrorHandler.instance;
  }

  // Handle an error with appropriate logging and fallback strategies
  public handleError(error: Error | AppError, context?: Record<string, any>): AppError {
    let appError: AppError;

    // Convert to AppError if it's a standard Error
    if (!(error instanceof AppError)) {
      appError = this.convertToAppError(error, context);
    } else {
      appError = error;
      // Add additional context if provided
      if (context) {
        appError.context = { ...(appError.context || {}), ...context };
      }
    }

    // Log the error based on severity
    this.logError(appError);

    // Notify any registered error listeners
    this.notifyErrorListeners(appError);

    return appError;
  }

  // Convert standard Error to AppError
  private convertToAppError(error: Error, context?: Record<string, any>): AppError {
    // Try to determine error category based on error message or type
    if (error.message.includes('network') || error.message.includes('timeout') || error.message.includes('connection')) {
      return new NetworkError(error.message, error, context);
    } else if (error.message.includes('authentication') || error.message.includes('auth') || error.message.includes('token') || error.message.includes('key')) {
      return new AuthenticationError(error.message, error, context);
    } else if (error.message.includes('provider') || error.message.includes('model') || error.message.includes('API')) {
      return new ProviderError(error.message, error, context);
    } else if (error.message.includes('task') || error.message.includes('step')) {
      return new TaskError(error.message, error, context);
    } else if (error.message.includes('validation') || error.message.includes('invalid') || error.message.includes('required')) {
      return new ValidationError(error.message, error, context);
    }

    // Default to generic AppError
    return new AppError(error.message, ErrorCategory.UNKNOWN, ErrorSeverity.ERROR, error, context);
  }

  // Log error based on severity
  private logError(error: AppError): void {
    switch (error.severity) {
      case ErrorSeverity.DEBUG:
        this.logger.debug(`[${error.category}] ${error.message}`, error.toJSON());
        break;
      case ErrorSeverity.INFO:
        this.logger.info(`[${error.category}] ${error.message}`, error.toJSON());
        break;
      case ErrorSeverity.WARNING:
        this.logger.warn(`[${error.category}] ${error.message}`, error.toJSON());
        break;
      case ErrorSeverity.ERROR:
        this.logger.error(`[${error.category}] ${error.message}`, error.toJSON());
        break;
      case ErrorSeverity.CRITICAL:
        this.logger.critical(`[${error.category}] ${error.message}`, error.toJSON());
        break;
    }
  }

  // Register an error listener
  public addErrorListener(listener: (error: AppError) => void): void {
    this.errorListeners.push(listener);
  }

  // Remove an error listener
  public removeErrorListener(listener: (error: AppError) => void): void {
    this.errorListeners = this.errorListeners.filter(l => l !== listener);
  }

  // Notify all error listeners
  private notifyErrorListeners(error: AppError): void {
    this.errorListeners.forEach(listener => {
      try {
        listener(error);
      } catch (listenerError) {
        this.logger.error('Error in error listener', { listenerError });
      }
    });
  }

  // Create a fallback function that handles errors and provides a default value
  public withFallback<T, Args extends any[]>(
    fn: (...args: Args) => Promise<T>,
    defaultValue: T,
    errorHandler?: (error: AppError, ...args: Args) => void
  ): (...args: Args) => Promise<T> {
    return async (...args: Args): Promise<T> => {
      try {
        return await fn(...args);
      } catch (error) {
        const appError = this.handleError(error as Error, { args });
        
        if (errorHandler) {
          errorHandler(appError, ...args);
        }
        
        return defaultValue;
      }
    };
  }

  // Create a retry function that attempts to execute a function multiple times
  public withRetry<T, Args extends any[]>(
    fn: (...args: Args) => Promise<T>,
    maxRetries: number = 3,
    delayMs: number = 1000,
    shouldRetry?: (error: AppError) => boolean
  ): (...args: Args) => Promise<T> {
    return async (...args: Args): Promise<T> => {
      let lastError: AppError | null = null;
      
      for (let attempt = 1; attempt <= maxRetries; attempt++) {
        try {
          return await fn(...args);
        } catch (error) {
          const appError = this.handleError(error as Error, { 
            attempt, 
            maxRetries,
            args 
          });
          
          lastError = appError;
          
          // Check if we should retry based on the error
          if (shouldRetry && !shouldRetry(appError)) {
            break;
          }
          
          // Don't delay on the last attempt
          if (attempt < maxRetries) {
            // Exponential backoff
            const backoffDelay = delayMs * Math.pow(2, attempt - 1);
            await new Promise(resolve => setTimeout(resolve, backoffDelay));
          }
        }
      }
      
      // If we get here, all retries failed
      throw lastError || new AppError('All retries failed', ErrorCategory.UNKNOWN, ErrorSeverity.ERROR);
    };
  }
}

// Export singleton instance
export const errorHandler = ErrorHandler.getInstance();