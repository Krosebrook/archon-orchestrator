/**
 * Mock Agent Data Fixtures
 * 
 * Reusable mock data for agent-related tests
 */

export const mockAgent = {
  id: 'agent_123',
  name: 'Test Agent',
  description: 'A test agent for unit testing',
  status: 'active',
  provider: 'openai',
  model: 'gpt-4o',
  config: {
    temperature: 0.7,
    max_tokens: 1000,
    top_p: 1,
  },
  created_at: '2025-01-01T00:00:00Z',
  updated_at: '2025-01-01T00:00:00Z',
  org_id: 'org_123',
};

export const mockAgentList = [
  mockAgent,
  {
    id: 'agent_456',
    name: 'Another Agent',
    description: 'Another test agent',
    status: 'inactive',
    provider: 'anthropic',
    model: 'claude-3-opus-20240229',
    config: {
      temperature: 0.5,
      max_tokens: 2000,
    },
    created_at: '2025-01-02T00:00:00Z',
    updated_at: '2025-01-02T00:00:00Z',
    org_id: 'org_123',
  },
];

export const mockAgentExecution = {
  id: 'exec_123',
  agent_id: 'agent_123',
  status: 'completed',
  input: 'Test input',
  output: 'Test output',
  tokens_used: 150,
  cost: 0.003,
  started_at: '2025-01-01T10:00:00Z',
  completed_at: '2025-01-01T10:00:05Z',
  trace_id: 'trace_123',
};

/**
 * Factory function to create mock agents with custom properties
 */
export function createMockAgent(overrides = {}) {
  return {
    ...mockAgent,
    ...overrides,
    id: overrides.id || `agent_${Math.random().toString(36).substr(2, 9)}`,
  };
}

/**
 * Factory function to create mock agent executions
 */
export function createMockExecution(overrides = {}) {
  return {
    ...mockAgentExecution,
    ...overrides,
    id: overrides.id || `exec_${Math.random().toString(36).substr(2, 9)}`,
  };
}
