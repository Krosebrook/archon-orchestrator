/**
 * @fileoverview README Documentation
 * @module shared/docs/README
 */

export const README_DOC = `
# Archon - AI Agent Orchestration Platform

> Enterprise-grade AI agent orchestration, workflow automation, and intelligent system management.

## Quick Start

### Prerequisites

- Base44 account with app creation enabled
- Node.js 18+ (for local development tools)

### Setup

1. **Clone/Import the app** in Base44 dashboard
2. **Configure environment** (see Environment Variables below)
3. **Create sample data** via dashboard or API

### First Steps

1. Navigate to **Dashboard** to see system overview
2. Create your first **Agent** in the Agents page
3. Build a **Workflow** using the Visual Builder
4. Execute and monitor in **Runs**

---

## Project Structure

\`\`\`
├── pages/                 # Route components (flat structure)
├── components/
│   ├── shared/           # Platform-wide components & utilities
│   │   ├── constants/    # Configuration constants
│   │   ├── types/        # JSDoc type definitions
│   │   └── docs/         # Embedded documentation
│   ├── contexts/         # React contexts (Auth, Theme)
│   ├── hooks/            # Custom hooks (useAsync, useRBAC)
│   ├── utils/            # Utility modules
│   └── [feature]/        # Feature-specific components
├── functions/            # Backend serverless functions
├── entities/             # Data model schemas (JSON)
├── agents/               # AI agent configurations
└── Layout.js             # App shell/layout
\`\`\`

---

## Core Modules

### API Client (\`components/utils/api-client.jsx\`)

Production-grade HTTP client with:
- ✅ Exponential backoff retry
- ✅ Circuit breaker pattern
- ✅ Request deduplication
- ✅ Correlation ID tracking
- ✅ Structured error taxonomy

\`\`\`javascript
import { apiRequest, withRetry } from '@/components/utils/api-client';

// With all features
const result = await apiRequest(
  () => base44.entities.Agent.list(),
  { retry: true, circuitBreakerName: 'agents' }
);

// Simple retry
const data = await withRetry(() => fetchData(), { maxRetries: 3 });
\`\`\`

### Validation (\`components/utils/validation.jsx\`)

Security-first input validation:
- ✅ XSS sanitization
- ✅ Prompt injection detection
- ✅ Schema validation (Zod-like)
- ✅ Rate limiting

\`\`\`javascript
import { 
  sanitizeInput, 
  detectPromptInjection, 
  Schema, 
  validate 
} from '@/components/utils/validation';

// Sanitize user input
const clean = sanitizeInput(userInput, { escapeHtml: true });

// Check for prompt injection
const { safe, threats } = detectPromptInjection(prompt);

// Validate schema
const userSchema = Schema.object({
  email: Schema.string({ email: true }),
  age: Schema.number({ min: 0, max: 150 })
});
const result = validate(userSchema, data);
\`\`\`

### Audit Logger (\`components/utils/audit-logger.jsx\`)

Tamper-evident audit trail:
- ✅ SHA-256 integrity hashing
- ✅ Automatic PII redaction
- ✅ Batch processing
- ✅ Export (JSON/CSV)

\`\`\`javascript
import { auditCreate, auditUpdate, auditDelete } from '@/components/utils/audit-logger';

await auditCreate('Agent', agentId, agentData);
await auditUpdate('Workflow', workflowId, before, after);
await auditDelete('Run', runId, runData);
\`\`\`

### Performance (\`components/utils/performance.jsx\`)

Performance monitoring and optimization:
- ✅ Budget tracking
- ✅ Memoization with LRU cache
- ✅ Debounce/throttle
- ✅ Web Vitals observer

\`\`\`javascript
import { 
  measurePerformance, 
  memoize, 
  debounce,
  observeWebVitals 
} from '@/components/utils/performance';

// Measure operation
const measuredFetch = measurePerformance('fetchAgents', fetchAgents, {
  budget: 300
});

// Memoize expensive computation
const memoizedCalc = memoize(expensiveCalc, { maxSize: 100, ttlMs: 60000 });

// Debounce input
const debouncedSearch = debounce(search, 300);
\`\`\`

### CoT Reasoning (\`components/utils/cot-reasoning.jsx\`)

Structured AI reasoning:
- ✅ Chain-of-thought prompting
- ✅ Dual-path analysis
- ✅ Prompt compression
- ✅ Cost estimation

\`\`\`javascript
import { 
  executeCoTReasoning, 
  executeDualPathReasoning,
  estimateCoTCost 
} from '@/components/utils/cot-reasoning';

// Single-path reasoning
const result = await executeCoTReasoning(
  'Analyze this customer complaint',
  { context: { complaint, history } }
);

// Dual-path (conservative + optimistic)
const analysis = await executeDualPathReasoning(
  'Should we launch this feature?',
  { context: { metrics, risks } }
);
\`\`\`

---

## RBAC

Role-based access control with four levels:

| Role | Permissions |
|------|-------------|
| **Owner** | Full access, delete, settings |
| **Admin** | Manage agents, approve actions |
| **Operator** | Run workflows, create resources |
| **Viewer** | Read-only access |

\`\`\`javascript
import { useRBAC } from '@/components/hooks/useRBAC';

function MyComponent() {
  const { hasPermission, guard, isAdmin } = useRBAC();
  
  if (!hasPermission('workflow.edit')) {
    return <AccessDenied />;
  }
  
  const handleDelete = () => {
    guard('workflow.delete', 'delete this workflow');
    // proceed...
  };
}
\`\`\`

---

## Environment Variables

\`\`\`bash
# Base44 Platform (auto-populated)
BASE44_APP_ID=your-app-id

# AI Providers
OPENAI_API_KEY=sk-...
ANTHROPIC_API_KEY=sk-ant-...

# Optional: Observability
HELICONE_API_KEY=sk-helicone-...

# Feature Flags
NEXT_PUBLIC_ENABLE_ANALYTICS=true
NEXT_PUBLIC_ENABLE_AI_DEBUGGER=true
NEXT_PUBLIC_ENABLE_SKILL_MARKETPLACE=true
\`\`\`

---

## Performance Budgets

| Operation | Budget |
|-----------|--------|
| API Call (non-AI) | 300ms |
| AI Call | 1500ms |
| React Render | 16ms (60fps) |
| Initial Load (LCP) | 2500ms |

---

## Security

- ✅ Input sanitization (XSS prevention)
- ✅ Prompt injection detection
- ✅ RLS on all entities
- ✅ PII redaction in audits
- ✅ Rate limiting
- ✅ Correlation ID tracking

---

*Built on Base44 Platform*
`;

export default README_DOC;