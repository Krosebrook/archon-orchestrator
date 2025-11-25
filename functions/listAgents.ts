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

    const body = await req.json().catch(() => ({}));
    const { status, provider, limit, cursor } = body;

    // Build filter
    const filter = {};
    if (status) filter.status = status;
    if (provider) filter['config.provider'] = provider;

    // Fetch agents
    const agents = await base44.asServiceRole.entities.Agent.filter(
      filter,
      '-created_date',
      limit || 50
    );

    // Get metrics summary for each agent
    const agentIds = agents.map(a => a.id);
    const metrics = await base44.asServiceRole.entities.AgentMetric.filter(
      { agent_id: { $in: agentIds } },
      '-timestamp',
      500
    );

    // Calculate stats per agent
    const agentStats = {};
    metrics.forEach(m => {
      if (!agentStats[m.agent_id]) {
        agentStats[m.agent_id] = { 
          total_runs: 0, 
          success: 0, 
          errors: 0, 
          total_cost: 0,
          total_latency: 0
        };
      }
      agentStats[m.agent_id].total_runs++;
      if (m.status === 'success') agentStats[m.agent_id].success++;
      if (m.status === 'error') agentStats[m.agent_id].errors++;
      agentStats[m.agent_id].total_cost += m.cost_cents || 0;
      agentStats[m.agent_id].total_latency += m.latency_ms || 0;
    });

    // Enrich agents with stats
    const enrichedAgents = agents.map(agent => {
      const stats = agentStats[agent.id] || { total_runs: 0, success: 0, errors: 0, total_cost: 0, total_latency: 0 };
      return {
        id: agent.id,
        name: agent.name,
        version: agent.version,
        status: agent.status,
        provider: agent.config?.provider,
        model: agent.config?.model,
        capabilities: agent.config?.capabilities || [],
        created_date: agent.created_date,
        stats: {
          total_runs: stats.total_runs,
          success_rate: stats.total_runs > 0 ? ((stats.success / stats.total_runs) * 100).toFixed(1) : 0,
          error_count: stats.errors,
          total_cost_cents: stats.total_cost,
          avg_latency_ms: stats.total_runs > 0 ? Math.round(stats.total_latency / stats.total_runs) : 0
        }
      };
    });

    // Summary
    const summary = {
      total: agents.length,
      active: agents.filter(a => a.status === 'active').length,
      inactive: agents.filter(a => a.status === 'inactive').length,
      error: agents.filter(a => a.status === 'error').length,
      deprecated: agents.filter(a => a.status === 'deprecated').length
    };

    return Response.json({
      success: true,
      data: {
        agents: enrichedAgents,
        summary,
        pagination: {
          limit: limit || 50,
          returned: agents.length,
          has_more: agents.length === (limit || 50)
        }
      }
    }, { headers: { 'X-Trace-Id': trace_id } });

  } catch (error) {
    console.error('List agents error:', error);
    return Response.json({
      code: 'SERVER_ERROR',
      message: error.message || 'Failed to list agents',
      retryable: true,
      trace_id
    }, { status: 500 });
  }
});