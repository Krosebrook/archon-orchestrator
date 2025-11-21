import { createClientFromRequest } from 'npm:@base44/sdk@0.8.4';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user) {
      return Response.json({ 
        code: 'UNAUTHORIZED',
        message: 'Authentication required',
        retryable: false
      }, { status: 401 });
    }

    const body = await req.json();
    const { agent_id, metric_limit = 100 } = body;

    if (!agent_id) {
      return Response.json({
        code: 'VALIDATION_ERROR',
        message: 'agent_id is required',
        hint: 'Provide the ID of an agent to analyze',
        retryable: false
      }, { status: 422 });
    }

    if (metric_limit > 200) {
      return Response.json({
        code: 'VALIDATION_ERROR',
        message: 'metric_limit cannot exceed 200',
        retryable: false
      }, { status: 422 });
    }

    // Fetch agent and metrics
    const agents = await base44.entities.Agent.filter({ id: agent_id });
    if (!agents || agents.length === 0) {
      return Response.json({
        code: 'NOT_FOUND',
        message: 'Agent not found',
        retryable: false
      }, { status: 404 });
    }

    const agent = agents[0];
    const metrics = await base44.entities.AgentMetric.filter({ agent_id }, '-timestamp', metric_limit);

    if (metrics.length < 10) {
      return Response.json({
        code: 'INSUFFICIENT_CONTEXT',
        message: 'Not enough metrics for analysis',
        hint: 'Agent needs at least 10 metrics for meaningful suggestions',
        retryable: false
      }, { status: 422 });
    }

    const performanceProfile = {
      agent: {
        name: agent.name,
        provider: agent.config?.provider,
        model: agent.config?.model,
        config: agent.config
      },
      performance: {
        avg_latency: metrics.reduce((s, m) => s + (m.latency_ms || 0), 0) / metrics.length,
        error_rate: metrics.filter(m => m.status === 'error').length / metrics.length,
        avg_cost: metrics.reduce((s, m) => s + (m.cost_cents || 0), 0) / metrics.length,
        avg_tokens: metrics.reduce((s, m) => s + (m.prompt_tokens || 0) + (m.completion_tokens || 0), 0) / metrics.length
      },
      sample_size: metrics.length
    };

    const result = await base44.integrations.Core.InvokeLLM({
      prompt: `You are a senior AI engineer specializing in LLM optimization. Analyze this agent configuration and performance data:

${JSON.stringify(performanceProfile, null, 2)}

Provide specific, actionable refactoring suggestions to improve:
1. **Performance**: Reduce latency and improve throughput
2. **Reliability**: Reduce error rates and improve stability
3. **Cost**: Optimize token usage and reduce costs
4. **Configuration**: Better model settings, temperature, max_tokens, etc.

For each suggestion:
- Explain WHAT to change
- Explain WHY it will help
- Quantify EXPECTED impact (%, ms, $)
- Provide SPECIFIC code/config changes

Prioritize suggestions by impact.`,
      response_json_schema: {
        type: "object",
        properties: {
          suggestions: {
            type: "array",
            items: {
              type: "object",
              properties: {
                category: { type: "string", enum: ["performance", "reliability", "cost", "config"] },
                priority: { type: "string", enum: ["high", "medium", "low"] },
                title: { type: "string" },
                description: { type: "string" },
                expected_impact: { type: "string" },
                implementation: { type: "string" }
              }
            }
          },
          overall_assessment: { type: "string" }
        }
      }
    });

    // Audit log
    await base44.asServiceRole.entities.Audit.create({
      entity_type: 'agent',
      entity_id: agent_id,
      action: 'refactor_analysis',
      metadata: { 
        suggestion_count: result.suggestions?.length || 0,
        sample_size: metrics.length,
        api_call: true
      },
      org_id: user.organization.id
    });

    return Response.json({
      success: true,
      data: result,
      agent_context: {
        name: agent.name,
        provider: agent.config?.provider,
        model: agent.config?.model
      }
    }, { 
      status: 200,
      headers: {
        'X-Request-Id': crypto.randomUUID()
      }
    });

  } catch (error) {
    console.error('Refactoring suggestions error:', error);
    return Response.json({
      code: 'SERVER_ERROR',
      message: error.message || 'Failed to generate suggestions',
      retryable: true
    }, { status: 500 });
  }
});