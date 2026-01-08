# Testing Implementation Guide

**Version:** 1.0  
**Last Updated:** January 7, 2026  
**Status:** Implemented

---

## Overview

This document describes the testing infrastructure implemented for Archon Orchestrator as part of Phase 1 (Foundation Strengthening) of the project roadmap. The testing system uses Vitest for fast, Vite-powered unit and integration testing.

---

## Quick Start

### Running Tests

```bash
# Run all tests once
npm test

# Run tests in watch mode (for development)
npm run test:watch

# Run tests with UI interface
npm run test:ui

# Generate coverage report
npm run test:coverage
```

### Test Results

- **Total Test Files:** 3
- **Total Tests:** 47
- **Pass Rate:** 100%
- **Execution Time:** ~2.3s

---

## Architecture

### Technology Stack

| Component | Technology | Version |
|-----------|-----------|---------|
| **Test Runner** | Vitest | 4.0.16 |
| **Testing Library** | @testing-library/react | 16.3.1 |
| **DOM Testing** | @testing-library/jest-dom | 6.9.1 |
| **User Interactions** | @testing-library/user-event | 14.6.1 |
| **Test Environment** | jsdom | 27.4.0 |
| **Coverage** | v8 (built-in) | - |

### Directory Structure

```
archon-orchestrator/
├── src/
│   ├── __tests__/
│   │   ├── setup.js                    # Global test setup
│   │   └── utils/
│   │       ├── mockBase44.js           # Base44 SDK mocks
│   │       └── testHelpers.js          # Common test utilities
│   ├── components/
│   │   ├── ui/
│   │   │   ├── button.jsx
│   │   │   └── button.test.jsx         # Co-located test
│   │   └── dashboard/
│   │       ├── StatCard.jsx
│   │       └── StatCard.test.jsx
│   └── utils/
│       ├── index.ts
│       └── index.test.js
├── vitest.config.js                    # Vitest configuration
└── .github/
    └── workflows/
        └── test.yml                    # CI/CD workflow
```

---

## Writing Tests

### Test File Naming

Tests should be co-located with source files:

- **Component tests:** `ComponentName.test.jsx`
- **Utility tests:** `utils.test.js`
- **Hook tests:** `useHookName.test.js`

### Example: Component Test

```javascript
import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Button } from './button';

describe('Button Component', () => {
  it('should render button with text', () => {
    render(<Button>Click me</Button>);
    expect(screen.getByRole('button', { name: /click me/i })).toBeInTheDocument();
  });

  it('should call onClick handler when clicked', async () => {
    const handleClick = vi.fn();
    const user = userEvent.setup();
    
    render(<Button onClick={handleClick}>Click me</Button>);
    await user.click(screen.getByRole('button'));
    
    expect(handleClick).toHaveBeenCalledTimes(1);
  });
});
```

### Example: Utility Test

```javascript
import { describe, it, expect } from 'vitest';
import { createPageUrl } from './index.ts';

describe('createPageUrl', () => {
  it('should convert page name to lowercase URL', () => {
    const result = createPageUrl('Dashboard');
    expect(result).toBe('/dashboard');
  });

  it('should replace spaces with hyphens', () => {
    const result = createPageUrl('Agent Details');
    expect(result).toBe('/agent-details');
  });
});
```

---

## Test Utilities

### Mock Base44 Client

Use the `mockBase44Client()` helper to mock Base44 SDK calls:

```javascript
import { mockBase44Client, testData } from '@/__tests__/utils/mockBase44';

describe('My Component', () => {
  beforeEach(() => {
    const mockClient = mockBase44Client();
    
    // Customize mock behavior
    mockClient.entities.Agent.filter.mockResolvedValue([
      testData.agent({ name: 'Test Agent' })
    ]);
  });

  it('should fetch agents', async () => {
    // Your test here
  });
});
```

### Test Helpers

```javascript
import { renderWithProviders } from '@/__tests__/utils/testHelpers';

it('should render with providers', () => {
  const { getByText } = renderWithProviders(<MyComponent />);
  expect(getByText('Hello')).toBeInTheDocument();
});
```

