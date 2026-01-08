# Testing Guide

**Comprehensive Testing Strategy for Archon Orchestrator**

Version: 1.2  
Last Updated: January 8, 2026

---

## Table of Contents

1. [Overview](#overview)
2. [Testing Philosophy](#testing-philosophy)
3. [Testing Stack](#testing-stack)
4. [Test Types](#test-types)
5. [Frontend Testing](#frontend-testing)
6. [Backend Testing](#backend-testing)
7. [Integration Testing](#integration-testing)
8. [E2E Testing](#e2e-testing)
9. [Test Coverage Goals](#test-coverage-goals)
10. [CI/CD Integration](#cicd-integration)
11. [Best Practices](#best-practices)
12. [Implementation Status](#implementation-status)

---

## Overview

This guide outlines the testing strategy for Archon Orchestrator, covering all aspects from unit tests to end-to-end testing. Our goal is to achieve comprehensive test coverage while maintaining developer productivity.

**Current Status:** ✅ Testing infrastructure implemented (Phase 1 complete)

---

## Testing Philosophy

### Core Principles

1. **Test Behavior, Not Implementation** - Focus on what the code does, not how
2. **Write Tests First** - TDD when possible for new features
3. **Fast Feedback** - Tests should run quickly
4. **Isolated Tests** - Tests should not depend on each other
5. **Readable Tests** - Tests are documentation
6. **Pragmatic Coverage** - Aim for high coverage, but prioritize critical paths

### Testing Pyramid

```
         ▲
        /E2E\          ~5% of tests
       /─────\
      /Integ─\        ~15% of tests
     /────────\
    /Unit Tests\      ~80% of tests
   /────────────\
```

**Unit Tests** - Fast, isolated, test single functions/components
**Integration Tests** - Test component interactions
**E2E Tests** - Test complete user flows

---

## Testing Stack

### Frontend Testing

```json
{
  "test-framework": "Vitest 4.0.16",
  "testing-library": "@testing-library/react 16.3.1",
  "dom-testing": "@testing-library/jest-dom 6.9.1",
  "user-events": "@testing-library/user-event 14.6.1",
  "mocking": "vitest built-in mocks",
  "coverage": "v8"
}
```

**Status:** ✅ Implemented

### Backend Testing

```json
{
  "test-framework": "Deno.test",
  "assertions": "Deno std/assert",
  "mocking": "std/testing/mock"
}
```

**Status:** 📋 Planned

### E2E Testing

```json
{
  "framework": "Playwright",
  "browsers": ["chromium", "firefox", "webkit"]
}
```

**Status:** 📋 Planned

---

## Test Types

### 1. Unit Tests

Test individual functions, utilities, and components in isolation.

**What to Test:**
- Utility functions
- React components
- Custom hooks
- Business logic
- API clients

**Example:**
```typescript
// src/utils/formatDate.test.ts
import { describe, it, expect } from 'vitest';
import { formatDate } from './formatDate';

describe('formatDate', () => {
  it('formats ISO date correctly', () => {
    const result = formatDate('2025-01-15T10:30:00Z');
    expect(result).toBe('Jan 15, 2025');
  });
  
  it('handles invalid dates', () => {
    const result = formatDate('invalid');
    expect(result).toBe('Invalid Date');
  });
  
  it('uses custom format when provided', () => {
    const result = formatDate('2025-01-15', 'MM/DD/YYYY');
    expect(result).toBe('01/15/2025');
  });
});
```

---

### 2. Component Tests

Test React components and their behavior.

**What to Test:**
- Component renders correctly
- Props affect rendering
- User interactions work
- State changes correctly
- Events are handled

**Example:**
```typescript
// src/components/AgentCard.test.tsx
import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@/test/test-utils';
import { AgentCard } from './AgentCard';

describe('AgentCard', () => {
  const mockAgent = {
    id: 'agent_123',
    name: 'Test Agent',
    status: 'active',
    config: { provider: 'openai', model: 'gpt-4o' }
  };
  
  it('renders agent information', () => {
    render(<AgentCard agent={mockAgent} />);
    
    expect(screen.getByText('Test Agent')).toBeInTheDocument();
    expect(screen.getByText(/active/i)).toBeInTheDocument();
    expect(screen.getByText(/gpt-4o/i)).toBeInTheDocument();
  });
  
  it('shows loading state', () => {
    render(<AgentCard agent={mockAgent} isLoading />);
    
    expect(screen.getByRole('status')).toBeInTheDocument();
    expect(screen.queryByText('Test Agent')).not.toBeInTheDocument();
  });
  
  it('calls onExecute when execute button clicked', async () => {
    const handleExecute = vi.fn();
    const { user } = render(
      <AgentCard agent={mockAgent} onExecute={handleExecute} />
    );
    
    const button = screen.getByRole('button', { name: /execute/i });
    await user.click(button);
    
    expect(handleExecute).toHaveBeenCalledWith('agent_123');
  });
  
  it('disables button when agent is inactive', () => {
    const inactiveAgent = { ...mockAgent, status: 'inactive' };
    render(<AgentCard agent={inactiveAgent} />);
    
    const button = screen.getByRole('button', { name: /execute/i });
    expect(button).toBeDisabled();
  });
});
```

---

### 3. Hook Tests

Test custom React hooks.

**Example:**
```typescript
// src/hooks/useAgent.test.ts
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useAgent } from './useAgent';
import * as agentApi from '@/api/agentApi';

vi.mock('@/api/agentApi');

describe('useAgent', () => {
  let queryClient: QueryClient;
  
  beforeEach(() => {
    queryClient = new QueryClient({
      defaultOptions: { queries: { retry: false } }
    });
  });
  
  const wrapper = ({ children }) => (
    <QueryClientProvider client={queryClient}>
      {children}
    </QueryClientProvider>
  );
  
  it('fetches agent data successfully', async () => {
    const mockAgent = { id: 'agent_123', name: 'Test Agent' };
    vi.mocked(agentApi.fetchAgent).mockResolvedValue(mockAgent);
    
    const { result } = renderHook(
      () => useAgent('agent_123'),
      { wrapper }
    );
    
    expect(result.current.isLoading).toBe(true);
    
    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true);
    });
    
    expect(result.current.data).toEqual(mockAgent);
  });
  
  it('handles errors', async () => {
    vi.mocked(agentApi.fetchAgent).mockRejectedValue(
      new Error('Agent not found')
    );
    
    const { result } = renderHook(
      () => useAgent('invalid_id'),
      { wrapper }
    );
    
    await waitFor(() => {
      expect(result.current.isError).toBe(true);
    });
    
    expect(result.current.error).toBeInstanceOf(Error);
  });
});
```

---

### 4. Integration Tests

Test how multiple components/modules work together.

**Example:**
```typescript
// src/features/agents/AgentCreationFlow.test.tsx
import { describe, it, expect, vi } from 'vitest';
import { render, screen, within } from '@/test/test-utils';
import { AgentCreationFlow } from './AgentCreationFlow';
import * as agentApi from '@/api/agentApi';

vi.mock('@/api/agentApi');

describe('AgentCreationFlow', () => {
  it('completes full agent creation flow', async () => {
    const onSuccess = vi.fn();
    vi.mocked(agentApi.createAgent).mockResolvedValue({
      id: 'agent_123',
      name: 'My Agent'
    });
    
    const { user } = render(
      <AgentCreationFlow onSuccess={onSuccess} />
    );
    
    // Step 1: Enter basic information
    await user.type(
      screen.getByLabelText(/agent name/i),
      'My Agent'
    );
    
    await user.type(
      screen.getByLabelText(/description/i),
      'A helpful agent'
    );
    
    await user.click(screen.getByRole('button', { name: /next/i }));
    
    // Step 2: Select provider
    await user.click(screen.getByRole('button', { name: /openai/i }));
    await user.click(screen.getByRole('button', { name: /next/i }));
    
    // Step 3: Configure model
    const modelSelect = screen.getByLabelText(/model/i);
    await user.selectOptions(modelSelect, 'gpt-4o');
    
    // Step 4: Submit
    await user.click(screen.getByRole('button', { name: /create agent/i }));
    
    // Verify API was called correctly
    await waitFor(() => {
      expect(agentApi.createAgent).toHaveBeenCalledWith({
        name: 'My Agent',
        description: 'A helpful agent',
        provider: 'openai',
        model: 'gpt-4o'
      });
    });
    
    // Verify success callback
    expect(onSuccess).toHaveBeenCalledWith({
      id: 'agent_123',
      name: 'My Agent'
    });
  });
});
```

---

### 5. Backend Function Tests

Test Deno serverless functions.

**Example:**
```typescript
// functions/createAgent.test.ts
import { assertEquals, assertExists } from "std/assert/mod.ts";
import { createMockRequest } from "./test-utils.ts";

Deno.test("createAgent - creates agent successfully", async () => {
  const mockRequest = createMockRequest({
    method: "POST",
    body: {
      name: "Test Agent",
      provider: "openai",
      model: "gpt-4o"
    },
    user: { id: "user_123", email: "test@example.com" }
  });
  
  const response = await handleCreateAgent(mockRequest);
  const data = await response.json();
  
  assertEquals(response.status, 201);
  assertEquals(data.success, true);
  assertExists(data.data.id);
  assertEquals(data.data.name, "Test Agent");
});

Deno.test("createAgent - validates required fields", async () => {
  const mockRequest = createMockRequest({
    method: "POST",
    body: { provider: "openai" }, // Missing name
    user: { id: "user_123" }
  });
  
  const response = await handleCreateAgent(mockRequest);
  const data = await response.json();
  
  assertEquals(response.status, 422);
  assertEquals(data.code, "VALIDATION_ERROR");
});

Deno.test("createAgent - requires authentication", async () => {
  const mockRequest = createMockRequest({
    method: "POST",
    body: { name: "Test Agent" },
    user: null // No user
  });
  
  const response = await handleCreateAgent(mockRequest);
  const data = await response.json();
  
  assertEquals(response.status, 401);
  assertEquals(data.code, "UNAUTHORIZED");
});
```

---

## Frontend Testing

### Setup ✅ COMPLETE

Testing infrastructure is now operational with the following dependencies installed:

```json
{
  "devDependencies": {
    "vitest": "^4.0.16",
    "@testing-library/react": "latest",
    "@testing-library/jest-dom": "latest",
    "@testing-library/user-event": "latest",
    "@vitest/ui": "latest",
    "jsdom": "latest"
  }
}
```

### Configuration ✅ COMPLETE

Vitest is configured in `vite.config.js`:

```javascript
export default defineConfig({
  // ... other config
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: ['./src/test/setup.js'],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html', 'lcov'],
      exclude: [
        'node_modules/',
        'src/test/',
        '**/*.test.{js,jsx}',
        '**/*.config.{js,ts}',
        'dist/',
        'coverage/',
        'functions/',
      ],
      thresholds: {
        lines: 10,
        functions: 10,
        branches: 10,
        statements: 10,
      },
    },
  },
});
```

### Test Utilities ✅ COMPLETE

Custom test utilities are available in `src/test/test-utils.jsx`:

```javascript
import { renderWithProviders, screen, waitFor } from '@/test/test-utils';

// Automatically wraps components with QueryClient and Router
const { user } = renderWithProviders(<YourComponent />);
```

### Mock Fixtures ✅ COMPLETE

Reusable mock data available:
- `src/test/fixtures/agents.js` - Mock agent data and factories
- `src/test/fixtures/workflows.js` - Mock workflow data and factories
- `src/test/mocks/base44.js` - Base44 SDK mocks

### Running Tests ✅ OPERATIONAL

```bash
# Run all tests
npm test

# Run tests in watch mode
npm run test:watch

# Run tests with UI
npm run test:ui

# Run tests with coverage
npm run test:coverage

# Run specific test file
npm test button.test.jsx

# Run tests matching pattern
npm test -- --testNamePattern="renders correctly"
```

### Example Tests ✅ COMPLETE

Working example tests are available:
- `src/components/ui/button.test.jsx` - Component testing example (12 tests)
- `src/lib/utils.test.js` - Utility function testing example (8 tests)  
- `src/components/hooks/useAsync.test.jsx` - Hook testing example (10 tests)

**Total: 30 tests passing** ✅

---

## Backend Testing

### Setup

Backend tests use Deno's built-in testing framework.

### Running Tests

```bash
# Run all backend tests
deno test functions/

# Run with coverage
deno test --coverage=coverage functions/

# Generate coverage report
deno coverage coverage --lcov > coverage.lcov

# Run specific test
deno test functions/createAgent.test.ts
```

---

## E2E Testing

### Setup

```bash
# Install Playwright
npm install --save-dev @playwright/test
npx playwright install
```

### Configuration

```typescript
// playwright.config.ts
import { defineConfig } from '@playwright/test';

export default defineConfig({
  testDir: './e2e',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
  reporter: 'html',
  use: {
    baseURL: 'http://localhost:5173',
    trace: 'on-first-retry',
  },
  projects: [
    { name: 'chromium', use: { browserName: 'chromium' } },
    { name: 'firefox', use: { browserName: 'firefox' } },
    { name: 'webkit', use: { browserName: 'webkit' } },
  ],
  webServer: {
    command: 'npm run dev',
    port: 5173,
    reuseExistingServer: !process.env.CI,
  },
});
```

### Example E2E Test

```typescript
// e2e/agent-creation.spec.ts
import { test, expect } from '@playwright/test';

test.describe('Agent Creation Flow', () => {
  test('user can create a new agent', async ({ page }) => {
    // Navigate to agents page
    await page.goto('/agents');
    
    // Click create button
    await page.click('button:has-text("Create Agent")');
    
    // Fill form
    await page.fill('input[name="name"]', 'E2E Test Agent');
    await page.fill('textarea[name="description"]', 'Created by E2E test');
    await page.selectOption('select[name="provider"]', 'openai');
    await page.selectOption('select[name="model"]', 'gpt-4o');
    
    // Submit
    await page.click('button:has-text("Create")');
    
    // Wait for success message
    await expect(page.locator('.toast-success')).toBeVisible();
    await expect(page.locator('.toast-success')).toContainText('Agent created');
    
    // Verify agent appears in list
    await expect(page.locator(`text=E2E Test Agent`)).toBeVisible();
  });
  
  test('validates required fields', async ({ page }) => {
    await page.goto('/agents/new');
    
    // Try to submit without filling required fields
    await page.click('button:has-text("Create")');
    
    // Check for validation errors
    await expect(page.locator('text=Name is required')).toBeVisible();
  });
});
```

---

## Test Coverage Goals

### Coverage Targets

| Component | Current | Target (3 months) | Target (6 months) |
|-----------|---------|-------------------|-------------------|
| Utilities | 0% | 90% | 95% |
| Hooks | 0% | 80% | 90% |
| Components | 0% | 70% | 80% |
| API Clients | 0% | 85% | 90% |
| Backend Functions | 0% | 80% | 90% |
| **Overall** | **0%** | **70%** | **85%** |

### Priority Areas

**Must Test (P0):**
- Authentication flows
- Agent creation and execution
- Workflow execution
- Payment/cost calculations
- Audit logging

**Should Test (P1):**
- Form validation
- Error handling
- Navigation
- Data fetching/mutations
- User interactions

**Nice to Test (P2):**
- Edge cases
- Performance
- Accessibility
- Visual regressions

---

## CI/CD Integration

### GitHub Actions Workflow

```yaml
# .github/workflows/test.yml
name: Tests

on: [push, pull_request]

jobs:
  frontend-tests:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: '18'
      - run: npm ci
      - run: npm test -- --coverage
      - uses: codecov/codecov-action@v3
  
  backend-tests:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: denoland/setup-deno@v1
        with:
          deno-version: v1.x
      - run: deno test --coverage=coverage functions/
      - run: deno coverage coverage --lcov > coverage.lcov
  
  e2e-tests:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
      - run: npm ci
      - run: npx playwright install --with-deps
      - run: npm run test:e2e
      - uses: actions/upload-artifact@v3
        if: always()
        with:
          name: playwright-report
          path: playwright-report/
```

---

## Best Practices

### General

1. **Arrange-Act-Assert (AAA)** - Structure tests clearly
2. **One Assertion Per Test** - Or at least one logical concept
3. **Descriptive Names** - Test names should explain what they test
4. **Fast Tests** - Tests should run quickly
5. **Independent Tests** - No dependencies between tests
6. **Clean Up** - Reset state after each test

### React Testing

1. **Query Priority** - Use this order:
   - `getByRole` (preferred)
   - `getByLabelText`
   - `getByPlaceholderText`
   - `getByText`
   - `getByTestId` (last resort)

2. **User Events** - Use `@testing-library/user-event` not `fireEvent`

3. **Async Testing** - Always await async operations

4. **Mock Conservatively** - Only mock what you need to

5. **Test User Behavior** - Not implementation details

### Code Coverage

1. **Don't Chase 100%** - Focus on critical paths
2. **Quality Over Quantity** - Good tests > high coverage
3. **Cover Edge Cases** - Error conditions, boundaries
4. **Ignore Generated Code** - Config, build files

---

## Related Documentation

- [CONTRIBUTING.md](./CONTRIBUTING.md)
- [REFACTORING.md](./REFACTORING.md)
- [KNOWN_ISSUES.md](./KNOWN_ISSUES.md)

---

**Last Updated:** December 30, 2025  
**Maintained By:** Archon Development Team


---

## Implementation Status

### Phase 1: Foundation (✅ Complete - January 2026)

**Implemented:**
- ✅ Vitest testing framework installed and configured
- ✅ Test utilities and helpers created
- ✅ Base44 SDK mocks implemented
- ✅ 47 passing unit tests across 3 test files
- ✅ GitHub Actions CI/CD workflow
- ✅ Coverage reporting (target: 50%)
- ✅ Test scripts added to package.json

**Test Files:**
1. `src/components/ui/button.test.jsx` - 22 tests
2. `src/components/dashboard/StatCard.test.jsx` - 16 tests
3. `src/utils/index.test.js` - 9 tests

**Coverage Achieved:** Initial infrastructure in place

**Commands Available:**
```bash
npm test               # Run all tests
npm run test:watch     # Watch mode for development
npm run test:ui        # Interactive UI
npm run test:coverage  # Generate coverage report
```

### Phase 2: Expansion (📋 Planned - Q1 2026)

**Goals:**
- 🎯 Achieve 70% test coverage
- 🎯 Add tests for critical workflow components
- 🎯 Add tests for authentication flows
- 🎯 Add tests for API integrations
- 🎯 Implement backend function tests with Deno

**Priorities:**
1. Agent management components
2. Workflow builder components
3. Dashboard components
4. Form components with validation
5. Error boundary components

### Phase 3: Maturity (📋 Planned - Q2 2026)

**Goals:**
- 🎯 Achieve 80% test coverage
- 🎯 Implement E2E tests with Playwright
- 🎯 Add visual regression testing
- 🎯 Add performance testing
- 🎯 Implement accessibility testing with axe-core

---

## Getting Started

### Quick Start for Developers

1. **Install dependencies** (if not already done):
   ```bash
   npm install
   ```

2. **Run tests**:
   ```bash
   npm test
   ```

3. **Write your first test**:
   - Create `YourComponent.test.jsx` next to your component
   - Follow the examples in existing test files
   - Use the test utilities from `src/__tests__/utils/`

4. **Check coverage**:
   ```bash
   npm run test:coverage
   open coverage/index.html
   ```

### Resources

- **Implementation Guide:** [TESTING_IMPLEMENTATION.md](./TESTING_IMPLEMENTATION.md)
- **Vitest Docs:** https://vitest.dev/
- **Testing Library Docs:** https://testing-library.com/
- **Best Practices:** See "Best Practices" section above

---

## Support & Feedback

For questions about testing:
1. Check [TESTING_IMPLEMENTATION.md](./TESTING_IMPLEMENTATION.md) for detailed examples
2. Review existing test files for patterns
3. Open a GitHub issue with the `testing` label
4. Ask in team discussions

---

**Maintained by:** DevOps & Quality Team  
**Last Implementation Update:** January 7, 2026  
**Next Review:** Q1 2026
