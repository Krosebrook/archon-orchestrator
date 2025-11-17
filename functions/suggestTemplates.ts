import { createClientFromRequest } from 'npm:@base44/sdk@0.8.4';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    
    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { goal, context } = await req.json();

    const templates = await base44.asServiceRole.entities.WorkflowTemplate.list();

    const prompt = `You are a workflow recommendation AI. Based on the user's goal, recommend the most relevant workflow templates.

User Goal: ${goal}
${context ? `Context: ${context}` : ''}

Available Templates:
${templates.map(t => `
- ${t.name} (${t.category})
  Description: ${t.description}
  Use Cases: ${t.use_cases?.join(', ') || 'N/A'}
  Complexity: ${t.complexity}
`).join('\n')}

Analyze the goal and return matching templates ranked by relevance. Return JSON:
{
  "recommendations": [
    {
      "template_id": "template_id",
      "relevance_score": 95,
      "reasoning": "Why this template matches the goal"
    }
  ],
  "custom_workflow_needed": false
}`;

    const response = await base44.integrations.Core.InvokeLLM({
      prompt,
      response_json_schema: {
        type: "object",
        properties: {
          recommendations: {
            type: "array",
            items: {
              type: "object",
              properties: {
                template_id: { type: "string" },
                relevance_score: { type: "number" },
                reasoning: { type: "string" }
              }
            }
          },
          custom_workflow_needed: { type: "boolean" }
        }
      }
    });

    const enriched = response.recommendations.map(rec => {
      const template = templates.find(t => t.id === rec.template_id);
      return { ...rec, template };
    }).filter(r => r.template);

    return Response.json({
      success: true,
      recommendations: enriched,
      custom_workflow_needed: response.custom_workflow_needed
    });

  } catch (error) {
    console.error('Template suggestion error:', error);
    return Response.json({ 
      error: error.message,
      success: false
    }, { status: 500 });
  }
});