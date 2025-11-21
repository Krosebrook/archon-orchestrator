import { createClientFromRequest } from 'npm:@base44/sdk@0.8.4';
import { z } from 'npm:zod@3.22.4';

const InputSchema = z.object({
  agent_id: z.string().min(1, 'agent_id is required'),
  feedback_window_days: z.number().int().min(1).max(90).default(7),
  auto_apply: z.boolean().default(false)
});

const ErrorCodes = {
  UNAUTHORIZED: 'UNAUTHORIZED',
  VALIDATION_ERROR: 'VALIDATION_ERROR',
  NOT_FOUND: 'NOT_FOUND',
  INSUFFICIENT_DATA: 'INSUFFICIENT_DATA',
  SERVER_ERROR: 'SERVER_ERROR'
};

function createError(code, message, hint = null, retryable = false, trace_id = null) {
  return Response.json({
    code,
    message,
    hint,
    retryable,
    trace_id
  }, { status: code === ErrorCodes.UNAUTHORIZED ? 401 : code === ErrorCodes.VALIDATION_ERROR || code === ErrorCodes.INSUFFICIENT_DATA ? 422 : code === ErrorCodes.NOT_FOUND ? 404 : 500 });
}

Deno.serve(async (req) => {
  const trace_id = crypto.randomUUID();
  const startTime = Date.now();

  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user) {
      return createError(
        ErrorCodes.UNAUTHORIZED,
        'Authentication required',
        'Please authenticate to access this endpoint',
        false,
        trace_id
      );
    }

    // Validate input
    const body = await req.json();
    const validation = InputSchema.safeParse(body);
    
    if (!validation.success) {
      return createError(
        ErrorCodes.VALIDATION_ERROR,
        validation.error.errors[0].message,
        'Check your request parameters',
        false,
        trace_id
      );
    }

    const { agent_id, feedback_window_days, auto_apply } = validation.data;

    // Fetch agent
    const agents = await base44.entities.Agent.filter({ id: agent_id });
    if (!agents || agents.length === 0) {
      return createError(
        ErrorCodes.NOT_FOUND,
        'Agent not found',
        'Verify the agent_id and ensure you have access',
        false,
        trace_id
      );
    }
    const agent = agents[0];
    
    // Get recent runs
    const recentRuns = await base44.entities.Run.filter(
      { agent_id },
      '-finished_at',
      100
    );

    if (recentRuns.length < 5) {
      return createError(
        ErrorCodes.INSUFFICIENT_DATA,
        'Need at least 5 runs for adaptation analysis',
        'Run the agent more times to generate sufficient feedback data',
        false,
        trace_id
      );
    }

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
    const analysisStart = Date.now();
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
    const analysisLatency = Date.now() - analysisStart;

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
        analysis_latency_ms: analysisLatency,
        trace_id
      },
      org_id: user.organization.id
    });

    const totalLatency = Date.now() - startTime;

    // Telemetry
    console.log(JSON.stringify({
      event: 'adapt_agent_behavior',
      trace_id,
      agent_id,
      auto_applied: applied,
      risk_level: adaptation.risk_assessment.risk_level,
      latency_ms: totalLatency,
      analysis_latency_ms: analysisLatency,
      org_id: user.organization.id
    }));

    return Response.json({
      success: true,
      data: {
        adaptation,
        performance_trends: performanceTrends,
        applied,
        session_id: session.id
      },
      trace_id
    }, { status: 200 });

  } catch (error) {
    console.error(JSON.stringify({
      event: 'adapt_agent_behavior_error',
      trace_id,
      error: error.message,
      stack: error.stack
    }));

    return createError(
      ErrorCodes.SERVER_ERROR,
      'Failed to adapt agent behavior',
      'Please try again or contact support if the issue persists',
      true,
      trace_id
    );
  }
});