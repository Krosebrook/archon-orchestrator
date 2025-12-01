/**
 * @fileoverview API Reference Documentation
 * @module shared/docs/API_REFERENCE
 */

export const API_REFERENCE_DOC = `
# Archon API Reference

> Complete API reference for all utility modules, hooks, and components.

---

## Table of Contents

1. [API Client](#api-client)
2. [Validation](#validation)
3. [Audit Logger](#audit-logger)
4. [Performance](#performance)
5. [CoT Reasoning](#cot-reasoning)
6. [Hooks](#hooks)
7. [Components](#components)

---

## API Client

\`@/components/utils/api-client\`

### Classes

#### \`APIError\`

Structured API error with full taxonomy support.

\`\`\`javascript
class APIError extends Error {
  constructor(code: string, message: string, options?: {
    hint?: string;
    retryable?: boolean;
    trace_id?: string;
    status?: number;
    severity?: 'low' | 'medium' | 'high' | 'critical';
    context?: object;
  })
  
  toJSON(): object
}
\`\`\`

### Functions

#### \`normalizeError(error, context?)\`

Convert any error to APIError format.

| Parameter | Type | Description |
|-----------|------|-------------|
| error | Error | Any error object |
| context | object | Optional context data |
| **Returns** | APIError | Normalized error |

#### \`handleError(error, options?)\`

Log error and show toast notification.

| Parameter | Type | Description |
|-----------|------|-------------|
| error | Error | Error to handle |
| options.silent | boolean | Suppress toast (default: false) |
| options.context | object | Additional context |
| **Returns** | APIError | Normalized error |

#### \`withRetry(fn, config?)\`

Execute function with exponential backoff retry.

| Parameter | Type | Default | Description |
|-----------|------|---------|-------------|
| fn | Function | - | Async function to execute |
| config.maxRetries | number | 3 | Max retry attempts |
| config.baseDelayMs | number | 1000 | Initial delay |
| config.maxDelayMs | number | 10000 | Max delay |
| config.backoffMultiplier | number | 2 | Backoff factor |
| **Returns** | Promise<T> | Function result |

#### \`getCircuitBreaker(name, options?)\`

Get or create a circuit breaker instance.

| Parameter | Type | Default | Description |
|-----------|------|---------|-------------|
| name | string | - | Unique breaker name |
| options.failureThreshold | number | 5 | Failures before open |
| options.resetTimeMs | number | 30000 | Time to half-open |
| options.halfOpenMaxCalls | number | 3 | Test calls allowed |
| **Returns** | CircuitBreaker | Breaker instance |

#### \`deduplicateRequest(key, fn, ttlMs?)\`

Deduplicate concurrent requests.

| Parameter | Type | Default | Description |
|-----------|------|---------|-------------|
| key | string | - | Unique request key |
| fn | Function | - | Request function |
| ttlMs | number | 5000 | Cache TTL |
| **Returns** | Promise<T> | Request result |

#### \`apiRequest(fn, options?)\`

Full-featured API request wrapper.

| Parameter | Type | Default | Description |
|-----------|------|---------|-------------|
| fn | Function | - | Request function |
| options.retry | boolean | true | Enable retry |
| options.retryConfig | object | - | Retry configuration |
| options.circuitBreakerName | string | - | Enable circuit breaker |
| options.dedupeKey | string | - | Enable deduplication |
| options.silent | boolean | false | Suppress error toast |
| **Returns** | Promise<T> | Request result |

---

## Validation

\`@/components/utils/validation\`

### Validators

#### \`isValidEmail(email)\`

RFC 5322 compliant email validation.

#### \`isValidUrl(url)\`

Validate HTTP/HTTPS URLs.

#### \`isValidJson(str)\`

Check if string is valid JSON.

#### \`isValidUUID(uuid)\`

Validate UUID format.

#### \`isValidSemver(version)\`

Validate semantic version format.

### Sanitization

#### \`sanitizeHtml(input)\`

Escape HTML entities.

| Input | Output |
|-------|--------|
| \`<script>\` | \`&lt;script&gt;\` |
| \`"quote"\` | \`&quot;quote&quot;\` |

#### \`sanitizeInput(input, options?)\`

Full input sanitization.

| Option | Type | Default | Description |
|--------|------|---------|-------------|
| trim | boolean | true | Trim whitespace |
| escapeHtml | boolean | true | Escape HTML |
| normalizeUnicode | boolean | false | Normalize to NFC |
| maxLength | number | - | Truncate length |

### Prompt Injection

#### \`detectPromptInjection(input)\`

Detect prompt injection attempts.

| Returns | Type | Description |
|---------|------|-------------|
| safe | boolean | Input is safe |
| threats | array | Detected threats |
| riskLevel | string | 'none' \\| 'low' \\| 'high' |

#### \`sanitizePromptInput(input, options?)\`

Sanitize input for LLM prompts.

### Schema Validation

#### \`Schema.string(options?)\`

String validator builder.

| Option | Type | Description |
|--------|------|-------------|
| minLength | number | Minimum length |
| maxLength | number | Maximum length |
| pattern | RegExp | Match pattern |
| email | boolean | Validate as email |
| url | boolean | Validate as URL |
| enum | string[] | Allowed values |
| optional | boolean | Allow null/undefined |
| default | any | Default value |

#### \`Schema.number(options?)\`

Number validator builder.

| Option | Type | Description |
|--------|------|-------------|
| min | number | Minimum value |
| max | number | Maximum value |
| integer | boolean | Must be integer |
| positive | boolean | Must be > 0 |

#### \`Schema.boolean(options?)\`

Boolean validator builder.

#### \`Schema.array(itemSchema, options?)\`

Array validator builder.

#### \`Schema.object(shape, options?)\`

Object validator builder.

| Option | Type | Description |
|--------|------|-------------|
| strict | boolean | Reject unknown keys |

#### \`validate(schema, value)\`

Execute validation.

| Returns | Type | Description |
|---------|------|-------------|
| valid | boolean | Validation passed |
| errors | array | Error messages |
| data | any | Validated/transformed data |

### Rate Limiting

#### \`checkRateLimit(key, limit?, windowMs?)\`

Check rate limit for key.

| Parameter | Type | Default | Description |
|-----------|------|---------|-------------|
| key | string | - | Unique rate limit key |
| limit | number | 10 | Requests allowed |
| windowMs | number | 60000 | Window duration |

| Returns | Type | Description |
|---------|------|-------------|
| allowed | boolean | Request allowed |
| remaining | number | Remaining requests |
| resetAt | number | Window reset time |
| limit | number | Configured limit |

---

## Audit Logger

\`@/components/utils/audit-logger\`

### Functions

#### \`auditCreate(entity, entityId, data, options?)\`

Log entity creation.

#### \`auditUpdate(entity, entityId, before, after, options?)\`

Log entity update with diff.

#### \`auditDelete(entity, entityId, data, options?)\`

Log entity deletion.

#### \`auditExecute(entity, entityId, metadata?, options?)\`

Log execution event.

#### \`auditCritical(action, entity, entityId, metadata?)\`

Log critical event (immediate, not batched).

#### \`redactSensitiveData(data, options?)\`

Remove PII from data.

| Redacted Patterns |
|-------------------|
| password, token, secret, api_key |
| credit_card, ssn, cvv |
| JWTs, private keys |
| Emails in strings |

#### \`formatAuditForExport(audits, format?)\`

Format audits for export.

| Format | Output |
|--------|--------|
| 'json' | JSON string |
| 'csv' | CSV string |

---

## Performance

\`@/components/utils/performance\`

### Functions

#### \`measurePerformance(name, fn, options?)\`

Measure function against budget.

| Option | Type | Default | Description |
|--------|------|---------|-------------|
| budget | number | 300 | Budget in ms |
| onSlow | Function | - | Callback if exceeded |
| silent | boolean | false | Suppress warnings |

#### \`debounce(fn, delay?, options?)\`

Advanced debounce.

| Option | Type | Default | Description |
|--------|------|---------|-------------|
| leading | boolean | false | Invoke on leading edge |
| trailing | boolean | true | Invoke on trailing edge |
| maxWait | number | - | Max wait time |

#### \`throttle(fn, limit?, options?)\`

Advanced throttle.

#### \`memoize(fn, options?)\`

LRU memoization with TTL.

| Option | Type | Default | Description |
|--------|------|---------|-------------|
| maxSize | number | 100 | Cache size |
| ttlMs | number | - | Entry TTL |
| keyGenerator | Function | JSON.stringify | Key generator |

#### \`createBatcher(batchFn, options?)\`

Create request batcher.

#### \`observeWebVitals(callback)\`

Monitor LCP, FID, CLS.

---

## CoT Reasoning

\`@/components/utils/cot-reasoning\`

### Functions

#### \`executeCoTReasoning(task, options?)\`

Execute chain-of-thought reasoning.

| Option | Type | Default | Description |
|--------|------|---------|-------------|
| context | object | {} | Context data |
| maxSteps | number | 7 | Max reasoning steps |
| minSteps | number | 3 | Min reasoning steps |
| requireEvidence | boolean | true | Require evidence |
| compress | boolean | true | Compress prompt |

#### \`executeDualPathReasoning(task, options?)\`

Execute dual-path (conservative + optimistic) analysis.

#### \`compressPrompt(prompt, options?)\`

Compress prompt to reduce tokens.

| Returns | Type | Description |
|---------|------|-------------|
| compressed | string | Compressed prompt |
| ratio | number | Compression ratio |
| tokensSaved | number | Estimated tokens saved |

#### \`estimateCoTCost(taskLength, contextLength, steps?)\`

Estimate LLM cost.

| Returns | Type | Description |
|---------|------|-------------|
| inputTokens | number | Estimated input tokens |
| outputTokens | number | Estimated output tokens |
| estimatedCostCents | number | Cost in cents |

---

## Hooks

### \`useAsync(asyncFunction, options?)\`

\`@/components/hooks/useAsync\`

Manage async operation state.

| Returns | Type | Description |
|---------|------|-------------|
| data | any | Resolved data |
| error | Error | Error if failed |
| isLoading | boolean | Loading state |
| isSuccess | boolean | Success state |
| isError | boolean | Error state |
| execute | Function | Execute async function |
| reset | Function | Reset state |

### \`useRBAC()\`

\`@/components/hooks/useRBAC\`

RBAC permission hook.

| Returns | Type | Description |
|---------|------|-------------|
| role | string | Current role |
| hasPermission | Function | Check permission |
| guard | Function | Throw if no permission |
| isOwner | boolean | Is owner role |
| isAdmin | boolean | Is admin or owner |
| canMutate | boolean | Not viewer role |

### \`useAuth()\`

\`@/components/contexts/AuthContext\`

Authentication context hook.

| Returns | Type | Description |
|---------|------|-------------|
| user | object | Current user |
| organization | object | Current org |
| role | string | Current role |
| isLoading | boolean | Auth loading |
| hasPermission | Function | Check permission |
| switchRole | Function | Switch role (dev) |

---

## Components

### \`<ErrorBoundary>\`

\`@/components/shared/ErrorBoundary\`

Catch and display React errors.

\`\`\`jsx
<ErrorBoundary>
  <App />
</ErrorBoundary>
\`\`\`

### \`<RBACGuard>\`

\`@/components/shared/RBACGuard\`

Permission-based rendering.

| Prop | Type | Description |
|------|------|-------------|
| permission | string | Required permission |
| fallback | ReactNode | Render if unauthorized |
| showLockMessage | boolean | Show default lock UI |

\`\`\`jsx
<RBACGuard permission="workflow.edit">
  <EditButton />
</RBACGuard>
\`\`\`

---

*API Reference version 1.0 - Last updated: 2025-12-01*
`;

export default API_REFERENCE_DOC;