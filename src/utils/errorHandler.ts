/**
 * Enhanced Error Handling Utilities
 * Provides standardized error handling patterns for Archon Orchestrator
 * 
 * @module utils/errorHandler
 */

import { toast } from 'sonner';
import type { AppError as AppErrorType } from '@/types/common';

/**
 * Error severity levels
 */
export const ErrorSeverity = {
  LOW: 'low',
  MEDIUM: 'medium',
  HIGH: 'high',
  CRITICAL: 'critical'
} as const;

export type ErrorSeverityLevel = typeof ErrorSeverity[keyof typeof ErrorSeverity];

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
} as const;

export type ErrorCategoryType = typeof ErrorCategory[keyof typeof ErrorCategory];

interface AppErrorOptions {
  code?: string;
  category?: ErrorCategoryType;
  severity?: ErrorSeverityLevel;
  statusCode?: number;
  details?: Record<string, any>;
  traceId?: string;
  isOperational?: boolean;
}

/**
 * Custom application error class with enhanced metadata
 */
export class AppError extends Error {
  public readonly code: string;
  public readonly category: ErrorCategoryType;
  public readonly severity: ErrorSeverityLevel;
  public readonly statusCode: number;
  public readonly details: Record<string, any>;
  public readonly timestamp: string;
  public readonly traceId: string;
  public readonly isOperational: boolean;

  constructor(message: string, options: AppErrorOptions = {}) {
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
function generateTraceId(): string {
  return `trace_${Date.now()}_${Math.random().toString(36).substring(2, 11)}`;
}

/**
 * Parse API error responses into standardized AppError format
 * @param error - The error to parse
 * @returns Standardized error object
 */
export async function parseApiError(error: unknown): Promise<AppError> {
  // If already an AppError, return as-is
  if (error instanceof AppError) {
    return error;
  }

  // Handle Response objects from fetch
  if (error instanceof Response) {
    let errorData: any;
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
  const message = typeof error === 'string' ? error : (error as any)?.message || 'An unknown error occurred';
  return new AppError(message, {
    code: (error as any)?.code || 'UNKNOWN_ERROR',
    category: ErrorCategory.UNKNOWN,
    severity: ErrorSeverity.MEDIUM,
    details: typeof error === 'object' ? (error as any) : {}
  });
}

/**
 * Categorize error by HTTP status code
 */
function categorizeByStatusCode(status: number): ErrorCategoryType {
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
function getSeverityByStatusCode(status: number): ErrorSeverityLevel {
  if (status >= 500) return ErrorSeverity.HIGH;
  if (status === 401 || status === 403) return ErrorSeverity.MEDIUM;
  if (status === 404) return ErrorSeverity.LOW;
  if (status >= 400) return ErrorSeverity.MEDIUM;
  return ErrorSeverity.LOW;
}

interface ToastOptions {
  duration?: number;
  description?: string;
  [key: string]: any;
}

/**
 * Display user-friendly error notification
 * @param error - Error to display
 * @param options - Toast options
 */
export function showErrorToast(error: AppError | Error | string, options: ToastOptions = {}): void {
  const appError = error instanceof AppError ? error : null;
  const message = appError?.message || (error as Error)?.message || (error as string) || 'An error occurred';
  
  const toastOptions: ToastOptions = {
    duration: options.duration || 5000,
    ...options
  };

  // Add trace ID to error messages for debugging
  if (appError?.traceId) {
    toastOptions.description = `Trace ID: ${appError.traceId}`;
  }

  toast.error(message, toastOptions);
}

interface HandleErrorOptions {
  showToast?: boolean;
  logToConsole?: boolean;
  logToServer?: boolean;
  context?: Record<string, any>;
  toastOptions?: ToastOptions;
}

/**
 * Handle errors with automatic logging and user notification
 * @param error - The error to handle
 * @param options - Handling options
 * @returns Processed error
 */
export async function handleError(error: unknown, options: HandleErrorOptions = {}): Promise<AppError> {
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
 * @param error - The error to log
 * @param context - Additional context
 */
async function logErrorToServer(error: AppError, context: Record<string, any>): Promise<void> {
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

interface RetryOptions {
  maxAttempts?: number;
  initialDelay?: number;
  maxDelay?: number;
  factor?: number;
  onRetry?: (attempt: number, delay: number, error: AppError) => void;
}

/**
 * Retry a failed operation with exponential backoff
 * @param fn - Async function to retry
 * @param options - Retry options
 * @returns Result of successful operation
 */
export async function retryWithBackoff<T>(
  fn: () => Promise<T>,
  options: RetryOptions = {}
): Promise<T> {
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
  
  throw new Error('Retry loop completed without success');
}

/**
 * Determine if an error is retryable
 */
function isRetryableError(error: AppError): boolean {
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
function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

interface ReactErrorInfo {
  componentStack?: string;
}

/**
 * Error boundary helper - extract useful info from React error
 * @param error - React error
 * @param errorInfo - React error info with componentStack
 * @returns Formatted error details
 */
export function formatReactError(error: Error, errorInfo: ReactErrorInfo) {
  return {
    message: error.message,
    stack: error.stack,
    componentStack: errorInfo?.componentStack || '',
    timestamp: new Date().toISOString(),
    traceId: generateTraceId()
  };
}

interface SafeHandlerOptions extends HandleErrorOptions {
  fallback?: (...args: any[]) => any;
}

/**
 * Create a safe error handler wrapper for async functions
 * Useful for event handlers that shouldn't crash the app
 */
export function createSafeHandler<T extends (...args: any[]) => Promise<any>>(
  handler: T,
  options: SafeHandlerOptions = {}
): (...args: Parameters<T>) => Promise<ReturnType<T> | void> {
  return async (...args: Parameters<T>) => {
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
export function createValidationError(field: string, message: string, details: Record<string, any> = {}): AppError {
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
export function createNotFoundError(resource: string, id?: string): AppError {
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
export function createAuthorizationError(action: string, resource: string): AppError {
  return new AppError(`You don't have permission to ${action} ${resource}`, {
    code: 'FORBIDDEN',
    category: ErrorCategory.AUTHORIZATION,
    severity: ErrorSeverity.MEDIUM,
    statusCode: 403,
    details: { action, resource }
  });
}
