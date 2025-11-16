import { createClientFromRequest } from 'npm:@base44/sdk@0.8.4';

/**
 * AI-driven refactor policy generation based on historical sessions
 */
Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Fetch recent refactor sessions and recommendations
    const [sessions, recommendations] = await Promise.all([
      base44.entities.RefactorSession.list('-created_date', 20),
      base44.entities.RefactorRecommendation.list('-created_date', 100)
    ]);

    if (sessions.length === 0) {
      return Response.json({
        success: false,
        error: 'Insufficient data for policy generation'
      }, { status: 400 });
    }

    // Analyze patterns
    const categoryStats = {};
    const severityStats = {};
    let totalApplied = 0;
    let totalFailed = 0;

    recommendations.forEach(rec => {
      categoryStats[rec.category] = (categoryStats[rec.category] || 0) + 1;
      severityStats[rec.severity] = (severityStats[rec.severity] || 0) + 1;
      if (rec.status === 'completed') totalApplied++;
      if (rec.status === 'failed') totalFailed++;
    });

    const mostCommonCategory = Object.entries(categoryStats)
      .sort(([,a], [,b]) => b - a)[0]?.[0];
    
    const mostCommonSeverity = Object.entries(severityStats)
      .sort(([,a], [,b]) => b - a)[0]?.[0];

    // Construct AI prompt
    const prompt = `You are a refactoring policy expert analyzing code quality patterns.

**Historical Data:**
- Total Sessions: ${sessions.length}
- Total Recommendations: ${recommendations.length}
- Applied Successfully: ${totalApplied}
- Failed Applications: ${totalFailed}
- Success Rate: ${((totalApplied / recommendations.length) * 100).toFixed(1)}%

**Category Distribution:**
${Object.entries(categoryStats).map(([cat, count]) => `- ${cat}: ${count} (${((count/recommendations.length)*100).toFixed(1)}%)`).join('\n')}

**Severity Distribution:**
${Object.entries(severityStats).map(([sev, count]) => `- ${sev}: ${count} (${((count/recommendations.length)*100).toFixed(1)}%)`).join('\n')}

**Most Common Issue:** ${mostCommonCategory}
**Most Common Severity:** ${mostCommonSeverity}

**Recent Recommendations Sample:**
${recommendations.slice(0, 5).map(r => `- [${r.severity}] ${r.category}: ${r.title}`).join('\n')}

**Your Task:**
Based on this data, generate 3-5 intelligent refactoring policies that would:
1. Prevent the most common issues
2. Automate safe refactorings
3. Require human review for risky changes
4. Balance automation with safety

**Output Format:**
{
  "suggested_policies": [
    {
      "name": "string",
      "description": "string",
      "scope": "global|workflow|agent|session",
      "rules": {
        "max_severity_auto_apply": "low|medium|high|critical",
        "require_approval_for": ["category1", "category2"],
        "blacklist_patterns": ["pattern1"],
        "mandatory_tests": true|false,
        "coverage_threshold": 0-100
      },
      "enforcement": "strict|advisory",
      "rationale": "why this policy is recommended based on the data"
    }
  ],
  "insights": "string - key insights from the analysis"
}`;

    const aiResponse = await base44.integrations.Core.InvokeLLM({
      prompt,
      response_json_schema: {
        type: 'object',
        properties: {
          suggested_policies: {
            type: 'array',
            items: {
              type: 'object',
              properties: {
                name: { type: 'string' },
                description: { type: 'string' },
                scope: { type: 'string' },
                rules: { type: 'object' },
                enforcement: { type: 'string' },
                rationale: { type: 'string' }
              }
            }
          },
          insights: { type: 'string' }
        }
      }
    });

    return Response.json({
      success: true,
      suggested_policies: aiResponse.suggested_policies,
      insights: aiResponse.insights,
      analysis: {
        sessions_analyzed: sessions.length,
        recommendations_analyzed: recommendations.length,
        category_stats: categoryStats,
        severity_stats: severityStats
      }
    });

  } catch (error) {
    console.error('Policy generation error:', error);
    return Response.json({
      error: error.message,
      stack: error.stack
    }, { status: 500 });
  }
});