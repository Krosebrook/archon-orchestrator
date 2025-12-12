/**
 * @fileoverview Domain Types
 * @description Core domain models with strict typing for the entire application.
 * Follows DDD principles with value objects and entity types.
 */

// =============================================================================
// BASE TYPES
// =============================================================================

export type UUID = string & { readonly __brand: 'UUID' };
export type Email = string & { readonly __brand: 'Email' };
export type ISODateTime = string & { readonly __brand: 'ISODateTime' };
export type SemanticVersion = string & { readonly __brand: 'SemanticVersion' };

// =============================================================================
// USER & ORGANIZATION
// =============================================================================

export interface Organization {
  id: UUID;
  name: string;
  created_date: ISODateTime;
  settings?: Record<string, unknown>;
}

export type Role = 'owner' | 'admin' | 'operator' | 'viewer';

export interface User {
  id: UUID;
  email: Email;
  fullName: string;
  role: Role;
  organization: Organization;
  created_date: ISODateTime;
  updated_date: ISODateTime;
}

// =============================================================================
// AGENT DOMAIN
// =============================================================================

export type AgentProvider = 'openai' | 'anthropic';
export type AgentStatus = 'active' | 'inactive' | 'deprecated' | 'error';

export interface AgentConfig {
  provider: AgentProvider;
  model: string;
  temperature?: number;
  max_tokens?: number;
  system_prompt?: string;
  tools?: string[];
  [key: string]: unknown;
}

export interface Agent {
  id: UUID;
  name: string;
  version: SemanticVersion;
  status: AgentStatus;
  config: AgentConfig;
  org_id: UUID;
  created_date: ISODateTime;
  updated_date: ISODateTime;
  created_by: Email;
}

// =============================================================================
// WORKFLOW DOMAIN
// =============================================================================

export type WorkflowStatus = 'draft' | 'active' | 'paused' | 'archived';

export interface WorkflowNode {
  id: string;
  type: string;
  label: string;
  config: Record<string, unknown>;
  position?: { x: number; y: number };
}

export interface WorkflowEdge {
  id: string;
  source: string;
  target: string;
  condition?: string;
}

export interface WorkflowSpec {
  nodes: WorkflowNode[];
  edges: WorkflowEdge[];
  metadata?: Record<string, unknown>;
}

export interface Workflow {
  id: UUID;
  name: string;
  description?: string;
  status: WorkflowStatus;
  spec: WorkflowSpec;
  version: SemanticVersion;
  org_id: UUID;
  created_date: ISODateTime;
  updated_date: ISODateTime;
  created_by: Email;
}

// =============================================================================
// RUN DOMAIN
// =============================================================================

export type RunStatus = 'pending' | 'running' | 'completed' | 'failed' | 'cancelled';

export interface RunMetrics {
  duration_ms?: number;
  total_tokens?: number;
  total_cost_cents?: number;
  [key: string]: unknown;
}

export interface Run {
  id: UUID;
  workflow_id: UUID;
  status: RunStatus;
  trigger: string;
  input?: Record<string, unknown>;
  output?: Record<string, unknown>;
  error?: string;
  metrics?: RunMetrics;
  org_id: UUID;
  created_date: ISODateTime;
  updated_date: ISODateTime;
  created_by: Email;
}

// =============================================================================
// TRACE DOMAIN
// =============================================================================

export type SpanKind = 'server' | 'client' | 'producer' | 'consumer' | 'internal';
export type SpanStatus = 'ok' | 'error' | 'unset';

export interface SpanAttributes {
  workflow_id?: UUID;
  agent_id?: UUID;
  node_id?: string;
  user_id?: UUID;
  org_id?: UUID;
  'http.method'?: string;
  'http.url'?: string;
  'http.status_code'?: number;
  'ai.provider'?: AgentProvider;
  'ai.model'?: string;
  'ai.prompt_tokens'?: number;
  'ai.completion_tokens'?: number;
  error?: boolean;
  'error.message'?: string;
  [key: string]: unknown;
}

export interface SpanEvent {
  timestamp: ISODateTime;
  name: string;
  attributes?: Record<string, unknown>;
}

