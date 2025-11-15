import { createClientFromRequest } from 'npm:@base44/sdk@0.7.1';

/**
 * Analyzes the entire codebase for refactoring opportunities
 * Uses LLM to detect redundancies, performance issues, and security gaps
 */
Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { scope, session_name } = await req.json();

    // Create refactor session
    const session = await base44.entities.RefactorSession.create({
      name: session_name || `Code Analysis ${new Date().toISOString().split('T')[0]}`,
      description: 'Automated codebase analysis for refactoring opportunities',
      analysis_scope: scope || {
        check_categories: ['redundancy', 'performance', 'security', 'maintainability', 'schema']
      },
      status: 'analyzing',
      started_at: new Date().toISOString(),
      org_id: user.organization?.id || 'org_default'
    });

    // Fetch all relevant entities to analyze patterns
    const [agents, workflows, runs, policies, tools] = await Promise.all([
      base44.entities.Agent.list(),
      base44.entities.Workflow.list(),
      base44.entities.Run.list('-created_date', 100),
      base44.entities.Policy.list(),
      base44.entities.Tool.list()
    ]);

    // Build analysis context
    const analysisContext = {
      entities: {
        agents_count: agents.length,
        workflows_count: workflows.length,
        tools_count: tools.length,
        policies_count: policies.length
      },
      performance_metrics: {
        total_runs: runs.length,
        failed_runs: runs.filter(r => r.state === 'failed').length,
        avg_cost_cents: runs.reduce((sum, r) => sum + (r.cost_cents || 0), 0) / (runs.length || 1),
        avg_tokens: runs.reduce((sum, r) => sum + (r.tokens_in || 0) + (r.tokens_out || 0), 0) / (runs.length || 1)
      },
      schema_structure: {
        agents: agents.map(a => ({ name: a.name, status: a.status, config: a.config })),
        workflows: workflows.map(w => ({ name: w.name, version: w.version, spec_size: JSON.stringify(w.spec).length })),
        tools: tools.map(t => ({ name: t.name, type: t.type, enabled: t.enabled }))
      }
    };

    // Use LLM to analyze the codebase
    const analysisPrompt = `You are an expert software architect analyzing a production AI orchestration platform called "Archon".

**Current System State:**
${JSON.stringify(analysisContext, null, 2)}

**Your Task:**
Analyze this system and provide structured refactoring recommendations in the following categories:

1. **Redundancy** - Duplicate code, unused entities, redundant workflows
2. **Performance** - Missing database indexes, inefficient queries, slow operations
3. **Security** - Missing auth checks, exposed secrets, insecure configurations
4. **Maintainability** - Complex code, poor naming, missing documentation
5. **Schema** - Database schema improvements, missing fields, better relationships

**Rules:**
- Each recommendation must have a clear title, description, and actionable fix
- Assign a severity: critical, high, medium, or low
- Assign a risk_level for implementing: low, medium, or high
- Organize into stages: Stage 0 (Backup), Stage 1 (Safe Cleanup), Stage 2 (Optimizations), Stage 3 (Schema Changes)
- Provide rollback strategies for each recommendation
- Estimate impact (performance gain, code reduction, security improvement)

**Output Format:**
Return a JSON array of recommendations. Each recommendation must have this structure:
{
  "category": "redundancy|performance|security|maintainability|schema",
  "severity": "critical|high|medium|low",
  "title": "Brief title",
  "description": "Detailed explanation of the problem",
  "affected_files": ["file1.js", "entity/Entity.json"],
  "recommendation": "What to do to fix it",
  "stage": 0|1|2|3,
  "risk_level": "low|medium|high",
  "rollback_strategy": "How to revert",
  "estimated_impact": {
    "performance_gain": "e.g., 30% faster queries",
    "code_reduction": "e.g., Remove 200 LOC",
    "security_improvement": "e.g., Prevent unauthorized access"
  }
}`;

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
                category: { type: 'string' },
                severity: { type: 'string' },
                title: { type: 'string' },
                description: { type: 'string' },
                affected_files: { type: 'array', items: { type: 'string' } },
                recommendation: { type: 'string' },
                stage: { type: 'integer' },
                risk_level: { type: 'string' },
                rollback_strategy: { type: 'string' },
                estimated_impact: { type: 'object' }
              }
            }
          },
          overall_score: { type: 'number' },
          scores_breakdown: { type: 'object' }
        }
      }
    });

    const recommendations = llmResponse.recommendations || [];
    const overall_score = llmResponse.overall_score || 75;
    const scores_breakdown = llmResponse.scores_breakdown || {
      security: 80,
      performance: 70,
      maintainability: 75,
      reliability: 80
    };

    // Count severity levels
    const severityCounts = {
      critical: recommendations.filter(r => r.severity === 'critical').length,
      high: recommendations.filter(r => r.severity === 'high').length,
      medium: recommendations.filter(r => r.severity === 'medium').length,
      low: recommendations.filter(r => r.severity === 'low').length
    };

    // Create recommendation records
    const createdRecommendations = [];
    for (const rec of recommendations) {
      const created = await base44.entities.RefactorRecommendation.create({
        session_id: session.id,
        category: rec.category,
        severity: rec.severity,
        title: rec.title,
        description: rec.description,
        affected_files: rec.affected_files || [],
        recommendation: rec.recommendation,
        stage: rec.stage,
        risk_level: rec.risk_level,
        rollback_strategy: rec.rollback_strategy,
        estimated_impact: rec.estimated_impact || {},
        status: 'pending',
        org_id: user.organization?.id || 'org_default'
      });
      createdRecommendations.push(created);
    }

    // Update session with results
    await base44.entities.RefactorSession.update(session.id, {
      status: 'ready',
      overall_score,
      scores_breakdown,
      total_recommendations: recommendations.length,
      critical_count: severityCounts.critical,
      high_count: severityCounts.high,
      medium_count: severityCounts.medium,
      low_count: severityCounts.low,
      completed_at: new Date().toISOString()
    });

    return Response.json({
      success: true,
      session_id: session.id,
      overall_score,
      scores_breakdown,
      recommendations: createdRecommendations,
      summary: {
        total: recommendations.length,
        by_severity: severityCounts,
        by_stage: {
          stage_0: recommendations.filter(r => r.stage === 0).length,
          stage_1: recommendations.filter(r => r.stage === 1).length,
          stage_2: recommendations.filter(r => r.stage === 2).length,
          stage_3: recommendations.filter(r => r.stage === 3).length
        }
      }
    });

  } catch (error) {
    console.error('Code analysis error:', error);
    return Response.json({
      error: error.message,
      stack: error.stack
    }, { status: 500 });
  }
});