/**
 * @fileoverview Trace Service
 * @description Service layer for distributed tracing operations.
 * Implements repository pattern with OpenTelemetry integration.
 */

import { base44 } from '@/api/base44Client';
import type { Trace, UUID, SpanKind, SpanAttributes, SpanEvent, Result } from '../shared/types/domain';
import { Ok, Err } from '../shared/types/domain';
import { APIError, ErrorCodes } from '../utils/api-client';

/**
 * Trace Service - handles all tracing operations.
 */
export class TraceService {
  /**
   * Create a new trace span.
   */
  async createSpan(params: {
    trace_id?: string;
    parent_span_id?: string;
    name: string;
    kind?: SpanKind;
    attributes?: SpanAttributes;
    org_id: UUID;
  }): Promise<Result<{ trace_id: string; span_id: string; trace: Trace }, APIError>> {
    try {
      const response = await base44.functions.invoke('createTrace', params);
      return Ok(response);
    } catch (error) {
      return Err(new APIError(
        ErrorCodes.SERVER_ERROR,
        'Failed to create trace span',
        { context: { name: params.name } }
      ));
    }
  }

  /**
   * End a trace span.
   */
  async endSpan(params: {
    trace_id: string;
    span_id: string;
    status?: 'ok' | 'error' | 'unset';
    attributes?: SpanAttributes;
    events?: SpanEvent[];
  }): Promise<Result<{ trace_id: string; span_id: string; duration_ms: number }, APIError>> {
    try {
      const response = await base44.functions.invoke('endTrace', params);
      return Ok(response);
    } catch (error) {
      return Err(new APIError(
        ErrorCodes.SERVER_ERROR,
        'Failed to end trace span',
        { context: { trace_id: params.trace_id, span_id: params.span_id } }
      ));
    }
  }

  /**
   * List traces with filters.
   */
  async listTraces(filters?: {
    workflow_id?: UUID;
    agent_id?: UUID;
    status?: 'ok' | 'error';
    limit?: number;
  }): Promise<Result<Trace[], APIError>> {
    try {
      const traces = filters
        ? await base44.entities.Trace.filter(filters, '-start_time', filters.limit || 100)
        : await base44.entities.Trace.list('-start_time', filters?.limit || 100);
      return Ok(traces);
    } catch (error) {
      return Err(new APIError(
        ErrorCodes.SERVER_ERROR,
        'Failed to list traces',
        { context: { filters } }
      ));
    }
  }

  /**
   * Get trace by ID with all spans.
   */
  async getTrace(traceId: string): Promise<Result<{ root: Trace; spans: Trace[] }, APIError>> {
    try {
      const spans = await base44.entities.Trace.filter({ trace_id: traceId });
      if (spans.length === 0) {
        return Err(new APIError(ErrorCodes.NOT_FOUND, 'Trace not found'));
      }

      const root = spans.find(s => !s.parent_span_id) || spans[0];
      return Ok({ root, spans });
    } catch (error) {
      return Err(new APIError(
        ErrorCodes.SERVER_ERROR,
        'Failed to get trace',
        { context: { traceId } }
      ));
    }
  }

  /**
   * Group traces by trace_id.
   */
  groupTraces(traces: Trace[]): Map<string, Trace[]> {
    return traces.reduce((acc, span) => {
      const existing = acc.get(span.trace_id) || [];
      acc.set(span.trace_id, [...existing, span]);
      return acc;
    }, new Map<string, Trace[]>());
  }

  /**
   * Calculate trace statistics.
   */
  calculateStats(spans: Trace[]): {
    total_duration: number;
    span_count: number;
    error_count: number;
    avg_latency: number;
  } {
    const durations = spans.map(s => s.duration_ms || 0);
    const errors = spans.filter(s => s.status === 'error').length;

    return {
      total_duration: Math.max(...durations),
      span_count: spans.length,
      error_count: errors,
      avg_latency: durations.reduce((a, b) => a + b, 0) / spans.length
    };
  }
}

// Singleton instance
export const traceService = new TraceService();