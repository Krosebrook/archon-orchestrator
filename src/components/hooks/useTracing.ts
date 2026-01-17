/**
 * @fileoverview Tracing Hook
 * @description React hook for OpenTelemetry tracing in components.
 */

import { useState, useEffect, useCallback, useRef } from 'react';
import { traceService } from '../services/TraceService';
import type { SpanAttributes, SpanKind, UUID } from '../shared/types/domain';
import { useAuth } from '../contexts/AuthContext';

interface TraceOptions {
  name: string;
  kind?: SpanKind;
  attributes?: SpanAttributes;
  autoEnd?: boolean;
}

interface ActiveSpan {
  trace_id: string;
  span_id: string;
  start_time: number;
}

/**
 * Hook for distributed tracing in React components.
 * 
 * @example
 * const { startSpan, endSpan, addEvent } = useTracing();
 * 
 * const handleAction = async () => {
 *   const span = await startSpan({ name: 'user.action', kind: 'client' });
 *   try {
 *     // do work
 *     await endSpan(span, { status: 'ok' });
 *   } catch (error) {
 *     await endSpan(span, { status: 'error', error: error.message });
 *   }
 * };
 */
export function useTracing() {
  const { organization } = useAuth();
  const [activeSpans, setActiveSpans] = useState<Map<string, ActiveSpan>>(new Map());
  const mountedRef = useRef(true);

  useEffect(() => {
    return () => {
      mountedRef.current = false;
    };
  }, []);

  const startSpan = useCallback(async (options: TraceOptions) => {
    if (!organization?.id) {
      console.warn('[Tracing] No organization context, skipping trace');
      return null;
    }

    const result = await traceService.createSpan({
      name: options.name,
      kind: options.kind || 'internal',
      attributes: {
        ...options.attributes,
        org_id: organization.id as UUID
      },
      org_id: organization.id as UUID
    });

    if (!result.ok) {
      console.error('[Tracing] Failed to start span:', result.error);
      return null;
    }

    const span: ActiveSpan = {
      trace_id: result.value.trace_id,
      span_id: result.value.span_id,
      start_time: Date.now()
    };

    if (mountedRef.current) {
      setActiveSpans(prev => new Map(prev).set(span.span_id, span));
    }

    // Auto-end after timeout if configured
    if (options.autoEnd !== false) {
      setTimeout(() => {
        endSpan(span, { status: 'ok' });
      }, 30000); // 30s timeout
    }

    return span;
  }, [organization?.id]);

  const endSpan = useCallback(async (
    span: ActiveSpan | null,
    options?: {
      status?: 'ok' | 'error' | 'unset';
      attributes?: SpanAttributes;
      error?: string;
    }
  ) => {
    if (!span) return;

    const status = options?.error ? 'error' : (options?.status || 'ok');
    const attributes: SpanAttributes = {
      ...options?.attributes,
      error: !!options?.error,
      'error.message': options?.error
    };

    await traceService.endSpan({
      trace_id: span.trace_id,
      span_id: span.span_id,
      status,
      attributes
    });

    if (mountedRef.current) {
      setActiveSpans(prev => {
        const next = new Map(prev);
        next.delete(span.span_id);
        return next;
      });
    }
  }, []);

  const addEvent = useCallback((
    span: ActiveSpan | null,
    eventName: string,
    attributes?: Record<string, unknown>
  ) => {
    // Events would be added to span context
    // For now, we'll just log them
    console.log('[Tracing] Event:', eventName, attributes);
  }, []);

  return {
    startSpan,
    endSpan,
    addEvent,
    activeSpans: Array.from(activeSpans.values())
  };
}