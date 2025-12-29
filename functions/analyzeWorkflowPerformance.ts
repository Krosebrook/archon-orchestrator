import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

/**
 * AI-Powered Workflow Performance Analyzer
 * Analyzes workflow execution patterns and generates actionable insights
 */
Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    
    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { workflow_id, lookback_days = 7 } = await req.json();

    // Fetch recent runs
    const runs = await base44.asServiceRole.entities.Run.filter({
      workflow_id,
      org_id: user.organization.id,
    });

    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - lookback_days);
    
    const recentRuns = runs
      .filter(r => new Date(r.created_date) >= cutoffDate)
      .sort((a, b) => new Date(b.created_date) - new Date(a.created_date));

    if (recentRuns.length < 10) {
      return Response.json({
        success: true,
        message: 'Insufficient data for analysis',
        insights: [],
      });
    }

    const insights = [];

    // Performance Analysis
    const durations = recentRuns.map(r => r.duration_ms || 0);
    const avgDuration = durations.reduce((a, b) => a + b, 0) / durations.length;
    const p95Duration = calculatePercentile(durations, 95);
    const stdDev = calculateStdDev(durations);

    // Detect performance degradation
    const recentAvg = durations.slice(0, Math.floor(durations.length / 3))
      .reduce((a, b) => a + b, 0) / Math.floor(durations.length / 3);
    const historicalAvg = durations.slice(Math.floor(durations.length / 3))
      .reduce((a, b) => a + b, 0) / (durations.length - Math.floor(durations.length / 3));

    if (recentAvg > historicalAvg * 1.3) {
      insights.push({
        insight_type: 'performance',
        severity: recentAvg > historicalAvg * 1.5 ? 'high' : 'medium',
        title: 'Performance Degradation Detected',
        description: `Workflow execution time has increased by ${((recentAvg / historicalAvg - 1) * 100).toFixed(1)}% compared to historical baseline.`,
        metrics: {
          baseline_value: historicalAvg,
          current_value: recentAvg,
          deviation_percentage: ((recentAvg / historicalAvg - 1) * 100),
          confidence_score: 0.85,
        },
        recommendation: {
          action: 'Investigate recent changes, check API dependencies, optimize slow nodes',
          expected_improvement: `${((recentAvg - historicalAvg) / recentAvg * 100).toFixed(0)}% faster execution`,
          implementation_effort: 'medium',
        },
      });
    }

    // Error Rate Analysis
    const errorRuns = recentRuns.filter(r => r.status === 'failed').length;
    const errorRate = errorRuns / recentRuns.length;

    if (errorRate > 0.1) {
      insights.push({
        insight_type: 'reliability',
        severity: errorRate > 0.2 ? 'critical' : 'high',
        title: 'High Error Rate Detected',
        description: `${(errorRate * 100).toFixed(1)}% of recent runs have failed. This is significantly above acceptable thresholds.`,
        metrics: {
          baseline_value: 0.05,
          current_value: errorRate,
          deviation_percentage: ((errorRate / 0.05 - 1) * 100),
          confidence_score: 0.95,
        },
        recommendation: {
          action: 'Review error logs, add retry logic, implement circuit breakers',
          expected_improvement: 'Reduce error rate to < 5%',
          implementation_effort: 'high',
        },
      });
    }

    // Cost Optimization
    const costs = recentRuns.map(r => r.cost_cents || 0);
    const totalCost = costs.reduce((a, b) => a + b, 0);
    const avgCost = totalCost / costs.length;

    if (avgCost > 100) {
      insights.push({
        insight_type: 'cost',
        severity: 'medium',
        title: 'Cost Optimization Opportunity',
        description: `Average run cost is ${(avgCost / 100).toFixed(2)}. Consider model optimization or caching.`,
        metrics: {
          current_value: avgCost,
          confidence_score: 0.8,
        },
        recommendation: {
          action: 'Switch to smaller models where appropriate, implement response caching',
          expected_improvement: '30-50% cost reduction',
          implementation_effort: 'low',
          estimated_savings_cents: Math.floor(totalCost * 0.4),
        },
      });
    }

    // Pattern Detection - Automation Candidates
    const executionPatterns = detectPatterns(recentRuns);
    if (executionPatterns.repetitive) {
      insights.push({
        insight_type: 'automation',
        severity: 'info',
        title: 'Automation Opportunity Detected',
        description: `Workflow shows ${executionPatterns.repeatCount} similar execution patterns. Consider scheduling or triggering automatically.`,
        automation_candidate: true,
        automation_config: {
          suggested_trigger: executionPatterns.suggestedTrigger,
          frequency: executionPatterns.frequency,
        },
        recommendation: {
          action: 'Set up automated trigger based on schedule or event',
          expected_improvement: 'Reduce manual overhead',
          implementation_effort: 'low',
        },
      });
    }

    // Save insights
    for (const insight of insights) {
      await base44.asServiceRole.entities.AIInsight.create({
        workflow_id,
        ...insight,
        org_id: user.organization.id,
      });
    }

    return Response.json({
      success: true,
      insights,
      summary: {
        total_runs: recentRuns.length,
        avg_duration_ms: avgDuration,
        p95_duration_ms: p95Duration,
        error_rate: errorRate,
        total_cost_cents: totalCost,
        insights_generated: insights.length,
      },
    });

  } catch (error) {
    console.error('Performance analysis error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});

function calculatePercentile(arr, p) {
  const sorted = [...arr].sort((a, b) => a - b);
  const index = Math.ceil((p / 100) * sorted.length) - 1;
  return sorted[index];
}

function calculateStdDev(arr) {
  const mean = arr.reduce((a, b) => a + b, 0) / arr.length;
  const squareDiffs = arr.map(v => Math.pow(v - mean, 2));
  const avgSquareDiff = squareDiffs.reduce((a, b) => a + b, 0) / arr.length;
  return Math.sqrt(avgSquareDiff);
}

function detectPatterns(runs) {
  // Simple pattern detection - check for similar time intervals
  if (runs.length < 5) return { repetitive: false };

  const intervals = [];
  for (let i = 0; i < runs.length - 1; i++) {
    const interval = new Date(runs[i].created_date) - new Date(runs[i + 1].created_date);
    intervals.push(interval);
  }

  const avgInterval = intervals.reduce((a, b) => a + b, 0) / intervals.length;
  const stdDev = calculateStdDev(intervals);

  // If standard deviation is low relative to mean, it's repetitive
  const isRepetitive = (stdDev / avgInterval) < 0.3 && intervals.length >= 5;

  if (isRepetitive) {
    const frequencyHours = avgInterval / (1000 * 60 * 60);
    return {
      repetitive: true,
      repeatCount: intervals.length,
      frequency: `every ${frequencyHours.toFixed(1)} hours`,
      suggestedTrigger: frequencyHours < 2 ? 'schedule_hourly' : 'schedule_daily',
    };
  }

  return { repetitive: false };
}