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

    // Fetch all key metrics in parallel
    const [agents, workflows, runs, metrics, alerts] = await Promise.all([
      base44.asServiceRole.entities.Agent.list(),
      base44.asServiceRole.entities.Workflow.list(),
      base44.asServiceRole.entities.Run.filter({}, '-started_at', 100),
      base44.asServiceRole.entities.AgentMetric.filter({}, '-timestamp', 200),
      base44.asServiceRole.entities.Alert.filter({ status: 'active' }, '-created_date', 20)
    ]);

    // Agent health
    const agentHealth = {
      total: agents.length,
      active: agents.filter(a => a.status === 'active').length,
      inactive: agents.filter(a => a.status === 'inactive').length,
      error: agents.filter(a => a.status === 'error').length,
      deprecated: agents.filter(a => a.status === 'deprecated').length
    };

    // Run stats (last 24h approximation)
    const recentRuns = runs.slice(0, 50);
    const runStats = {
      total: recentRuns.length,
      completed: recentRuns.filter(r => r.state === 'completed').length,
      failed: recentRuns.filter(r => r.state === 'failed').length,
      running: recentRuns.filter(r => r.state === 'running').length,
      success_rate: recentRuns.length > 0 
        ? ((recentRuns.filter(r => r.state === 'completed').length / recentRuns.length) * 100).toFixed(1)
        : 0
    };

    // Cost & performance metrics
    const totalCost = metrics.reduce((sum, m) => sum + (m.cost_cents || 0), 0);
    const avgLatency = metrics.length > 0 
      ? Math.round(metrics.reduce((sum, m) => sum + (m.latency_ms || 0), 0) / metrics.length)
      : 0;
    const errorRate = metrics.length > 0
      ? ((metrics.filter(m => m.status === 'error').length / metrics.length) * 100).toFixed(1)
      : 0;

    // Provider breakdown
    const byProvider = {};
    metrics.forEach(m => {
      const provider = m.provider || 'unknown';
      if (!byProvider[provider]) {
        byProvider[provider] = { requests: 0, cost: 0, errors: 0 };
      }
      byProvider[provider].requests++;
      byProvider[provider].cost += m.cost_cents || 0;
      if (m.status === 'error') byProvider[provider].errors++;
    });

    // Calculate overall health score
    const healthFactors = [
      agentHealth.error === 0 ? 25 : Math.max(0, 25 - (agentHealth.error * 5)),
      parseFloat(runStats.success_rate) * 0.25,
      parseFloat(errorRate) < 5 ? 25 : Math.max(0, 25 - parseFloat(errorRate)),
      avgLatency < 1000 ? 25 : Math.max(0, 25 - ((avgLatency - 1000) / 100))
    ];
    const healthScore = Math.min(100, Math.round(healthFactors.reduce((a, b) => a + b, 0)));

    const healthStatus = healthScore >= 80 ? 'healthy' : healthScore >= 60 ? 'degraded' : 'critical';

    return Response.json({
      success: true,
      data: {
        status: healthStatus,
        health_score: healthScore,
        timestamp: new Date().toISOString(),
        agents: agentHealth,
        workflows: {
          total: workflows.length,
          active: workflows.filter(w => w.status === 'active').length
        },
        runs: runStats,
        performance: {
          avg_latency_ms: avgLatency,
          error_rate: parseFloat(errorRate),
          total_cost_cents: totalCost,
          total_requests: metrics.length
        },
        by_provider: byProvider,
        active_alerts: alerts.length,
        alerts: alerts.slice(0, 5).map(a => ({
          id: a.id,
          severity: a.severity,
          message: a.message,
          created_date: a.created_date
        }))
      }
    }, { headers: { 'X-Trace-Id': trace_id } });

  } catch (error) {
    console.error('Health check error:', error);
    return Response.json({
      code: 'SERVER_ERROR',
      message: error.message || 'Health check failed',
      retryable: true,
      trace_id
    }, { status: 500 });
  }
});