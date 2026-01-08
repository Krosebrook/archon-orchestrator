/**
 * @fileoverview Base44 SDK Mock Utilities
 * @description Mock utilities for Base44 SDK in tests
 */

import { vi } from 'vitest';

/**
 * Create a mock Base44 client with common methods
 * @returns {Object} Mocked Base44 client
 */
export function createMockBase44Client() {
  return {
    auth: {
      me: vi.fn().mockResolvedValue({
        id: 'user-123',
        email: 'test@example.com',
        name: 'Test User',
        organization: {
          id: 'org-123',
          name: 'Test Organization',
        },
        role: 'admin',
      }),
      signIn: vi.fn().mockResolvedValue({ success: true }),
      signOut: vi.fn().mockResolvedValue({ success: true }),
    },
    entities: {
      Agent: {
        create: vi.fn().mockResolvedValue({
          id: 'agent-123',
          name: 'Test Agent',
          version: '1.0.0',
          created_date: new Date().toISOString(),
        }),
        filter: vi.fn().mockResolvedValue([]),
        get: vi.fn().mockResolvedValue(null),
        update: vi.fn().mockResolvedValue({}),
        delete: vi.fn().mockResolvedValue({ success: true }),
      },
      Workflow: {
        create: vi.fn().mockResolvedValue({
          id: 'workflow-123',
          name: 'Test Workflow',
          created_date: new Date().toISOString(),
        }),
        filter: vi.fn().mockResolvedValue([]),
        get: vi.fn().mockResolvedValue(null),
        update: vi.fn().mockResolvedValue({}),
        delete: vi.fn().mockResolvedValue({ success: true }),
      },
      WorkflowRun: {
        create: vi.fn().mockResolvedValue({
          id: 'run-123',
          status: 'running',
          created_date: new Date().toISOString(),
        }),
        filter: vi.fn().mockResolvedValue([]),
        get: vi.fn().mockResolvedValue(null),
        update: vi.fn().mockResolvedValue({}),
      },
      Audit: {
        create: vi.fn().mockResolvedValue({
          id: 'audit-123',
          created_date: new Date().toISOString(),
        }),
        filter: vi.fn().mockResolvedValue([]),
      },
      AgentCollaboration: {
        create: vi.fn().mockResolvedValue({}),
        filter: vi.fn().mockResolvedValue([]),
        get: vi.fn().mockResolvedValue(null),
        update: vi.fn().mockResolvedValue({}),
      },
      WorkflowOptimization: {
        create: vi.fn().mockResolvedValue({}),
        filter: vi.fn().mockResolvedValue([]),
        get: vi.fn().mockResolvedValue(null),
      },
    },
    asServiceRole: {
      entities: {
        Agent: {
          create: vi.fn().mockResolvedValue({
            id: 'agent-123',
            name: 'Test Agent',
          }),
          filter: vi.fn().mockResolvedValue([]),
          get: vi.fn().mockResolvedValue(null),
          update: vi.fn().mockResolvedValue({}),
          delete: vi.fn().mockResolvedValue({ success: true }),
        },
        Workflow: {
          create: vi.fn().mockResolvedValue({
            id: 'workflow-123',
            name: 'Test Workflow',
          }),
          filter: vi.fn().mockResolvedValue([]),
          get: vi.fn().mockResolvedValue(null),
          update: vi.fn().mockResolvedValue({}),
        },
        Audit: {
          create: vi.fn().mockResolvedValue({
            id: 'audit-123',
          }),
          filter: vi.fn().mockResolvedValue([]),
        },
      },
    },
  };
}

/**
 * Mock the base44 client module
 * Usage: mockBase44Client() in beforeEach
 */
export function mockBase44Client() {
  const mockClient = createMockBase44Client();
  
  vi.mock('@/api/base44Client', () => ({
    base44: mockClient,
  }));
  
  return mockClient;
}

/**
 * Create test data factories
 */
export const testData = {
  agent: (overrides = {}) => ({
    id: 'agent-123',
    name: 'Test Agent',
    version: '1.0.0',
    description: 'A test agent for unit testing',
    provider: 'openai',
    model: 'gpt-4',
    temperature: 0.7,
    max_tokens: 2000,
    status: 'active',
    capabilities: ['chat', 'completion'],
    created_date: new Date().toISOString(),
    org_id: 'org-123',
    ...overrides,
  }),
  
  workflow: (overrides = {}) => ({
    id: 'workflow-123',
    name: 'Test Workflow',
    description: 'A test workflow',
    status: 'active',
    steps: [],
    created_date: new Date().toISOString(),
    org_id: 'org-123',
    ...overrides,
  }),
  
  workflowRun: (overrides = {}) => ({
    id: 'run-123',
    workflow_id: 'workflow-123',
    status: 'running',
    started_at: new Date().toISOString(),
    org_id: 'org-123',
    ...overrides,
  }),
  
  user: (overrides = {}) => ({
    id: 'user-123',
    email: 'test@example.com',
    name: 'Test User',
    role: 'admin',
    organization: {
      id: 'org-123',
      name: 'Test Organization',
    },
    ...overrides,
  }),
};

/**
 * Mock fetch for API calls
 */
export function mockFetch(responseData, options = {}) {
  const { status = 200, ok = true } = options;
  
  global.fetch = vi.fn().mockResolvedValue({
    ok,
    status,
    json: async () => responseData,
    text: async () => JSON.stringify(responseData),
  });
  
  return global.fetch;
}

/**
 * Reset all Base44 mocks
 */
export function resetBase44Mocks(mockClient) {
  Object.values(mockClient.entities).forEach((entity) => {
    Object.values(entity).forEach((method) => {
      if (typeof method === 'function' && method.mockClear) {
        method.mockClear();
      }
    });
  });
  
  if (mockClient.asServiceRole) {
    Object.values(mockClient.asServiceRole.entities).forEach((entity) => {
      Object.values(entity).forEach((method) => {
        if (typeof method === 'function' && method.mockClear) {
          method.mockClear();
        }
      });
    });
  }
}
