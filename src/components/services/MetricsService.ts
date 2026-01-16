/**
 * @fileoverview Metrics Service
 * @description Service layer for metrics collection and analysis.
 */

import { base44 } from '@/api/base44Client';
import type { AgentMetric, UUID, Result } from '../shared/types/domain';
import { Ok, Err } from '../shared/types/domain';
import { APIError, ErrorCodes } from '../utils/api-client';

export interface MetricCollectionParams {
  agent_id?: UUID;
  run_id?: UUID;
  provider: string;
  model: string;
  prompt_tokens?: number;
  completion_tokens?: number;
  latency_ms?: number;
  cost_cents?: number;
  status?: string;
  org_id: UUID;
}

export interface MetricAggregation {
  avg_latency: number;
  p50_latency: number;
  p95_latency: number;
  p99_latency: number;
  total_requests: number;
  error_rate: number;
  total_cost_cents: number;
  total_tokens: number;
}

/**
 * Metrics Service - handles metric collection and aggregation.
 */
export class MetricsService {
  /**
   * Collect a metric data point.
   */
  async collectMetric(params: MetricCollectionParams): Promise<Result<{ metric_id: UUID }, APIError>> {
    try {
      const response = await base44.functions.invoke('collectMetrics', params);
      return Ok(response);
    } catch (error) {
      return Err(new APIError(
        ErrorCodes.SERVER_ERROR,
        'Failed to collect metric',
        { context: { agent_id: params.agent_id } }
      ));
    }
  }

  /**
   * List metrics with filters.
   */
  async listMetrics(filters?: {
    agent_id?: UUID;
    run_id?: UUID;
    provider?: string;
    status?: string;
    start_date?: string;
    end_date?: string;
    limit?: number;
  }): Promise<Result<AgentMetric[], APIError>> {
    try {
      const queryFilters: Record<string, unknown> = {};
      if (filters?.agent_id) queryFilters.agent_id = filters.agent_id;
      if (filters?.run_id) queryFilters.run_id = filters.run_id;
      if (filters?.provider) queryFilters.provider = filters.provider;
      if (filters?.status) queryFilters.status = filters.status;

      const metrics = await base44.entities.AgentMetric.filter(
        queryFilters,
        '-timestamp',
        filters?.limit || 1000
      );

      // Filter by date range if provided
      let filtered = metrics;
      if (filters?.start_date || filters?.end_date) {
        filtered = metrics.filter(m => {
          const ts = new Date(m.timestamp).getTime();
          const start = filters.start_date ? new Date(filters.start_date).getTime() : 0;
          const end = filters.end_date ? new Date(filters.end_date).getTime() : Date.now();
          return ts >= start && ts <= end;
        });
      }

      return Ok(filtered);
    } catch (error) {
      return Err(new APIError(
        ErrorCodes.SERVER_ERROR,
        'Failed to list metrics',
        { context: { filters } }
      ));
    }
  }

  /**
   * Aggregate metrics for analysis.
   */
  async aggregateMetrics(filters?: {
    agent_id?: UUID;
    start_date?: string;
    end_date?: string;
  }): Promise<Result<MetricAggregation, APIError>> {
    const result = await this.listMetrics(filters);
    
    if (!result.ok) {
      return result;
    }

    const metrics = result.value;
    if (metrics.length === 0) {
      return Ok({
        avg_latency: 0,
        p50_latency: 0,
        p95_latency: 0,
        p99_latency: 0,
        total_requests: 0,
        error_rate: 0,
        total_cost_cents: 0,
        total_tokens: 0
      });
    }

    const latencies = metrics.map(m => m.latency_ms).sort((a, b) => a - b);
    const errors = metrics.filter(m => m.status === 'error').length;

    return Ok({
      avg_latency: latencies.reduce((a, b) => a + b, 0) / latencies.length,
      p50_latency: latencies[Math.floor(latencies.length * 0.5)],
      p95_latency: latencies[Math.floor(latencies.length * 0.95)],
      p99_latency: latencies[Math.floor(latencies.length * 0.99)],
      total_requests: metrics.length,
      error_rate: errors / metrics.length,
      total_cost_cents: metrics.reduce((sum, m) => sum + m.cost_cents, 0),
      total_tokens: metrics.reduce((sum, m) => sum + m.prompt_tokens + m.completion_tokens, 0)
    });
  }

  /**
   * Get metrics by time buckets.
   */
  bucketMetrics(metrics: AgentMetric[], bucketSize: 'hour' | 'day' | 'week'): Map<string, AgentMetric[]> {
    const buckets = new Map<string, AgentMetric[]>();

    metrics.forEach(metric => {
      const date = new Date(metric.timestamp);
      let bucketKey: string;

      switch (bucketSize) {
        case 'hour':
          bucketKey = `${date.toISOString().slice(0, 13)}:00:00Z`;
          break;
        case 'day':
          bucketKey = date.toISOString().slice(0, 10);
          break;
        case 'week':
          const weekStart = new Date(date);
          weekStart.setDate(date.getDate() - date.getDay());
          bucketKey = weekStart.toISOString().slice(0, 10);
          break;
      }

      const existing = buckets.get(bucketKey) || [];
      buckets.set(bucketKey, [...existing, metric]);
    });

    return buckets;
  }
}

// Singleton instance
export const metricsService = new MetricsService();