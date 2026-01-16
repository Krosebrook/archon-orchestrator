/**
 * @fileoverview Centralized Validation Schemas
 * @module core/validation/schemas
 * @description Zod schemas for all entities with strict validation
 */

import { z } from 'zod';

// =============================================================================
// BASE SCHEMAS
// =============================================================================

export const orgIdSchema = z.string().uuid();
export const emailSchema = z.string().email();
export const urlSchema = z.string().url();
export const semverSchema = z.string().regex(/^\d+\.\d+\.\d+$/);
export const timestampSchema = z.string().datetime();
export const jsonSchema = z.record(z.unknown());

// =============================================================================
// AGENT SCHEMAS
// =============================================================================

export const agentConfigSchema = z.object({
  provider: z.enum(['openai', 'anthropic']),
  model: z.string().min(1),
  temperature: z.number().min(0).max(2),
  max_tokens: z.number().int().positive().max(100000),
}).passthrough();

export const agentStatusSchema = z.enum(['active', 'inactive', 'deprecated', 'error']);

export const createAgentSchema = z.object({
  name: z.string().min(1).max(100),
  version: semverSchema,
  status: agentStatusSchema,
  config: agentConfigSchema,
  org_id: orgIdSchema,
});

export const updateAgentSchema = createAgentSchema.partial().required({ org_id: true });

// =============================================================================
// WORKFLOW SCHEMAS
// =============================================================================

export const workflowNodeSchema = z.object({
  id: z.string().uuid(),
  type: z.enum(['agent', 'condition', 'loop', 'trigger', 'action', 'human_review']),
  label: z.string().min(1),
  config: jsonSchema.optional(),
  position: z.object({
    x: z.number(),
    y: z.number(),
  }).optional(),
});

export const workflowEdgeSchema = z.object({
  id: z.string().uuid(),
  source: z.string().uuid(),
  target: z.string().uuid(),
  condition: z.string().optional(),
});

export const workflowSpecSchema = z.object({
  nodes: z.array(workflowNodeSchema),
  edges: z.array(workflowEdgeSchema),
  version: semverSchema,
});

export const workflowStatusSchema = z.enum(['draft', 'active', 'paused', 'archived', 'error']);

export const createWorkflowSchema = z.object({
  name: z.string().min(1).max(200),
  description: z.string().max(2000).optional(),
  spec: workflowSpecSchema,
  status: workflowStatusSchema,
  tags: z.array(z.string()).optional(),
  org_id: orgIdSchema,
});

export const updateWorkflowSchema = createWorkflowSchema.partial().required({ org_id: true });

// =============================================================================
// RUN SCHEMAS
// =============================================================================

export const runStatusSchema = z.enum([
  'queued',
  'running',
  'paused',
  'completed',
  'failed',
  'cancelled',
  'timed_out'
]);

export const createRunSchema = z.object({
  workflow_id: z.string().uuid(),
  agent_id: z.string().uuid().optional(),
  status: runStatusSchema,
  input: jsonSchema.optional(),
  org_id: orgIdSchema,
});

export const updateRunSchema = z.object({
  status: runStatusSchema.optional(),
  output: jsonSchema.optional(),
  error_message: z.string().optional(),
  completed_at: timestampSchema.optional(),
  org_id: orgIdSchema,
});

// =============================================================================
// POLICY SCHEMAS
// =============================================================================

export const policyRuleSchema = z.object({
  id: z.string().uuid(),
  condition: z.string(),
  action: z.enum(['allow', 'deny', 'require_approval']),
  reason: z.string(),
});

export const createPolicySchema = z.object({
  name: z.string().min(1).max(200),
  description: z.string().max(1000).optional(),
  rules: z.array(policyRuleSchema),
  enabled: z.boolean().default(true),
  scope: z.enum(['workflow', 'agent', 'run', 'global']),
  org_id: orgIdSchema,
});

export const updatePolicySchema = createPolicySchema.partial().required({ org_id: true });

// =============================================================================
// APPROVAL SCHEMAS
// =============================================================================

export const approvalEnvironmentSchema = z.enum(['staging', 'production']);
export const approvalStatusSchema = z.enum(['pending', 'approved', 'rejected', 'expired']);

export const createApprovalRequestSchema = z.object({
  workflow_id: z.string().uuid(),
  pipeline_id: z.string().uuid(),
  version: semverSchema,
  environment: approvalEnvironmentSchema,
  requested_by: emailSchema,
  comments: z.string().max(2000).optional(),
  expires_at: timestampSchema.optional(),
  org_id: orgIdSchema,
});

export const processApprovalSchema = z.object({
  request_id: z.string().uuid(),
  action: z.enum(['approve', 'reject']),
  approved_by: emailSchema,
  comments: z.string().max(2000).optional(),
  org_id: orgIdSchema,
});

