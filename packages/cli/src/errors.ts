/**
 * Error handling utilities for safe error responses.
 * Ensures internal implementation details (stack traces, file paths)
 * are never exposed to clients.
 */

/**
 * Standard error codes for API responses.
 */
export enum ErrorCode {
  /** Input validation failed (safe to expose details) */
  VALIDATION_ERROR = 'VALIDATION_ERROR',
  /** Provider API request failed */
  PROVIDER_ERROR = 'PROVIDER_ERROR',
  /** Constraint parsing or resolution failed */
  CONSTRAINT_ERROR = 'CONSTRAINT_ERROR',
  /** Request exceeded timeout */
  TIMEOUT_ERROR = 'TIMEOUT_ERROR',
  /** Authentication/authorization failed */
  AUTH_ERROR = 'AUTH_ERROR',
  /** Rate limit exceeded */
  RATE_LIMIT_ERROR = 'RATE_LIMIT_ERROR',
  /** Unknown internal error (never expose details) */
  INTERNAL_ERROR = 'INTERNAL_ERROR',
}

/**
 * Safe error response structure for API clients.
 * Never contains stack traces or internal paths.
 */
export interface SafeError {
  /** Human-readable error message (sanitized) */
  error: string;
  /** Machine-readable error code */
  code: ErrorCode;
}

/**
 * Base class for application errors that are safe to expose.
 */
export class AppError extends Error {
  constructor(
    message: string,
    public readonly code: ErrorCode,
    public readonly statusCode: number = 500
  ) {
    super(message);
    this.name = 'AppError';
  }
}

/**
 * Validation error - message is safe to expose to clients.
 */
export class ValidationError extends AppError {
  constructor(message: string) {
    super(message, ErrorCode.VALIDATION_ERROR, 400);
    this.name = 'ValidationError';
  }
}

/**
 * Provider API error - internal details should not be exposed.
 */
export class ProviderError extends AppError {
  constructor(
    message: string,
    public readonly provider?: string,
    public readonly originalError?: Error
  ) {
    super(message, ErrorCode.PROVIDER_ERROR, 502);
    this.name = 'ProviderError';
  }
}

/**
 * Constraint parsing or resolution error.
 */
export class ConstraintError extends AppError {
  constructor(message: string) {
    super(message, ErrorCode.CONSTRAINT_ERROR, 400);
    this.name = 'ConstraintError';
  }
}

/**
 * Request timeout error.
 */
export class TimeoutError extends AppError {
  constructor(message: string = 'Request timed out') {
    super(message, ErrorCode.TIMEOUT_ERROR, 504);
    this.name = 'TimeoutError';
  }
}

/**
 * Authentication/authorization error.
 */
export class AuthError extends AppError {
  constructor(message: string = 'Authentication required') {
    super(message, ErrorCode.AUTH_ERROR, 401);
    this.name = 'AuthError';
  }
}

/**
 * Rate limit exceeded error.
 */
export class RateLimitError extends AppError {
  constructor(message: string = 'Rate limit exceeded') {
    super(message, ErrorCode.RATE_LIMIT_ERROR, 429);
    this.name = 'RateLimitError';
  }
}

/**
 * Patterns that indicate sensitive information in error messages.
 */
const SENSITIVE_PATTERNS = [
  // File paths (Unix and Windows)
  /\/(?:home|usr|var|etc|opt|tmp|Users|[A-Za-z]:)[^\s]*/gi,
  /[A-Z]:\\[^\s]*/gi,
  // Stack traces
  /\s+at\s+[^\n]+/g,
  // Line numbers in stack traces
  /:\d+:\d+\)?$/gm,
  // Node.js internal paths
  /node:internal\/[^\s]*/g,
  // Package paths
  /node_modules\/[^\s]*/g,
];

/**
 * Removes sensitive information from error messages.
 * Used as a safety net - prefer using typed errors.
 */
