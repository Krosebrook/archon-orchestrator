
/**
 * @fileoverview Utils Module Barrel Export
 * @description Central export point for all utility functions.
 * 
 * @module utils
 * @version 1.0.0
 * 
 * @example
 * import { apiRequest, sanitizeInput, auditCreate, measurePerformance } from '@/components/utils';
 */

// =============================================================================
// API CLIENT
// =============================================================================

export {
  // Errors
  ErrorCodes,
  ErrorSeverity,
  APIError,
  normalizeError,
  handleError,
  
  // Retry & Circuit Breaker
  withRetry,
  getCircuitBreaker,
  
  // Deduplication
  deduplicateRequest,
  
  // Correlation
  getCorrelationId,
  resetCorrelationId,
  
  // Main request wrapper
  apiRequest
} from './api-client';

// =============================================================================
// VALIDATION
// =============================================================================

export {
  // Basic validators
  isValidEmail,
  isValidUrl,
  isValidJson,
  isValidUUID,
  isValidSemver,
  
  // Sanitization
  sanitizeHtml,
  sanitizeInput,
  
  // Prompt injection
  detectPromptInjection,
  sanitizePromptInput,
  
  // Schema validation
  Schema,
  validate,
  
  // Domain validators
  WorkflowNameSchema,
  AgentConfigSchema,
  validateWorkflowName,
  validateAgentConfig,
  
  // Rate limiting
  checkRateLimit,
  resetRateLimit
} from './validation';

// =============================================================================
// AUDIT LOGGER
// =============================================================================

export {
  // Constants
  AuditActions,
  AuditEntities,
  AuditSeverity,
  
  // Redaction
  redactSensitiveData,
  
  // Session
  getCorrelationId as getAuditCorrelationId,
  setCorrelationId as setAuditCorrelationId,
  generateCorrelationId,
  
  // Audit functions
  createAuditLog,
  auditCreate,
  auditUpdate,
  auditDelete,
  auditExecute,
  auditCritical,
  
  // Export
  formatAuditForExport,
  flushPendingAudits
} from './audit-logger';

// =============================================================================
// PERFORMANCE
// =============================================================================

export {
  // Budgets
  PerformanceBudgets,
  
  // Measurement
  measurePerformance,
  measured,
  
  // Debounce & Throttle
  debounce,
  throttle,
  
  // Memoization
  memoize,
  
  // Batching
  createBatcher,
  
  // Lazy loading
  lazy,
  
  // Metrics
  performanceCollector,
  
  // Idle
  runWhenIdle,
  cancelIdleTask
} from './performance';

// =============================================================================
// WEB VITALS
// =============================================================================

// Placeholder to prevent import errors during cache clearing
export { default as observeWebVitals } from './web-vitals';

// =============================================================================
// COT REASONING
// =============================================================================

export {
  // Types
  ReasoningStepType,
  ConfidenceLevel,
  
  // Prompt compression
  compressPrompt,
  
  // Reasoning execution
  executeCoTReasoning,
  executeDualPathReasoning,
  
  // Validation
  validateCoTOutput,
  
  // Templates
  ReasoningTemplates,
  
  // Cost
  estimateCoTCost
} from './cot-reasoning';

// =============================================================================
// RATE LIMITER
// =============================================================================

export {
  RateLimiter,
  rateLimit
} from './rateLimiter';
