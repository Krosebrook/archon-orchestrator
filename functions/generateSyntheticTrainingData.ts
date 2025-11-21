import { createClientFromRequest } from 'npm:@base44/sdk@0.8.4';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user) {
      return Response.json({ 
        code: 'UNAUTHORIZED',
        message: 'Authentication required'
      }, { status: 401 });
    }

    const body = await req.json();
    const { module_id, sample_count = 10, difficulty = 'medium' } = body;

    if (!module_id) {
      return Response.json({
        code: 'VALIDATION_ERROR',
        message: 'module_id is required'
      }, { status: 422 });
    }

    if (sample_count > 50) {
      return Response.json({
        code: 'VALIDATION_ERROR',
        message: 'sample_count cannot exceed 50',
        hint: 'Generate in batches for larger datasets'
      }, { status: 422 });
    }

    // Fetch training module
    const modules = await base44.entities.TrainingModule.filter({ id: module_id });
    if (!modules || modules.length === 0) {
      return Response.json({
        code: 'NOT_FOUND',
        message: 'Training module not found'
      }, { status: 404 });
    }

    const module = modules[0];
    const agents = await base44.entities.Agent.filter({ id: module.agent_id });
    const agent = agents[0];

    // Generate synthetic scenarios
    const syntheticData = await base44.integrations.Core.InvokeLLM({
      prompt: `You are a synthetic data generator for AI agent training. Generate ${sample_count} training scenarios:

Context:
- Agent: ${agent.name}
- Training Objectives: ${JSON.stringify(module.learning_objectives)}
- Difficulty: ${difficulty}
- Existing Patterns: ${JSON.stringify(module.training_data?.patterns || [])}

Generate diverse, realistic scenarios that:
1. Target the specific learning objectives
2. Vary in complexity based on difficulty level
3. Include edge cases and challenging situations
4. Provide clear expected outcomes
5. Cover different aspects of the agent's capabilities

Each scenario should have:
- Input: The scenario description/prompt
- Expected Output: What a successful response looks like
- Success Criteria: How to evaluate the response
- Difficulty: easy | medium | hard | expert
- Tags: Relevant skills being tested`,
      response_json_schema: {
        type: "object",
        properties: {
          scenarios: {
            type: "array",
            items: {
              type: "object",
              properties: {
                id: { type: "string" },
                input: { type: "string" },
                expected_output: { type: "string" },
                success_criteria: {
                  type: "array",
                  items: { type: "string" }
                },
                difficulty: { type: "string", enum: ["easy", "medium", "hard", "expert"] },
                tags: { type: "array", items: { type: "string" } },
                estimated_tokens: { type: "integer" }
              }
            }
          },
          diversity_score: { type: "number" },
          coverage_analysis: { type: "string" }
        }
      }
    });

    // Update module with synthetic data
    const updatedData = {
      ...module.training_data,
      synthetic_scenarios: syntheticData.scenarios,
      generated_at: new Date().toISOString(),
      diversity_score: syntheticData.diversity_score
    };

    await base44.asServiceRole.entities.TrainingModule.update(module_id, {
      training_data: updatedData,
      iterations: (module.iterations || 0) + 1
    });

    // Audit
    await base44.asServiceRole.entities.Audit.create({
      entity_type: 'training_module',
      entity_id: module_id,
      action: 'synthetic_data_generated',
      metadata: {
        sample_count: syntheticData.scenarios.length,
        difficulty,
        diversity_score: syntheticData.diversity_score,
        api_call: true
      },
      org_id: user.organization.id
    });

    return Response.json({
      success: true,
      data: syntheticData,
      module_updated: true
    }, { status: 200 });

  } catch (error) {
    console.error('Synthetic data generation error:', error);
    return Response.json({
      code: 'SERVER_ERROR',
      message: error.message || 'Failed to generate synthetic data',
      retryable: true
    }, { status: 500 });
  }
});