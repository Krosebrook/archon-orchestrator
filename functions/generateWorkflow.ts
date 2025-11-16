import { createClientFromRequest } from 'npm:@base44/sdk@0.8.4';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    
    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { goal, context } = await req.json();

    // Get available agents and tools
    const [agents, tools] = await Promise.all([
      base44.asServiceRole.entities.Agent.list(),
      base44.asServiceRole.entities.Tool.list()
    ]);

    const agentsList = agents.map(a => ({
      id: a.id,
      name: a.name,
      model: a.config?.model,
      provider: a.config?.provider,
      capabilities: a.config?.capabilities || []
    }));

    const toolsList = tools.map(t => ({
      id: t.id,
      name: t.name,
      type: t.type,
      description: t.description
    }));

    const prompt = `You are a workflow architect AI. Generate a complete, executable workflow based on the user's goal.

Goal: ${goal}
${context ? `Additional Context: ${context}` : ''}

Available Agents:
${agentsList.map(a => `- ${a.name} (${a.provider}/${a.model}): ${a.capabilities.join(', ')}`).join('\n')}

Available Tools/Integrations:
${toolsList.map(t => `- ${t.name} (${t.type})`).join('\n')}

Design a workflow that:
1. Breaks down the goal into concrete, executable nodes (steps)
2. Assigns appropriate agents to each node based on capabilities
3. Identifies necessary tools/integrations
4. Creates dependencies between nodes (which nodes must complete before others)
5. Defines clear inputs/outputs for each node

Return a JSON workflow specification with this structure:
{
  "workflow_name": "Descriptive workflow name",
  "description": "What this workflow accomplishes",
  "nodes": [
    {
      "id": "node_1",
      "type": "agent|tool|condition|webhook",
      "label": "Node label",
      "config": {
        "agent_id": "agent_id_if_applicable",
        "tool_id": "tool_id_if_applicable",
        "instructions": "What this node should do",
        "timeout": 30
      },
      "dependencies": ["node_0"],
      "position": { "x": 100, "y": 100 }
    }
  ],
  "edges": [
    { "from": "node_0", "to": "node_1" }
  ],
  "collaboration_strategy": "sequential|parallel|consensus|hierarchical",
  "estimated_cost_cents": 100,
  "reasoning": "Brief explanation of the workflow design"
}`;

    const response = await base44.integrations.Core.InvokeLLM({
      prompt,
      response_json_schema: {
        type: "object",
        properties: {
          workflow_name: { type: "string" },
          description: { type: "string" },
          nodes: {
            type: "array",
            items: {
              type: "object",
              properties: {
                id: { type: "string" },
                type: { type: "string" },
                label: { type: "string" },
                config: { type: "object", additionalProperties: true },
                dependencies: { type: "array", items: { type: "string" } },
                position: { type: "object", properties: { x: { type: "number" }, y: { type: "number" } } }
              }
            }
          },
          edges: {
            type: "array",
            items: {
              type: "object",
              properties: {
                from: { type: "string" },
                to: { type: "string" }
              }
            }
          },
          collaboration_strategy: { type: "string" },
          estimated_cost_cents: { type: "number" },
          reasoning: { type: "string" }
        }
      }
    });

    return Response.json({
      success: true,
      workflow: response
    });

  } catch (error) {
    console.error('Workflow generation error:', error);
    return Response.json({ 
      error: error.message,
      success: false
    }, { status: 500 });
  }
});