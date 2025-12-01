/**
 * @fileoverview TypeScript-like JSDoc type definitions for the Archon platform.
 * Provides type safety through documentation and IDE support.
 * 
 * @module shared/types
 * @version 1.0.0
 */

// =============================================================================
// API ERROR TYPES
// =============================================================================

/**
 * @typedef {Object} APIErrorOptions
 * @property {string} [hint] - User-friendly hint for resolution
 * @property {boolean} [retryable] - Whether the operation can be retried
 * @property {string} [trace_id] - Correlation ID for debugging
 * @property {number} [status] - HTTP status code
 * @property {string} [severity] - Error severity level
 * @property {Object} [context] - Additional context data
 */

/**
 * @typedef {Object} APIErrorJSON
 * @property {string} name - Error name (always 'APIError')
 * @property {string} code - Error code from ErrorCodes enum
 * @property {string} message - Human-readable error message
 * @property {string|null} hint - Resolution hint
 * @property {boolean} retryable - Can operation be retried
 * @property {string|null} trace_id - Correlation ID
 * @property {number|null} status - HTTP status code
 * @property {string} severity - Error severity
 * @property {string} timestamp - ISO timestamp
 */

// =============================================================================
// VALIDATION TYPES
// =============================================================================

/**
 * @typedef {Object} ValidationError
 * @property {string} path - Path to invalid field
 * @property {string} message - Error message
 */

/**
 * @typedef {Object} ValidationResult
 * @property {boolean} valid - Whether validation passed
 * @property {ValidationError[]} errors - List of validation errors
 * @property {*} data - Validated/transformed data (null if invalid)
 */

/**
 * @typedef {Object} PromptInjectionResult
 * @property {boolean} safe - Whether input is safe
 * @property {Array<{pattern: string, match: string}>} threats - Detected threats
 * @property {'none'|'low'|'high'} riskLevel - Overall risk level
 */

/**
 * @typedef {Object} SanitizeOptions
 * @property {boolean} [trim=true] - Trim whitespace
 * @property {boolean} [escapeHtml=true] - Escape HTML entities
 * @property {boolean} [normalizeUnicode] - Normalize unicode
 * @property {number} [maxLength] - Maximum string length
 */

// =============================================================================
// AUDIT TYPES
// =============================================================================

/**
 * @typedef {Object} AuditEntry
 * @property {string} action - Action performed (from AuditActions)
 * @property {string} entity - Entity type (from AuditEntities)
 * @property {string} entity_id - Entity identifier
 * @property {Object|null} before - State before change
 * @property {Object|null} after - State after change
 * @property {string} timestamp - ISO timestamp
 * @property {string} session_id - Browser session ID
 * @property {string|null} correlation_id - Request correlation ID
 * @property {string} hash - Integrity hash
 * @property {string} severity - Entry severity
 * @property {Object} metadata - Additional metadata
 * @property {string|null} ip_address - Client IP
 * @property {string|null} user_agent - Client user agent
 */

/**
 * @typedef {Object} AuditChanges
 * @property {Object} [before] - State before change
 * @property {Object} [after] - State after change
 */

/**
 * @typedef {Object} AuditOptions
 * @property {string} [severity] - Entry severity
 * @property {Object} [metadata] - Additional metadata
 * @property {string} [ipAddress] - Client IP address
 */

// =============================================================================
// PERFORMANCE TYPES
// =============================================================================

/**
 * @typedef {Object} PerformanceMetrics
 * @property {string} name - Operation name
 * @property {number} duration - Duration in milliseconds
 * @property {number|null} memory_delta_kb - Memory change in KB
 * @property {number} budget - Performance budget
 * @property {boolean} exceeded - Whether budget was exceeded
 * @property {number} timestamp - Unix timestamp
 */

/**
 * @typedef {Object} PerformanceStats
 * @property {number} count - Number of samples
 * @property {number} avg - Average duration
 * @property {number} min - Minimum duration
 * @property {number} max - Maximum duration
 * @property {number} p50 - 50th percentile
 * @property {number} p95 - 95th percentile
 * @property {number} p99 - 99th percentile
 */

/**
 * @typedef {Object} WebVitalMetric
 * @property {'LCP'|'FID'|'CLS'} name - Metric name
 * @property {number} value - Metric value
 * @property {'good'|'needs-improvement'|'poor'} rating - Performance rating
 */

/**
 * @typedef {Object} DebounceOptions
 * @property {boolean} [leading=false] - Invoke on leading edge
 * @property {boolean} [trailing=true] - Invoke on trailing edge
 * @property {number} [maxWait] - Maximum wait time
 */

