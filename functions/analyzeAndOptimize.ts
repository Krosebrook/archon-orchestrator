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
    const { target_type, target_id } = body;

    // Gather system-wide data
    const [agents, workflows, runs, metrics] = await Promise.all([
      base44.asServiceRole.entities.Agent.list(),
      base44.asServiceRole.entities.Workflow.list(),
      base44.asServiceRole.entities.Run.filter({}, '-started_at', 100),
      base44.asServiceRole.entities.AgentMetric.filter({}, '-timestamp', 300)
    ]);

    // Build analysis context
    const systemContext = {
      agents: agents.map(a => ({
        id: a.id,
        name: a.name,
        status: a.status,
        model: a.config?.model,
        provider: a.config?.provider
      })),
      workflows: workflows.map(w => ({
        id: w.id,
        name: w.name,
        nodes_count: w.spec?.nodes?.length || 0
      })),
      run_stats: {
        total: runs.length,
        completed: runs.filter(r => r.state === 'completed').length,
        failed: runs.filter(r => r.state === 'failed').length,
        avg_duration: runs.reduce((sum, r) => sum + (r.duration_ms || 0), 0) / Math.max(runs.length, 1)
      },
      cost_stats: {
        total_cost: metrics.reduce((sum, m) => sum + (m.cost_cents || 0), 0),
        avg_cost: metrics.reduce((sum, m) => sum + (m.cost_cents || 0), 0) / Math.max(metrics.length, 1),
        by_model: {}
      },
      performance_stats: {
        avg_latency: metrics.reduce((sum, m) => sum + (m.latency_ms || 0), 0) / Math.max(metrics.length, 1),
        error_rate: (metrics.filter(m => m.status === 'error').length / Math.max(metrics.length, 1)) * 100
      }
    };

    // Calculate cost by model
    metrics.forEach(m => {
      const model = m.model || 'unknown';
      if (!systemContext.cost_stats.by_model[model]) {
        systemContext.cost_stats.by_model[model] = { cost: 0, count: 0 };
      }
      systemContext.cost_stats.by_model[model].cost += m.cost_cents || 0;
      systemContext.cost_stats.by_model[model].count++;
    });

    // Generate AI-powered optimization recommendations
    const analysisResult = await base44.integrations.Core.InvokeLLM({
      prompt: `You are an AI systems optimization expert. Analyze this agent orchestration system and provide actionable optimization recommendations.

System Overview:
${JSON.stringify(systemContext, null, 2)}

Provide comprehensive analysis and recommendations for:
1. Cost Optimization: How to reduce AI costs while maintaining quality
2. Performance Optimization: How to reduce latency and improve throughput
3. Reliability Improvements: How to reduce errors and improve success rates
4. Architecture Suggestions: Workflow improvements, agent consolidation, etc.
5. Resource Utilization: Are agents being used efficiently?

Be specific, quantitative where possible, and prioritize by impact.`,
      response_json_schema: {
        type: "object",
        properties: {
          overall_assessment: { type: "string" },
          health_score: { type: "number" },
          optimizations: {
            type: "array",
            items: {
              type: "object",
              properties: {
                category: { type: "string", enum: ["cost", "performance", "reliability", "architecture", "utilization"] },
                priority: { type: "string", enum: ["critical", "high", "medium", "low"] },
                title: { type: "string" },
                description: { type: "string" },
                current_state: { type: "string" },
                recommended_action: { type: "string" },
                estimated_impact: { type: "string" },
                implementation_effort: { type: "string", enum: ["low", "medium", "high"] }
              }
            }
          },
          quick_wins: { type: "array", items: { type: "string" } },
          long_term_recommendations: { type: "array", items: { type: "string" } },
          risk_factors: { type: "array", items: { type: "string" } }
        }
      }
    });

    // Audit
    await base44.asServiceRole.entities.Audit.create({
      entity_type: 'system',
      entity_id: 'optimization_analysis',
      action: 'analyze',
      actor: user.email,
      metadata: { 
        agents_analyzed: agents.length,
        workflows_analyzed: workflows.length,
        metrics_analyzed: metrics.length
      },
      org_id: user.organization?.id || 'default-org'
    });

    return Response.json({
      success: true,
      data: {
        analysis: analysisResult,
        context: {
          agents_count: agents.length,
          workflows_count: workflows.length,
          recent_runs: runs.length,
          total_cost_cents: systemContext.cost_stats.total_cost,
          avg_latency_ms: Math.round(systemContext.performance_stats.avg_latency),
          error_rate: systemContext.performance_stats.error_rate.toFixed(1)
        },
        generated_at: new Date().toISOString()
      }
    }, { headers: { 'X-Trace-Id': trace_id } });

  } catch (error) {
    console.error('Optimization analysis error:', error);
    return Response.json({
      code: 'SERVER_ERROR',
      message: error.message || 'Optimization analysis failed',
      retryable: true,
      trace_id
    }, { status: 500 });
  }
});