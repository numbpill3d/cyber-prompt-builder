/**
 * Security Configuration
 * Defines security policies and validation rules
 */

/**
 * Content Security Policy configuration
 */
export const CSP_CONFIG = {
  'default-src': ["'self'"],
  'script-src': ["'self'", "'unsafe-inline'", "'unsafe-eval'"],
  'style-src': ["'self'", "'unsafe-inline'", "https://fonts.googleapis.com"],
  'font-src': ["'self'", "https://fonts.gstatic.com"],
  'img-src': ["'self'", "data:", "https:"],
  'connect-src': [
    "'self'",
    "https://api.openai.com",
    "https://api.anthropic.com",
    "https://generativelanguage.googleapis.com"
  ],
  'frame-ancestors': ["'none'"],
  'base-uri': ["'self'"],
  'form-action': ["'self'"]
};

/**
 * API endpoint validation
 */
export const ALLOWED_API_ENDPOINTS = [
  'https://api.openai.com/v1/',
  'https://api.anthropic.com/v1/',
  'https://generativelanguage.googleapis.com/v1/'
];

/**
 * Input sanitization rules
 */
export const SANITIZATION_RULES = {
  maxPromptLength: 10000,
  maxFileSize: 1024 * 1024, // 1MB
  allowedFileTypes: ['.txt', '.md', '.json', '.js', '.ts', '.jsx', '.tsx', '.py', '.java', '.cpp', '.c', '.h'],
  forbiddenPatterns: [
    /<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi,
    /javascript:/gi,
    /vbscript:/gi,
    /onload\s*=/gi,
    /onerror\s*=/gi
  ]
};

/**
 * Rate limiting configuration
 */
export const RATE_LIMITS = {
  apiCalls: {
    windowMs: 60 * 1000, // 1 minute
    maxRequests: 60
  },
  fileOperations: {
    windowMs: 60 * 1000, // 1 minute
    maxRequests: 100
  }
};

/**
 * Validate API key format
 */
export function validateApiKey(key: string, provider: 'openai' | 'claude' | 'gemini'): boolean {
  if (!key || typeof key !== 'string') {
    return false;
  }

  switch (provider) {
    case 'openai':
      return /^sk-[a-zA-Z0-9]{48}$/.test(key);
    case 'claude':
      return /^sk-ant-[a-zA-Z0-9-_]{95}$/.test(key);
    case 'gemini':
      return /^[a-zA-Z0-9-_]{39}$/.test(key);
    default:
      return false;
  }
}

/**
 * Sanitize user input
 */
export function sanitizeInput(input: string): string {
  if (!input || typeof input !== 'string') {
    return '';
  }

  let sanitized = input;

  // Remove forbidden patterns
  SANITIZATION_RULES.forbiddenPatterns.forEach(pattern => {
    sanitized = sanitized.replace(pattern, '');
  });

  // Limit length
  if (sanitized.length > SANITIZATION_RULES.maxPromptLength) {
    sanitized = sanitized.substring(0, SANITIZATION_RULES.maxPromptLength);
  }

  return sanitized.trim();
}

/**
 * Validate file type
 */
export function isAllowedFileType(filename: string): boolean {
  const extension = filename.toLowerCase().substring(filename.lastIndexOf('.'));
  return SANITIZATION_RULES.allowedFileTypes.includes(extension);
}

/**
 * Generate CSP header value
 */
export function generateCSPHeader(): string {
  return Object.entries(CSP_CONFIG)
    .map(([directive, sources]) => `${directive} ${sources.join(' ')}`)
    .join('; ');
}