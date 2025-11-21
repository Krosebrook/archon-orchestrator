import { createClientFromRequest } from 'npm:@base44/sdk@0.8.4';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user) {
      return Response.json({ 
        code: 'UNAUTHORIZED',
        message: 'Authentication required'
      }, { status: 401 });
    }

    const body = await req.json();
    const { agent_id, feedback_window_days = 7, auto_apply = false } = body;

    if (!agent_id) {
      return Response.json({
        code: 'VALIDATION_ERROR',
        message: 'agent_id is required'
      }, { status: 422 });
    }

    // Fetch agent and recent performance data
    const agents = await base44.entities.Agent.filter({ id: agent_id });
    if (!agents || agents.length === 0) {
      return Response.json({
        code: 'NOT_FOUND',
        message: 'Agent not found'
      }, { status: 404 });
    }

    const agent = agents[0];
    
    // Get recent runs
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - feedback_window_days);
    
    const recentRuns = await base44.entities.Run.filter(
      { agent_id },
      '-finished_at',
      100
    );

    const metrics = await base44.entities.AgentMetric.filter(
      { agent_id },
      '-timestamp',
      200
    );

    // Calculate performance trends
    const performanceTrends = {
      total_runs: recentRuns.length,
      success_rate: recentRuns.filter(r => r.status === 'completed').length / Math.max(recentRuns.length, 1),
      failure_rate: recentRuns.filter(r => r.status === 'failed').length / Math.max(recentRuns.length, 1),
      avg_latency: metrics.reduce((s, m) => s + (m.latency_ms || 0), 0) / Math.max(metrics.length, 1),
      avg_cost: metrics.reduce((s, m) => s + (m.cost_cents || 0), 0) / Math.max(metrics.length, 1),
      error_distribution: metrics
        .filter(m => m.status === 'error')
        .reduce((acc, m) => {
          acc[m.error_code || 'unknown'] = (acc[m.error_code || 'unknown'] || 0) + 1;
          return acc;
        }, {})
    };

    // AI-driven adaptation analysis
    const adaptation = await base44.integrations.Core.InvokeLLM({
      prompt: `You are an adaptive learning system. Analyze this agent's recent performance and recommend behavioral adaptations:

Agent: ${agent.name}
Current Config: ${JSON.stringify(agent.config)}

Performance Trends (last ${feedback_window_days} days):
${JSON.stringify(performanceTrends, null, 2)}

Based on:
1. Success/failure patterns
2. Performance degradation or improvement
3. Error patterns
4. Cost and latency trends

Recommend:
1. **Config Adjustments**: Specific parameter changes
2. **Behavior Modifications**: How the agent should adapt its approach
3. **Risk Assessment**: Impact and confidence level
4. **Monitoring**: Metrics to watch after changes
5. **Rollback Criteria**: When to revert changes

Be conservative - only recommend changes with high confidence.`,
      response_json_schema: {
        type: "object",
        properties: {
          recommended_config: {
            type: "object",
            properties: {
              temperature: { type: "number" },
              max_tokens: { type: "integer" },
              model: { type: "string" },
              other_params: { type: "object", additionalProperties: true }
            }
          },
          behavior_modifications: {
            type: "array",
            items: {
              type: "object",
              properties: {
                modification: { type: "string" },
                rationale: { type: "string" },
                expected_impact: { type: "string" }
              }
            }
          },
          risk_assessment: {
            type: "object",
            properties: {
              risk_level: { type: "string", enum: ["low", "medium", "high"] },
              confidence: { type: "number" },
              concerns: { type: "array", items: { type: "string" } }
            }
          },
          monitoring_metrics: {
            type: "array",
            items: { type: "string" }
          },
          rollback_criteria: {
            type: "array",
            items: { type: "string" }
          }
        }
      }
    });

    // Auto-apply if requested and low risk
    let applied = false;
    if (auto_apply && adaptation.risk_assessment.risk_level === 'low' && adaptation.risk_assessment.confidence > 0.8) {
      await base44.asServiceRole.entities.Agent.update(agent_id, {
        config: {
          ...agent.config,
          ...adaptation.recommended_config
        }
      });
      applied = true;
    }

    // Create training session record
    const session = await base44.asServiceRole.entities.TrainingSession.create({
      module_id: 'adaptive_learning',
      agent_id,
      started_at: new Date().toISOString(),
      finished_at: new Date().toISOString(),
      status: 'completed',
      training_samples: recentRuns.length,
      improvements: {
        latency_improvement_pct: 0,
        accuracy_improvement_pct: 0,
        cost_reduction_pct: 0,
        error_rate_reduction_pct: 0
      },
      config_adjustments: adaptation.recommended_config,
      org_id: user.organization.id
    });

    // Audit
    await base44.asServiceRole.entities.Audit.create({
      entity_type: 'agent',
      entity_id: agent_id,
      action: 'adaptive_behavior_update',
      metadata: {
        auto_applied: applied,
        risk_level: adaptation.risk_assessment.risk_level,
        confidence: adaptation.risk_assessment.confidence,
        api_call: true
      },
      org_id: user.organization.id
    });

    return Response.json({
      success: true,
      data: {
        adaptation,
        performance_trends: performanceTrends,
        applied,
        session_id: session.id
      }
    }, { status: 200 });

  } catch (error) {
    console.error('Adaptive behavior error:', error);
    return Response.json({
      code: 'SERVER_ERROR',
      message: error.message || 'Failed to adapt agent behavior',
      retryable: true
    }, { status: 500 });
  }
});