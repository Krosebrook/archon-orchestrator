import { createClientFromRequest } from 'npm:@base44/sdk@0.8.4';

/**
 * Analyzes workflow performance and generates optimization recommendations
 */
Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { workflow_id, analysis_type = 'performance' } = await req.json();

    if (!workflow_id) {
      return Response.json({ error: 'workflow_id required' }, { status: 400 });
    }

    // Fetch workflow and runs
    const [workflow, runs] = await Promise.all([
      base44.entities.Workflow.filter({ id: workflow_id }).then(w => w[0]),
      base44.entities.Run.filter({ workflow_id }, '-started_at', 100)
    ]);

    if (!workflow) {
      return Response.json({ error: 'Workflow not found' }, { status: 404 });
    }

    // Calculate current metrics
    const currentMetrics = {
      avg_cost_cents: Math.round(runs.reduce((sum, r) => sum + (r.cost_cents || 0), 0) / runs.length) || 0,
      avg_duration_ms: Math.round(runs.reduce((sum, r) => {
        if (!r.started_at || !r.finished_at) return sum;
        return sum + (new Date(r.finished_at) - new Date(r.started_at));
      }, 0) / runs.length) || 0,
      success_rate: runs.length > 0 ? (runs.filter(r => r.state === 'completed').length / runs.length) : 0,
      p95_latency_ms: 0 // Calculate P95
    };

    // Invoke LLM for optimization analysis
    const analysisPrompt = `You are a workflow optimization AI analyzing performance data.

**Workflow:** ${workflow.name}
**Analysis Type:** ${analysis_type}

**Current Metrics:**
- Average Cost: $${(currentMetrics.avg_cost_cents / 100).toFixed(2)}
- Average Duration: ${Math.round(currentMetrics.avg_duration_ms / 1000)}s
- Success Rate: ${(currentMetrics.success_rate * 100).toFixed(1)}%
- Total Runs: ${runs.length}

**Recent Run Patterns:**
${runs.slice(0, 10).map(r => `- ${r.state} | ${r.cost_cents}¢ | ${r.tokens_in}+${r.tokens_out} tokens`).join('\n')}

**Your Task:**
Analyze this workflow and provide actionable optimization recommendations.

**Output Format:**
{
  "recommendations": [
    {
      "title": "Brief title",
      "description": "Detailed explanation",
      "impact": "Expected improvement (e.g., '25% cost reduction')",
      "effort": "low|medium|high",
      "estimated_savings": {
        "cost_reduction_percent": 25,
        "latency_reduction_ms": 500
      }
    }
  ],
  "priority_recommendation": "string"
}

Focus on: ${analysis_type}`;

    const llmResponse = await base44.integrations.Core.InvokeLLM({
      prompt: analysisPrompt,
      response_json_schema: {
        type: 'object',
        properties: {
          recommendations: {
            type: 'array',
            items: {
              type: 'object',
              properties: {
                title: { type: 'string' },
                description: { type: 'string' },
                impact: { type: 'string' },
                effort: { type: 'string' },
                estimated_savings: { type: 'object' }
              }
            }
          },
          priority_recommendation: { type: 'string' }
        }
      }
    });

    // Create optimization record
    const optimization = await base44.entities.WorkflowOptimization.create({
      workflow_id,
      analysis_type,
      current_metrics: currentMetrics,
      recommendations: llmResponse.recommendations || [],
      status: 'ready',
      org_id: user.organization?.id || 'org_default'
    });

    return Response.json({
      success: true,
      optimization_id: optimization.id,
      current_metrics: currentMetrics,
      recommendations: llmResponse.recommendations,
      priority: llmResponse.priority_recommendation
    });

  } catch (error) {
    console.error('Workflow optimization error:', error);
    return Response.json({
      error: error.message,
      stack: error.stack
    }, { status: 500 });
  }
});