/**
 * @fileoverview Testing Utilities
 * @module core/testing/testUtils
 * @description Production-grade test helpers and mocks
 */

import { vi } from 'vitest';

// =============================================================================
// MOCK FACTORIES
// =============================================================================

export const mockWorkflow = (overrides = {}) => ({
  id: '123e4567-e89b-12d3-a456-426614174000',
  name: 'Test Workflow',
  description: 'A test workflow',
  status: 'active',
  version: '1.0.0',
  spec: {
    nodes: [
      { id: 'node1', type: 'agent', label: 'Agent Node', config: {} },
      { id: 'node2', type: 'action', label: 'Action Node', config: {} },
    ],
    edges: [
      { id: 'edge1', source: 'node1', target: 'node2' },
    ],
    version: '1.0.0',
  },
  tags: ['test'],
  org_id: 'org_test',
  created_date: new Date().toISOString(),
  updated_date: new Date().toISOString(),
  created_by: 'test@example.com',
  ...overrides,
});

export const mockAgent = (overrides = {}) => ({
  id: '123e4567-e89b-12d3-a456-426614174001',
  name: 'Test Agent',
  version: '1.0.0',
  status: 'active',
  config: {
    provider: 'openai',
    model: 'gpt-4',
    temperature: 0.7,
    max_tokens: 2000,
  },
  org_id: 'org_test',
  created_date: new Date().toISOString(),
  updated_date: new Date().toISOString(),
  created_by: 'test@example.com',
  ...overrides,
});

export const mockRun = (overrides = {}) => ({
  id: '123e4567-e89b-12d3-a456-426614174002',
  workflow_id: '123e4567-e89b-12d3-a456-426614174000',
  agent_id: '123e4567-e89b-12d3-a456-426614174001',
  status: 'running',
  input: { test: 'data' },
  output: null,
  error_message: null,
  started_at: new Date().toISOString(),
  completed_at: null,
  duration_ms: null,
  org_id: 'org_test',
  created_date: new Date().toISOString(),
  updated_date: new Date().toISOString(),
  created_by: 'test@example.com',
  ...overrides,
});

export const mockUser = (overrides = {}) => ({
  email: 'test@example.com',
  fullName: 'Test User',
  role: 'operator',
  organization: {
    id: 'org_test',
    name: 'Test Organization',
  },
  ...overrides,
});

export const mockPolicy = (overrides = {}) => ({
  id: '123e4567-e89b-12d3-a456-426614174003',
  name: 'Test Policy',
  description: 'A test policy',
  rules: [
    {
      id: 'rule1',
      condition: 'workflow.status === "active"',
      action: 'allow',
      reason: 'Active workflows are allowed',
    },
  ],
  enabled: true,
  scope: 'workflow',
  org_id: 'org_test',
  created_date: new Date().toISOString(),
  updated_date: new Date().toISOString(),
  created_by: 'test@example.com',
  ...overrides,
});

// =============================================================================
// API MOCKS
// =============================================================================

export const mockBase44API = () => {
  const mockEntities = {
    Workflow: {
      list: vi.fn().mockResolvedValue([mockWorkflow()]),
      filter: vi.fn().mockResolvedValue([mockWorkflow()]),
      create: vi.fn().mockResolvedValue(mockWorkflow()),
      update: vi.fn().mockResolvedValue(mockWorkflow()),
      delete: vi.fn().mockResolvedValue(undefined),
    },
    Agent: {
      list: vi.fn().mockResolvedValue([mockAgent()]),
      filter: vi.fn().mockResolvedValue([mockAgent()]),
      create: vi.fn().mockResolvedValue(mockAgent()),
      update: vi.fn().mockResolvedValue(mockAgent()),
      delete: vi.fn().mockResolvedValue(undefined),
    },
    Run: {
      list: vi.fn().mockResolvedValue([mockRun()]),
      filter: vi.fn().mockResolvedValue([mockRun()]),
      create: vi.fn().mockResolvedValue(mockRun()),
      update: vi.fn().mockResolvedValue(mockRun()),
      delete: vi.fn().mockResolvedValue(undefined),
    },
    Policy: {
      list: vi.fn().mockResolvedValue([mockPolicy()]),
      filter: vi.fn().mockResolvedValue([mockPolicy()]),
      create: vi.fn().mockResolvedValue(mockPolicy()),
      update: vi.fn().mockResolvedValue(mockPolicy()),
      delete: vi.fn().mockResolvedValue(undefined),
    },
  };

  const mockFunctions = {
    invoke: vi.fn().mockResolvedValue({ status: 200, data: {} }),
  };

  const mockAuth = {
    me: vi.fn().mockResolvedValue(mockUser()),
    isAuthenticated: vi.fn().mockResolvedValue(true),
    updateMe: vi.fn().mockResolvedValue(mockUser()),
    logout: vi.fn().mockResolvedValue(undefined),
  };

  return {
    entities: mockEntities,
    functions: mockFunctions,
    auth: mockAuth,
    asServiceRole: {
      entities: mockEntities,
      functions: mockFunctions,
    },
  };
};

// =============================================================================
// REACT TESTING LIBRARY HELPERS
// =============================================================================

export const waitForLoadingToFinish = () => {
  return new Promise(resolve => setTimeout(resolve, 0));
};

export const createMockIntersectionObserver = () => {
  return class MockIntersectionObserver {
    observe = vi.fn();
    disconnect = vi.fn();
    unobserve = vi.fn();
  };
};

export const createMockResizeObserver = () => {
  return class MockResizeObserver {
    observe = vi.fn();
    disconnect = vi.fn();
    unobserve = vi.fn();
  };
};

// =============================================================================
// ASSERTION HELPERS
// =============================================================================

export const expectValidUUID = (value: string) => {
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
  expect(value).toMatch(uuidRegex);
};

export const expectValidTimestamp = (value: string) => {
  expect(() => new Date(value).toISOString()).not.toThrow();
  expect(new Date(value).toISOString()).toBe(value);
};

export const expectValidSemver = (value: string) => {
  const semverRegex = /^\d+\.\d+\.\d+$/;
  expect(value).toMatch(semverRegex);
};

// =============================================================================
// PERFORMANCE TESTING
// =============================================================================

export const measureRenderTime = async (fn: () => Promise<void>) => {
  const start = performance.now();
  await fn();
  const end = performance.now();
  return end - start;
};

export const expectPerformanceUnder = async (
  fn: () => Promise<void>,
  maxMs: number
) => {
  const duration = await measureRenderTime(fn);
  expect(duration).toBeLessThan(maxMs);
};

// =============================================================================
// ERROR SIMULATION
// =============================================================================

export const simulateNetworkError = () => {
  return Promise.reject(new Error('Network request failed'));
};

export const simulateTimeout = (ms: number = 5000) => {
  return new Promise((_, reject) => 
    setTimeout(() => reject(new Error('Request timeout')), ms)
  );
};

export const simulateRateLimitError = () => {
  return Promise.reject({
    status: 429,
    message: 'Too many requests',
    code: 'RATE_LIMIT_EXCEEDED',
  });
};

// =============================================================================
// ASYNC HELPERS
// =============================================================================

export const flushPromises = () => {
  return new Promise(resolve => setImmediate(resolve));
};

export const waitFor = async (
  condition: () => boolean,
  timeout: number = 1000,
  interval: number = 50
): Promise<void> => {
  const startTime = Date.now();
  
  while (!condition()) {
    if (Date.now() - startTime > timeout) {
      throw new Error('Timeout waiting for condition');
    }
    await new Promise(resolve => setTimeout(resolve, interval));
  }
};