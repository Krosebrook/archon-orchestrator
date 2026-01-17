import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { description, apiDocumentation } = await req.json();

    if (!description) {
      return Response.json({ error: 'Description is required' }, { status: 400 });
    }

    const prompt = `You are an expert API integration architect. Based on the following description and documentation, generate a complete connector definition.

**API Description:**
${description}

${apiDocumentation ? `**API Documentation:**\n${apiDocumentation}` : ''}

Generate a JSON response with:
1. Suggested connector name and provider
2. Authentication method (api_key, oauth2, basic, custom) with reasoning
3. Category (crm, communication, project_management, analytics, storage, custom)
4. 3-5 key operations with complete schemas

For each operation include:
- id (snake_case)
- name (human-readable)
- description
- method (GET/POST/PUT/DELETE/PATCH)
- endpoint (path with {param} placeholders)
- input_schema (JSON Schema)
- output_schema (JSON Schema)

Be thorough with schema definitions - include all likely parameters with correct types, descriptions, and whether they're required.`;

    const result = await base44.integrations.Core.InvokeLLM({
      prompt,
      add_context_from_internet: false,
      response_json_schema: {
        type: 'object',
        properties: {
          name: { type: 'string' },
          provider: { type: 'string' },
          auth_type: { type: 'string', enum: ['api_key', 'oauth2', 'basic', 'custom'] },
          auth_reasoning: { type: 'string' },
          category: { type: 'string' },
          operations: {
            type: 'array',
            items: {
              type: 'object',
              properties: {
                id: { type: 'string' },
                name: { type: 'string' },
                description: { type: 'string' },
                method: { type: 'string' },
                endpoint: { type: 'string' },
                input_schema: { type: 'object' },
                output_schema: { type: 'object' },
              },
            },
          },
          auth_config_suggestions: { type: 'object' },
        },
      },
    });

    return Response.json({
      success: true,
      data: result,
    });
  } catch (error) {
    console.error('Connector generation error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});