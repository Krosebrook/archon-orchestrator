import { createClientFromRequest } from 'npm:@base44/sdk@0.8.4';
import { z } from 'npm:zod@3.22.4';

const InputSchema = z.object({
  module_id: z.string().min(1, 'module_id is required'),
  sample_count: z.number().int().min(1).max(50).default(10),
  difficulty: z.enum(['easy', 'medium', 'hard', 'expert']).default('medium')
});

const ErrorCodes = {
  UNAUTHORIZED: 'UNAUTHORIZED',
  VALIDATION_ERROR: 'VALIDATION_ERROR',
  NOT_FOUND: 'NOT_FOUND',
  SERVER_ERROR: 'SERVER_ERROR'
};

function createError(code, message, hint = null, retryable = false, trace_id = null) {
  return Response.json({
    code,
    message,
    hint,
    retryable,
    trace_id
  }, { status: code === ErrorCodes.UNAUTHORIZED ? 401 : code === ErrorCodes.VALIDATION_ERROR ? 422 : code === ErrorCodes.NOT_FOUND ? 404 : 500 });
}

Deno.serve(async (req) => {
  const trace_id = crypto.randomUUID();
  const startTime = Date.now();

  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user) {
      return createError(
        ErrorCodes.UNAUTHORIZED,
        'Authentication required',
        'Please authenticate to access this endpoint',
        false,
        trace_id
      );
    }

    // Validate input
    const body = await req.json();
    const validation = InputSchema.safeParse(body);
    
    if (!validation.success) {
      return createError(
        ErrorCodes.VALIDATION_ERROR,
        validation.error.errors[0].message,
        'Check your request parameters',
        false,
        trace_id
      );
    }

    const { module_id, sample_count, difficulty } = validation.data;

    // Fetch training module
    const modules = await base44.entities.TrainingModule.filter({ id: module_id });
    if (!modules || modules.length === 0) {
      return createError(
        ErrorCodes.NOT_FOUND,
        'Training module not found',
        'Verify the module_id and ensure you have access',
        false,
        trace_id
      );
    }

    const module = modules[0];
    const agents = await base44.entities.Agent.filter({ id: module.agent_id });
    if (!agents || agents.length === 0) {
      return createError(
        ErrorCodes.NOT_FOUND,
        'Associated agent not found',
        'The training module references a non-existent agent',
        false,
        trace_id
      );
    }
    const agent = agents[0];

    // Generate synthetic scenarios
    const generationStart = Date.now();
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
    const generationLatency = Date.now() - generationStart;

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
        generation_latency_ms: generationLatency,
        trace_id
      },
      org_id: user.organization.id
    });

    const totalLatency = Date.now() - startTime;

    // Telemetry
    console.log(JSON.stringify({
      event: 'generate_synthetic_data',
      trace_id,
      module_id,
      sample_count: syntheticData.scenarios.length,
      difficulty,
      latency_ms: totalLatency,
      generation_latency_ms: generationLatency,
      org_id: user.organization.id
    }));

    return Response.json({
      success: true,
      data: syntheticData,
      module_updated: true,
      trace_id
    }, { status: 200 });

  } catch (error) {
    console.error(JSON.stringify({
      event: 'generate_synthetic_data_error',
      trace_id,
      error: error.message,
      stack: error.stack
    }));

    return createError(
      ErrorCodes.SERVER_ERROR,
      'Failed to generate synthetic data',
      'Please try again or contact support if the issue persists',
      true,
      trace_id
    );
  }
});