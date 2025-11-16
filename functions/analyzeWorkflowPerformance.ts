import { createClientFromRequest } from 'npm:@base44/sdk@0.8.4';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    
    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { workflow_id } = await req.json();

    // Get workflow and its execution history
    const [workflow, runs, agents, metrics] = await Promise.all([
      base44.asServiceRole.entities.Workflow.filter({ id: workflow_id }),
      base44.asServiceRole.entities.Run.filter({ workflow_id }, '-created_date', 50),
      base44.asServiceRole.entities.Agent.list(),
      base44.asServiceRole.entities.AgentMetric.filter({ run_id: { $in: [] } }, '-timestamp', 500)
    ]);

    if (workflow.length === 0) {
      return Response.json({ error: 'Workflow not found' }, { status: 404 });
    }

    const workflowData = workflow[0];
    const runIds = runs.map(r => r.id);
    
    // Get metrics for these runs
    const runMetrics = await base44.asServiceRole.entities.AgentMetric.filter(
      { run_id: { $in: runIds } },
      '-timestamp'
    );

    // Calculate performance stats
    const stats = {
      total_runs: runs.length,
      avg_cost_cents: runs.reduce((sum, r) => sum + (r.cost_cents || 0), 0) / Math.max(runs.length, 1),
      avg_duration_ms: runs.reduce((sum, r) => {
        if (r.started_at && r.finished_at) {
          return sum + (new Date(r.finished_at) - new Date(r.started_at));
        }
        return sum;
      }, 0) / Math.max(runs.length, 1),
      success_rate: runs.filter(r => r.state === 'completed').length / Math.max(runs.length, 1),
      failed_runs: runs.filter(r => r.state === 'failed').length
    };

    const prompt = `You are a workflow optimization AI. Analyze the workflow execution data and suggest concrete improvements.

Workflow: ${workflowData.name}
Description: ${workflowData.description}

Current Structure:
${JSON.stringify(workflowData.spec, null, 2)}

Performance Metrics:
- Total Runs: ${stats.total_runs}
- Avg Cost: $${(stats.avg_cost_cents / 100).toFixed(2)}
- Avg Duration: ${Math.round(stats.avg_duration_ms / 1000)}s
- Success Rate: ${(stats.success_rate * 100).toFixed(1)}%
- Failed Runs: ${stats.failed_runs}

Available Agents:
${agents.map(a => `- ${a.name} (${a.config?.provider}/${a.config?.model}): ${a.config?.capabilities?.join(', ') || 'general'}`).join('\n')}

Analyze and provide specific optimization recommendations:
1. Identify bottlenecks (slow nodes, high-cost operations)
2. Suggest agent re-assignments based on capabilities
3. Propose task reordering for better parallelization
4. Recommend efficiency improvements

Return JSON with this structure:
{
  "overall_score": 75,
  "optimizations": [
    {
      "type": "reorder|reassign|parallel|optimize",
      "severity": "high|medium|low",
      "title": "Short title",
      "description": "What's wrong and why",
      "recommendation": "Specific action to take",
      "node_ids": ["node_1"],
      "estimated_improvement": {
        "cost_reduction_percent": 20,
        "speed_improvement_percent": 30
      },
      "changes": {
        "nodes": [{"id": "node_1", "updates": {...}}],
        "edges": [{"from": "node_1", "to": "node_2"}]
      }
    }
  ],
  "reasoning": "Overall analysis summary"
}`;

    const response = await base44.integrations.Core.InvokeLLM({
      prompt,
      response_json_schema: {
        type: "object",
        properties: {
          overall_score: { type: "number" },
          optimizations: {
            type: "array",
            items: {
              type: "object",
              properties: {
                type: { type: "string" },
                severity: { type: "string" },
                title: { type: "string" },
                description: { type: "string" },
                recommendation: { type: "string" },
                node_ids: { type: "array", items: { type: "string" } },
                estimated_improvement: {
                  type: "object",
                  properties: {
                    cost_reduction_percent: { type: "number" },
                    speed_improvement_percent: { type: "number" }
                  }
                },
                changes: {
                  type: "object",
                  properties: {
                    nodes: { type: "array", items: { type: "object", additionalProperties: true } },
                    edges: { type: "array", items: { type: "object", additionalProperties: true } }
                  }
                }
              }
            }
          },
          reasoning: { type: "string" }
        }
      }
    });

    return Response.json({
      success: true,
      analysis: response,
      current_stats: stats
    });

  } catch (error) {
    console.error('Workflow analysis error:', error);
    return Response.json({ 
      error: error.message,
      success: false
    }, { status: 500 });
  }
});