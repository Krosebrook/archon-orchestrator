/**
 * @fileoverview Trace Service
 * @description Service layer for distributed tracing operations.
 */

import { base44 } from '@/api/base44Client';
import { APIError, ErrorCodes } from '../utils/api-client';

/**
 * Generates unique span ID (16-char hex).
 */
function generateSpanId() {
  const bytes = new Uint8Array(8);
  crypto.getRandomValues(bytes);
  return Array.from(bytes).map(b => b.toString(16).padStart(2, '0')).join('');
}

/**
 * Generates unique trace ID (32-char hex).
 */
function generateTraceId() {
  const bytes = new Uint8Array(16);
  crypto.getRandomValues(bytes);
  return Array.from(bytes).map(b => b.toString(16).padStart(2, '0')).join('');
}

/**
 * Trace Service - handles all tracing operations.
 */
export class TraceService {
  /**
   * Create a new trace span.
   */
  async createSpan(params) {
    try {
      const response = await base44.functions.invoke('createTrace', params);
      return { ok: true, value: response };
    } catch (error) {
      return { 
        ok: false, 
        error: new APIError(
          ErrorCodes.SERVER_ERROR,
          'Failed to create trace span',
          { context: { name: params.name } }
        )
      };
    }
  }

  /**
   * End a trace span.
   */
  async endSpan(params) {
    try {
      const response = await base44.functions.invoke('endTrace', params);
      return { ok: true, value: response };
    } catch (error) {
      return { 
        ok: false, 
        error: new APIError(
          ErrorCodes.SERVER_ERROR,
          'Failed to end trace span',
          { context: { trace_id: params.trace_id, span_id: params.span_id } }
        )
      };
    }
  }

  /**
   * List traces with filters.
   */
  async listTraces(filters = {}) {
    try {
      const traces = filters && Object.keys(filters).length > 0
        ? await base44.entities.Trace.filter(filters, '-start_time', filters.limit || 100)
        : await base44.entities.Trace.list('-start_time', filters.limit || 100);
      return { ok: true, value: traces };
    } catch (error) {
      return { 
        ok: false, 
        error: new APIError(
          ErrorCodes.SERVER_ERROR,
          'Failed to list traces',
          { context: { filters } }
        )
      };
    }
  }

  /**
   * Get trace by ID with all spans.
   */
  async getTrace(traceId) {
    try {
      const spans = await base44.entities.Trace.filter({ trace_id: traceId });
      if (spans.length === 0) {
        return { 
          ok: false, 
          error: new APIError(ErrorCodes.NOT_FOUND, 'Trace not found')
        };
      }

      const root = spans.find(s => !s.parent_span_id) || spans[0];
      return { ok: true, value: { root, spans } };
    } catch (error) {
      return { 
        ok: false, 
        error: new APIError(
          ErrorCodes.SERVER_ERROR,
          'Failed to get trace',
          { context: { traceId } }
        )
      };
    }
  }

  /**
   * Group traces by trace_id.
   */
  groupTraces(traces) {
    return traces.reduce((acc, span) => {
      const existing = acc.get(span.trace_id) || [];
      acc.set(span.trace_id, [...existing, span]);
      return acc;
    }, new Map());
  }

  /**
   * Calculate trace statistics.
   */
  calculateStats(spans) {
    const durations = spans.map(s => s.duration_ms || 0);
    const errors = spans.filter(s => s.status === 'error').length;

    return {
      total_duration: Math.max(...durations, 0),
      span_count: spans.length,
      error_count: errors,
      avg_latency: durations.length > 0 ? durations.reduce((a, b) => a + b, 0) / spans.length : 0
    };
  }
}

// Singleton instance
export const traceService = new TraceService();