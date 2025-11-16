import { createClientFromRequest } from 'npm:@base44/sdk@0.8.4';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    
    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { collaboration_id, goal, context } = await req.json();

    // Get collaboration and agents
    const collaborations = await base44.entities.AgentCollaboration.filter({ id: collaboration_id });
    if (collaborations.length === 0) {
      return Response.json({ error: 'Collaboration not found' }, { status: 404 });
    }
    const collaboration = collaborations[0];

    // Get agent capabilities
    const agents = await base44.asServiceRole.entities.Agent.list();
    const participantAgents = agents.filter(a => 
      collaboration.participant_agents?.includes(a.id)
    );

    const agentCapabilities = participantAgents.map(agent => ({
      id: agent.id,
      name: agent.name,
      model: agent.config?.model,
      provider: agent.config?.provider,
      capabilities: agent.config?.capabilities || [],
      current_load: 0 // TODO: Calculate based on active tasks
    }));

    // Use AI to analyze and delegate tasks
    const prompt = `You are a task delegation coordinator for an AI agent collaboration system.

Goal: ${goal || 'Optimize workflow and complete assigned objectives'}

Current Context:
${JSON.stringify(context || collaboration.shared_context, null, 2)}

Available Agents:
${agentCapabilities.map(a => `- ${a.name} (${a.provider}/${a.model}): ${a.capabilities.join(', ') || 'general purpose'}`).join('\n')}

Strategy: ${collaboration.strategy}

Analyze the goal and context, then:
1. Break down the goal into 3-6 concrete, actionable sub-tasks
2. Assign each sub-task to the most appropriate agent based on their capabilities
3. Estimate effort (low/medium/high) and priority (low/medium/high) for each
4. Define success criteria for each sub-task

Return a JSON object with this structure:
{
  "tasks": [
    {
      "title": "Sub-task title",
      "description": "Detailed description",
      "assigned_agent_id": "agent_id",
      "effort": "low|medium|high",
      "priority": "low|medium|high",
      "dependencies": ["task_0", "task_1"],
      "success_criteria": "Clear success criteria"
    }
  ],
  "reasoning": "Brief explanation of delegation strategy"
}`;

    const response = await base44.integrations.Core.InvokeLLM({
      prompt,
      response_json_schema: {
        type: "object",
        properties: {
          tasks: {
            type: "array",
            items: {
              type: "object",
              properties: {
                title: { type: "string" },
                description: { type: "string" },
                assigned_agent_id: { type: "string" },
                effort: { type: "string" },
                priority: { type: "string" },
                dependencies: { type: "array", items: { type: "string" } },
                success_criteria: { type: "string" }
              }
            }
          },
          reasoning: { type: "string" }
        }
      }
    });

    const delegationResult = response;

    // Create task records with IDs
    const tasks = delegationResult.tasks.map((task, idx) => ({
      ...task,
      id: `task_${Date.now()}_${idx}`,
      status: 'pending',
      created_at: new Date().toISOString(),
      progress: 0
    }));

    // Update collaboration with task delegation
    await base44.entities.AgentCollaboration.update(collaboration_id, {
      shared_context: {
        ...collaboration.shared_context,
        task_delegation: {
          tasks,
          reasoning: delegationResult.reasoning,
          delegated_at: new Date().toISOString(),
          delegated_by: user.email
        }
      }
    });

    return Response.json({
      success: true,
      tasks,
      reasoning: delegationResult.reasoning
    });

  } catch (error) {
    console.error('Task delegation error:', error);
    return Response.json({ 
      error: error.message,
      success: false
    }, { status: 500 });
  }
});