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
    const { name, description, provider, model, temperature, max_tokens, capabilities, persona } = body;

    // Validation
    if (!name) {
      return Response.json({
        code: 'VALIDATION_ERROR',
        message: 'name is required',
        hint: 'Provide a unique name for the agent',
        retryable: false,
        trace_id
      }, { status: 422 });
    }

    // Check for duplicate name
    const existing = await base44.asServiceRole.entities.Agent.filter({ name });
    if (existing.length > 0) {
      return Response.json({
        code: 'VALIDATION_ERROR',
        message: 'Agent with this name already exists',
        hint: 'Choose a different name',
        retryable: false,
        trace_id
      }, { status: 422 });
    }

    const org_id = user.organization?.id || 'default-org';

    // Create agent
    const agent = await base44.asServiceRole.entities.Agent.create({
      name,
      version: '1.0.0',
      status: 'active',
      config: {
        provider: provider || 'openai',
        model: model || 'gpt-4o',
        temperature: temperature ?? 0.7,
        max_tokens: max_tokens || 2000,
        capabilities: capabilities || [],
        description
      },
      org_id
    });

    // Create identity memory if persona provided
    if (persona) {
      await base44.asServiceRole.entities.AgentMemory.create({
        agent_id: agent.id,
        memory_type: 'semantic',
        content: {
          type: 'identity',
          persona,
          created_at: new Date().toISOString()
        },
        context: 'Agent identity and persona definition',
        importance: 100,
        tags: ['identity', 'persona', 'core'],
        org_id
      });
    }

    // Audit
    await base44.asServiceRole.entities.Audit.create({
      entity_type: 'agent',
      entity_id: agent.id,
      action: 'create',
      actor: user.email,
      metadata: { name, provider: provider || 'openai', model: model || 'gpt-4o' },
      org_id
    });

    return Response.json({
      success: true,
      data: {
        id: agent.id,
        name: agent.name,
        status: agent.status,
        config: agent.config
      }
    }, { 
      status: 201,
      headers: { 'X-Trace-Id': trace_id }
    });

  } catch (error) {
    console.error('Agent creation error:', error);
    return Response.json({
      code: 'SERVER_ERROR',
      message: error.message || 'Failed to create agent',
      retryable: true,
      trace_id
    }, { status: 500 });
  }
});