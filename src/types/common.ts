/**
 * @fileoverview Common TypeScript type definitions
 * @description Shared types used throughout the application
 * @module types/common
 * @version 1.0.0
 */

/**
 * Agent configuration and provider types
 */
export type AgentProvider = 'openai' | 'anthropic' | 'google' | 'meta' | 'mistral' | 'custom';

export type AgentStatus = 'active' | 'inactive' | 'paused' | 'error' | 'training';

export interface AgentConfig {
  provider: AgentProvider;
  model: string;
  temperature?: number;
  max_tokens?: number;
  top_p?: number;
  frequency_penalty?: number;
  presence_penalty?: number;
  [key: string]: any;
}

export interface Agent {
  id: string;
  name: string;
  description?: string;
  status: AgentStatus;
  config: AgentConfig;
  capabilities?: string[];
  created_at: string;
  updated_at: string;
  org_id: string;
  created_by?: string;
}

/**
 * Workflow types
 */
export type WorkflowStatus = 'draft' | 'active' | 'paused' | 'archived';

export interface Workflow {
  id: string;
  name: string;
  description?: string;
  status: WorkflowStatus;
  steps: WorkflowStep[];
  created_at: string;
  updated_at: string;
  org_id: string;
}

export interface WorkflowStep {
  id: string;
  type: string;
  agent_id?: string;
  config: Record<string, any>;
  next_steps?: string[];
}

/**
 * Execution/Run types
 */
export type RunStatus = 'pending' | 'running' | 'completed' | 'failed' | 'cancelled';

export interface Run {
  id: string;
  workflow_id: string;
  status: RunStatus;
  input?: Record<string, any>;
  output?: Record<string, any>;
  error?: string;
  started_at?: string;
  completed_at?: string;
  created_at: string;
  org_id: string;
}

/**
 * Audit log types
 */
export type AuditAction = 'create' | 'read' | 'update' | 'delete' | 'execute' | 'approve' | 'reject';

export type AuditEntity = 'agent' | 'workflow' | 'run' | 'user' | 'org' | 'system' | 'connector' | 'skill';

export interface AuditLog {
  id: string;
  entity_type: AuditEntity;
  entity_id: string;
  action: AuditAction;
  actor: string;
  metadata?: Record<string, any>;
  timestamp: string;
  org_id: string;
}

/**
 * API Response types
 */
export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: ApiError;
  trace_id?: string;
}

export interface ApiError {
  code: string;
  message: string;
  details?: Record<string, any>;
  trace_id?: string;
}

/**
 * Pagination types
 */
export interface PaginationParams {
  page?: number;
  per_page?: number;
  sort_by?: string;
  sort_order?: 'asc' | 'desc';
}

export interface PaginatedResponse<T> {
  data: T[];
  pagination: {
    page: number;
    per_page: number;
    total: number;
    total_pages: number;
    has_next: boolean;
    has_prev: boolean;
  };
}

/**
 * User and Organization types
 */
export interface User {
  id: string;
  email: string;
  name?: string;
  role: string;
  organization: Organization;
  created_at: string;
}

export interface Organization {
  id: string;
  name: string;
  created_at: string;
}

/**
 * Form and UI types
 */
export interface SelectOption {
  label: string;
  value: string;
  disabled?: boolean;
}

export interface FormField {
  name: string;
  label: string;
  type: 'text' | 'textarea' | 'select' | 'checkbox' | 'number' | 'date';
  required?: boolean;
  options?: SelectOption[];
  placeholder?: string;
  defaultValue?: any;
}

/**
 * Error types
 */
export interface AppError extends Error {
  code?: string;
  statusCode?: number;
  details?: Record<string, any>;
}

/**
 * Performance monitoring types
 */
export interface PerformanceMetrics {
  name: string;
  value: number;
  rating: 'good' | 'needs-improvement' | 'poor';
  delta?: number;
  id?: string;
}

export interface WebVitalsMetric {
  id: string;
  name: 'CLS' | 'FID' | 'FCP' | 'LCP' | 'TTFB' | 'INP';
  value: number;
  rating: 'good' | 'needs-improvement' | 'poor';
  delta: number;
  navigationType: 'navigate' | 'reload' | 'back-forward' | 'back-forward-cache' | 'prerender';
}
