/**
 * Mock Workflow Data Fixtures
 * 
 * Reusable mock data for workflow-related tests
 */

export const mockWorkflow = {
  id: 'workflow_123',
  name: 'Test Workflow',
  description: 'A test workflow for unit testing',
  status: 'active',
  steps: [
    {
      id: 'step_1',
      type: 'agent',
      agent_id: 'agent_123',
      config: {},
    },
    {
      id: 'step_2',
      type: 'condition',
      condition: 'success',
      next_step_id: 'step_3',
    },
  ],
  created_at: '2025-01-01T00:00:00Z',
  updated_at: '2025-01-01T00:00:00Z',
  org_id: 'org_123',
};

export const mockWorkflowList = [
  mockWorkflow,
  {
    id: 'workflow_456',
    name: 'Another Workflow',
    description: 'Another test workflow',
    status: 'inactive',
    steps: [],
    created_at: '2025-01-02T00:00:00Z',
    updated_at: '2025-01-02T00:00:00Z',
    org_id: 'org_123',
  },
];

export const mockWorkflowExecution = {
  id: 'wf_exec_123',
  workflow_id: 'workflow_123',
  status: 'completed',
  started_at: '2025-01-01T10:00:00Z',
  completed_at: '2025-01-01T10:05:00Z',
  steps_completed: 2,
  total_steps: 2,
  trace_id: 'trace_456',
};

/**
 * Factory function to create mock workflows with custom properties
 */
export function createMockWorkflow(overrides = {}) {
  return {
    ...mockWorkflow,
    ...overrides,
    id: overrides.id || `workflow_${Math.random().toString(36).substr(2, 9)}`,
  };
}

/**
 * Factory function to create mock workflow executions
 */
export function createMockWorkflowExecution(overrides = {}) {
  return {
    ...mockWorkflowExecution,
    ...overrides,
    id: overrides.id || `wf_exec_${Math.random().toString(36).substr(2, 9)}`,
  };
}
