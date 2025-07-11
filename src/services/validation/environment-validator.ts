/**
 * Environment Validation Service
 * Validates environment configuration and provides warnings for production readiness
 */

import { Logger } from '../logging/logger';
import { errorHandler, ValidationError } from '../error/error-handler';

/**
 * Environment validation result
 */
export interface ValidationResult {
  isValid: boolean;
  errors: string[];
  warnings: string[];
  recommendations: string[];
}

/**
 * Environment validation configuration
 */
export interface ValidationConfig {
  requireApiKeys: boolean;
  requireSecureConnection: boolean;
  checkPerformanceSettings: boolean;
  validateBrowserSupport: boolean;
}

/**
 * Environment Validator Service
 */
export class EnvironmentValidator {
  private static instance: EnvironmentValidator;
  private logger: Logger;

  private constructor() {
    this.logger = new Logger('EnvironmentValidator');
  }

  /**
   * Get singleton instance
   */
  public static getInstance(): EnvironmentValidator {
    if (!EnvironmentValidator.instance) {
      EnvironmentValidator.instance = new EnvironmentValidator();
    }
    return EnvironmentValidator.instance;
  }

  /**
   * Validate the current environment
   */
  public validateEnvironment(config: Partial<ValidationConfig> = {}): ValidationResult {
    const validationConfig: ValidationConfig = {
      requireApiKeys: false,
      requireSecureConnection: process.env.NODE_ENV === 'production',
      checkPerformanceSettings: true,
      validateBrowserSupport: true,
      ...config
    };

    const result: ValidationResult = {
      isValid: true,
      errors: [],
      warnings: [],
      recommendations: []
    };

    try {
      // Validate API keys
      if (validationConfig.requireApiKeys) {
        this.validateApiKeys(result);
      }

      // Validate secure connection
      if (validationConfig.requireSecureConnection) {
        this.validateSecureConnection(result);
      }

      // Check performance settings
      if (validationConfig.checkPerformanceSettings) {
        this.validatePerformanceSettings(result);
      }

      // Validate browser support
      if (validationConfig.validateBrowserSupport) {
        this.validateBrowserSupport(result);
      }

      // Validate environment variables
      this.validateEnvironmentVariables(result);

      // Set overall validity
      result.isValid = result.errors.length === 0;

      return result;
    } catch (error) {
      this.logger.error('Environment validation error', { error });
      errorHandler.handleError(error as Error, { context: 'environment-validation' });
      
      result.isValid = false;
      result.errors.push('Failed to validate environment: ' + (error as Error).message);
      return result;
    }
  }

  /**
   * Validate API keys
   */
  private validateApiKeys(result: ValidationResult): void {
    const apiKeys = {
      openai: process.env.REACT_APP_PROVIDERS_OPENAI_API_KEY,
      claude: process.env.REACT_APP_PROVIDERS_CLAUDE_API_KEY,
      gemini: process.env.REACT_APP_PROVIDERS_GEMINI_API_KEY
    };

    const hasAnyKey = Object.values(apiKeys).some(key => key && key.trim() !== '');

    if (!hasAnyKey) {
      result.warnings.push('No AI provider API keys configured. Some features may not work.');
    }
  }

  /**
   * Validate secure connection
   */
  private validateSecureConnection(result: ValidationResult): void {
    if (typeof window !== 'undefined') {
      const isSecure = window.location.protocol === 'https:' || 
                      window.location.hostname === 'localhost' ||
                      window.location.hostname === '127.0.0.1';

      if (!isSecure && process.env.NODE_ENV === 'production') {
        result.errors.push('Application must be served over HTTPS in production.');
      }
    }
  }

  /**
   * Validate performance settings
   */
  private validatePerformanceSettings(result: ValidationResult): void {
    // Check memory settings
    const maxTokens = process.env.REACT_APP_PROMPT_BUILDER_MAX_TOKENS;
    if (maxTokens && parseInt(maxTokens) > 8192) {
      result.warnings.push('High token limit may impact performance and costs.');
    }
  }

  /**
   * Validate browser support
   */
  private validateBrowserSupport(result: ValidationResult): void {
    if (typeof window === 'undefined') {
      return;
    }

    const requiredFeatures = [
      { name: 'localStorage', check: () => 'localStorage' in window },
      { name: 'fetch', check: () => 'fetch' in window },
      { name: 'Promise', check: () => 'Promise' in window }
    ];

    requiredFeatures.forEach(feature => {
      try {
        if (!feature.check()) {
          result.errors.push(`Browser does not support ${feature.name}, which is required for the application.`);
        }
      } catch (error) {
        result.warnings.push(`Could not check support for ${feature.name}.`);
      }
    });
  }

  /**
   * Validate environment variables
   */
  private validateEnvironmentVariables(result: ValidationResult): void {
    const environment = process.env.REACT_APP_APP_ENVIRONMENT;
    if (environment && !['development', 'test', 'production'].includes(environment)) {
      result.warnings.push(`Invalid environment: ${environment}. Should be development, test, or production.`);
    }

    const maxIterations = process.env.REACT_APP_AGENT_MAX_ITERATIONS;
    if (maxIterations) {
      const num = parseInt(maxIterations);
      if (isNaN(num) || num < 1 || num > 10) {
        result.warnings.push('REACT_APP_AGENT_MAX_ITERATIONS should be a number between 1 and 10.');
      }
    }
  }

  /**
   * Get environment summary
   */
  public getEnvironmentSummary(): Record<string, unknown> {
    return {
      nodeEnv: process.env.NODE_ENV,
      appEnvironment: process.env.REACT_APP_APP_ENVIRONMENT,
      hasApiKeys: {
        openai: !!process.env.REACT_APP_PROVIDERS_OPENAI_API_KEY,
        claude: !!process.env.REACT_APP_PROVIDERS_CLAUDE_API_KEY,
        gemini: !!process.env.REACT_APP_PROVIDERS_GEMINI_API_KEY
      },
      defaultProvider: process.env.REACT_APP_PROVIDERS_DEFAULT_PROVIDER
    };
  }
}

// Export singleton instance
export const environmentValidator = EnvironmentValidator.getInstance();