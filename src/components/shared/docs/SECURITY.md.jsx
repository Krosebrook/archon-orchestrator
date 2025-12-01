/**
 * @fileoverview Security Documentation
 * @module shared/docs/SECURITY
 */

export const SECURITY_DOC = `
# Archon Security Documentation

> Security architecture, controls, and best practices for the Archon platform.

## Security Model Overview

\`\`\`
┌─────────────────────────────────────────────────────────────────────────┐
│                        SECURITY LAYERS                                  │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                         │
│  ┌─────────────────────────────────────────────────────────────────┐   │
│  │                    PRESENTATION LAYER                            │   │
│  │  • Input sanitization (XSS)                                      │   │
│  │  • RBAC guards on UI components                                  │   │
│  │  • Error boundaries (no stack traces to users)                   │   │
│  └─────────────────────────────────────────────────────────────────┘   │
│                                    │                                    │
│                                    ▼                                    │
│  ┌─────────────────────────────────────────────────────────────────┐   │
│  │                    APPLICATION LAYER                             │   │
│  │  • Schema validation (Zod-like)                                  │   │
│  │  • Prompt injection detection                                    │   │
│  │  • Rate limiting                                                 │   │
│  │  • Circuit breaker                                               │   │
│  └─────────────────────────────────────────────────────────────────┘   │
│                                    │                                    │
│                                    ▼                                    │
│  ┌─────────────────────────────────────────────────────────────────┐   │
│  │                    DATA LAYER                                    │   │
│  │  • Row Level Security (RLS) by org_id                           │   │
│  │  • PII redaction in audits                                      │   │
│  │  • SHA-256 audit integrity hashing                              │   │
│  │  • Encrypted secrets in environment                             │   │
│  └─────────────────────────────────────────────────────────────────┘   │
│                                                                         │
└─────────────────────────────────────────────────────────────────────────┘
\`\`\`

---

## Input Protection

### XSS Prevention

All user input is sanitized before rendering:

\`\`\`javascript
import { sanitizeInput, sanitizeHtml } from '@/components/utils/validation';

// Full sanitization
const clean = sanitizeInput(userInput, {
  trim: true,
  escapeHtml: true,
  normalizeUnicode: true,
  maxLength: 10000
});

// HTML entity encoding
const encoded = sanitizeHtml('<script>alert("xss")</script>');
// Returns: &lt;script&gt;alert(&quot;xss&quot;)&lt;/script&gt;
\`\`\`

### Prompt Injection Detection

20+ patterns detected before AI calls:

\`\`\`javascript
import { detectPromptInjection, sanitizePromptInput } from '@/components/utils/validation';

const { safe, threats, riskLevel } = detectPromptInjection(userPrompt);

if (!safe) {
  console.warn('Prompt injection detected:', threats);
  // Block or sanitize
}

// Patterns detected:
// - Direct instruction override ("ignore previous instructions")
// - Role manipulation ("you are now a...")
// - System prompt extraction ("show me your prompt")
// - Jailbreak attempts ("do anything now")
// - Code injection (<script>, javascript:)
// - SQL injection patterns
// - Template injection ({{...}}, \${...})
\`\`\`

### Schema Validation

Zod-like validation at all boundaries:

\`\`\`javascript
import { Schema, validate } from '@/components/utils/validation';

const AgentSchema = Schema.object({
  name: Schema.string({ minLength: 3, maxLength: 100 }),
  config: Schema.object({
    provider: Schema.string({ enum: ['openai', 'anthropic'] }),
    model: Schema.string({ minLength: 1 }),
    temperature: Schema.number({ min: 0, max: 2, optional: true })
  })
});

const result = validate(AgentSchema, userData);
if (!result.valid) {
  // Handle validation errors
  console.error(result.errors);
}
\`\`\`

---

## Rate Limiting

Sliding window rate limiter:

\`\`\`javascript
import { checkRateLimit } from '@/components/utils/validation';

// Check before expensive operation
const { allowed, remaining, resetAt } = checkRateLimit(
  \`user:\${userId}:ai_calls\`,
  20,    // limit
  60000  // window (1 minute)
);

if (!allowed) {
  throw new Error(\`Rate limited. Try again in \${resetAt - Date.now()}ms\`);
}
\`\`\`

Default limits by operation type:

| Operation | Limit | Window |
|-----------|-------|--------|
| API calls | 100 | 1 minute |
| AI calls | 20 | 1 minute |
| Auth attempts | 5 | 5 minutes |
| Exports | 5 | 1 hour |
| Bulk operations | 10 | 1 minute |

---

## Access Control (RBAC)

### Role Hierarchy

\`\`\`
Owner ──▶ Admin ──▶ Operator ──▶ Viewer
  │         │          │           │
  │         │          │           └── Read-only access
  │         │          └── Run workflows, create resources
  │         └── Manage agents, approve actions
  └── Full access, delete, settings, billing
\`\`\`

### Permission Matrix

| Permission | Owner | Admin | Operator | Viewer |
|------------|-------|-------|----------|--------|
| workflow.view | ✓ | ✓ | ✓ | ✓ |
| workflow.create | ✓ | ✓ | ✓ | ✗ |
| workflow.edit | ✓ | ✓ | ✓ | ✗ |
| workflow.delete | ✓ | ✓ | ✗ | ✗ |
| workflow.run | ✓ | ✓ | ✓ | ✗ |
| agent.view | ✓ | ✓ | ✓ | ✓ |
| agent.create | ✓ | ✓ | ✗ | ✗ |
| agent.edit | ✓ | ✓ | ✗ | ✗ |
| agent.delete | ✓ | ✓ | ✗ | ✗ |
| policy.delete | ✓ | ✗ | ✗ | ✗ |
| settings.edit | ✓ | ✗ | ✗ | ✗ |
| audit.export | ✓ | ✓ | ✗ | ✗ |

### Usage

\`\`\`javascript
// Component guard
import { RBACGuard } from '@/components/shared/RBACGuard';

<RBACGuard permission="workflow.edit">
  <EditButton />
</RBACGuard>

// Hook guard
import { useRBAC } from '@/components/hooks/useRBAC';

const { hasPermission, guard } = useRBAC();

const handleDelete = async () => {
  guard('workflow.delete', 'delete this workflow');
  await deleteWorkflow(id);
};
\`\`\`

---

## Data Protection

### Row Level Security (RLS)

All entities are scoped by \`org_id\`:

\`\`\`json
{
  "rls": {
    "read": { "org_id": "{{user.organization.id}}" },
    "write": { "org_id": "{{user.organization.id}}" }
  }
}
\`\`\`

### PII Redaction

Automatic in audit logs:

\`\`\`javascript
import { redactSensitiveData } from '@/components/utils/audit-logger';

const redacted = redactSensitiveData({
  user: { email: 'john@example.com', password: 'secret123' },
  payment: { card: '4111-1111-1111-1111' }
});

// Result:
// {
//   user: { email: '[EMAIL_IN_STRING_REDACTED]', password: '[REDACTED]' },
//   payment: { card: '[CREDIT_CARD_REDACTED]' }
// }
\`\`\`

Sensitive patterns automatically detected:
- Passwords, tokens, secrets, API keys
- Credit card numbers, SSNs
- JWTs, private keys

### Audit Integrity

SHA-256 hashing ensures tamper-evident logs:

\`\`\`javascript
// Each audit entry includes:
{
  action: 'update',
  entity: 'Workflow',
  entity_id: 'wf_123',
  before: { /* redacted */ },
  after: { /* redacted */ },
  hash: 'a1b2c3d4e5f6...', // SHA-256 of entry
  timestamp: '2025-12-01T12:00:00.000Z',
  session_id: 'session_xxx',
  correlation_id: 'cid_xxx'
}
\`\`\`

---

## Resilience

### Circuit Breaker

Prevents cascade failures:

\`\`\`javascript
import { getCircuitBreaker } from '@/components/utils/api-client';

const breaker = getCircuitBreaker('ai-provider', {
  failureThreshold: 5,
  resetTimeMs: 30000,
  halfOpenMaxCalls: 3
});

// States: CLOSED → OPEN (after 5 failures) → HALF_OPEN → CLOSED
\`\`\`

### Retry with Backoff

Exponential backoff with jitter:

\`\`\`javascript
import { withRetry } from '@/components/utils/api-client';

const result = await withRetry(fetchData, {
  maxRetries: 3,
  baseDelayMs: 1000,
  maxDelayMs: 10000,
  backoffMultiplier: 2
});

// Delays: ~1s, ~2s, ~4s (with ±25% jitter)
\`\`\`

---

## Secrets Management

### Environment Variables

Never commit secrets:

\`\`\`bash
# .env.example (committed)
OPENAI_API_KEY=sk-...
ANTHROPIC_API_KEY=sk-ant-...

# .env (NOT committed)
OPENAI_API_KEY=sk-proj-actual-key
\`\`\`

### Validation

Fail fast on missing secrets:

\`\`\`javascript
// Deno function startup
const required = ['OPENAI_API_KEY'];
for (const key of required) {
  if (!Deno.env.get(key)) {
    throw new Error(\`Missing required secret: \${key}\`);
  }
}
\`\`\`

---

## Compliance Checklist

| Control | Status | Notes |
|---------|--------|-------|
| Input validation | ✅ | XSS, injection detection |
| Output encoding | ✅ | HTML entity escaping |
| Authentication | ✅ | Base44 built-in |
| Authorization | ✅ | RBAC with guards |
| Data encryption | ✅ | HTTPS enforced |
| Audit logging | ✅ | SHA-256 integrity |
| PII handling | ✅ | Auto-redaction |
| Rate limiting | ✅ | Sliding window |
| Secret management | ✅ | Environment vars |
| Error handling | ✅ | No stack traces to users |

---

*Security documentation version 1.0 - Last updated: 2025-12-01*
`;

export default SECURITY_DOC;