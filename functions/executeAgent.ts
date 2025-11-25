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
    const { agent_id, prompt, context, output_schema } = body;

    // Validation
    if (!agent_id || !prompt) {
      return Response.json({
        code: 'VALIDATION_ERROR',
        message: 'agent_id and prompt are required',
        hint: 'Provide the agent ID and a prompt for execution',
        retryable: false,
        trace_id
      }, { status: 422 });
    }

    // Fetch agent
    const agents = await base44.asServiceRole.entities.Agent.filter({ id: agent_id });
    if (!agents || agents.length === 0) {
      return Response.json({
        code: 'NOT_FOUND',
        message: 'Agent not found',
        retryable: false,
        trace_id
      }, { status: 404 });
    }

    const agent = agents[0];
    
    // Check agent status
    if (agent.status !== 'active') {
      return Response.json({
        code: 'FORBIDDEN',
        message: `Agent is ${agent.status}, cannot execute`,
        hint: 'Activate the agent before execution',
        retryable: false,
        trace_id
      }, { status: 403 });
    }

    // Get agent memory/identity if exists
    const memories = await base44.asServiceRole.entities.AgentMemory.filter({ 
      agent_id, 
      memory_type: 'semantic' 
    }, '-importance', 5);

    const identityContext = memories.map(m => m.content).join('\n');

    // Build system prompt from agent config
    const systemPrompt = `You are ${agent.name}.
${identityContext ? `\nIdentity & Context:\n${identityContext}` : ''}
${context ? `\nAdditional Context:\n${JSON.stringify(context)}` : ''}

Respond according to your configured capabilities and constraints.`;

    const startTime = Date.now();

    // Execute via LLM
    const llmParams = {
      prompt: `${systemPrompt}\n\nUser Request: ${prompt}`,
    };

    if (output_schema) {
      llmParams.response_json_schema = output_schema;
    }

    const result = await base44.integrations.Core.InvokeLLM(llmParams);

    const latency_ms = Date.now() - startTime;

    // Record metrics
    await base44.asServiceRole.entities.AgentMetric.create({
      agent_id,
      provider: agent.config?.provider || 'openai',
      model: agent.config?.model || 'gpt-4o',
      prompt_tokens: Math.ceil(prompt.length / 4),
      completion_tokens: Math.ceil(JSON.stringify(result).length / 4),
      latency_ms,
      cost_cents: Math.ceil(latency_ms / 100),
      status: 'success',
      timestamp: new Date().toISOString(),
      org_id: agent.org_id
    });

    // Audit log
    await base44.asServiceRole.entities.Audit.create({
      entity_type: 'agent',
      entity_id: agent_id,
      action: 'execute',
      actor: user.email,
      metadata: { 
        prompt_length: prompt.length,
        latency_ms,
        model: agent.config?.model
      },
      org_id: agent.org_id
    });

    return Response.json({
      success: true,
      data: {
        result,
        agent_name: agent.name,
        model: agent.config?.model,
        latency_ms
      }
    }, { 
      status: 200,
      headers: { 'X-Trace-Id': trace_id }
    });

  } catch (error) {
    console.error('Agent execution error:', error);
    return Response.json({
      code: 'SERVER_ERROR',
      message: error.message || 'Agent execution failed',
      retryable: true,
      trace_id
    }, { status: 500 });
  }
});