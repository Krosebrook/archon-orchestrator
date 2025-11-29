/**
 * API Client Utilities
 * Axis: Architecture, Security, Quality
 * 
 * Enhanced error taxonomy with:
 * - Full error classification (code, message, hint, retryable, trace_id)
 * - Retry logic with exponential backoff
 * - Request deduplication
 * - Circuit breaker pattern
 * - Correlation ID propagation
 */

import { toast } from 'sonner';

// =============================================================================
// ERROR TAXONOMY (aligned with backend functions)
// =============================================================================

export const ErrorCodes = Object.freeze({
  // Auth errors
  UNAUTHORIZED: 'UNAUTHORIZED',
  FORBIDDEN: 'FORBIDDEN',
  SESSION_EXPIRED: 'SESSION_EXPIRED',
  
  // Resource errors
  NOT_FOUND: 'NOT_FOUND',
  CONFLICT: 'CONFLICT',
  GONE: 'GONE',
  
  // Input errors
  VALIDATION_ERROR: 'VALIDATION_ERROR',
  INVALID_FORMAT: 'INVALID_FORMAT',
  MISSING_REQUIRED: 'MISSING_REQUIRED',
  
  // Rate/quota errors
  RATE_LIMITED: 'RATE_LIMITED',
  QUOTA_EXCEEDED: 'QUOTA_EXCEEDED',
  
  // Server errors
  SERVER_ERROR: 'SERVER_ERROR',
  SERVICE_UNAVAILABLE: 'SERVICE_UNAVAILABLE',
  GATEWAY_TIMEOUT: 'GATEWAY_TIMEOUT',
  
  // Client errors
  NETWORK_ERROR: 'NETWORK_ERROR',
  TIMEOUT: 'TIMEOUT',
  ABORTED: 'ABORTED',
  
  // AI-specific errors
  AI_PROVIDER_ERROR: 'AI_PROVIDER_ERROR',
  AI_RATE_LIMITED: 'AI_RATE_LIMITED',
  AI_CONTENT_FILTERED: 'AI_CONTENT_FILTERED',
  AI_CONTEXT_TOO_LONG: 'AI_CONTEXT_TOO_LONG'
});

// Error severity levels for observability
export const ErrorSeverity = Object.freeze({
  LOW: 'low',
  MEDIUM: 'medium',
  HIGH: 'high',
  CRITICAL: 'critical'
});

// =============================================================================
// API ERROR CLASS
// =============================================================================

export class APIError extends Error {
  constructor(code, message, options = {}) {
    super(message);
    this.name = 'APIError';
    this.code = code;
    this.hint = options.hint || null;
    this.retryable = options.retryable ?? false;
    this.trace_id = options.trace_id || null;
    this.status = options.status || null;
    this.severity = options.severity || ErrorSeverity.MEDIUM;
    this.timestamp = new Date().toISOString();
    this.context = options.context || {};
    
    // Capture stack trace
    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, APIError);
    }
  }

  toJSON() {
    return {
      name: this.name,
      code: this.code,
      message: this.message,
      hint: this.hint,
      retryable: this.retryable,
      trace_id: this.trace_id,
      status: this.status,
      severity: this.severity,
      timestamp: this.timestamp
    };
  }
}

// =============================================================================
// ERROR NORMALIZATION
// =============================================================================

const STATUS_TO_ERROR = {
  400: { code: ErrorCodes.VALIDATION_ERROR, message: 'Invalid request', severity: ErrorSeverity.LOW },
  401: { code: ErrorCodes.UNAUTHORIZED, message: 'Authentication required', severity: ErrorSeverity.MEDIUM },
  403: { code: ErrorCodes.FORBIDDEN, message: 'Permission denied', severity: ErrorSeverity.MEDIUM },
  404: { code: ErrorCodes.NOT_FOUND, message: 'Resource not found', severity: ErrorSeverity.LOW },
  409: { code: ErrorCodes.CONFLICT, message: 'Resource conflict', severity: ErrorSeverity.MEDIUM },
  410: { code: ErrorCodes.GONE, message: 'Resource no longer available', severity: ErrorSeverity.LOW },
  422: { code: ErrorCodes.VALIDATION_ERROR, message: 'Invalid input', severity: ErrorSeverity.LOW },
  429: { code: ErrorCodes.RATE_LIMITED, message: 'Too many requests', retryable: true, severity: ErrorSeverity.MEDIUM },
  500: { code: ErrorCodes.SERVER_ERROR, message: 'Server error', retryable: true, severity: ErrorSeverity.HIGH },
  502: { code: ErrorCodes.SERVICE_UNAVAILABLE, message: 'Service unavailable', retryable: true, severity: ErrorSeverity.HIGH },
  503: { code: ErrorCodes.SERVICE_UNAVAILABLE, message: 'Service temporarily unavailable', retryable: true, severity: ErrorSeverity.HIGH },
  504: { code: ErrorCodes.GATEWAY_TIMEOUT, message: 'Gateway timeout', retryable: true, severity: ErrorSeverity.HIGH }
};