### Test Data Factories

```javascript
import { testData } from '@/__tests__/utils/mockBase44';

const agent = testData.agent({ name: 'Custom Agent', status: 'active' });
const workflow = testData.workflow({ name: 'Custom Workflow' });
const user = testData.user({ email: 'custom@example.com' });
```

---

## Coverage Requirements

### Current Thresholds

As configured in `vitest.config.js`:

| Metric | Threshold |
|--------|-----------|
| Lines | 50% |
| Functions | 50% |
| Branches | 50% |
| Statements | 50% |

### Viewing Coverage

```bash
# Generate coverage report
npm run test:coverage

# Open HTML report in browser
open coverage/index.html
```

### Coverage Goals

- **Phase 1 (Current):** 50% coverage
- **Phase 2:** 70% coverage
- **Phase 3:** 80% coverage

---

## CI/CD Integration

### GitHub Actions Workflow

The `.github/workflows/test.yml` workflow runs on:
- Push to `main` or `develop` branches
- Pull requests to `main` or `develop`

### Workflow Steps

1. ✅ **Checkout code**
2. ✅ **Setup Node.js** (18.x and 20.x matrix)
3. ✅ **Install dependencies** (`npm ci`)
4. ✅ **Run linter** (`npm run lint`)
5. ✅ **Run type checking** (`npm run typecheck`)
6. ✅ **Run tests** (`npm test`)
7. ✅ **Generate coverage** (`npm run test:coverage`)
8. ✅ **Upload coverage artifacts**
9. ✅ **Comment coverage on PR**
10. ✅ **Check coverage thresholds**
11. ✅ **Build application** (`npm run build`)

### CI Features

- **Matrix Testing:** Tests run on Node.js 18.x and 20.x
- **Coverage Artifacts:** Coverage reports saved for 30 days
- **PR Comments:** Auto-comment coverage metrics on PRs
- **Threshold Checks:** Enforces 50% minimum coverage
- **Build Validation:** Ensures code builds successfully

---

## Best Practices

### Testing Principles

1. **Test Behavior, Not Implementation**
   - Focus on what the component does, not how it does it
   - Test user-visible behavior
   - Avoid testing internal state or methods

2. **Arrange-Act-Assert Pattern**
   ```javascript
   it('should do something', () => {
     // Arrange: Setup test data and environment
     const mockData = { name: 'Test' };
     
     // Act: Perform the action
     render(<Component data={mockData} />);
     
     // Assert: Verify the outcome
     expect(screen.getByText('Test')).toBeInTheDocument();
   });
   ```

3. **Use Semantic Queries**
   - Prefer `getByRole` over `getByTestId`
   - Use `getByLabelText` for form fields
   - Fall back to `getByText` for static content

4. **Async Operations**
   ```javascript
   // Wait for element to appear
   const element = await screen.findByText('Loading complete');
   
   // Wait for element to disappear
   await waitForElementToBeRemoved(() => screen.queryByText('Loading...'));
   ```

5. **User Interactions**
   ```javascript
   const user = userEvent.setup();
   await user.click(screen.getByRole('button'));
   await user.type(screen.getByLabelText('Name'), 'John');
   ```

### What to Test

✅ **Do Test:**
- Component rendering
- User interactions (clicks, typing, etc.)
- Conditional rendering
- Props variations
- Error states
- Accessibility features

❌ **Don't Test:**
- Third-party libraries
- Implementation details
- Styling/CSS (unless critical to functionality)
- Browser APIs (mock them instead)

---

## Mocking Strategies

### Mock Base44 SDK

```javascript
import { vi } from 'vitest';

vi.mock('@/api/base44Client', () => ({
  base44: {
    entities: {
      Agent: {
        filter: vi.fn().mockResolvedValue([]),
        create: vi.fn().mockResolvedValue({ id: '123' }),
      },
    },
  },
}));
```

### Mock React Router