// =============================================================================
// CIRCUIT BREAKER TYPES
// =============================================================================

/**
 * @typedef {'CLOSED'|'OPEN'|'HALF_OPEN'} CircuitBreakerState
 */

/**
 * @typedef {Object} CircuitBreakerStatus
 * @property {string} name - Breaker name
 * @property {CircuitBreakerState} state - Current state
 * @property {number} failureCount - Current failure count
 * @property {number|null} lastFailureTime - Last failure timestamp
 */

/**
 * @typedef {Object} CircuitBreakerOptions
 * @property {number} [failureThreshold=5] - Failures before opening
 * @property {number} [resetTimeMs=30000] - Time before half-open
 * @property {number} [halfOpenMaxCalls=3] - Calls allowed in half-open
 */

// =============================================================================
// RATE LIMIT TYPES
// =============================================================================

/**
 * @typedef {Object} RateLimitResult
 * @property {boolean} allowed - Whether request is allowed
 * @property {number} remaining - Remaining requests in window
 * @property {number} resetAt - Timestamp when limit resets
 * @property {number} limit - Configured limit
 */

// =============================================================================
// COT REASONING TYPES
// =============================================================================

/**
 * @typedef {Object} ReasoningStep
 * @property {number} step_number - Step sequence number
 * @property {string} step_type - Type from ReasoningStepType
 * @property {string} thought - Reasoning thought
 * @property {string[]} evidence - Supporting evidence
 * @property {string} confidence - Confidence level
 */

/**
 * @typedef {Object} ReasoningFinalAnswer
 * @property {string} conclusion - Final conclusion
 * @property {string} confidence - Overall confidence
 * @property {string[]} key_insights - Key insights
 * @property {string[]} limitations - Known limitations
 */

/**
 * @typedef {Object} ReasoningMetadata
 * @property {number} total_steps - Total reasoning steps
 * @property {string} reasoning_path - Path description
 * @property {boolean} alternative_considered - Whether alternatives were considered
 */

/**
 * @typedef {Object} CoTResult
 * @property {ReasoningStep[]} reasoning_trace - Reasoning steps
 * @property {ReasoningFinalAnswer} final_answer - Final answer
 * @property {ReasoningMetadata} metadata - Execution metadata
 */

/**
 * @typedef {Object} CoTValidation
 * @property {boolean} valid - Whether output is valid
 * @property {string[]} errors - Validation errors
 * @property {string[]} warnings - Validation warnings
 * @property {'high'|'medium'|'low'} quality - Output quality
 */

/**
 * @typedef {Object} PromptCompressionResult
 * @property {string} compressed - Compressed prompt
 * @property {number} [originalLength] - Original length
 * @property {number} [compressedLength] - Compressed length
 * @property {number} ratio - Compression ratio
 * @property {number} [tokensSaved] - Estimated tokens saved
 */

/**
 * @typedef {Object} CostEstimate
 * @property {number} inputTokens - Estimated input tokens
 * @property {number} outputTokens - Estimated output tokens
 * @property {number} totalTokens - Total tokens
 * @property {number} estimatedCostUSD - Cost in USD
 * @property {number} estimatedCostCents - Cost in cents
 */

// =============================================================================
// RBAC TYPES
// =============================================================================

/**
 * @typedef {'owner'|'admin'|'operator'|'viewer'} Role
 */

/**
 * @typedef {Object} RBACContext
 * @property {Role} role - Current user role
 * @property {(permission: string) => boolean} hasPermission - Permission checker
 * @property {(permission: string, action?: string) => void} guard - Permission guard
 * @property {boolean} isOwner - Is owner role
 * @property {boolean} isAdmin - Is admin or owner
 * @property {boolean} canMutate - Can perform mutations
 */

// =============================================================================
// ASYNC STATE TYPES
// =============================================================================

/**
 * @typedef {Object} AsyncState
 * @property {*} data - Resolved data
 * @property {Error|null} error - Error if failed
 * @property {boolean} isLoading - Loading state
 * @property {boolean} isSuccess - Success state
 * @property {boolean} isError - Error state
 */

/**
 * @typedef {Object} AsyncActions
 * @property {(...args: any[]) => Promise<any>} execute - Execute async function
 * @property {() => void} reset - Reset state
 */

/**
 * @typedef {AsyncState & AsyncActions} UseAsyncReturn
 */

// =============================================================================
// EXPORT MARKER (for documentation)
// =============================================================================

export const Types = {
  // This file only contains JSDoc typedefs
  // Export a marker for documentation purposes
  __types__: true
};