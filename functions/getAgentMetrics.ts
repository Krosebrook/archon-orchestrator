import { createClientFromRequest } from 'npm:@base44/sdk@0.8.4';

Deno.serve(async (req) => {
  const trace_id = crypto.randomUUID();
  
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user) {
      return Response.json({ 
        code: 'UNAUTHORIZED',
        message: 'Authentication required',
        retryable: false,
        trace_id
      }, { status: 401 });
    }

    const body = await req.json();
    const { agent_id, time_range, limit } = body;

    // Build filter
    const filter = {};
    if (agent_id) {
      filter.agent_id = agent_id;
    }

    // Fetch metrics
    const metrics = await base44.asServiceRole.entities.AgentMetric.filter(
      filter,
      '-timestamp',
      limit || 100
    );

    // Calculate aggregations
    const totalMetrics = metrics.length;
    const successCount = metrics.filter(m => m.status === 'success').length;
    const errorCount = metrics.filter(m => m.status === 'error').length;
    
    const totalCost = metrics.reduce((sum, m) => sum + (m.cost_cents || 0), 0);
    const totalLatency = metrics.reduce((sum, m) => sum + (m.latency_ms || 0), 0);
    const totalTokens = metrics.reduce((sum, m) => sum + (m.prompt_tokens || 0) + (m.completion_tokens || 0), 0);

    const avgLatency = totalMetrics > 0 ? Math.round(totalLatency / totalMetrics) : 0;
    const avgCost = totalMetrics > 0 ? Math.round(totalCost / totalMetrics) : 0;
    const successRate = totalMetrics > 0 ? ((successCount / totalMetrics) * 100).toFixed(1) : 0;

    // Group by model
    const byModel = {};
    metrics.forEach(m => {
      const model = m.model || 'unknown';
      if (!byModel[model]) {
        byModel[model] = { count: 0, cost: 0, latency: 0 };
      }
      byModel[model].count++;
      byModel[model].cost += m.cost_cents || 0;
      byModel[model].latency += m.latency_ms || 0;
    });

    // Group by provider
    const byProvider = {};
    metrics.forEach(m => {
      const provider = m.provider || 'unknown';
      if (!byProvider[provider]) {
        byProvider[provider] = { count: 0, cost: 0 };
      }
      byProvider[provider].count++;
      byProvider[provider].cost += m.cost_cents || 0;
    });

    return Response.json({
      success: true,
      data: {
        summary: {
          total_requests: totalMetrics,
          success_count: successCount,
          error_count: errorCount,
          success_rate: parseFloat(successRate),
          total_cost_cents: totalCost,
          avg_cost_cents: avgCost,
          avg_latency_ms: avgLatency,
          total_tokens: totalTokens
        },
        by_model: byModel,
        by_provider: byProvider,
        recent: metrics.slice(0, 10).map(m => ({
          timestamp: m.timestamp,
          model: m.model,
          status: m.status,
          latency_ms: m.latency_ms,
          cost_cents: m.cost_cents
        }))
      }
    }, { headers: { 'X-Trace-Id': trace_id } });

  } catch (error) {
    console.error('Metrics fetch error:', error);
    return Response.json({
      code: 'SERVER_ERROR',
      message: error.message || 'Failed to fetch metrics',
      retryable: true,
      trace_id
    }, { status: 500 });
  }
});