import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

/**
 * AI-Powered Anomaly Detection
 * Uses statistical methods and pattern matching to detect workflow anomalies
 */
Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    
    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { workflow_id, run_id } = await req.json();

    // Fetch the current run
    const [currentRun] = await base44.asServiceRole.entities.Run.filter({
      id: run_id,
      org_id: user.organization.id,
    });

    if (!currentRun) {
      return Response.json({ error: 'Run not found' }, { status: 404 });
    }

    // Fetch historical runs for baseline
    const historicalRuns = await base44.asServiceRole.entities.Run.filter({
      workflow_id,
      org_id: user.organization.id,
    });

    const completedRuns = historicalRuns
      .filter(r => r.status === 'completed' && r.id !== run_id)
      .slice(0, 100);

    if (completedRuns.length < 20) {
      return Response.json({
        success: true,
        message: 'Insufficient baseline data',
        anomalies: [],
      });
    }

    const anomalies = [];

    // Calculate baselines
    const durations = completedRuns.map(r => r.duration_ms || 0);
    const costs = completedRuns.map(r => r.cost_cents || 0);
    
    const baseline = {
      avg_duration_ms: mean(durations),
      std_duration_ms: stdDev(durations),
      avg_cost_cents: mean(costs),
      std_cost_cents: stdDev(costs),
      sample_size: completedRuns.length,
    };

    // Latency Anomaly Detection (using Z-score)
    const durationZScore = (currentRun.duration_ms - baseline.avg_duration_ms) / baseline.std_duration_ms;
    
    if (Math.abs(durationZScore) > 3) {
      const severity = Math.abs(durationZScore) > 4 ? 0.9 : 0.7;
      
      anomalies.push({
        workflow_id,
        run_id,
        anomaly_type: 'latency_spike',
        detected_at: new Date().toISOString(),
        severity_score: severity,
        baseline_metrics: {
          avg_duration_ms: baseline.avg_duration_ms,
          sample_size: baseline.sample_size,
        },
        anomaly_metrics: {
          duration_ms: currentRun.duration_ms,
          deviation_std: durationZScore,
        },
        root_cause_analysis: {
          probable_causes: [
            'API dependency slowdown',
            'Increased data volume',
            'Resource contention',
            'Network latency',
          ],
          confidence: 0.75,
          evidence: [
            { type: 'statistical', value: `${durationZScore.toFixed(2)} standard deviations` },
          ],
        },
        impact_assessment: {
          sla_breach: currentRun.duration_ms > baseline.avg_duration_ms * 2,
          cost_impact_cents: currentRun.cost_cents || 0,
        },
        auto_remediation: {
          available: true,
          action: 'Trigger retry with exponential backoff',
          executed: false,
        },
      });
    }

    // Cost Anomaly Detection
    const costZScore = (currentRun.cost_cents - baseline.avg_cost_cents) / baseline.std_cost_cents;
    
    if (costZScore > 3) {
      anomalies.push({
        workflow_id,
        run_id,
        anomaly_type: 'cost_spike',
        detected_at: new Date().toISOString(),
        severity_score: Math.min(costZScore / 5, 1),
        baseline_metrics: {
          avg_cost_cents: baseline.avg_cost_cents,
          sample_size: baseline.sample_size,
        },
        anomaly_metrics: {
          cost_cents: currentRun.cost_cents,
          deviation_std: costZScore,
        },
        root_cause_analysis: {
          probable_causes: [
            'Excessive token usage',
            'Multiple retry attempts',
            'Model upgrade',
            'Increased complexity',
          ],
          confidence: 0.8,
          evidence: [
            { type: 'cost_spike', value: `${((currentRun.cost_cents / baseline.avg_cost_cents - 1) * 100).toFixed(0)}% increase` },
          ],
        },
        impact_assessment: {
          cost_impact_cents: currentRun.cost_cents - baseline.avg_cost_cents,
        },
        auto_remediation: {
          available: false,
          action: 'Review workflow configuration',
        },
      });
    }

    // Error Pattern Detection
    if (currentRun.status === 'failed') {
      const recentErrors = historicalRuns
        .filter(r => r.status === 'failed')
        .slice(0, 10);

      if (recentErrors.length >= 3) {
        anomalies.push({
          workflow_id,
          run_id,
          anomaly_type: 'error_rate',
          detected_at: new Date().toISOString(),
          severity_score: Math.min(recentErrors.length / 10, 1),
          baseline_metrics: {
            avg_error_rate: recentErrors.length / historicalRuns.length,
          },
          anomaly_metrics: {
            error_rate: recentErrors.length / 10,
          },
          root_cause_analysis: {
            probable_causes: [
              'API authentication failure',
              'Rate limiting',
              'Invalid input data',
              'Service outage',
            ],
            confidence: 0.85,
            evidence: [
              { type: 'error_cluster', value: `${recentErrors.length} failures in recent window` },
            ],
          },
          impact_assessment: {
            affected_users: Math.floor(recentErrors.length * 1.5),
          },
          auto_remediation: {
            available: true,
            action: 'Enable circuit breaker, pause workflow',
            executed: false,
          },
        });
      }
    }

    // Save anomalies
    for (const anomaly of anomalies) {
      await base44.asServiceRole.entities.WorkflowAnomaly.create({
        ...anomaly,
        org_id: user.organization.id,
      });
    }

    // Create alert if critical
    if (anomalies.some(a => a.severity_score > 0.8)) {
      await base44.asServiceRole.entities.Alert.create({
        alert_type: 'anomaly_detected',
        severity: 'high',
        title: 'Critical Workflow Anomaly Detected',
        description: `Anomaly detected in workflow execution. Immediate attention required.`,
        metadata: {
          workflow_id,
          run_id,
          anomaly_count: anomalies.length,
        },
        status: 'active',
        org_id: user.organization.id,
      });
    }

    return Response.json({
      success: true,
      anomalies,
      summary: {
        total_anomalies: anomalies.length,
        max_severity: Math.max(...anomalies.map(a => a.severity_score), 0),
        baseline_metrics: baseline,
      },
    });

  } catch (error) {
    console.error('Anomaly detection error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});

function mean(arr) {
  return arr.reduce((a, b) => a + b, 0) / arr.length;
}

function stdDev(arr) {
  const avg = mean(arr);
  const squareDiffs = arr.map(v => Math.pow(v - avg, 2));
  return Math.sqrt(mean(squareDiffs));
}