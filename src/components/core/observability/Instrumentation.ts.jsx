/**
 * @fileoverview OpenTelemetry Instrumentation
 * @module core/observability/Instrumentation
 * @description Production-grade observability with OTEL spans
 */

import { base44 } from '@/api/base44Client';

// =============================================================================
// TYPES
// =============================================================================

export interface SpanContext {
  trace_id: string;
  span_id: string;
  parent_span_id?: string;
}

export interface SpanOptions {
  name: string;
  kind?: 'server' | 'client' | 'producer' | 'consumer' | 'internal';
  attributes?: Record<string, string | number | boolean>;
}

export interface SpanEndOptions {
  status?: 'ok' | 'error' | 'unset';
  error?: Error;
  attributes?: Record<string, string | number | boolean>;
}

// =============================================================================
// SPAN MANAGER
// =============================================================================

export class Span {
  private context: SpanContext;
  private startTime: Date;
  private name: string;
  private attributes: Record<string, unknown>;
  private events: Array<{ timestamp: string; name: string; attributes?: Record<string, unknown> }>;

  constructor(context: SpanContext, name: string, attributes?: Record<string, unknown>) {
    this.context = context;
    this.name = name;
    this.attributes = attributes || {};
    this.events = [];
    this.startTime = new Date();
  }

  /**
   * Add an event to the span
   */
  addEvent(name: string, attributes?: Record<string, unknown>): void {
    this.events.push({
      timestamp: new Date().toISOString(),
      name,
      attributes,
    });
  }

  /**
   * Set span attributes
   */
  setAttributes(attributes: Record<string, unknown>): void {
    this.attributes = { ...this.attributes, ...attributes };
  }

  /**
   * End the span and record it
   */
  async end(options?: SpanEndOptions): Promise<void> {
    const endTime = new Date();
    const durationMs = endTime.getTime() - this.startTime.getTime();

    try {
      // Merge final attributes
      const finalAttributes = {
        ...this.attributes,
        ...options?.attributes,
      };

      // Record error if present
      if (options?.error) {
        finalAttributes.error = true;
        finalAttributes['error.message'] = options.error.message;
        finalAttributes['error.stack'] = options.error.stack;
      }

      // Create trace record
      await base44.functions.invoke('endTrace', {
        span_id: this.context.span_id,
        end_time: endTime.toISOString(),
        status: options?.status || (options?.error ? 'error' : 'ok'),
        duration_ms: durationMs,
        attributes: finalAttributes,
        events: this.events,
      });
    } catch (error) {
      console.error('[Instrumentation] Failed to end span:', error);
    }
  }

  /**
   * Get span context for child spans
   */
  getContext(): SpanContext {
    return this.context;
  }
}

// =============================================================================
// TRACER
// =============================================================================

export class Tracer {
  private static instance: Tracer;

  private constructor() {}

  static getInstance(): Tracer {
    if (!Tracer.instance) {
      Tracer.instance = new Tracer();
    }
    return Tracer.instance;
  }

  /**
   * Start a new span
   */
  async startSpan(options: SpanOptions, parentContext?: SpanContext): Promise<Span> {
    const trace_id = parentContext?.trace_id || this.generateTraceId();
    const span_id = this.generateSpanId();
    const parent_span_id = parentContext?.span_id;

    const context: SpanContext = {
      trace_id,
      span_id,
      parent_span_id,
    };

    try {
      // Create trace record
      await base44.functions.invoke('createTrace', {
        trace_id,
        span_id,
        parent_span_id,
        name: options.name,
        kind: options.kind || 'internal',
        start_time: new Date().toISOString(),
        attributes: options.attributes || {},
      });
    } catch (error) {
      console.error('[Instrumentation] Failed to start span:', error);
    }

    return new Span(context, options.name, options.attributes);
  }

  /**
   * Wrap a function with automatic span tracking
   */
  async withSpan<T>(
    name: string,
    fn: (span: Span) => Promise<T>,
    parentContext?: SpanContext
  ): Promise<T> {
    const span = await this.startSpan({ name }, parentContext);
    
    try {
      const result = await fn(span);
      await span.end({ status: 'ok' });
      return result;
    } catch (error) {
      await span.end({ status: 'error', error: error as Error });
      throw error;
    }
  }

  /**
   * Generate a unique trace ID (32 chars hex)
   */
  private generateTraceId(): string {
    return Array.from({ length: 32 }, () =>
      Math.floor(Math.random() * 16).toString(16)
    ).join('');
  }

  /**
   * Generate a unique span ID (16 chars hex)
   */
  private generateSpanId(): string {
    return Array.from({ length: 16 }, () =>
      Math.floor(Math.random() * 16).toString(16)
    ).join('');
  }
}

// =============================================================================
// PERFORMANCE TRACKING
// =============================================================================

export class PerformanceTracker {
  private marks: Map<string, number> = new Map();

  /**
   * Start a performance measurement
   */
  mark(label: string): void {
    this.marks.set(label, performance.now());
  }

  /**
   * End a performance measurement and return duration
   */
  measure(label: string): number | null {
    const start = this.marks.get(label);
    if (!start) return null;

    const duration = performance.now() - start;
    this.marks.delete(label);
    return duration;
  }

  /**
   * Track a function's execution time
   */
  async track<T>(label: string, fn: () => Promise<T>): Promise<{ result: T; duration: number }> {
    this.mark(label);
    const result = await fn();
    const duration = this.measure(label) || 0;
    
    return { result, duration };
  }
}

// =============================================================================
// METRICS COLLECTOR
// =============================================================================

export class MetricsCollector {
  private static instance: MetricsCollector;

  private constructor() {}

  static getInstance(): MetricsCollector {
    if (!MetricsCollector.instance) {
      MetricsCollector.instance = new MetricsCollector();
    }
    return MetricsCollector.instance;
  }

  /**
   * Record an AI agent metric
   */
  async recordAIMetric(params: {
    agent_id: string;
    run_id?: string;
    provider: 'openai' | 'anthropic' | 'other';
    model: string;
    prompt_tokens: number;
    completion_tokens: number;
    latency_ms: number;
    cost_cents: number;
    status: 'success' | 'error' | 'timeout' | 'throttled';
    error_code?: string;
    org_id: string;
  }): Promise<void> {
    try {
      await base44.functions.invoke('collectMetrics', params);
    } catch (error) {
      console.error('[Metrics] Failed to record:', error);
    }
  }

  /**
   * Track API latency
   */
  async recordLatency(endpoint: string, method: string, latency_ms: number, status: number): Promise<void> {
    console.log('[Metrics] Latency:', { endpoint, method, latency_ms, status });
    // In production, send to metrics backend (Prometheus, Datadog, etc.)
  }

  /**
   * Track error rate
   */
  async recordError(endpoint: string, error_code: string, error_message: string): Promise<void> {
    console.error('[Metrics] Error:', { endpoint, error_code, error_message });
    // In production, send to error tracking (Sentry, Rollbar, etc.)
  }
}

// =============================================================================
// SINGLETON EXPORTS
// =============================================================================

export const tracer = Tracer.getInstance();
export const metricsCollector = MetricsCollector.getInstance();
export const performanceTracker = new PerformanceTracker();