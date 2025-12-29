import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

/**
 * Generate explainability insights for agent decisions
 * Uses LLM to analyze and explain reasoning
 */
Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    
    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { 
      agent_id,
      run_id,
      decision_point,
      input_data,
      output_data,
      model_used = 'gpt-4o-mini',
    } = await req.json();
    
    if (!agent_id || !decision_point || !input_data || !output_data) {
      return Response.json({ 
        error: 'agent_id, decision_point, input_data, and output_data are required' 
      }, { status: 400 });
    }

    const OPENAI_API_KEY = Deno.env.get('OPENAI_API_KEY');
    if (!OPENAI_API_KEY) {
      throw new Error('OPENAI_API_KEY not configured');
    }

    // Generate explanation using LLM
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${OPENAI_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        messages: [{
          role: 'system',
          content: 'You are an AI explainability expert. Analyze agent decisions and provide clear, transparent explanations of reasoning, factors, and alternatives.',
        }, {
          role: 'user',
          content: `Explain this AI agent decision:\n\nDecision Point: ${decision_point}\n\nInput: ${JSON.stringify(input_data, null, 2)}\n\nOutput: ${JSON.stringify(output_data, null, 2)}\n\nProvide:\n1. Clear reasoning\n2. Key factors (with weights 0-1 and positive/negative/neutral impact)\n3. Confidence score (0-1)\n4. Alternative paths considered\n\nReturn as JSON: { reasoning, confidence_score, factors: [{factor, weight, impact}], alternative_paths: [{path, probability, why_not_chosen}] }`,
        }],
        temperature: 0.3,
        response_format: { type: 'json_object' },
      }),
    });

    if (!response.ok) {
      throw new Error(`OpenAI API error: ${response.statusText}`);
    }

    const data = await response.json();
    const explanation = JSON.parse(data.choices[0].message.content);

    // Store explainability log
    const log = await base44.asServiceRole.entities.ExplainabilityLog.create({
      agent_id,
      run_id,
      decision_point,
      input_data,
      output_data,
      reasoning: explanation.reasoning,
      confidence_score: explanation.confidence_score,
      factors: explanation.factors,
      alternative_paths: explanation.alternative_paths,
      model_used,
      timestamp: new Date().toISOString(),
      org_id: user.organization.id,
    });

    return Response.json({
      success: true,
      explanation: log,
    });

  } catch (error) {
    console.error('Explainability error:', error);
    return Response.json({ 
      error: error.message,
      trace_id: `XAI_ERROR_${Date.now()}`,
    }, { status: 500 });
  }
});