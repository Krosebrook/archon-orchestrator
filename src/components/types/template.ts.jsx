/**
 * @fileoverview Template Domain Types
 * @description Type-safe interfaces for workflow templates, reviews, and usage
 * @version 1.0.0
 */

/**
 * Template category taxonomy
 */
export type TemplateCategory =
  | 'customer_service'
  | 'data_processing'
  | 'content_generation'
  | 'automation'
  | 'integration'
  | 'analytics';

/**
 * Template complexity levels
 */
export type TemplateComplexity = 'beginner' | 'intermediate' | 'advanced';

/**
 * Template change types for versioning
 */
export type TemplateChangeType = 'major' | 'minor' | 'patch' | 'hotfix';

/**
 * Agent requirement specification
 */
export interface AgentRequirement {
  role: string;
  provider: 'openai' | 'anthropic';
  capabilities: string[];
}

/**
 * Workflow node specification
 */
export interface WorkflowNode {
  id: string;
  type: string;
  data: {
    label: string;
    config?: Record<string, unknown>;
    integration?: string;
    operation?: string;
    method?: string;
    schedule?: string;
    [key: string]: unknown;
  };
  position: {
    x: number;
    y: number;
  };
}

/**
 * Workflow edge specification
 */
export interface WorkflowEdge {
  id: string;
  source: string;
  target: string;
  label?: string;
}

/**
 * Complete workflow specification
 */
export interface WorkflowSpec {
  nodes: WorkflowNode[];
  edges: WorkflowEdge[];
  version?: string;
  metadata?: Record<string, unknown>;
}

/**
 * Main workflow template entity
 */
export interface WorkflowTemplate {
  id: string;
  name: string;
  description: string;
  category: TemplateCategory;
  tags: string[];
  use_case: string;
  complexity: TemplateComplexity;
  spec: WorkflowSpec;
  required_agents: AgentRequirement[];
  estimated_cost_per_run_cents: number;
  estimated_duration_sec: number;
  ai_features: string[];
  usage_count: number;
  is_featured: boolean;
  is_marketplace_item?: boolean;
  rating?: number;
  installation_count?: number;
  org_id: string;
  created_date: string;
  updated_date: string;
  created_by: string;
}

/**
 * Template usage tracking
 */
export interface TemplateUsage {
  id: string;
  template_id: string;
  user_email: string;
  workflow_id: string;
  org_id: string;
  created_date: string;
  updated_date: string;
  created_by: string;
}

/**
 * Template review and rating
 */
export interface TemplateReview {
  id: string;
  template_id: string;
  user_email: string;
  rating: number;
  comment: string;
  org_id: string;
  created_date: string;
  updated_date: string;
  created_by: string;
}

/**
 * Template rating aggregation
 */
export interface TemplateRatingData {
  average: number;
  count: number;
}

/**
 * Template filter options
 */
export interface TemplateFilters {
  category?: TemplateCategory | 'all';
  complexity?: TemplateComplexity | 'all';
  searchQuery?: string;
  featured?: boolean;
  minRating?: number;
}

/**
 * Template creation DTO
 */
export type CreateTemplateDTO = Omit<
  WorkflowTemplate,
  'id' | 'created_date' | 'updated_date' | 'created_by' | 'usage_count'
>;

/**
 * Template update DTO
 */
export type UpdateTemplateDTO = Partial<Omit<WorkflowTemplate, 'id' | 'org_id'>>;

/**
 * Service result type with error handling
 */
export interface ServiceResult<T> {
  ok: boolean;
  value?: T;
  error?: {
    code: string;
    message: string;
    hint?: string;
    retryable: boolean;
    trace_id?: string;
  };
}