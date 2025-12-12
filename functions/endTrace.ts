/**
 * @fileoverview End Trace Function
 * @description Completes a trace span with final status and duration.
 */

import { createClientFromRequest } from 'npm:@base44/sdk@0.8.4';

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
      span_id,
      status = 'ok',
      attributes = {},
      events = []
    } = body;
    
    if (!trace_id || !span_id) {
      return Response.json({
        error: 'Validation error',
        message: 'trace_id and span_id are required'
      }, { status: 400 });
    }
    
    // Find trace span
    const traces = await base44.asServiceRole.entities.Trace.filter({
      trace_id,
      span_id
    });
    
    if (traces.length === 0) {
      return Response.json({
        error: 'Not found',
        message: 'Trace span not found'
      }, { status: 404 });
    }
    
    const trace = traces[0];
    const end_time = new Date().toISOString();
    const start = new Date(trace.start_time).getTime();
    const end = new Date(end_time).getTime();
    const duration_ms = end - start;
    
    // Update trace span
    await base44.asServiceRole.entities.Trace.update(trace.id, {
      end_time,
      duration_ms,
      status,
      attributes: {
        ...trace.attributes,
        ...attributes
      },
      events: [...(trace.events || []), ...events]
    });
    
    return Response.json({
      trace_id,
      span_id,
      duration_ms,
      status
    });
    
  } catch (error) {
    console.error('[EndTrace] Error:', error);
    
    return Response.json({
      error: 'Failed to end trace',
      message: error.message,
      trace_id: crypto.randomUUID()
    }, { status: 500 });
  }
});