# Refactoring Recommendations

**Code Quality & Architecture Improvement Suggestions**

Version: 1.1  
Last Updated: January 8, 2026

---

## Executive Summary

This document provides actionable refactoring recommendations for Archon Orchestrator based on codebase analysis. The suggestions focus on improving code quality, maintainability, performance, and scalability while minimizing disruption.

---

## Table of Contents

1. [Priority Matrix](#priority-matrix)
2. [Type Safety Improvements](#type-safety-improvements)
3. [Code Organization](#code-organization)
4. [Performance Optimizations](#performance-optimizations)
5. [Error Handling](#error-handling)
6. [Testing Infrastructure](#testing-infrastructure)
7. [Component Refactoring](#component-refactoring)
8. [Backend Function Patterns](#backend-function-patterns)
9. [State Management](#state-management)
10. [Implementation Roadmap](#implementation-roadmap)

---

## Priority Matrix

| Priority | Impact | Effort | Recommendations |
|----------|--------|--------|-----------------|
| **P0 - Critical** | High | Low-Med | Type safety, error handling patterns |
| **P1 - High** | High | Med | Testing infrastructure, code organization |
| **P2 - Medium** | Med | Med | Performance optimizations, refactoring |
| **P3 - Low** | Low | Low | Code style, naming consistency |

---

## Type Safety Improvements

### Current State (Updated: January 16, 2026)

- Frontend: Mostly JavaScript (401 .jsx files)
- Backend: TypeScript (54 .ts files in functions/)
- Type coverage: ~45% (backend + some frontend utilities)
- **New:** TypeScript configuration in place (tsconfig.json, tsconfig.node.json)
- **New:** 19 TypeScript utility files properly organized with .ts extension

### Progress Update

✅ **Completed:**
1. Created tsconfig.json and tsconfig.node.json
2. Fixed 19 files with incorrect .ts.jsx extensions → .ts
3. Configured type checking for entire codebase
4. Updated ESLint to work with TypeScript files
5. Resolved file naming conflicts (Agents.jsx vs agents.jsx)

🔄 **In Progress:**
- Gradual migration of .jsx → .tsx files
- Adding type definitions to existing components

### Recommendations

#### 1. Migrate Frontend to TypeScript

**Priority:** P0  
**Impact:** High (Better DX, fewer bugs)  
**Effort:** Medium (incremental migration possible)
**Status:** ✅ Foundation Complete, 🔄 Migration In Progress

**Action Items:**
```bash
# Rename .jsx to .tsx incrementally
# Start with utility files and hooks

# Example migration
// Before: Button.jsx
export function Button({ onClick, children }) {
  return <button onClick={onClick}>{children}</button>;
}

// After: Button.tsx
interface ButtonProps {
  onClick: () => void;
  children: React.ReactNode;
  variant?: 'primary' | 'secondary';
  disabled?: boolean;
}

export function Button({ 
  onClick, 
  children, 
  variant = 'primary',
  disabled = false 
}: ButtonProps) {
  return (
    <button onClick={onClick} disabled={disabled}>
      {children}
    </button>
  );
}
```

**Migration Strategy:**
1. ✅ Add `tsconfig.json` for frontend - **DONE**
2. ✅ Install type definitions: `@types/react`, `@types/react-dom` - **DONE**
3. 🔄 Migrate utilities first (lowest risk) - **IN PROGRESS** (19 .ts files)
4. Migrate hooks and contexts
5. Migrate components (leaves to roots)
6. Migrate pages last

**Expected Benefits:**
- 70% reduction in type-related bugs
- Better IDE autocomplete
- Easier refactoring
- Self-documenting code

---

#### 2. Create Shared Type Definitions

**Priority:** P0  
**Effort:** Low

Create `/src/types` directory with shared types:

```typescript
// src/types/agent.ts
export interface Agent {
  id: string;
  name: string;
  version: string;
  status: 'active' | 'inactive' | 'archived';
  config: AgentConfig;
  org_id: string;
  created_at: string;
  updated_at: string;
}

export interface AgentConfig {
  provider: 'openai' | 'anthropic' | 'custom';
  model: string;
  temperature: number;
  max_tokens: number;
  capabilities: string[];
  description?: string;
}

// src/types/workflow.ts
export interface Workflow {
  id: string;
  name: string;
  description?: string;
  definition: WorkflowDefinition;
  status: 'draft' | 'active' | 'archived';
  org_id: string;
  created_at: string;
  updated_at: string;
}

export interface WorkflowDefinition {
  nodes: WorkflowNode[];
  edges: WorkflowEdge[];
  variables?: Record<string, unknown>;
}

// src/types/api.ts
export interface APIResponse<T = unknown> {
  success: boolean;
  data?: T;
  error?: APIError;
}

export interface APIError {
  code: string;
  message: string;
  hint?: string;
  retryable: boolean;
  trace_id: string;
}
```

---

## Code Organization

### Current Structure Issues

- 334 components in flat structure
- Some mixed concerns (utils with components)
- Inconsistent file naming

### Recommendations

#### 1. Feature-Based Organization

**Priority:** P1  
**Impact:** High (Better maintainability)  
**Effort:** Medium

**Proposed Structure:**
```
src/
├── features/
│   ├── agents/
│   │   ├── components/
│   │   │   ├── AgentCard.tsx
│   │   │   ├── AgentList.tsx
│   │   │   └── AgentForm.tsx
│   │   ├── hooks/
│   │   │   ├── useAgent.ts
│   │   │   └── useAgentMetrics.ts
│   │   ├── api/
│   │   │   └── agentApi.ts
│   │   ├── types/
│   │   │   └── index.ts
│   │   └── utils/
│   │       └── agentUtils.ts
│   │
│   ├── workflows/
│   │   ├── components/
│   │   ├── hooks/
│   │   ├── api/
│   │   └── ...
│   │
│   └── monitoring/
│       └── ...
│
├── shared/
│   ├── components/  # Shared UI components
│   ├── hooks/       # Shared custom hooks
│   ├── utils/       # Shared utilities
│   └── types/       # Shared type definitions
│
├── lib/
│   ├── api-client.ts
│   ├── query-client.ts
│   └── auth.ts
│
└── pages/
    ├── AgentsPage.tsx
    ├── WorkflowsPage.tsx
    └── ...
```

**Migration Steps:**
1. Create new structure alongside old
2. Move files incrementally by feature
3. Update imports (use find/replace)
4. Test after each feature migration
5. Remove old structure when complete

---

#### 2. Barrel Exports (index.ts)

**Priority:** P2  
**Effort:** Low

Create index files for cleaner imports:

```typescript
// src/features/agents/components/index.ts
export { AgentCard } from './AgentCard';
export { AgentList } from './AgentList';
export { AgentForm } from './AgentForm';

// Usage
// Before
import { AgentCard } from '@/features/agents/components/AgentCard';
import { AgentList } from '@/features/agents/components/AgentList';

// After
import { AgentCard, AgentList } from '@/features/agents/components';
```

---

## Performance Optimizations

### Current Issues

- No code splitting visible
- Large initial bundle size (estimated)
- Potential unnecessary re-renders

### Recommendations

#### 1. Implement Route-Based Code Splitting

**Priority:** P1  
**Impact:** High (Faster initial load)  
**Effort:** Low

```tsx
// Before
import Dashboard from './pages/Dashboard';
import Agents from './pages/Agents';

// After
import { lazy, Suspense } from 'react';

const Dashboard = lazy(() => import('./pages/Dashboard'));
const Agents = lazy(() => import('./pages/Agents'));

function App() {
  return (
    <Suspense fallback={<LoadingSpinner />}>
      <Routes>
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/agents" element={<Agents />} />
      </Routes>
    </Suspense>
  );
}
```

---

#### 2. Optimize Component Re-renders

**Priority:** P2  
**Impact:** Medium (Smoother UI)  
**Effort:** Medium

```tsx
// Use React.memo for expensive components
export const ExpensiveList = React.memo(({ items, onItemClick }) => {
  return items.map(item => (
    <ExpensiveItem key={item.id} item={item} onClick={onItemClick} />
  ));
}, (prevProps, nextProps) => {
  // Custom comparison
  return prevProps.items === nextProps.items;
});

// Use useCallback for stable function references
function ParentComponent() {
  const handleClick = useCallback((id) => {
    // Handle click
  }, []); // Dependencies
  
  return <ExpensiveList items={items} onItemClick={handleClick} />;
}
```

---

#### 3. Implement Virtual Scrolling

**Priority:** P2  
**Effort:** Low (library available)

For large lists (agents, workflows, logs):

```tsx
import { useVirtualizer } from '@tanstack/react-virtual';

function AgentList({ agents }) {
  const parentRef = useRef();
  
  const virtualizer = useVirtualizer({
    count: agents.length,
    getScrollElement: () => parentRef.current,
    estimateSize: () => 80, // Row height
  });
  
  return (
    <div ref={parentRef} style={{ height: '600px', overflow: 'auto' }}>
      <div style={{ height: `${virtualizer.getTotalSize()}px` }}>
        {virtualizer.getVirtualItems().map((virtualRow) => (
          <AgentCard
            key={agents[virtualRow.index].id}
            agent={agents[virtualRow.index]}
          />
        ))}
      </div>
    </div>
  );
}
```

---

## Error Handling

### Current State

- Inconsistent error handling patterns
- Some unhandled promise rejections possible
- Limited error boundaries

### Recommendations

#### 1. Implement Error Boundaries

**Priority:** P0  
**Impact:** High (Better UX, no crashes)  
**Effort:** Low

```tsx
// src/components/ErrorBoundary.tsx
import { Component, ReactNode } from 'react';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  error?: Error;
}

export class ErrorBoundary extends Component<Props, State> {
  state: State = { hasError: false };
  
  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }
  
  componentDidCatch(error: Error, errorInfo: any) {
    console.error('Error caught by boundary:', error, errorInfo);
    // Log to monitoring service
  }
  
  render() {
    if (this.state.hasError) {
      return this.props.fallback || (
        <div className="error-container">
          <h2>Something went wrong</h2>
          <p>{this.state.error?.message}</p>
          <button onClick={() => this.setState({ hasError: false })}>
            Try again
          </button>
        </div>
      );
    }
    
    return this.props.children;
  }
}

// Usage
<ErrorBoundary>
  <AgentList />
</ErrorBoundary>
```

---

#### 2. Standardize API Error Handling

**Priority:** P0  
**Effort:** Low

```typescript
// src/lib/api-error-handler.ts
export class APIError extends Error {
  constructor(
    public code: string,
    message: string,
    public retryable: boolean,
    public trace_id: string,
    public hint?: string
  ) {
    super(message);
    this.name = 'APIError';
  }
}

export async function handleAPICall<T>(
  apiCall: () => Promise<APIResponse<T>>
): Promise<T> {
  try {
    const response = await apiCall();
    
    if (!response.success) {
      throw new APIError(
        response.error!.code,
        response.error!.message,
        response.error!.retryable,
        response.error!.trace_id,
        response.error!.hint
      );
    }
    
    return response.data!;
  } catch (error) {
    if (error instanceof APIError) {
      throw error;
    }
    
    // Network or unexpected error
    throw new APIError(
      'NETWORK_ERROR',
      'Network request failed',
      true,
      crypto.randomUUID()
    );
  }
}

// Usage
try {
  const agent = await handleAPICall(() => 
    base44.functions.createAgent({ name: 'Test' })
  );
} catch (error) {
  if (error instanceof APIError) {
    if (error.retryable) {
      // Implement retry logic
    }
    toast.error(error.message, { description: error.hint });
  }
}
```

---

## Testing Infrastructure

### Current State

- No visible test files
- No testing framework configured
- Critical gap in quality assurance

### Recommendations

#### 1. Set Up Testing Framework

**Priority:** P1  
**Impact:** High (Quality assurance)  
**Effort:** Medium

**Install Dependencies:**
```bash
npm install --save-dev \
  vitest \
  @testing-library/react \
  @testing-library/jest-dom \
  @testing-library/user-event \
  jsdom
```

**Configuration:**
```typescript
// vite.config.js
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: './src/test/setup.ts',
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html'],
    },
  },
});
```

---

#### 2. Create Test Utilities

**Priority:** P1  
**Effort:** Low

```typescript
// src/test/test-utils.tsx
import { render } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

export function renderWithProviders(ui: React.ReactElement) {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false },
      mutations: { retry: false },
    },
  });
  
  return render(
    <QueryClientProvider client={queryClient}>
      {ui}
    </QueryClientProvider>
  );
}

export * from '@testing-library/react';
```

---

#### 3. Write Example Tests

**Priority:** P1  
**Effort:** Low

```typescript
// src/features/agents/components/AgentCard.test.tsx
import { describe, it, expect, vi } from 'vitest';
import { renderWithProviders, screen, fireEvent } from '@/test/test-utils';
import { AgentCard } from './AgentCard';

describe('AgentCard', () => {
  const mockAgent = {
    id: 'agent_123',
    name: 'Test Agent',
    status: 'active',
    config: { provider: 'openai', model: 'gpt-4o' }
  };
  
  it('renders agent information', () => {
    renderWithProviders(
      <AgentCard agent={mockAgent} onExecute={vi.fn()} />
    );
    
    expect(screen.getByText('Test Agent')).toBeInTheDocument();
    expect(screen.getByText('active')).toBeInTheDocument();
  });
  
  it('calls onExecute when button clicked', async () => {
    const handleExecute = vi.fn();
    renderWithProviders(
      <AgentCard agent={mockAgent} onExecute={handleExecute} />
    );
    
    fireEvent.click(screen.getByText('Execute'));
    
    expect(handleExecute).toHaveBeenCalledWith('agent_123');
  });
});
```

---

## Component Refactoring

### Recommendations

#### 1. Extract Reusable Patterns

**Priority:** P2  
**Effort:** Medium

Identify repeated patterns and extract to shared components:

```tsx
// Common pattern: Loading states
export function withLoading<P extends object>(
  Component: React.ComponentType<P>
) {
  return function WithLoadingComponent({ isLoading, ...props }: P & { isLoading: boolean }) {
    if (isLoading) {
      return <LoadingSpinner />;
    }
    return <Component {...props as P} />;
  };
}

// Usage
const AgentListWithLoading = withLoading(AgentList);

<AgentListWithLoading isLoading={isLoading} agents={agents} />
```

---

#### 2. Compound Components Pattern

**Priority:** P3  
**Effort:** Medium

For complex components like forms:

```tsx
// Before: Monolithic form component
<AgentForm 
  onSubmit={handleSubmit}
  fields={['name', 'provider', 'model']}
  showAdvanced={true}
/>

// After: Compound component pattern
<AgentForm onSubmit={handleSubmit}>
  <AgentForm.Field name="name" label="Agent Name" required />
  <AgentForm.Field name="provider" type="select" options={providers} />
  <AgentForm.Field name="model" type="select" options={models} />
  <AgentForm.AdvancedSection>
    <AgentForm.Field name="temperature" type="number" />
    <AgentForm.Field name="max_tokens" type="number" />
  </AgentForm.AdvancedSection>
  <AgentForm.Submit>Create Agent</AgentForm.Submit>
</AgentForm>
```

---

## Backend Function Patterns

### Recommendations

#### 1. Shared Validation Logic

**Priority:** P1  
**Effort:** Low

Create shared validation utilities:

```typescript
// functions/utils/validation.ts
import { z } from 'zod';

export const AgentSchema = z.object({
  name: z.string().min(1).max(100),
  provider: z.enum(['openai', 'anthropic', 'custom']),
  model: z.string().min(1),
  temperature: z.number().min(0).max(2).optional(),
  max_tokens: z.number().int().positive().optional(),
});

export function validateRequest<T>(
  schema: z.ZodSchema<T>,
  data: unknown
): { success: true; data: T } | { success: false; error: string } {
  try {
    const validated = schema.parse(data);
    return { success: true, data: validated };
  } catch (error) {
    if (error instanceof z.ZodError) {
      return { 
        success: false, 
        error: error.errors.map(e => e.message).join(', ')
      };
    }
    return { success: false, error: 'Validation failed' };
  }
}

// Usage in functions
const validation = validateRequest(AgentSchema, body);
if (!validation.success) {
  return Response.json({
    code: 'VALIDATION_ERROR',
    message: validation.error,
    retryable: false,
    trace_id
  }, { status: 422 });
}
const { name, provider, model } = validation.data;
```

---

#### 2. Centralized Error Response

**Priority:** P0  
**Effort:** Low

```typescript
// functions/utils/response.ts
export function successResponse<T>(data: T, status = 200) {
  return Response.json({
    success: true,
    data
  }, { status });
}

export function errorResponse(
  code: string,
  message: string,
  trace_id: string,
  options: {
    hint?: string;
    retryable?: boolean;
    status?: number;
  } = {}
) {
  return Response.json({
    code,
    message,
    hint: options.hint,
    retryable: options.retryable ?? false,
    trace_id
  }, { status: options.status ?? 500 });
}

// Usage
return errorResponse(
  'NOT_FOUND',
  'Agent not found',
  trace_id,
  { status: 404, retryable: false }
);
```

---

## State Management

### Recommendations

#### 1. Normalize Query Keys

**Priority:** P2  
**Effort:** Low

Create consistent query key factory:

```typescript
// src/lib/query-keys.ts
export const queryKeys = {
  agents: {
    all: ['agents'] as const,
    lists: () => [...queryKeys.agents.all, 'list'] as const,
    list: (filters: string) => [...queryKeys.agents.lists(), { filters }] as const,
    details: () => [...queryKeys.agents.all, 'detail'] as const,
    detail: (id: string) => [...queryKeys.agents.details(), id] as const,
    metrics: (id: string) => [...queryKeys.agents.detail(id), 'metrics'] as const,
  },
  workflows: {
    all: ['workflows'] as const,
    // Similar structure
  }
};

// Usage
const { data: agent } = useQuery({
  queryKey: queryKeys.agents.detail(agentId),
  queryFn: () => fetchAgent(agentId)
});

// Invalidation
queryClient.invalidateQueries({ queryKey: queryKeys.agents.detail(agentId) });
```

---

## Implementation Roadmap

### Phase 1: Critical Foundations (Week 1-2)

1. Set up TypeScript configuration
2. Implement error boundaries
3. Standardize API error handling
4. Create shared type definitions
5. Set up testing framework

**Deliverables:**
- tsconfig.json
- ErrorBoundary component
- Shared types in `/src/types`
- Basic test setup
- 10+ example tests

---

### Phase 2: Code Organization (Week 3-4)

1. Create feature-based structure
2. Migrate utilities first
3. Migrate shared components
4. Update import paths
5. Document new structure

**Deliverables:**
- New `/src/features` structure
- Migration guide
- Updated import paths
- Documentation

---

### Phase 3: Performance & Quality (Week 5-6)

1. Implement code splitting
2. Add virtual scrolling
3. Optimize re-renders
4. Increase test coverage to 50%
5. Performance profiling

**Deliverables:**
- Route-based code splitting
- Optimized lists
- 50% test coverage
- Performance benchmarks

---

### Phase 4: Polish & Enhancement (Week 7-8)

1. Migrate all components to TypeScript
2. Refactor complex components
3. Add integration tests
4. Optimize bundle size
5. Documentation updates

**Deliverables:**
- 100% TypeScript coverage
- 70% test coverage
- Optimized bundle
- Complete documentation

---

## Metrics for Success

| Metric | Baseline (Dec 2025) | Current (Jan 16, 2026) | Target | Timeline |
|--------|---------------------|------------------------|--------|----------|
| TypeScript Coverage | 40% | 45% ↑ | 100% | 8 weeks |
| Test Coverage | 0% | ~15%* ↑ | 70% | 8 weeks |
| ESLint Errors | 16 | 0 ✅ | 0 | Achieved |
| ESLint Warnings | 182 | 49 ✅ | <20 | 4 weeks |
| Bundle Size | ~2MB* | ~2MB | <1MB | 6 weeks |
| Time to Interactive | ~3s* | ~3s | <1.5s | 6 weeks |
| Type Safety | Partial | Partial+ ↑ | Full | 4 weeks |
| Code Duplication | Medium* | Medium | Low | 6 weeks |
| Tests Passing | 0 | 114/120 ✅ | 100% | 4 weeks |

*Estimated based on typical React apps of similar size
**Based on 8 test suites covering core functionality

---

## Related Documentation

- [ARCHITECTURE.md](./ARCHITECTURE.md)
- [CONTRIBUTING.md](./CONTRIBUTING.md)
- [TESTING.md](./TESTING.md) (to be created)

---

**Last Updated:** December 30, 2025  
**Maintained By:** Archon Development Team
