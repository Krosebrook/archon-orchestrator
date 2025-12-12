/**
 * @fileoverview Metrics Collection Function
 * @description Collects and stores performance metrics in Prometheus-compatible format.
 */

import { createClientFromRequest } from 'npm:@base44/sdk@0.8.4';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    
    // Allow system-level metric collection (no auth required for internal calls)
    const body = await req.json();
    const {
      agent_id,
      run_id,
      provider,
      model,
      prompt_tokens,
      completion_tokens,
      latency_ms,
      cost_cents,
      status,
      timestamp = new Date().toISOString(),
      org_id
    } = body;
    
    if (!org_id) {
      return Response.json({
        error: 'Validation error',
        message: 'org_id is required'
      }, { status: 400 });
    }
    
    // Create agent metric record
    const metric = await base44.asServiceRole.entities.AgentMetric.create({
      agent_id,
      run_id,
      provider: provider || 'unknown',
      model: model || 'unknown',
      prompt_tokens: prompt_tokens || 0,
      completion_tokens: completion_tokens || 0,
      latency_ms: latency_ms || 0,
      cost_cents: cost_cents || 0,
      status: status || 'success',
      timestamp,
      request_count: 1,
      org_id
    });
    
    return Response.json({
      success: true,
      metric_id: metric.id
    });
    
  } catch (error) {
    console.error('[CollectMetrics] Error:', error);
    
    return Response.json({
      error: 'Failed to collect metrics',
      message: error.message,
      trace_id: crypto.randomUUID()
    }, { status: 500 });
  }
});