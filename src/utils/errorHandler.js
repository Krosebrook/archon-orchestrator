/**
 * Enhanced Error Handling Utilities
 * Provides standardized error handling patterns for Archon Orchestrator
 * 
 * @module utils/errorHandler
 */

import { toast } from 'sonner';

/**
 * Error severity levels
 */
export const ErrorSeverity = {
  LOW: 'low',
  MEDIUM: 'medium',
  HIGH: 'high',
  CRITICAL: 'critical'
};

/**
 * Error categories for tracking and analysis
 */
export const ErrorCategory = {
  NETWORK: 'network',
  VALIDATION: 'validation',
  AUTHENTICATION: 'authentication',
  AUTHORIZATION: 'authorization',
  NOT_FOUND: 'not_found',
  SERVER_ERROR: 'server_error',
  CLIENT_ERROR: 'client_error',
  AGENT_ERROR: 'agent_error',
  WORKFLOW_ERROR: 'workflow_error',
  UNKNOWN: 'unknown'
};

/**
 * Custom application error class with enhanced metadata
 */
export class AppError extends Error {
  constructor(message, options = {}) {
    super(message);
    this.name = 'AppError';
    this.code = options.code || 'UNKNOWN_ERROR';
    this.category = options.category || ErrorCategory.UNKNOWN;
    this.severity = options.severity || ErrorSeverity.MEDIUM;
    this.statusCode = options.statusCode || 500;
    this.details = options.details || {};
    this.timestamp = new Date().toISOString();
    this.traceId = options.traceId || generateTraceId();
    this.isOperational = options.isOperational !== false;
    
    // Capture stack trace
    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, this.constructor);
    }
  }

  toJSON() {
    return {
      name: this.name,
      message: this.message,
      code: this.code,
      category: this.category,
      severity: this.severity,
      statusCode: this.statusCode,
      details: this.details,
      timestamp: this.timestamp,
      traceId: this.traceId,
      stack: this.stack
    };
  }
}

/**
 * Generate a unique trace ID for error tracking
 */
