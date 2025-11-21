import { createClientFromRequest } from 'npm:@base44/sdk@0.8.4';
import { z } from 'npm:zod@3.22.4';

const InputSchema = z.object({
  agent_id: z.string().min(1, 'agent_id is required'),
  run_limit: z.number().int().min(5).max(200).default(50),
  min_success_rate: z.number().min(0).max(1).default(0.8)
});

const ErrorCodes = {
  UNAUTHORIZED: 'UNAUTHORIZED',
  VALIDATION_ERROR: 'VALIDATION_ERROR',
  INSUFFICIENT_CONTEXT: 'INSUFFICIENT_CONTEXT',
  NOT_FOUND: 'NOT_FOUND',
  SERVER_ERROR: 'SERVER_ERROR'
};

function createError(code, message, hint = null, retryable = false, trace_id = null) {
  return Response.json({
    code,
    message,
    hint,
    retryable,
    trace_id
  }, { status: code === ErrorCodes.UNAUTHORIZED ? 401 : code === ErrorCodes.VALIDATION_ERROR || code === ErrorCodes.INSUFFICIENT_CONTEXT ? 422 : code === ErrorCodes.NOT_FOUND ? 404 : 500 });
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

    const { agent_id, run_limit, min_success_rate } = validation.data;

    // Verify agent exists and user has access
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

    // Fetch successful runs
    const successfulRuns = await base44.entities.Run.filter(
      { agent_id, status: 'completed' },
      '-finished_at',
      run_limit
    );

    if (successfulRuns.length < 5) {
      return createError(
        ErrorCodes.INSUFFICIENT_CONTEXT,
        'Need at least 5 successful runs for pattern analysis',
        'Run the agent more times to build training data',
        false,
        trace_id
      );
    }

    // Fetch metrics
    const runIds = successfulRuns.map(r => r.id);
    const metrics = await base44.entities.AgentMetric.filter(
      { run_id: { $in: runIds } },
      '-timestamp',
      200
    );

    // Build training context
    const trainingContext = {
      agent_id,
      successful_runs: successfulRuns.map(run => ({
        id: run.id,
        duration_ms: run.duration_ms,
        cost_cents: run.cost_cents,
        started_at: run.started_at,
        finished_at: run.finished_at
      })),
      performance_profile: {
        avg_duration: successfulRuns.reduce((s, r) => s + (r.duration_ms || 0), 0) / successfulRuns.length,
        avg_cost: successfulRuns.reduce((s, r) => s + (r.cost_cents || 0), 0) / successfulRuns.length,
        success_rate: successfulRuns.length / run_limit,
        total_samples: successfulRuns.length
      },
      metrics_summary: {
        avg_latency: metrics.reduce((s, m) => s + (m.latency_ms || 0), 0) / Math.max(metrics.length, 1),
        avg_tokens: metrics.reduce((s, m) => s + (m.prompt_tokens || 0) + (m.completion_tokens || 0), 0) / Math.max(metrics.length, 1)
      }
    };

    // AI analysis
    const analysisStart = Date.now();
    const analysis = await base44.integrations.Core.InvokeLLM({
      prompt: `You are an AI training specialist. Analyze these successful agent runs to extract learning patterns:

${JSON.stringify(trainingContext, null, 2)}

Extract:
1. **Success Patterns**: What makes these runs successful? Common characteristics?
2. **Optimal Configuration**: What config settings correlate with best performance?
3. **Training Objectives**: Top 3-5 skills this agent should focus on improving
4. **Synthetic Scenarios**: Types of test scenarios to generate for training
5. **Performance Baseline**: Current capability assessment

Be specific and actionable. Focus on reproducible patterns.`,
      response_json_schema: {
        type: "object",
        properties: {
          success_patterns: {
            type: "array",
            items: {
              type: "object",
              properties: {
                pattern: { type: "string" },
                frequency: { type: "number" },
                impact: { type: "string" }
              }
            }
          },
          optimal_config: {
            type: "object",
            properties: {
              temperature: { type: "number" },
              max_tokens: { type: "integer" },
              other_settings: { type: "object", additionalProperties: true }
            }
          },
          training_objectives: {
            type: "array",
            items: {
              type: "object",
              properties: {
                objective: { type: "string" },
                priority: { type: "string", enum: ["high", "medium", "low"] },
                measurable_outcome: { type: "string" }
              }
            }
          },
          synthetic_scenarios: {
            type: "array",
            items: { type: "string" }
          },
          baseline_assessment: {
            type: "object",
            properties: {
              strengths: { type: "array", items: { type: "string" } },
              weaknesses: { type: "array", items: { type: "string" } },
              overall_score: { type: "number" }
            }
          }
        }
      }
    });
    const analysisLatency = Date.now() - analysisStart;

    // Create training module
    const trainingModule = await base44.asServiceRole.entities.TrainingModule.create({
      name: `Success Pattern Training - ${new Date().toISOString().split('T')[0]}`,
      description: 'AI-generated training from successful run analysis',
      agent_id,
      training_type: 'success_pattern',
      source_runs: runIds,
      training_data: {
        patterns: analysis.success_patterns,
        optimal_config: analysis.optimal_config
      },
      learning_objectives: analysis.training_objectives.map(o => o.objective),
      success_metrics: {
        baseline_score: analysis.baseline_assessment.overall_score,
        target_score: Math.min(100, analysis.baseline_assessment.overall_score * 1.2),
        current_score: analysis.baseline_assessment.overall_score
      },
      status: 'active',
      org_id: user.organization.id
    });

    // Audit
    await base44.asServiceRole.entities.Audit.create({
      entity_type: 'training_module',
      entity_id: trainingModule.id,
      action: 'training_analysis_completed',
      metadata: {
        samples_analyzed: successfulRuns.length,
        patterns_found: analysis.success_patterns.length,
        analysis_latency_ms: analysisLatency,
        trace_id
      },
      org_id: user.organization.id
    });

    const totalLatency = Date.now() - startTime;

    // Telemetry
    console.log(JSON.stringify({
      event: 'analyze_successful_runs',
      trace_id,
      agent_id,
      samples: successfulRuns.length,
      latency_ms: totalLatency,
      analysis_latency_ms: analysisLatency,
      org_id: user.organization.id
    }));

    return Response.json({
      success: true,
      data: {
        analysis,
        training_module: trainingModule
      },
      trace_id
    }, { status: 200 });

  } catch (error) {
    console.error(JSON.stringify({
      event: 'analyze_successful_runs_error',
      trace_id,
      error: error.message,
      stack: error.stack
    }));

    return createError(
      ErrorCodes.SERVER_ERROR,
      'Failed to analyze successful runs',
      'Please try again or contact support if the issue persists',
      true,
      trace_id
    );
  }
});