```javascript
import { BrowserRouter } from 'react-router-dom';

function renderWithRouter(ui) {
  return render(<BrowserRouter>{ui}</BrowserRouter>);
}
```

### Mock External APIs

```javascript
global.fetch = vi.fn().mockResolvedValue({
  ok: true,
  json: async () => ({ data: [] }),
});
```

---

## Debugging Tests

### Vitest UI

```bash
npm run test:ui
```

Opens a browser-based UI for exploring tests and debugging failures.

### Debug Output

```javascript
import { screen } from '@testing-library/react';

// Print current DOM structure
screen.debug();

// Print specific element
screen.debug(screen.getByRole('button'));
```

### VS Code Debugging

Add to `.vscode/launch.json`:

```json
{
  "type": "node",
  "request": "launch",
  "name": "Debug Vitest",
  "runtimeExecutable": "npm",
  "runtimeArgs": ["run", "test:watch"],
  "console": "integratedTerminal",
  "internalConsoleOptions": "neverOpen"
}
```

---

## Common Patterns

### Testing Loading States

```javascript
it('should show loading skeleton', () => {
  render(<Component isLoading={true} />);
  expect(screen.getByTestId('loading-skeleton')).toBeInTheDocument();
});
```

### Testing Error States

```javascript
it('should display error message on failure', async () => {
  mockApi.mockRejectedValue(new Error('API Error'));
  render(<Component />);
  
  await waitFor(() => {
    expect(screen.getByText(/error/i)).toBeInTheDocument();
  });
});
```

### Testing Forms

```javascript
it('should submit form with valid data', async () => {
  const handleSubmit = vi.fn();
  const user = userEvent.setup();
  
  render(<Form onSubmit={handleSubmit} />);
  
  await user.type(screen.getByLabelText('Name'), 'John');
  await user.type(screen.getByLabelText('Email'), 'john@example.com');
  await user.click(screen.getByRole('button', { name: /submit/i }));
  
  expect(handleSubmit).toHaveBeenCalledWith({
    name: 'John',
    email: 'john@example.com',
  });
});
```

---

## Troubleshooting

### Common Issues

**Issue:** Tests timeout waiting for element
```javascript
// Solution: Increase timeout
await screen.findByText('Element', {}, { timeout: 5000 });
```

**Issue:** Mock not working
```javascript
// Solution: Ensure vi.mock() is at top of file
vi.mock('@/api/base44Client');

// Then in test
import { base44 } from '@/api/base44Client';
```

**Issue:** React warnings in console
```javascript
// Solution: Suppress known warnings in src/__tests__/setup.js
console.error = vi.fn((message) => {
  if (message.includes('Warning:')) return;
  originalError(message);
});
```

---

## Next Steps

### Future Improvements

1. **Increase Coverage** (Target: 70%)
   - Add tests for critical workflows
   - Test error boundaries
   - Test authentication flows

2. **E2E Testing** (Playwright)
   - User journey tests
   - Cross-browser testing
   - Visual regression tests

3. **Performance Testing**
   - Lighthouse CI integration
   - Web Vitals monitoring
   - Bundle size tracking

4. **Accessibility Testing**
   - axe-core integration
   - Keyboard navigation tests
   - Screen reader compatibility

---

## Resources

### Documentation

- [Vitest Documentation](https://vitest.dev/)
- [Testing Library](https://testing-library.com/docs/react-testing-library/intro)
- [Jest-DOM Matchers](https://github.com/testing-library/jest-dom)

### Internal Docs

- [TESTING.md](./TESTING.md) - Testing strategy
- [KNOWN_ISSUES.md](./KNOWN_ISSUES.md) - Known testing limitations
- [CONTRIBUTING.md](./CONTRIBUTING.md) - Contribution guidelines

---

## Support

For questions or issues with the testing infrastructure:

1. Check this documentation first
2. Review existing test examples
3. Check GitHub Issues
4. Ask in team discussions

---

**Maintained by:** DevOps Team  
**Last Review:** January 7, 2026