export function normalizeError(error, context = {}) {
  // Already normalized
  if (error instanceof APIError) {
    return error;
  }

  // Network/fetch errors
  if (!error.response && !error.status) {
    if (error.name === 'AbortError') {
      return new APIError(ErrorCodes.ABORTED, 'Request was cancelled', { 
        retryable: false,
        severity: ErrorSeverity.LOW,
        context
      });
    }
    return new APIError(ErrorCodes.NETWORK_ERROR, 'Network connection failed', { 
      retryable: true,
      severity: ErrorSeverity.HIGH,
      hint: 'Check your internet connection',
      context
    });
  }

  const status = error.response?.status || error.status;
  const data = error.response?.data || error.data || {};
  const mapping = STATUS_TO_ERROR[status] || { 
    code: ErrorCodes.SERVER_ERROR, 
    message: 'Unexpected error',
    retryable: status >= 500,
    severity: status >= 500 ? ErrorSeverity.HIGH : ErrorSeverity.MEDIUM
  };

  return new APIError(
    data.code || mapping.code,
    data.message || mapping.message,
    {
      status,
      hint: data.hint || null,
      retryable: data.retryable ?? mapping.retryable ?? false,
      trace_id: data.trace_id || error.headers?.['x-trace-id'] || null,
      severity: mapping.severity,
      context
    }
  );
}

// =============================================================================
// ERROR HANDLING
// =============================================================================

export function handleError(error, options = {}) {
  const normalized = normalizeError(error, options.context);
  
  // Log with structured format
  const logData = {
    code: normalized.code,
    message: normalized.message,
    trace_id: normalized.trace_id,
    severity: normalized.severity,
    retryable: normalized.retryable
  };
  
  if (normalized.severity === ErrorSeverity.CRITICAL || normalized.severity === ErrorSeverity.HIGH) {
    console.error('[API Error]', logData);
  } else {
    console.warn('[API Error]', logData);
  }

  // Show toast unless silent
  if (!options.silent) {
    const toastMessage = normalized.hint 
      ? `${normalized.message}. ${normalized.hint}` 
      : normalized.message;
    
    if (normalized.severity === ErrorSeverity.CRITICAL) {
      toast.error(toastMessage, { duration: 10000 });
    } else {
      toast.error(toastMessage);
    }
  }

  return normalized;
}

// =============================================================================
// RETRY LOGIC WITH EXPONENTIAL BACKOFF
// =============================================================================

const DEFAULT_RETRY_CONFIG = {
  maxRetries: 3,
  baseDelayMs: 1000,
  maxDelayMs: 10000,
  backoffMultiplier: 2,
  retryableStatuses: [408, 429, 500, 502, 503, 504],
  retryableCodes: [ErrorCodes.RATE_LIMITED, ErrorCodes.SERVICE_UNAVAILABLE, ErrorCodes.GATEWAY_TIMEOUT, ErrorCodes.NETWORK_ERROR]
};

function calculateBackoff(attempt, config) {
  const delay = Math.min(
    config.baseDelayMs * Math.pow(config.backoffMultiplier, attempt),
    config.maxDelayMs
  );
  // Add jitter (±25%)
  const jitter = delay * 0.25 * (Math.random() * 2 - 1);
  return Math.round(delay + jitter);
}

export async function withRetry(fn, config = {}) {
  const retryConfig = { ...DEFAULT_RETRY_CONFIG, ...config };
  let lastError;

  for (let attempt = 0; attempt <= retryConfig.maxRetries; attempt++) {
    try {
      return await fn();
    } catch (error) {
      lastError = normalizeError(error);
      
      const shouldRetry = 
        attempt < retryConfig.maxRetries &&
        (lastError.retryable || 
         retryConfig.retryableStatuses.includes(lastError.status) ||
         retryConfig.retryableCodes.includes(lastError.code));

      if (!shouldRetry) {
        throw lastError;
      }

      const delay = calculateBackoff(attempt, retryConfig);
      console.log(`[Retry] Attempt ${attempt + 1}/${retryConfig.maxRetries}, waiting ${delay}ms`);
      await new Promise(resolve => setTimeout(resolve, delay));
    }
  }

  throw lastError;
}

