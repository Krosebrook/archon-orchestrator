/**
 * @fileoverview Trace Creation Function
 * @description Creates OpenTelemetry-compatible trace spans for observability.
 */

import { createClientFromRequest } from 'npm:@base44/sdk@0.8.4';

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

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    
    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    const body = await req.json();
    const {
      trace_id,
      parent_span_id,
      name,
      kind = 'internal',
      attributes = {},
      org_id
    } = body;
    
    if (!name || !org_id) {
      return Response.json({
        error: 'Validation error',
        message: 'name and org_id are required'
      }, { status: 400 });
    }
    
    const span_id = generateSpanId();
    const final_trace_id = trace_id || generateTraceId();
    const start_time = new Date().toISOString();
    
    // Create trace span
    const trace = await base44.asServiceRole.entities.Trace.create({
      trace_id: final_trace_id,
      parent_span_id,
      span_id,
      name,
      kind,
      start_time,
      status: 'unset',
      attributes: {
        ...attributes,
        org_id,
        user_id: user.id
      },
      events: [],
      org_id
    });
    
    return Response.json({
      trace_id: final_trace_id,
      span_id,
      parent_span_id,
      trace
    });
    
  } catch (error) {
    console.error('[CreateTrace] Error:', error);
    
    return Response.json({
      error: 'Failed to create trace',
      message: error.message,
      trace_id: crypto.randomUUID()
    }, { status: 500 });
  }
});