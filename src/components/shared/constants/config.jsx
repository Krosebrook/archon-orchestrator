/**
 * @fileoverview Application Configuration Constants
 * @description Production-grade configuration with validation, feature flags,
 * and environment-specific settings following Archon canonical standards.
 * 
 * @module shared/constants/config
 * @version 2.0.0
 */

/**
 * Performance budgets (in milliseconds)
 * @readonly
 */
export const PerformanceBudgets = Object.freeze({
  API_CALL_NON_AI: 300,      // P95 < 300ms
  API_CALL_AI: 1500,          // P95 < 1500ms
  REACT_RENDER: 16,           // 60fps target
  INITIAL_LOAD_LCP: 2500,     // Largest Contentful Paint
  BUNDLE_SIZE_KB: 180         // Initial JS bundle (gzip)
});

/**
 * Retry configuration defaults
 * @readonly
 */
export const DefaultRetryConfig = Object.freeze({
  maxRetries: 3,
  baseDelayMs: 1000,
  maxDelayMs: 10000,
  backoffMultiplier: 2,
  retryableStatuses: [408, 429, 500, 502, 503, 504],
  retryableCodes: [
    'TIMEOUT',
    'RATE_LIMITED',
    'SERVICE_UNAVAILABLE',
    'NETWORK_ERROR',
    'AI_RATE_LIMIT'
  ]
});

/**
 * Circuit breaker configuration
 * @readonly
 */
export const DefaultCircuitBreakerConfig = Object.freeze({
  failureThreshold: 5,        // Open after 5 failures
  resetTimeMs: 30000,         // 30s cooldown
  halfOpenMaxCalls: 3         // 3 test calls in half-open
});

/**
 * Rate limiting configuration
 * @readonly
 */
export const RateLimitConfig = Object.freeze({
  API_CALLS: { limit: 100, windowMs: 60000 },      // 100/min
  AI_CALLS: { limit: 20, windowMs: 60000 },        // 20/min
  AUTH_ATTEMPTS: { limit: 5, windowMs: 300000 },   // 5/5min
  EXPORTS: { limit: 5, windowMs: 3600000 },        // 5/hour
  BULK_OPS: { limit: 10, windowMs: 60000 }         // 10/min
});

/**
 * Pagination defaults
 * @readonly
 */
export const PaginationConfig = Object.freeze({
  DEFAULT_PAGE_SIZE: 20,
  MAX_PAGE_SIZE: 100,
  DEFAULT_SORT: '-created_date'
});

/**
 * Audit batch processor configuration
 * @readonly
 */
export const AuditBatchConfig = Object.freeze({
  batchSize: 10,
  flushIntervalMs: 5000
});

/**
 * WebSocket configuration
 * @readonly
 */
export const WebSocketConfig = Object.freeze({
  reconnectDelayMs: 1000,
  maxReconnectDelayMs: 30000,
  reconnectBackoffMultiplier: 1.5,
  heartbeatIntervalMs: 30000,
  connectionTimeoutMs: 10000
});

/**
 * Observability configuration
 * @readonly
 */
export const ObservabilityConfig = Object.freeze({
  TRACE_SAMPLING_RATE: 0.1,     // Sample 10% of traces
  METRICS_FLUSH_INTERVAL: 60000, // 1 minute
  LOG_LEVEL: process.env.NODE_ENV === 'production' ? 'info' : 'debug'
});

/**
 * Feature flags (from environment)
 * @readonly
 */
export const FeatureFlags = Object.freeze({
  ENABLE_ANALYTICS: process.env.NEXT_PUBLIC_ENABLE_ANALYTICS === 'true',
  ENABLE_AI_DEBUGGER: process.env.NEXT_PUBLIC_ENABLE_AI_DEBUGGER === 'true',
  ENABLE_SKILL_MARKETPLACE: process.env.NEXT_PUBLIC_ENABLE_SKILL_MARKETPLACE === 'true',
  ENABLE_REALTIME: process.env.NEXT_PUBLIC_ENABLE_REALTIME === 'true',
  ENABLE_TELEMETRY: process.env.NEXT_PUBLIC_ENABLE_TELEMETRY !== 'false'
});

/**
 * AI provider configuration
 * @readonly
 */
export const AIProviderConfig = Object.freeze({
  OPENAI: {
    defaultModel: 'gpt-4o-mini',
    maxTokens: 4096,
    temperature: 0.7,
    timeout: 30000
  },
  ANTHROPIC: {
    defaultModel: 'claude-3-5-sonnet-20241022',
    maxTokens: 4096,
    temperature: 0.7,
    timeout: 30000
  }
});

/**
 * Validation patterns
 * @readonly
 */
export const ValidationPatterns = Object.freeze({
  EMAIL: /^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)*$/,
  UUID: /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i,
  SEMVER: /^\d+\.\d+\.\d+(-[a-zA-Z0-9.]+)?(\+[a-zA-Z0-9.]+)?$/,
  URL: /^https?:\/\/.+/,
  SLUG: /^[a-z0-9]+(?:-[a-z0-9]+)*$/
});

/**
 * Security configuration
 * @readonly
 */
export const SecurityConfig = Object.freeze({
  SESSION_TIMEOUT_MS: 3600000,    // 1 hour
  MAX_LOGIN_ATTEMPTS: 5,
  PASSWORD_MIN_LENGTH: 12,
  REQUIRE_MFA_FOR_ADMIN: true,
  ALLOWED_ORIGINS: process.env.ALLOWED_ORIGINS?.split(',') || []
});

/**
 * Validate required environment variables
 * @throws {Error} If required variables are missing
 */
export function validateEnvironment() {
  const required = ['BASE44_APP_ID'];
  const missing = required.filter(key => !process.env[key] && !import.meta.env?.[key]);
  
  if (missing.length > 0) {
    throw new Error(
      `Missing required environment variables: ${missing.join(', ')}\n` +
      'See .env.example for required configuration'
    );
  }
}

/**
 * Get environment-specific configuration
 * @returns {Object} Environment config
 */
export function getEnvironmentConfig() {
  const env = process.env.NODE_ENV || 'development';
  
  return {
    environment: env,
    isDevelopment: env === 'development',
    isProduction: env === 'production',
    isTest: env === 'test',
    apiUrl: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000',
    wsUrl: process.env.NEXT_PUBLIC_WS_URL || 'ws://localhost:3000',
    version: process.env.NEXT_PUBLIC_APP_VERSION || '1.0.0'
  };
}