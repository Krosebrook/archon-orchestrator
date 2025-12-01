/**
 * @fileoverview Centralized constants for the Archon platform.
 * Extracted from utils to enable configuration and testing.
 * 
 * @module shared/constants
 * @version 1.0.0
 */

// =============================================================================
// PERFORMANCE BUDGETS (Configurable)
// =============================================================================

/**
 * Performance timing budgets in milliseconds.
 * Override via environment or runtime config.
 * @readonly
 * @enum {number}
 */
export const PerformanceBudgets = Object.freeze({
  /** Non-AI API call budget */
  API_CALL: 300,
  /** AI-backed operation budget */
  AI_CALL: 1500,
  /** React render target (60fps) */
  RENDER: 16,
  /** Database query budget */
  DATABASE_QUERY: 100,
  /** File upload budget */
  FILE_UPLOAD: 5000,
  /** Initial page load (LCP) budget */
  INITIAL_LOAD: 2500
});

// =============================================================================
// ERROR CODES
// =============================================================================

/**
 * Standardized error codes aligned with backend functions.
 * @readonly
 * @enum {string}
 */
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

/**
 * Error severity levels for observability.
 * @readonly
 * @enum {string}
 */
export const ErrorSeverity = Object.freeze({
  LOW: 'low',
  MEDIUM: 'medium',
  HIGH: 'high',
  CRITICAL: 'critical'
});

// =============================================================================
// AUDIT CONSTANTS
// =============================================================================

/**
 * Audit action types.
 * @readonly
 * @enum {string}
 */
export const AuditActions = Object.freeze({
  CREATE: 'create',
  UPDATE: 'update',
  DELETE: 'delete',
  VIEW: 'view',
  EXECUTE: 'execute',
  LOGIN: 'login',
  LOGOUT: 'logout',
  EXPORT: 'export',
  IMPORT: 'import',
  APPROVE: 'approve',
  REJECT: 'reject',
  CONFIGURE: 'configure',
  DEPLOY: 'deploy',
  ROLLBACK: 'rollback'
});

/**
 * Auditable entity types.
 * @readonly
 * @enum {string}
 */
export const AuditEntities = Object.freeze({
  WORKFLOW: 'Workflow',
  AGENT: 'Agent',
  RUN: 'Run',
  POLICY: 'Policy',
  USER: 'User',
  TEAM: 'Team',
  INTEGRATION: 'Integration',
  SKILL: 'Skill',
  TEMPLATE: 'Template',
  SYSTEM: 'System'
});

/**
 * Audit severity levels.
 * @readonly
 * @enum {string}
 */
export const AuditSeverity = Object.freeze({
  INFO: 'info',
  WARNING: 'warning',
  CRITICAL: 'critical'
});

// =============================================================================
// RBAC CONSTANTS
// =============================================================================

/**
 * User roles in order of privilege (highest first).
 * @readonly
 * @enum {string}
 */
export const Roles = Object.freeze({
  OWNER: 'owner',
  ADMIN: 'admin',
  OPERATOR: 'operator',
  VIEWER: 'viewer'
});

/**
 * Permission to role mapping.
 * Defines which roles can perform which actions.
 * @readonly
 * @type {Record<string, string[]>}
 */
export const Permissions = Object.freeze({
  'workflow.view': ['owner', 'admin', 'operator', 'viewer'],
  'workflow.create': ['owner', 'admin', 'operator'],
  'workflow.edit': ['owner', 'admin', 'operator'],
  'workflow.delete': ['owner', 'admin'],
  'workflow.run': ['owner', 'admin', 'operator'],
  'agent.view': ['owner', 'admin', 'operator', 'viewer'],
  'agent.create': ['owner', 'admin'],
  'agent.edit': ['owner', 'admin'],
  'agent.delete': ['owner', 'admin'],
  'policy.view': ['owner', 'admin', 'operator', 'viewer'],
  'policy.create': ['owner', 'admin'],
  'policy.edit': ['owner', 'admin'],
  'policy.delete': ['owner'],
  'approval.view': ['owner', 'admin', 'operator'],
  'approval.approve': ['owner', 'admin'],
  'settings.view': ['owner', 'admin'],
  'settings.edit': ['owner'],
  'audit.view': ['owner', 'admin'],
  'audit.export': ['owner', 'admin']
});

// =============================================================================
// COT REASONING CONSTANTS
// =============================================================================

/**
 * Chain-of-Thought reasoning step types.
 * @readonly
 * @enum {string}
 */
export const ReasoningStepType = Object.freeze({
  ANALYZE: 'analyze',
  DECOMPOSE: 'decompose',
  EVALUATE: 'evaluate',
  SYNTHESIZE: 'synthesize',
  VALIDATE: 'validate',
  CONCLUDE: 'conclude'
});

/**
 * Confidence levels for reasoning outputs.
 * @readonly
 * @enum {string}
 */
export const ConfidenceLevel = Object.freeze({
  HIGH: 'high',
  MEDIUM: 'medium',
  LOW: 'low',
  UNCERTAIN: 'uncertain'
});

// =============================================================================
// RETRY CONFIGURATION
// =============================================================================

/**
 * Default retry configuration for API calls.
 * @readonly
 * @type {Object}
 */
export const DefaultRetryConfig = Object.freeze({
  maxRetries: 3,
  baseDelayMs: 1000,
  maxDelayMs: 10000,
  backoffMultiplier: 2,
  retryableStatuses: [408, 429, 500, 502, 503, 504],
  retryableCodes: [
    ErrorCodes.RATE_LIMITED,
    ErrorCodes.SERVICE_UNAVAILABLE,
    ErrorCodes.GATEWAY_TIMEOUT,
    ErrorCodes.NETWORK_ERROR
  ]
});

// =============================================================================
// CIRCUIT BREAKER CONFIGURATION
// =============================================================================

/**
 * Default circuit breaker configuration.
 * @readonly
 * @type {Object}
 */
export const DefaultCircuitBreakerConfig = Object.freeze({
  failureThreshold: 5,
  resetTimeMs: 30000,
  halfOpenMaxCalls: 3
});

// =============================================================================
// RATE LIMIT CONFIGURATION
// =============================================================================

/**
 * Default rate limit configurations by operation type.
 * @readonly
 * @type {Object}
 */
export const RateLimitConfig = Object.freeze({
  /** Standard API calls */
  API: { limit: 100, windowMs: 60000 },
  /** AI/LLM calls */
  AI: { limit: 20, windowMs: 60000 },
  /** Authentication attempts */
  AUTH: { limit: 5, windowMs: 300000 },
  /** Export operations */
  EXPORT: { limit: 5, windowMs: 3600000 },
  /** Bulk operations */
  BULK: { limit: 10, windowMs: 60000 }
});

// =============================================================================
// VALIDATION PATTERNS
// =============================================================================

/**
 * Common validation regex patterns.
 * @readonly
 * @type {Object}
 */
export const ValidationPatterns = Object.freeze({
  EMAIL: /^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)*$/,
  UUID: /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i,
  SEMVER: /^\d+\.\d+\.\d+(-[a-zA-Z0-9.]+)?(\+[a-zA-Z0-9.]+)?$/,
  WORKFLOW_NAME: /^[a-zA-Z0-9][a-zA-Z0-9\s_-]*$/,
  SLUG: /^[a-z0-9]+(?:-[a-z0-9]+)*$/
});

// =============================================================================
// HTTP STATUS MAPPINGS
// =============================================================================

/**
 * HTTP status code to error mapping.
 * @readonly
 * @type {Record<number, Object>}
 */
export const HttpStatusToError = Object.freeze({
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
});