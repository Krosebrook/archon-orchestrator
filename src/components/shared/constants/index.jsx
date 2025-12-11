/**
 * @fileoverview Constants Module Barrel Export
 * @description Central export point for all application constants following
 * Archon canonical standards for configuration, errors, RBAC, and audit.
 * 
 * @module shared/constants
 * @version 2.0.0
 */

// =============================================================================
// ERROR TAXONOMY
// =============================================================================

export {
  ErrorCodes,
  ErrorSeverity,
  HttpStatusToError,
  ErrorHints,
  isRetryableError,
  getErrorSeverity
} from './errors';

// =============================================================================
// CONFIGURATION
// =============================================================================

export {
  PerformanceBudgets,
  DefaultRetryConfig,
  DefaultCircuitBreakerConfig,
  RateLimitConfig,
  PaginationConfig,
  AuditBatchConfig,
  WebSocketConfig,
  ObservabilityConfig,
  FeatureFlags,
  AIProviderConfig,
  ValidationPatterns,
  SecurityConfig,
  validateEnvironment,
  getEnvironmentConfig
} from './config';

// =============================================================================
// RBAC
// =============================================================================

export {
  Roles,
  PermissionNamespaces,
  PermissionActions,
  Permissions,
  RoleHierarchy,
  hasPermission,
  getRolePermissions,
  can,
  guard,
  getRoleDisplayName,
  getRoleDescription
} from './rbac';

// =============================================================================
// AUDIT
// =============================================================================

export {
  AuditActions,
  AuditEntities,
  AuditSeverity,
  CriticalAuditActions,
  ApprovalRequiredActions,
  PII_FIELD_PATTERNS,
  getAuditSeverity,
  requiresApproval,
  generateAuditMessage
} from './audit';

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