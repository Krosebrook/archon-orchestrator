import { createClientFromRequest } from 'npm:@base44/sdk@0.8.4';

/**
 * Simulates policy impact on historical recommendations
 */
Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { policy_rules, lookback_days = 30 } = await req.json();

    if (!policy_rules) {
      return Response.json({ error: 'policy_rules required' }, { status: 400 });
    }

    // Fetch historical recommendations
    const recommendations = await base44.entities.RefactorRecommendation.list('-created_date', 200);

    // Simulate policy application
    let wouldAutoApply = 0;
    let wouldRequireApproval = 0;
    let wouldBlock = 0;
    let impactedCategories = {};
    let impactedSeverities = {};
    const matchedRecommendations = [];

    recommendations.forEach(rec => {
      let action = 'none';
      let reason = '';

      // Check severity auto-apply rule
      const severityLevels = ['low', 'medium', 'high', 'critical'];
      const maxAutoApplyLevel = severityLevels.indexOf(policy_rules.max_severity_auto_apply || 'low');
      const recSeverityLevel = severityLevels.indexOf(rec.severity);

      // Check blacklist patterns
      const matchesBlacklist = policy_rules.blacklist_patterns?.some(pattern => 
        rec.affected_files?.some(file => file.includes(pattern))
      );

      if (matchesBlacklist) {
        action = 'block';
        reason = 'Matched blacklist pattern';
        wouldBlock++;
      } else if (policy_rules.require_approval_for?.includes(rec.category)) {
        action = 'require_approval';
        reason = 'Category requires approval';
        wouldRequireApproval++;
      } else if (recSeverityLevel <= maxAutoApplyLevel) {
        action = 'auto_apply';
        reason = `Severity ${rec.severity} within auto-apply threshold`;
        wouldAutoApply++;
      } else {
        action = 'require_approval';
        reason = 'Severity exceeds auto-apply threshold';
        wouldRequireApproval++;
      }

      impactedCategories[rec.category] = (impactedCategories[rec.category] || 0) + 1;
      impactedSeverities[rec.severity] = (impactedSeverities[rec.severity] || 0) + 1;

      if (action !== 'none') {
        matchedRecommendations.push({
          id: rec.id,
          title: rec.title,
          category: rec.category,
          severity: rec.severity,
          action,
          reason
        });
      }
    });

    // Calculate impact metrics
    const totalImpacted = wouldAutoApply + wouldRequireApproval + wouldBlock;
    const impactPercentage = recommendations.length > 0 
      ? ((totalImpacted / recommendations.length) * 100).toFixed(1)
      : 0;

    // Estimate time savings
    const avgReviewTimeMinutes = 15;
    const estimatedTimeSaved = wouldAutoApply * avgReviewTimeMinutes;

    // Calculate risk score
    const criticalAutoApplied = matchedRecommendations.filter(
      r => r.action === 'auto_apply' && r.severity === 'critical'
    ).length;
    const riskScore = Math.min(100, (criticalAutoApplied / Math.max(1, wouldAutoApply)) * 100);

    return Response.json({
      success: true,
      simulation: {
        total_recommendations: recommendations.length,
        total_impacted: totalImpacted,
        impact_percentage: parseFloat(impactPercentage),
        breakdown: {
          would_auto_apply: wouldAutoApply,
          would_require_approval: wouldRequireApproval,
          would_block: wouldBlock
        },
        by_category: impactedCategories,
        by_severity: impactedSeverities,
        estimated_time_saved_minutes: estimatedTimeSaved,
        risk_score: Math.round(riskScore),
        sample_matches: matchedRecommendations.slice(0, 10)
      }
    });

  } catch (error) {
    console.error('Policy simulation error:', error);
    return Response.json({
      error: error.message,
      stack: error.stack
    }, { status: 500 });
  }
});