// =============================================================================
// TRACE SCHEMAS
// =============================================================================

export const traceKindSchema = z.enum(['server', 'client', 'producer', 'consumer', 'internal']);
export const traceStatusSchema = z.enum(['ok', 'error', 'unset']);

export const createTraceSchema = z.object({
  trace_id: z.string().length(32),
  parent_span_id: z.string().length(16).optional(),
  span_id: z.string().length(16),
  name: z.string().min(1),
  kind: traceKindSchema,
  start_time: timestampSchema,
  attributes: jsonSchema.optional(),
  org_id: orgIdSchema,
});

export const endTraceSchema = z.object({
  span_id: z.string().length(16),
  end_time: timestampSchema,
  status: traceStatusSchema,
  duration_ms: z.number().int().nonnegative(),
  org_id: orgIdSchema,
});

// =============================================================================
// METRIC SCHEMAS
// =============================================================================

export const metricProviderSchema = z.enum(['openai', 'anthropic', 'other']);
export const metricStatusSchema = z.enum(['success', 'error', 'timeout', 'throttled']);

export const createMetricSchema = z.object({
  agent_id: z.string().uuid(),
  run_id: z.string().uuid().optional(),
  provider: metricProviderSchema,
  model: z.string().min(1),
  prompt_tokens: z.number().int().nonnegative(),
  completion_tokens: z.number().int().nonnegative(),
  latency_ms: z.number().int().nonnegative(),
  cost_cents: z.number().int().nonnegative(),
  status: metricStatusSchema,
  error_code: z.string().optional(),
  timestamp: timestampSchema,
  org_id: orgIdSchema,
});

// =============================================================================
// USER SCHEMAS
// =============================================================================

export const userRoleSchema = z.enum(['owner', 'admin', 'operator', 'viewer']);

export const updateUserPreferencesSchema = z.object({
  theme: z.enum(['light', 'dark', 'system']).optional(),
  language: z.enum(['en', 'es', 'fr', 'de', 'zh']).optional(),
  timezone: z.string().optional(),
  notification_preferences: z.object({
    email_enabled: z.boolean().optional(),
    push_enabled: z.boolean().optional(),
    workflow_events: z.boolean().optional(),
    agent_events: z.boolean().optional(),
    approval_requests: z.boolean().optional(),
    security_alerts: z.boolean().optional(),
  }).optional(),
});

export const updateUserProfileSchema = z.object({
  avatar_url: urlSchema.optional(),
  bio: z.string().max(500).optional(),
  title: z.string().max(100).optional(),
  department: z.string().max(100).optional(),
  phone: z.string().max(20).optional(),
  location: z.string().max(100).optional(),
  skills: z.array(z.string().max(50)).optional(),
  social_links: z.object({
    linkedin: urlSchema.optional(),
    github: urlSchema.optional(),
    twitter: urlSchema.optional(),
  }).optional(),
});

// =============================================================================
// VALIDATION HELPER
// =============================================================================

export type ValidationResult<T> = 
  | { success: true; data: T }
  | { success: false; errors: z.ZodError['errors'] };

export function validate<T>(schema: z.ZodSchema<T>, data: unknown): ValidationResult<T> {
  const result = schema.safeParse(data);
  
  if (result.success) {
    return { success: true, data: result.data };
  }
  
  return { success: false, errors: result.error.errors };
}

// =============================================================================
// EXPORTS
// =============================================================================

export type AgentConfig = z.infer<typeof agentConfigSchema>;
export type CreateAgent = z.infer<typeof createAgentSchema>;
export type UpdateAgent = z.infer<typeof updateAgentSchema>;

export type WorkflowNode = z.infer<typeof workflowNodeSchema>;
export type WorkflowEdge = z.infer<typeof workflowEdgeSchema>;
export type WorkflowSpec = z.infer<typeof workflowSpecSchema>;
export type CreateWorkflow = z.infer<typeof createWorkflowSchema>;
export type UpdateWorkflow = z.infer<typeof updateWorkflowSchema>;

export type CreateRun = z.infer<typeof createRunSchema>;
export type UpdateRun = z.infer<typeof updateRunSchema>;

export type PolicyRule = z.infer<typeof policyRuleSchema>;
export type CreatePolicy = z.infer<typeof createPolicySchema>;
export type UpdatePolicy = z.infer<typeof updatePolicySchema>;

export type CreateApprovalRequest = z.infer<typeof createApprovalRequestSchema>;
export type ProcessApproval = z.infer<typeof processApprovalSchema>;

export type CreateTrace = z.infer<typeof createTraceSchema>;
export type EndTrace = z.infer<typeof endTraceSchema>;

export type CreateMetric = z.infer<typeof createMetricSchema>;

export type UpdateUserPreferences = z.infer<typeof updateUserPreferencesSchema>;
export type UpdateUserProfile = z.infer<typeof updateUserProfileSchema>;