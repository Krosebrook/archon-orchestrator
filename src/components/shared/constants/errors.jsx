/**
 * @fileoverview Error Taxonomy & Classification
 * @description Production-grade error codes, severity, and metadata following
 * Archon canonical error structure: code, message, hint, retryable, trace_id.
 * 
 * @module shared/constants/errors
 * @version 2.0.0
 */

/**
 * Standard error codes following Archon taxonomy
 * @readonly
 * @enum {string}
 */
export const ErrorCodes = Object.freeze({
  // Client Errors (4xx)
  VALIDATION_ERROR: 'VALIDATION_ERROR',
  UNAUTHORIZED: 'UNAUTHORIZED',
  FORBIDDEN: 'FORBIDDEN',
  NOT_FOUND: 'NOT_FOUND',
  CONFLICT: 'CONFLICT',
  RATE_LIMITED: 'RATE_LIMITED',
  ABORTED: 'ABORTED',
  
  // Server Errors (5xx)
  SERVER_ERROR: 'SERVER_ERROR',
  SERVICE_UNAVAILABLE: 'SERVICE_UNAVAILABLE',
  TIMEOUT: 'TIMEOUT',
  NETWORK_ERROR: 'NETWORK_ERROR',
  
  // AI Provider Errors
  AI_PROVIDER_ERROR: 'AI_PROVIDER_ERROR',
  AI_RATE_LIMIT: 'AI_RATE_LIMIT',
  AI_INVALID_REQUEST: 'AI_INVALID_REQUEST',
  AI_CONTEXT_LENGTH: 'AI_CONTEXT_LENGTH',
  
  // Business Logic Errors
  POLICY_VIOLATION: 'POLICY_VIOLATION',
  APPROVAL_REQUIRED: 'APPROVAL_REQUIRED',
  CIRCUIT_BREAKER_OPEN: 'CIRCUIT_BREAKER_OPEN',
  
  // Data Errors
  DATABASE_ERROR: 'DATABASE_ERROR',
  RLS_VIOLATION: 'RLS_VIOLATION',
  INTEGRITY_ERROR: 'INTEGRITY_ERROR'
});

/**
 * Error severity levels for observability and alerting
 * @readonly
 * @enum {string}
 */
export const ErrorSeverity = Object.freeze({
  LOW: 'low',           // Informational, self-recovering
  MEDIUM: 'medium',     // User-facing, needs attention
  HIGH: 'high',         // Service degradation
  CRITICAL: 'critical'  // Service outage
});

/**
 * HTTP status code to error code mapping
 * @readonly
 */
export const HttpStatusToError = Object.freeze({
  400: { 
    code: ErrorCodes.VALIDATION_ERROR, 
    message: 'Invalid request',
    retryable: false,
    severity: ErrorSeverity.LOW
  },
  401: { 
    code: ErrorCodes.UNAUTHORIZED, 
    message: 'Authentication required',
    retryable: false,
    severity: ErrorSeverity.MEDIUM
  },
  403: { 
    code: ErrorCodes.FORBIDDEN, 
    message: 'Insufficient permissions',
    retryable: false,
    severity: ErrorSeverity.MEDIUM
  },
  404: { 
    code: ErrorCodes.NOT_FOUND, 
    message: 'Resource not found',
    retryable: false,
    severity: ErrorSeverity.LOW
  },
  409: { 
    code: ErrorCodes.CONFLICT, 
    message: 'Resource conflict',
    retryable: true,
    severity: ErrorSeverity.MEDIUM
  },
  429: { 
    code: ErrorCodes.RATE_LIMITED, 
    message: 'Too many requests',
    retryable: true,
    severity: ErrorSeverity.MEDIUM
  },
  500: { 
    code: ErrorCodes.SERVER_ERROR, 
    message: 'Internal server error',
    retryable: true,
    severity: ErrorSeverity.HIGH
  },
  503: { 
    code: ErrorCodes.SERVICE_UNAVAILABLE, 
    message: 'Service temporarily unavailable',
    retryable: true,
    severity: ErrorSeverity.HIGH
  },
  504: { 
    code: ErrorCodes.TIMEOUT, 
    message: 'Request timeout',
    retryable: true,
    severity: ErrorSeverity.HIGH
  }
});

/**
 * Error hints - user-friendly guidance for common errors
 * @readonly
 */
export const ErrorHints = Object.freeze({
  [ErrorCodes.UNAUTHORIZED]: 'Please log in to continue',
  [ErrorCodes.FORBIDDEN]: 'Contact your organization admin for access',
  [ErrorCodes.NOT_FOUND]: 'The requested resource may have been deleted',
  [ErrorCodes.RATE_LIMITED]: 'Please wait a moment before trying again',
  [ErrorCodes.NETWORK_ERROR]: 'Check your internet connection',
  [ErrorCodes.TIMEOUT]: 'The operation took too long - try again with a smaller dataset',
  [ErrorCodes.AI_RATE_LIMIT]: 'AI provider rate limit reached - retry in a few seconds',
  [ErrorCodes.AI_CONTEXT_LENGTH]: 'Input is too long - try reducing the context size',
  [ErrorCodes.CIRCUIT_BREAKER_OPEN]: 'Service is temporarily unavailable - it will recover automatically',
  [ErrorCodes.POLICY_VIOLATION]: 'This action is blocked by a governance policy',
  [ErrorCodes.APPROVAL_REQUIRED]: 'This action requires admin approval'
});

/**
 * Determine if an error code is retryable
 * @param {string} code - Error code
 * @returns {boolean}
 */
export function isRetryableError(code) {
  const retryableCodes = new Set([
    ErrorCodes.RATE_LIMITED,
    ErrorCodes.TIMEOUT,
    ErrorCodes.SERVICE_UNAVAILABLE,
    ErrorCodes.NETWORK_ERROR,
    ErrorCodes.AI_RATE_LIMIT,
    ErrorCodes.CONFLICT,
    ErrorCodes.CIRCUIT_BREAKER_OPEN
  ]);
  return retryableCodes.has(code);
}

/**
 * Get error severity for a given code
 * @param {string} code - Error code
 * @returns {string} Severity level
 */
export function getErrorSeverity(code) {
  const criticalErrors = new Set([
    ErrorCodes.SERVER_ERROR,
    ErrorCodes.DATABASE_ERROR,
    ErrorCodes.RLS_VIOLATION,
    ErrorCodes.INTEGRITY_ERROR
  ]);
  
  const highErrors = new Set([
    ErrorCodes.SERVICE_UNAVAILABLE,
    ErrorCodes.TIMEOUT,
    ErrorCodes.CIRCUIT_BREAKER_OPEN
  ]);
  
  const mediumErrors = new Set([
    ErrorCodes.UNAUTHORIZED,
    ErrorCodes.FORBIDDEN,
    ErrorCodes.RATE_LIMITED,
    ErrorCodes.POLICY_VIOLATION,
    ErrorCodes.APPROVAL_REQUIRED
  ]);
  
  if (criticalErrors.has(code)) return ErrorSeverity.CRITICAL;
  if (highErrors.has(code)) return ErrorSeverity.HIGH;
  if (mediumErrors.has(code)) return ErrorSeverity.MEDIUM;
  return ErrorSeverity.LOW;
}