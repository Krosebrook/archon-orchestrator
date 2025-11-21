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
    const { issue_description } = body;

    if (!issue_description || issue_description.trim().length < 10) {
      return Response.json({
        code: 'VALIDATION_ERROR',
        message: 'issue_description must be at least 10 characters',
        hint: 'Provide a detailed description of the issue you are experiencing',
        retryable: false
      }, { status: 422 });
    }

    // Gather context
    const agents = await base44.entities.Agent.list('', 10);
    const recentFailures = await base44.entities.Run.filter({ status: 'failed' }, '-finished_at', 10);
    const errorMetrics = await base44.entities.AgentMetric.filter({ status: 'error' }, '-timestamp', 20);

    const contextData = {
      agents: agents.map(a => ({ 
        id: a.id, 
        name: a.name, 
        status: a.status, 
        config: a.config 
      })),
      recent_failures: recentFailures.map(r => ({
        agent_id: r.agent_id,
        error: r.error_message,
        timestamp: r.finished_at
      })),
      error_metrics: errorMetrics.map(m => ({
        agent_id: m.agent_id,
        error_code: m.error_code,
        status: m.status
      }))
    };

    const result = await base44.integrations.Core.InvokeLLM({
      prompt: `You are an expert debugging coach. A developer is experiencing this issue:

"${issue_description}"

System Context:
${JSON.stringify(contextData, null, 2)}

Provide step-by-step debugging guidance:

For each step:
1. Clear action to take
2. What to look for
3. How to interpret results
4. When to move to next step

Include:
- Diagnostic questions to narrow down the issue
- Specific commands/queries to run
- Expected vs unexpected outcomes
- Common pitfalls to avoid

Be systematic, pedagogical, and thorough. Guide them to understand root cause, not just fix symptoms.`,
      response_json_schema: {
        type: "object",
        properties: {
          diagnosis: { type: "string" },
          steps: {
            type: "array",
            items: {
              type: "object",
              properties: {
                step_number: { type: "integer" },
                title: { type: "string" },
                action: { type: "string" },
                what_to_look_for: { type: "string" },
                expected_outcome: { type: "string" },
                if_unexpected: { type: "string" }
              }
            }
          },
          diagnostic_questions: { type: "array", items: { type: "string" } },
          common_pitfalls: { type: "array", items: { type: "string" } }
        }
      }
    });

    // Audit log
    await base44.asServiceRole.entities.Audit.create({
      entity_type: 'system',
      entity_id: 'debug_wizard',
      action: 'debug_session_started',
      metadata: { 
        issue_description: issue_description.substring(0, 100),
        step_count: result.steps?.length || 0,
        api_call: true
      },
      org_id: user.organization.id
    });

    return Response.json({
      success: true,
      data: result,
      session_id: crypto.randomUUID()
    }, { 
      status: 200,
      headers: {
        'X-Request-Id': crypto.randomUUID()
      }
    });

  } catch (error) {
    console.error('Debug session error:', error);
    return Response.json({
      code: 'SERVER_ERROR',
      message: error.message || 'Failed to start debug session',
      retryable: true
    }, { status: 500 });
  }
});