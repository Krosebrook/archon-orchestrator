import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { operation, context } = await req.json();

    if (!operation) {
      return Response.json({ error: 'Operation is required' }, { status: 400 });
    }

    const prompt = `You are an API schema expert. Review this operation definition and provide feedback.

**Operation:**
- Name: ${operation.name}
- Method: ${operation.method}
- Endpoint: ${operation.endpoint}
- Input Schema: ${JSON.stringify(operation.input_schema, null, 2)}
- Output Schema: ${JSON.stringify(operation.output_schema, null, 2)}

${context ? `**Additional Context:**\n${context}` : ''}

Analyze for:
1. Schema correctness (valid JSON Schema)
2. Completeness (missing common parameters)
3. Consistency (naming, types, patterns)
4. Security concerns (exposed sensitive fields)
5. Best practices (required vs optional fields)

Provide:
- issues: Array of problems found (severity: error|warning|info)
- suggestions: Array of improvement recommendations
- score: Overall quality score (0-100)
- improved_schemas: Suggested corrected input/output schemas if issues found`;

    const result = await base44.integrations.Core.InvokeLLM({
      prompt,
      add_context_from_internet: false,
      response_json_schema: {
        type: 'object',
        properties: {
          issues: {
            type: 'array',
            items: {
              type: 'object',
              properties: {
                severity: { type: 'string', enum: ['error', 'warning', 'info'] },
                field: { type: 'string' },
                message: { type: 'string' },
              },
            },
          },
          suggestions: {
            type: 'array',
            items: { type: 'string' },
          },
          score: { type: 'number' },
          improved_schemas: {
            type: 'object',
            properties: {
              input_schema: { type: 'object' },
              output_schema: { type: 'object' },
            },
          },
        },
      },
    });

    return Response.json({
      success: true,
      data: result,
    });
  } catch (error) {
    console.error('Validation error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});