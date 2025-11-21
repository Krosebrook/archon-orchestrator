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
    const { run_id } = body;

    if (!run_id) {
      return Response.json({
        code: 'VALIDATION_ERROR',
        message: 'run_id is required',
        hint: 'Provide the ID of a failed run to analyze',
        retryable: false
      }, { status: 422 });
    }

    // Fetch run details
    const runs = await base44.entities.Run.filter({ id: run_id });
    if (!runs || runs.length === 0) {
      return Response.json({
        code: 'NOT_FOUND',
        message: 'Run not found',
        retryable: false
      }, { status: 404 });
    }

    const run = runs[0];
    const agents = await base44.entities.Agent.filter({ id: run.agent_id });
    const agent = agents[0];
    const metrics = await base44.entities.AgentMetric.filter({ run_id }, '-timestamp', 50);

    const logContext = {
      run_id: run.id,
      agent_name: agent?.name,
      status: run.status,
      error_message: run.error_message,
      started_at: run.started_at,
      finished_at: run.finished_at,
      duration: run.duration_ms,
      metrics: metrics.map(m => ({
        timestamp: m.timestamp,
        status: m.status,
        error_code: m.error_code,
        latency: m.latency_ms,
        cost: m.cost_cents
      }))
    };

    const result = await base44.integrations.Core.InvokeLLM({
      prompt: `You are an expert debugging assistant. Analyze this failed agent run and provide root cause analysis:

${JSON.stringify(logContext, null, 2)}

Provide:
1. **Root Cause**: The most likely reason for failure
2. **Error Category**: Categorize the error (config, network, timeout, logic, resource)
3. **Evidence**: Specific log entries or metrics that support your analysis
4. **Fix Steps**: Ordered steps to resolve (be specific and actionable)
5. **Prevention**: How to prevent this in the future

Be precise, technical, and actionable. Reference specific timestamps and metrics.`,
      response_json_schema: {
        type: "object",
        properties: {
          root_cause: { type: "string" },
          category: { type: "string", enum: ["config", "network", "timeout", "logic", "resource", "external"] },
          severity: { type: "string", enum: ["low", "medium", "high", "critical"] },
          evidence: { type: "array", items: { type: "string" } },
          fix_steps: { type: "array", items: { type: "string" } },
          prevention: { type: "array", items: { type: "string" } },
          similar_patterns: { type: "array", items: { type: "string" } }
        }
      }
    });

    // Audit log
    await base44.asServiceRole.entities.Audit.create({
      entity_type: 'run',
      entity_id: run_id,
      action: 'debug_analysis',
      metadata: { 
        category: result.category, 
        severity: result.severity,
        api_call: true
      },
      org_id: user.organization.id
    });

    return Response.json({
      success: true,
      data: result,
      run_context: {
        agent_name: agent?.name,
        run_id: run.id,
        finished_at: run.finished_at
      }
    }, { 
      status: 200,
      headers: {
        'X-Request-Id': crypto.randomUUID()
      }
    });

  } catch (error) {
    console.error('Log analysis error:', error);
    return Response.json({
      code: 'SERVER_ERROR',
      message: error.message || 'Failed to analyze logs',
      retryable: true
    }, { status: 500 });
  }
});