/**
 * Base44 SDK Mocks
 * 
 * Mock implementation of Base44 SDK for testing
 */

import { vi } from 'vitest';

/**
 * Mock Base44 client
 */
export const mockBase44Client = {
  auth: {
    me: vi.fn().mockResolvedValue({
      id: 'user_123',
      email: 'test@example.com',
      name: 'Test User',
      organization: {
        id: 'org_123',
        name: 'Test Org',
      },
    }),
    signOut: vi.fn().mockResolvedValue(undefined),
  },
  entities: {
    Agent: {
      list: vi.fn().mockResolvedValue({ data: [], count: 0 }),
      get: vi.fn().mockResolvedValue(null),
      create: vi.fn().mockResolvedValue({ id: 'new_agent_123' }),
      update: vi.fn().mockResolvedValue({ id: 'agent_123' }),
      delete: vi.fn().mockResolvedValue(undefined),
    },
    Workflow: {
      list: vi.fn().mockResolvedValue({ data: [], count: 0 }),
      get: vi.fn().mockResolvedValue(null),
      create: vi.fn().mockResolvedValue({ id: 'new_workflow_123' }),
      update: vi.fn().mockResolvedValue({ id: 'workflow_123' }),
      delete: vi.fn().mockResolvedValue(undefined),
    },
    Audit: {
      create: vi.fn().mockResolvedValue({ id: 'audit_123' }),
      list: vi.fn().mockResolvedValue({ data: [], count: 0 }),
    },
  },
  asServiceRole: {
    entities: {
      Audit: {
        create: vi.fn().mockResolvedValue({ id: 'audit_123' }),
      },
    },
  },
};

/**
 * Factory function to create a fresh mock Base44 client
 */
export function createMockBase44Client(overrides = {}) {
  const client = {
    ...mockBase44Client,
    ...overrides,
  };
  
  // Reset all mocks
  Object.keys(client.auth).forEach(key => {
    if (vi.isMockFunction(client.auth[key])) {
      client.auth[key].mockClear();
    }
  });
  
  return client;
}

/**
 * Mock useBase44 hook
 */
export function mockUseBase44() {
  return mockBase44Client;
}
