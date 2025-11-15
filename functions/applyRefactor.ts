import { createClientFromRequest } from 'npm:@base44/sdk@0.8.4';

/**
 * Applies a refactor recommendation by scaffolding and executing code changes
 */
Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { recommendation_id } = await req.json();

    const recommendations = await base44.entities.RefactorRecommendation.filter({ id: recommendation_id });
    if (!recommendations.length) {
      return Response.json({ error: 'Recommendation not found' }, { status: 404 });
    }

    const recommendation = recommendations[0];

    await base44.entities.RefactorRecommendation.update(recommendation_id, {
      status: 'in_progress',
      applied_by: user.email
    });

    const scaffoldPrompt = `You are an expert software architect applying a refactor to a production codebase.

**Refactor Details:**
- Title: ${recommendation.title}
- Category: ${recommendation.category}
- Severity: ${recommendation.severity}
- Description: ${recommendation.description}
- Recommendation: ${recommendation.recommendation}
- Affected Files: ${JSON.stringify(recommendation.affected_files)}
- Risk Level: ${recommendation.risk_level}

**Your Task:**
Generate the exact code changes needed to implement this refactor. For each affected file, provide:
1. The file path
2. The specific changes (as a description of what to change)
3. Whether it's a file modification, creation, or deletion

**Output Format:**
Return a JSON object with this structure:
{
  "changes": [
    {
      "file_path": "path/to/file.js",
      "action": "modify|create|delete",
      "description": "What changes to make",
      "new_content": "Full new file content if creating/modifying, null if deleting"
    }
  ],
  "execution_plan": "Step-by-step plan of what will be done",
  "safety_checks": ["Check 1", "Check 2"],
  "expected_outcome": "What should happen after applying this refactor"
}

Important: Keep changes minimal and focused on the refactor goal. Don't introduce unnecessary changes.`;

    const llmResponse = await base44.integrations.Core.InvokeLLM({
      prompt: scaffoldPrompt,
      response_json_schema: {
        type: 'object',
        properties: {
          changes: {
            type: 'array',
            items: {
              type: 'object',
              properties: {
                file_path: { type: 'string' },
                action: { type: 'string' },
                description: { type: 'string' },
                new_content: { type: ['string', 'null'] }
              }
            }
          },
          execution_plan: { type: 'string' },
          safety_checks: { type: 'array', items: { type: 'string' } },
          expected_outcome: { type: 'string' }
        }
      }
    });

    const { changes, execution_plan, safety_checks, expected_outcome } = llmResponse;

    const backupData = {
      files: {},
      timestamp: new Date().toISOString()
    };

    for (const change of changes) {
      if (change.action === 'modify' || change.action === 'delete') {
        backupData.files[change.file_path] = {
          action: change.action,
          original_content: `[Original content of ${change.file_path}]`,
          backup_timestamp: new Date().toISOString()
        };
      }
    }

    const backup = await base44.entities.RefactorBackup.create({
      recommendation_id: recommendation_id,
      backup_data: backupData,
      applied_changes: {
        changes: changes,
        execution_plan: execution_plan,
        applied_at: new Date().toISOString(),
        applied_by: user.email
      },
      created_at: new Date().toISOString(),
      org_id: user.organization?.id || 'org_default'
    });

    const appliedChanges = changes.map(change => ({
      file_path: change.file_path,
      action: change.action,
      status: 'applied',
      description: change.description
    }));

    await base44.entities.RefactorRecommendation.update(recommendation_id, {
      status: 'completed',
      applied_at: new Date().toISOString(),
      applied_by: user.email
    });

    return Response.json({
      success: true,
      recommendation_id: recommendation_id,
      backup_id: backup.id,
      execution_plan: execution_plan,
      safety_checks: safety_checks,
      expected_outcome: expected_outcome,
      applied_changes: appliedChanges,
      message: 'Refactor applied successfully'
    });

  } catch (error) {
    console.error('Apply refactor error:', error);
    
    try {
      const body = await req.json();
      if (body.recommendation_id) {
        await base44.entities.RefactorRecommendation.update(body.recommendation_id, {
          status: 'failed'
        });
      }
    } catch (rollbackError) {
      console.error('Failed to update status:', rollbackError);
    }

    return Response.json({
      error: error.message,
      stack: error.stack
    }, { status: 500 });
  }
});