export interface Trace {
  id: UUID;
  trace_id: string;
  parent_span_id?: string;
  span_id: string;
  name: string;
  kind: SpanKind;
  start_time: ISODateTime;
  end_time?: ISODateTime;
  duration_ms?: number;
  status: SpanStatus;
  attributes?: SpanAttributes;
  events?: SpanEvent[];
  org_id: UUID;
}

// =============================================================================
// METRIC DOMAIN
// =============================================================================

export interface AgentMetric {
  id: UUID;
  agent_id?: UUID;
  run_id?: UUID;
  provider: AgentProvider | 'unknown';
  model: string;
  prompt_tokens: number;
  completion_tokens: number;
  latency_ms: number;
  cost_cents: number;
  status: 'success' | 'error' | 'timeout' | 'throttled';
  error_code?: string;
  timestamp: ISODateTime;
  cpu_usage_percent?: number;
  memory_mb?: number;
  request_count: number;
  org_id: UUID;
}

// =============================================================================
// CI/CD DOMAIN
// =============================================================================

export type PipelineStageType = 'lint' | 'test' | 'build' | 'deploy' | 'security' | 'approval';
export type PipelineStatus = 'pending' | 'running' | 'success' | 'failed' | 'cancelled';

export interface PipelineStage {
  name: string;
  type: PipelineStageType;
  config?: Record<string, unknown>;
  order: number;
}

export interface CIPipeline {
  id: UUID;
  name: string;
  agent_id?: UUID;
  workflow_id?: UUID;
  trigger: 'manual' | 'commit' | 'schedule' | 'webhook';
  stages: PipelineStage[];
  last_run?: {
    status: PipelineStatus;
    started_at: ISODateTime;
    finished_at?: ISODateTime;
    duration_ms?: number;
  };
  enabled: boolean;
  org_id: UUID;
}

export type ApprovalStatus = 'pending' | 'approved' | 'rejected' | 'expired';
export type DeploymentEnvironment = 'staging' | 'production';

export interface ApprovalRequest {
  id: UUID;
  workflow_id: UUID;
  pipeline_id: UUID;
  version: SemanticVersion;
  environment: DeploymentEnvironment;
  requested_by: Email;
  status: ApprovalStatus;
  comments?: string;
  approved_by?: Email;
  approved_at?: ISODateTime;
  expires_at?: ISODateTime;
  metadata?: Record<string, unknown>;
  org_id: UUID;
  created_date: ISODateTime;
}

// =============================================================================
// AUDIT DOMAIN
// =============================================================================

export type AuditAction = 'create' | 'update' | 'delete' | 'execute' | 'approve' | 'reject';
export type AuditSeverity = 'info' | 'warning' | 'critical';

export interface Audit {
  id: UUID;
  action: AuditAction;
  entity: string;
  entity_id: UUID;
  actor: Email;
  severity: AuditSeverity;
  metadata?: Record<string, unknown>;
  org_id: UUID;
  created_date: ISODateTime;
}

// =============================================================================
// RESULT TYPES (Railway-oriented programming)
// =============================================================================

export type Result<T, E = Error> = 
  | { ok: true; value: T }
  | { ok: false; error: E };

export const Ok = <T>(value: T): Result<T, never> => ({ ok: true, value });
export const Err = <E>(error: E): Result<never, E> => ({ ok: false, error });

// =============================================================================
// QUERY TYPES
// =============================================================================

export interface PaginationParams {
  cursor?: string;
  limit?: number;
}

export interface PaginatedResponse<T> {
  data: T[];
  next_cursor?: string;
  has_more: boolean;
  total?: number;
}

export interface FilterParams {
  [key: string]: unknown;
}

// =============================================================================
// TYPE GUARDS
// =============================================================================

export function isUUID(value: unknown): value is UUID {
  return typeof value === 'string' && /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(value);
}

export function isEmail(value: unknown): value is Email {
  return typeof value === 'string' && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
}

export function isISODateTime(value: unknown): value is ISODateTime {
  return typeof value === 'string' && !isNaN(Date.parse(value));
}

export function isSemanticVersion(value: unknown): value is SemanticVersion {
  return typeof value === 'string' && /^\d+\.\d+\.\d+(-[a-zA-Z0-9.-]+)?(\+[a-zA-Z0-9.-]+)?$/.test(value);
}