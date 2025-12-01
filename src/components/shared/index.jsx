
/**
 * @fileoverview Shared Module Barrel Export
 * @description Central export point for all shared utilities, constants, and types.
 * 
 * @module shared
 * @version 1.0.0
 * 
 * @example
 * import { ErrorCodes, PerformanceBudgets, Permissions } from '@/components/shared';
 */

// =============================================================================
// CONSTANTS
// =============================================================================

export {
  // Performance
  PerformanceBudgets,
  
  // Errors
  ErrorCodes,
  ErrorSeverity,
  HttpStatusToError,
  
  // Audit
  AuditActions,
  AuditEntities,
  AuditSeverity,
  
  // RBAC
  Roles,
  Permissions,
  
  // AI/CoT
  ReasoningStepType,
  ConfidenceLevel,
  
  // Config
  DefaultRetryConfig,
  DefaultCircuitBreakerConfig,
  RateLimitConfig,
  ValidationPatterns
} from './constants';

// =============================================================================
// TYPES (JSDoc only - for documentation)
// =============================================================================

export { Types } from './types';

// =============================================================================
// DOCUMENTATION
// =============================================================================

export { ARCHITECTURE_DOC, README_DOC, SECURITY_DOC } from './docs';
