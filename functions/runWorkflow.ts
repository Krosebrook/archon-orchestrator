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
    const { workflow_id, input_data, dry_run } = body;

    if (!workflow_id) {
      return Response.json({
        code: 'VALIDATION_ERROR',
        message: 'workflow_id is required',
        retryable: false,
        trace_id
      }, { status: 422 });
    }

    // Fetch workflow
    const workflows = await base44.asServiceRole.entities.Workflow.filter({ id: workflow_id });
    if (!workflows || workflows.length === 0) {
      return Response.json({
        code: 'NOT_FOUND',
        message: 'Workflow not found',
        retryable: false,
        trace_id
      }, { status: 404 });
    }

    const workflow = workflows[0];
    const spec = workflow.spec || {};
    const nodes = spec.nodes || [];
    const edges = spec.edges || [];

    // Create run record
    const run = await base44.asServiceRole.entities.Run.create({
      workflow_id,
      agent_id: nodes[0]?.config?.agent_id,
      state: dry_run ? 'simulated' : 'running',
      started_at: new Date().toISOString(),
      input: input_data,
      org_id: workflow.org_id
    });

    if (dry_run) {
      return Response.json({
        success: true,
        data: {
          run_id: run.id,
          mode: 'dry_run',
          workflow_name: workflow.name,
          nodes_count: nodes.length,
          estimated_cost_cents: spec.estimated_cost_cents || nodes.length * 10
        }
      }, { headers: { 'X-Trace-Id': trace_id } });
    }

    // Execute nodes in order (simplified - real impl would handle DAG)
    const results = [];
    let totalCost = 0;
    const startTime = Date.now();

    for (const node of nodes) {
      if (node.type === 'agent' && node.config?.agent_id) {
        const agents = await base44.asServiceRole.entities.Agent.filter({ id: node.config.agent_id });
        if (agents.length > 0) {
          const agent = agents[0];
          
          const nodeResult = await base44.integrations.Core.InvokeLLM({
            prompt: `${node.config?.instructions || node.label}\n\nContext: ${JSON.stringify(input_data)}`,
          });

          results.push({
            node_id: node.id,
            agent_name: agent.name,
            output: nodeResult,
            status: 'completed'
          });

          totalCost += 10;
        }
      } else if (node.type === 'tool') {
        results.push({
          node_id: node.id,
          output: { simulated: true, tool: node.config?.tool_id },
          status: 'completed'
        });
      }
    }

    const duration_ms = Date.now() - startTime;

    // Update run with results
    await base44.asServiceRole.entities.Run.update(run.id, {
      state: 'completed',
      finished_at: new Date().toISOString(),
      duration_ms,
      cost_cents: totalCost,
      output: { node_results: results }
    });

    // Audit
    await base44.asServiceRole.entities.Audit.create({
      entity_type: 'workflow',
      entity_id: workflow_id,
      action: 'run',
      actor: user.email,
      metadata: { run_id: run.id, duration_ms, cost_cents: totalCost },
      org_id: workflow.org_id
    });

    return Response.json({
      success: true,
      data: {
        run_id: run.id,
        workflow_name: workflow.name,
        state: 'completed',
        duration_ms,
        cost_cents: totalCost,
        results
      }
    }, { headers: { 'X-Trace-Id': trace_id } });

  } catch (error) {
    console.error('Workflow run error:', error);
    return Response.json({
      code: 'SERVER_ERROR',
      message: error.message || 'Workflow execution failed',
      retryable: true,
      trace_id
    }, { status: 500 });
  }
});