function generateTraceId() {
  return `trace_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}

/**
 * Parse API error responses into standardized AppError format
 * @param {Error|Response|Object} error - The error to parse
 * @returns {AppError} Standardized error object
 */
export async function parseApiError(error) {
  // If already an AppError, return as-is
  if (error instanceof AppError) {
    return error;
  }

  // Handle Response objects from fetch (or objects that look like Response)
  if (error instanceof Response || (error && typeof error.status === 'number' && typeof error.json === 'function')) {
    let errorData;
    try {
      errorData = await error.json();
    } catch {
      errorData = { message: error.statusText };
    }

    const category = categorizeByStatusCode(error.status);
    const severity = getSeverityByStatusCode(error.status);

    return new AppError(
      errorData.message || `HTTP ${error.status}: ${error.statusText}`,
      {
        code: errorData.code || `HTTP_${error.status}`,
        category,
        severity,
        statusCode: error.status,
        details: errorData,
        traceId: errorData.trace_id
      }
    );
  }

  // Handle network errors
  if (error instanceof TypeError && error.message.includes('fetch')) {
    return new AppError('Network connection failed. Please check your internet connection.', {
      code: 'NETWORK_ERROR',
      category: ErrorCategory.NETWORK,
      severity: ErrorSeverity.HIGH,
      details: { originalError: error.message }
    });
  }

  // Handle generic Error objects
  if (error instanceof Error) {
    return new AppError(error.message, {
      code: 'GENERIC_ERROR',
      category: ErrorCategory.UNKNOWN,
      severity: ErrorSeverity.MEDIUM,
      details: { originalError: error.message, stack: error.stack }
    });
  }

  // Handle plain objects or strings
  const message = typeof error === 'string' ? error : error?.message || 'An unknown error occurred';
  return new AppError(message, {
    code: error?.code || 'UNKNOWN_ERROR',
    category: ErrorCategory.UNKNOWN,
    severity: ErrorSeverity.MEDIUM,
    details: typeof error === 'object' ? error : {}
  });
}

/**
 * Categorize error by HTTP status code
 */
function categorizeByStatusCode(status) {
  if (status === 401) return ErrorCategory.AUTHENTICATION;
  if (status === 403) return ErrorCategory.AUTHORIZATION;
  if (status === 404) return ErrorCategory.NOT_FOUND;
  if (status === 422) return ErrorCategory.VALIDATION;
  if (status >= 500) return ErrorCategory.SERVER_ERROR;
  if (status >= 400) return ErrorCategory.CLIENT_ERROR;
  return ErrorCategory.UNKNOWN;
}

/**
 * Determine severity by HTTP status code
 */
function getSeverityByStatusCode(status) {
  if (status >= 500) return ErrorSeverity.HIGH;
  if (status === 401 || status === 403) return ErrorSeverity.MEDIUM;
  if (status === 404) return ErrorSeverity.LOW;
  if (status >= 400) return ErrorSeverity.MEDIUM;
  return ErrorSeverity.LOW;
}

/**
 * Display user-friendly error notification
 * @param {AppError|Error|string} error - Error to display
 * @param {Object} options - Toast options
 */
export function showErrorToast(error, options = {}) {
  const appError = error instanceof AppError ? error : null;
  const message = appError?.message || error?.message || error || 'An error occurred';
  
  const toastOptions = {
    duration: options.duration || 5000,
    ...options
  };

  // Add trace ID to error messages for debugging
  if (appError?.traceId) {
    toastOptions.description = `Trace ID: ${appError.traceId}`;
  }

  toast.error(message, toastOptions);
}

/**
 * Handle errors with automatic logging and user notification
 * @param {Error} error - The error to handle
 * @param {Object} options - Handling options
 * @returns {AppError} Processed error
 */
export async function handleError(error, options = {}) {
  const {
    showToast = true,
    logToConsole = true,
    logToServer = false,
    context = {}
  } = options;

  const appError = await parseApiError(error);

  // Log to console in development
  if (logToConsole && import.meta.env.DEV) {
    console.group(`🚨 ${appError.severity.toUpperCase()} Error`);
    console.error('Message:', appError.message);
    console.error('Code:', appError.code);
    console.error('Category:', appError.category);
    console.error('Trace ID:', appError.traceId);
    console.error('Details:', appError.details);
    console.error('Context:', context);
    console.error('Stack:', appError.stack);
    console.groupEnd();
  }

  // Send to server for logging (if enabled)
  if (logToServer) {
    try {
      await logErrorToServer(appError, context);
    } catch (logError) {
      console.error('Failed to log error to server:', logError);
    }
  }

  // Show user notification
  if (showToast) {
    showErrorToast(appError, options.toastOptions);
  }

  return appError;
}

/**
 * Log error to server for centralized tracking
 * @param {AppError} error - The error to log
 * @param {Object} context - Additional context
 */
async function logErrorToServer(error, context) {
  try {
    // Only log operational errors (not programming errors)
    if (!error.isOperational) {
      return;
    }

    const errorLog = {
      ...error.toJSON(),
      context,
      userAgent: navigator.userAgent,
      url: window.location.href,
      timestamp: new Date().toISOString()
    };

    // Send to logging endpoint (implementation depends on backend)
    await fetch('/api/logs/errors', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(errorLog)
    });
  } catch (err) {
    // Silently fail - don't block user experience for logging errors
    console.error('Error logging failed:', err);
  }
}

/**
 * Retry a failed operation with exponential backoff
 * @param {Function} fn - Async function to retry
 * @param {Object} options - Retry options
 * @returns {Promise} Result of successful operation
 */
export async function retryWithBackoff(fn, options = {}) {
  const {
    maxAttempts = 3,
    initialDelay = 1000,
    maxDelay = 10000,
    factor = 2,
    onRetry = null
  } = options;

  let attempt = 1;
  let delay = initialDelay;

  while (attempt <= maxAttempts) {
    try {
      return await fn();
    } catch (error) {
      if (attempt === maxAttempts) {
        throw error;
      }

      const appError = await parseApiError(error);
      
      // Don't retry non-retryable errors
      if (!isRetryableError(appError)) {
        throw error;
      }

      if (onRetry) {
        onRetry(attempt, delay, appError);
      }

      await sleep(delay);
      delay = Math.min(delay * factor, maxDelay);
      attempt++;
    }
  }
}

/**
 * Determine if an error is retryable
 */
function isRetryableError(error) {
  if (!(error instanceof AppError)) {
    return false;
  }

  // Retry network errors and 5xx server errors
  if (error.category === ErrorCategory.NETWORK) {
    return true;
  }

  if (error.statusCode >= 500 && error.statusCode < 600) {
    return true;
  }

  // Don't retry client errors (4xx) or auth errors
  return false;
}

/**
 * Sleep utility for retry backoff
 */
function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * Error boundary helper - extract useful info from React error
 * @param {Error} error - React error
 * @param {Object} errorInfo - React error info with componentStack
 * @returns {Object} Formatted error details
 */
export function formatReactError(error, errorInfo) {
  return {
    message: error.message,
    stack: error.stack,
    componentStack: errorInfo?.componentStack || '',
    timestamp: new Date().toISOString(),
    traceId: generateTraceId()
  };
}

/**
 * Create a safe error handler wrapper for async functions
 * Useful for event handlers that shouldn't crash the app
 */
export function createSafeHandler(handler, options = {}) {
  return async (...args) => {
    try {
      return await handler(...args);
    } catch (error) {
      await handleError(error, {
        ...options,
        context: { handler: handler.name, args }
      });
      
      if (options.fallback) {
        return options.fallback(...args);
      }
    }
  };
}

/**
 * Validation error helper
 */
export function createValidationError(field, message, details = {}) {
  return new AppError(message, {
    code: 'VALIDATION_ERROR',
    category: ErrorCategory.VALIDATION,
    severity: ErrorSeverity.LOW,
    statusCode: 422,
    details: { field, ...details }
  });
}

/**
 * Not found error helper
 */
export function createNotFoundError(resource, id) {
  return new AppError(`${resource} not found${id ? ` with ID: ${id}` : ''}`, {
    code: 'NOT_FOUND',
    category: ErrorCategory.NOT_FOUND,
    severity: ErrorSeverity.LOW,
    statusCode: 404,
    details: { resource, id }
  });
}

/**
 * Authorization error helper
 */
export function createAuthorizationError(action, resource) {
  return new AppError(`You don't have permission to ${action} ${resource}`, {
    code: 'FORBIDDEN',
    category: ErrorCategory.AUTHORIZATION,
    severity: ErrorSeverity.MEDIUM,
    statusCode: 403,
    details: { action, resource }
  });
}

export default {
  AppError,
  ErrorSeverity,
  ErrorCategory,
  handleError,
  parseApiError,
  showErrorToast,
  retryWithBackoff,
  formatReactError,
  createSafeHandler,
  createValidationError,
  createNotFoundError,
  createAuthorizationError
};