// =============================================================================
// CIRCUIT BREAKER
// =============================================================================

class CircuitBreaker {
  constructor(name, options = {}) {
    this.name = name;
    this.failureThreshold = options.failureThreshold || 5;
    this.resetTimeMs = options.resetTimeMs || 30000;
    this.halfOpenMaxCalls = options.halfOpenMaxCalls || 3;
    
    this.state = 'CLOSED'; // CLOSED, OPEN, HALF_OPEN
    this.failureCount = 0;
    this.successCount = 0;
    this.lastFailureTime = null;
    this.halfOpenCalls = 0;
  }

  async execute(fn) {
    if (this.state === 'OPEN') {
      if (Date.now() - this.lastFailureTime >= this.resetTimeMs) {
        this.state = 'HALF_OPEN';
        this.halfOpenCalls = 0;
      } else {
        throw new APIError(
          ErrorCodes.SERVICE_UNAVAILABLE,
          `Circuit breaker is open for ${this.name}`,
          { retryable: true, hint: 'Service is temporarily unavailable, try again later' }
        );
      }
    }

    if (this.state === 'HALF_OPEN' && this.halfOpenCalls >= this.halfOpenMaxCalls) {
      throw new APIError(
        ErrorCodes.SERVICE_UNAVAILABLE,
        `Circuit breaker is half-open for ${this.name}`,
        { retryable: true }
      );
    }

    try {
      if (this.state === 'HALF_OPEN') {
        this.halfOpenCalls++;
      }
      
      const result = await fn();
      this.onSuccess();
      return result;
    } catch (error) {
      this.onFailure();
      throw error;
    }
  }

  onSuccess() {
    this.failureCount = 0;
    if (this.state === 'HALF_OPEN') {
      this.successCount++;
      if (this.successCount >= this.halfOpenMaxCalls) {
        this.state = 'CLOSED';
        this.successCount = 0;
      }
    }
  }

  onFailure() {
    this.failureCount++;
    this.lastFailureTime = Date.now();
    
    if (this.state === 'HALF_OPEN') {
      this.state = 'OPEN';
    } else if (this.failureCount >= this.failureThreshold) {
      this.state = 'OPEN';
      console.warn(`[CircuitBreaker] ${this.name} opened after ${this.failureCount} failures`);
    }
  }

  getState() {
    return {
      name: this.name,
      state: this.state,
      failureCount: this.failureCount,
      lastFailureTime: this.lastFailureTime
    };
  }
}

const circuitBreakers = new Map();

export function getCircuitBreaker(name, options) {
  if (!circuitBreakers.has(name)) {
    circuitBreakers.set(name, new CircuitBreaker(name, options));
  }
  return circuitBreakers.get(name);
}

// =============================================================================
// REQUEST DEDUPLICATION
// =============================================================================

const pendingRequests = new Map();

export async function deduplicateRequest(key, fn, ttlMs = 5000) {
  if (pendingRequests.has(key)) {
    return pendingRequests.get(key);
  }

  const promise = fn().finally(() => {
    setTimeout(() => pendingRequests.delete(key), ttlMs);
  });

  pendingRequests.set(key, promise);
  return promise;
}

// =============================================================================
// CORRELATION ID
// =============================================================================

let correlationId = null;

export function getCorrelationId() {
  if (!correlationId) {
    correlationId = `cid_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }
  return correlationId;
}

export function resetCorrelationId() {
  correlationId = `cid_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  return correlationId;
}

// =============================================================================
// REQUEST WRAPPER WITH ALL FEATURES
// =============================================================================

export async function apiRequest(fn, options = {}) {
  const {
    retry = true,
    retryConfig = {},
    circuitBreakerName = null,
    dedupeKey = null,
    silent = false
  } = options;

  const correlationId = getCorrelationId();

  const wrappedFn = async () => {
    try {
      return await fn();
    } catch (error) {
      throw normalizeError(error, { correlationId });
    }
  };

  let executor = wrappedFn;

  // Apply circuit breaker if configured
  if (circuitBreakerName) {
    const breaker = getCircuitBreaker(circuitBreakerName);
    executor = () => breaker.execute(executor);
  }

  // Apply retry logic if enabled
  if (retry) {
    executor = () => withRetry(executor, retryConfig);
  }

  // Apply deduplication if key provided
  if (dedupeKey) {
    executor = () => deduplicateRequest(dedupeKey, executor);
  }

  try {
    return await executor();
  } catch (error) {
    return handleError(error, { silent });
  }
}