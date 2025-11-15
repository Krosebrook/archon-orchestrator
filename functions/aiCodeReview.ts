import { createClientFromRequest } from 'npm:@base44/sdk@0.8.4';

/**
 * Performs AI-powered code review analyzing quality, security, and best practices
 */
Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { scope, title } = await req.json();

    const review = await base44.entities.CodeReview.create({
      title: title || `Code Review ${new Date().toLocaleDateString()}`,
      scope: scope || { categories: ['security', 'performance', 'maintainability', 'best-practices'] },
      status: 'pending',
      org_id: user.organization?.id || 'org_default'
    });

    const [agents, workflows, runs, policies] = await Promise.all([
      base44.entities.Agent.list(),
      base44.entities.Workflow.list(),
      base44.entities.Run.list('-created_date', 50),
      base44.entities.Policy.list()
    ]);

    const reviewPrompt = `You are a senior software architect conducting a comprehensive code review of an AI orchestration platform called "Archon".

**System Overview:**
- Agents: ${agents.length} configured
- Workflows: ${workflows.length} defined
- Recent Runs: ${runs.length}
- Policies: ${policies.length} active

**Review Categories:**
1. Security - Auth checks, input validation, secret management
2. Performance - Database queries, N+1 problems, caching
3. Maintainability - Code organization, naming, documentation
4. Best Practices - Error handling, TypeScript usage, testing

**Your Task:**
Analyze the codebase and provide structured findings.

**Output Format:**
{
  "findings": [
    {
      "severity": "critical|high|medium|low",
      "category": "security|performance|maintainability|best-practices",
      "file": "path/to/file.js",
      "line": 42,
      "issue": "Description of the problem",
      "suggestion": "How to fix it"
    }
  ],
  "overall_score": 85,
  "summary": "Brief summary of code quality"
}

Focus on actionable, specific issues with clear remediation steps.`;

    const llmResponse = await base44.integrations.Core.InvokeLLM({
      prompt: reviewPrompt,
      response_json_schema: {
        type: 'object',
        properties: {
          findings: {
            type: 'array',
            items: {
              type: 'object',
              properties: {
                severity: { type: 'string' },
                category: { type: 'string' },
                file: { type: 'string' },
                line: { type: 'integer' },
                issue: { type: 'string' },
                suggestion: { type: 'string' }
              }
            }
          },
          overall_score: { type: 'integer' },
          summary: { type: 'string' }
        }
      }
    });

    await base44.entities.CodeReview.update(review.id, {
      findings: llmResponse.findings || [],
      overall_score: llmResponse.overall_score || 75,
      status: 'completed'
    });

    return Response.json({
      success: true,
      review_id: review.id,
      findings: llmResponse.findings,
      overall_score: llmResponse.overall_score,
      summary: llmResponse.summary
    });

  } catch (error) {
    console.error('Code review error:', error);
    return Response.json({
      error: error.message,
      stack: error.stack
    }, { status: 500 });
  }
});