export function stripSensitiveInfo(message: string): string {
  let sanitized = message;
  for (const pattern of SENSITIVE_PATTERNS) {
    sanitized = sanitized.replace(pattern, '[redacted]');
  }
  // Collapse multiple [redacted] into one
  sanitized = sanitized.replace(/(\[redacted\]\s*)+/g, '[redacted] ');
  return sanitized.trim();
}

/**
 * Logger interface for internal error logging.
 */
export interface ErrorLogger {
  error(message: string, error: unknown): void;
}

/**
 * Default error logger that writes to console.error.
 */
export const consoleErrorLogger: ErrorLogger = {
  error(message: string, error: unknown): void {
    console.error(message, error);
  },
};

/**
 * Silent error logger for testing.
 */
export const silentErrorLogger: ErrorLogger = {
  error(): void {
    // No-op
  },
};

/**
 * Options for error sanitization.
 */
export interface SanitizeErrorOptions {
  /** Logger for internal errors. Default: consoleErrorLogger */
  logger?: ErrorLogger;
}

/**
 * Converts any error to a safe error response.
 *
 * - AppError subclasses: Uses the error's message and code
 * - Provider errors (API key, rate limit): Returns appropriate code
 * - Unknown errors: Logs internally, returns generic message
 *
 * @param error - The error to sanitize
 * @param options - Sanitization options
 * @returns Safe error response for clients
 */
export function sanitizeError(
  error: unknown,
  options: SanitizeErrorOptions = {}
): SafeError {
  const { logger = consoleErrorLogger } = options;

  // Handle our typed errors
  if (error instanceof AppError) {
    return {
      error: error.message,
      code: error.code,
    };
  }

  // Handle standard errors with heuristics
  if (error instanceof Error) {
    const message = error.message.toLowerCase();

    // API key errors - safe to indicate auth issue
    if (message.includes('api key') || message.includes('api_key') ||
        message.includes('unauthorized') || message.includes('authentication')) {
      return {
        error: 'API key is missing or invalid',
        code: ErrorCode.AUTH_ERROR,
      };
    }

    // Rate limiting
    if (message.includes('rate limit') || message.includes('too many requests')) {
      return {
        error: 'Rate limit exceeded, please retry later',
        code: ErrorCode.RATE_LIMIT_ERROR,
      };
    }

    // Timeout errors
    if (message.includes('timeout') || message.includes('timed out') ||
        error.name === 'TimeoutError' || error.name === 'AbortError') {
      return {
        error: 'Request timed out',
        code: ErrorCode.TIMEOUT_ERROR,
      };
    }

    // Validation-like errors (empty input, invalid format)
    if (message.includes('empty') || message.includes('invalid') ||
        message.includes('missing') || message.includes('required')) {
      // Strip any sensitive info just in case
      return {
        error: stripSensitiveInfo(error.message),
        code: ErrorCode.VALIDATION_ERROR,
      };
    }

    // Provider/network errors
    if (message.includes('econnrefused') || message.includes('enotfound') ||
        message.includes('network') || message.includes('fetch')) {
      return {
        error: 'Provider service unavailable',
        code: ErrorCode.PROVIDER_ERROR,
      };
    }
  }

  // Unknown error - log full details internally, return generic message
  logger.error('Internal error:', error);
  return {
    error: 'Internal server error',
    code: ErrorCode.INTERNAL_ERROR,
  };
}

/**
 * Gets the appropriate HTTP status code for an error.
 */
export function getErrorStatusCode(error: unknown): number {
  if (error instanceof AppError) {
    return error.statusCode;
  }

  // Use sanitizeError to determine the code, then map to status
  const safeError = sanitizeError(error, { logger: silentErrorLogger });

  switch (safeError.code) {
    case ErrorCode.VALIDATION_ERROR:
    case ErrorCode.CONSTRAINT_ERROR:
      return 400;
    case ErrorCode.AUTH_ERROR:
      return 401;
    case ErrorCode.RATE_LIMIT_ERROR:
      return 429;
    case ErrorCode.TIMEOUT_ERROR:
      return 504;
    case ErrorCode.PROVIDER_ERROR:
      return 502;
    case ErrorCode.INTERNAL_ERROR:
    default:
      return 500;
  }
}
