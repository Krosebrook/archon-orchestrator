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
    const { name, description, nodes, edges, collaboration_strategy, tags } = body;

    if (!name) {
      return Response.json({
        code: 'VALIDATION_ERROR',
        message: 'name is required',
        hint: 'Provide a name for the workflow',
        retryable: false,
        trace_id
      }, { status: 422 });
    }

    const org_id = user.organization?.id || 'default-org';

    // Calculate estimated cost based on nodes
    const agentNodes = (nodes || []).filter(n => n.type === 'agent');
    const estimated_cost_cents = agentNodes.length * 15;

    // Create workflow
    const workflow = await base44.asServiceRole.entities.Workflow.create({
      name,
      description: description || '',
      status: 'active',
      spec: {
        nodes: nodes || [],
        edges: edges || [],
        collaboration_strategy: collaboration_strategy || 'sequential',
        estimated_cost_cents
      },
      tags: tags || [],
      version: '1.0.0',
      org_id
    });

    // Create initial version record
    await base44.asServiceRole.entities.WorkflowVersion.create({
      workflow_id: workflow.id,
      version: '1.0.0',
      spec: workflow.spec,
      change_summary: 'Initial workflow creation',
      created_by: user.email,
      org_id
    });

    // Audit
    await base44.asServiceRole.entities.Audit.create({
      entity_type: 'workflow',
      entity_id: workflow.id,
      action: 'create',
      actor: user.email,
      metadata: { 
        name, 
        nodes_count: (nodes || []).length,
        strategy: collaboration_strategy || 'sequential'
      },
      org_id
    });

    return Response.json({
      success: true,
      data: {
        id: workflow.id,
        name: workflow.name,
        description: workflow.description,
        version: workflow.version,
        nodes_count: (nodes || []).length,
        estimated_cost_cents
      }
    }, { 
      status: 201,
      headers: { 'X-Trace-Id': trace_id }
    });

  } catch (error) {
    console.error('Workflow creation error:', error);
    return Response.json({
      code: 'SERVER_ERROR',
      message: error.message || 'Failed to create workflow',
      retryable: true,
      trace_id
    }, { status: 500 });
  }
});