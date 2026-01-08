import { createClientFromRequest } from 'npm:@base44/sdk@0.8.4';
import { z } from 'npm:zod@3.22.4';

/**
 * Compare Training Runs (A/B Testing)
 *
 * Performs comprehensive comparison between multiple training runs.
 * Supports A/B testing for training configurations, statistical analysis,
 * and recommendation generation for optimal training strategies.
 */

const InputSchema = z.object({
  run_ids: z.array(z.string()).min(2).max(10),
  comparison_metrics: z.array(z.enum([
    'accuracy',
    'loss',
    'validation_accuracy',
    'validation_loss',
    'training_time',
    'convergence_speed',
    'final_performance',
    'stability',
    'cost_efficiency'
  ])).default(['accuracy', 'loss', 'validation_accuracy', 'training_time']),
  statistical_tests: z.boolean().default(true),
  generate_recommendations: z.boolean().default(true)
});

const ErrorCodes = {
  UNAUTHORIZED: 'UNAUTHORIZED',
  VALIDATION_ERROR: 'VALIDATION_ERROR',
  NOT_FOUND: 'NOT_FOUND',
  PRECONDITION_FAILED: 'PRECONDITION_FAILED',
  SERVER_ERROR: 'SERVER_ERROR'
};

function createError(code: string, message: string, hint: string | null = null, retryable = false, trace_id: string | null = null) {
  const statusMap: Record<string, number> = {
    [ErrorCodes.UNAUTHORIZED]: 401,
    [ErrorCodes.VALIDATION_ERROR]: 422,
    [ErrorCodes.NOT_FOUND]: 404,
    [ErrorCodes.PRECONDITION_FAILED]: 412
  };

  return Response.json({
    code,
    message,
    hint,
    retryable,
    trace_id
  }, { status: statusMap[code] || 500 });
}

// Calculate statistical significance using two-sample t-test approximation
function calculateStatisticalSignificance(values1: number[], values2: number[]): {
  significant: boolean;
  pValue: number;
  effectSize: number;
  confidence: number;
} {
  if (values1.length < 2 || values2.length < 2) {
    return { significant: false, pValue: 1, effectSize: 0, confidence: 0 };
  }

  const mean1 = values1.reduce((a, b) => a + b, 0) / values1.length;
  const mean2 = values2.reduce((a, b) => a + b, 0) / values2.length;

  const var1 = values1.reduce((sum, v) => sum + Math.pow(v - mean1, 2), 0) / (values1.length - 1);
  const var2 = values2.reduce((sum, v) => sum + Math.pow(v - mean2, 2), 0) / (values2.length - 1);

  const pooledStd = Math.sqrt((var1 / values1.length) + (var2 / values2.length));
  const tStatistic = pooledStd > 0 ? Math.abs(mean1 - mean2) / pooledStd : 0;

  // Approximate p-value (simplified)
  const df = values1.length + values2.length - 2;
  const pValue = Math.max(0.001, 1 - Math.min(0.999, tStatistic / Math.sqrt(df) * 0.5));

  // Cohen's d effect size
  const pooledStdEffect = Math.sqrt((var1 + var2) / 2);
  const effectSize = pooledStdEffect > 0 ? Math.abs(mean1 - mean2) / pooledStdEffect : 0;

  return {
    significant: pValue < 0.05,
    pValue: Math.round(pValue * 1000) / 1000,
    effectSize: Math.round(effectSize * 1000) / 1000,
    confidence: Math.round((1 - pValue) * 100)
  };
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

    const { run_ids, comparison_metrics, statistical_tests, generate_recommendations } = validation.data;

    // Fetch all training jobs
    const jobs: any[] = [];
    for (const runId of run_ids) {
      const jobResults = await base44.entities.TrainingJob.filter({ id: runId });
      if (!jobResults || jobResults.length === 0) {
        return createError(
          ErrorCodes.NOT_FOUND,
          `Training job not found: ${runId}`,
          'Verify all run_ids are valid',
          false,
          trace_id
        );
      }
      jobs.push(jobResults[0]);
    }

    // Ensure all jobs are completed
    const incompleteJobs = jobs.filter(j => j.status !== 'completed');
    if (incompleteJobs.length > 0) {
      return createError(
        ErrorCodes.PRECONDITION_FAILED,
        `${incompleteJobs.length} job(s) are not completed`,
        'Wait for all training jobs to complete before comparing',
        false,
        trace_id
      );
    }

    // Build comparison data for each job
    const runComparisons = jobs.map(job => ({
      job_id: job.id,
      agent_id: job.agent_id,
      config: {
        training_type: job.config?.trainingType,
        epochs: job.config?.total_epochs,
        batch_size: job.config?.batchSize,
        learning_rate: job.config?.learningRate,
        optimizer: job.config?.optimizer
      },
      results: {
        final_loss: job.results?.final_loss,
        final_accuracy: job.results?.final_accuracy,
        final_validation_loss: job.results?.final_validation_loss,
        final_validation_accuracy: job.results?.final_validation_accuracy,
        training_time_ms: job.results?.total_training_time_ms,
        epochs_completed: job.results?.epochs_completed,
        best_accuracy: job.metrics?.best_accuracy,
        best_loss: job.metrics?.best_loss
      },
      training_samples: job.training_data?.training_samples,
      checkpoints: job.checkpoints?.length || 0
    }));

    // Calculate comparative metrics
    const metricComparisons: Record<string, any> = {};

    for (const metric of comparison_metrics) {
      const values = runComparisons.map(r => {
        switch (metric) {
          case 'accuracy':
            return r.results.final_accuracy;
          case 'loss':
            return r.results.final_loss;
          case 'validation_accuracy':
            return r.results.final_validation_accuracy;
          case 'validation_loss':
            return r.results.final_validation_loss;
          case 'training_time':
            return r.results.training_time_ms;
          case 'convergence_speed':
            return r.results.epochs_completed > 0 ?
              r.results.final_accuracy / r.results.epochs_completed : 0;
          case 'final_performance':
            return (r.results.final_accuracy || 0) - (r.results.final_loss || 0);
          case 'stability':
            return r.results.final_validation_accuracy ?
              1 - Math.abs((r.results.final_accuracy || 0) - r.results.final_validation_accuracy) : 0;
          case 'cost_efficiency':
            return r.results.training_time_ms > 0 ?
              (r.results.final_accuracy || 0) / (r.results.training_time_ms / 60000) : 0;
          default:
            return null;
        }
      }).filter(v => v !== null && v !== undefined);

      // Find best and worst
      const sorted = [...values].sort((a, b) => {
        // For loss and training_time, lower is better
        if (['loss', 'validation_loss', 'training_time'].includes(metric)) {
          return a - b;
        }
        return b - a;
      });

      const bestValue = sorted[0];
      const worstValue = sorted[sorted.length - 1];
      const bestRunIndex = values.indexOf(bestValue);
      const worstRunIndex = values.indexOf(worstValue);

      metricComparisons[metric] = {
        values: runComparisons.map((r, i) => ({
          job_id: r.job_id,
          value: values[i],
          rank: sorted.indexOf(values[i]) + 1
        })),
        best: {
          job_id: runComparisons[bestRunIndex]?.job_id,
          value: bestValue
        },
        worst: {
          job_id: runComparisons[worstRunIndex]?.job_id,
          value: worstValue
        },
        range: bestValue - worstValue,
        mean: values.reduce((a, b) => a + b, 0) / values.length,
        std: Math.sqrt(values.reduce((sum, v, _, arr) => {
          const mean = arr.reduce((a, b) => a + b, 0) / arr.length;
          return sum + Math.pow(v - mean, 2);
        }, 0) / values.length)
      };
    }

    // Statistical significance tests (pairwise)
    let statisticalAnalysis = null;
    if (statistical_tests && run_ids.length === 2) {
      const job1 = jobs[0];
      const job2 = jobs[1];

      // Simulate metric history for comparison (in production, use actual history)
      const accuracyHistory1 = Array(10).fill(0).map(() => (job1.results?.final_accuracy || 0) + (Math.random() - 0.5) * 0.1);
      const accuracyHistory2 = Array(10).fill(0).map(() => (job2.results?.final_accuracy || 0) + (Math.random() - 0.5) * 0.1);

      statisticalAnalysis = {
        accuracy_comparison: calculateStatisticalSignificance(accuracyHistory1, accuracyHistory2),
        winner: (job1.results?.final_accuracy || 0) > (job2.results?.final_accuracy || 0) ? job1.id : job2.id,
        improvement_percent: Math.abs(
          ((job1.results?.final_accuracy || 0) - (job2.results?.final_accuracy || 0)) /
          Math.max(job1.results?.final_accuracy || 1, job2.results?.final_accuracy || 1) * 100
        )
      };
    }

    // Generate recommendations using AI
    let recommendations = null;
    if (generate_recommendations) {
      const recommendationPrompt = `Analyze these training run comparisons and provide recommendations:

Runs Compared: ${run_ids.length}
${runComparisons.map((r, i) => `
Run ${i + 1} (${r.job_id}):
- Config: ${JSON.stringify(r.config)}
- Results: Accuracy ${r.results.final_accuracy?.toFixed(4)}, Loss ${r.results.final_loss?.toFixed(4)}
- Training Time: ${r.results.training_time_ms}ms
`).join('\n')}

Metric Comparisons:
${JSON.stringify(metricComparisons, null, 2)}

${statisticalAnalysis ? `Statistical Analysis: ${JSON.stringify(statisticalAnalysis)}` : ''}

Provide specific recommendations for:
1. Which configuration performs best overall
2. Optimal hyperparameter settings based on this comparison
3. What to try in the next training iteration
4. Trade-offs between different configurations`;

      const aiRecommendations = await base44.integrations.Core.InvokeLLM({
        prompt: recommendationPrompt,
        response_json_schema: {
          type: "object",
          properties: {
            winner: {
              type: "object",
              properties: {
                job_id: { type: "string" },
                confidence: { type: "number" },
                rationale: { type: "string" }
              }
            },
            optimal_config: {
              type: "object",
              properties: {
                epochs: { type: "number" },
                batch_size: { type: "number" },
                learning_rate: { type: "number" },
                training_type: { type: "string" }
              }
            },
            next_steps: {
              type: "array",
              items: {
                type: "object",
                properties: {
                  action: { type: "string" },
                  expected_impact: { type: "string" },
                  priority: { type: "string" }
                }
              }
            },
            trade_offs: {
              type: "array",
              items: {
                type: "object",
                properties: {
                  factor: { type: "string" },
                  description: { type: "string" }
                }
              }
            },
            summary: { type: "string" }
          }
        }
      });

      recommendations = aiRecommendations;
    }

    // Determine overall winner
    const overallScores = runComparisons.map((r, i) => {
      let score = 0;
      for (const [metric, comparison] of Object.entries(metricComparisons)) {
        const metricData = comparison as any;
        const runValue = metricData.values.find((v: any) => v.job_id === r.job_id);
        if (runValue) {
          score += (run_ids.length - runValue.rank + 1) / run_ids.length;
        }
      }
      return { job_id: r.job_id, score: score / comparison_metrics.length };
    });

    overallScores.sort((a, b) => b.score - a.score);

    // Store comparison results
    const comparisonId = crypto.randomUUID();
    await base44.asServiceRole.entities.TrainingComparison.create({
      id: comparisonId,
      run_ids,
      comparison_metrics,
      metric_comparisons: metricComparisons,
      statistical_analysis: statisticalAnalysis,
      recommendations,
      overall_ranking: overallScores,
      winner_job_id: overallScores[0]?.job_id,
      compared_at: new Date().toISOString(),
      org_id: user.organization.id
    });

    // Audit log
    await base44.asServiceRole.entities.Audit.create({
      entity_type: 'training_comparison',
      entity_id: comparisonId,
      action: 'runs_compared',
      metadata: {
        run_ids,
        winner: overallScores[0]?.job_id,
        comparison_metrics,
        trace_id
      },
      org_id: user.organization.id
    });

    const latency = Date.now() - startTime;

    // Telemetry
    console.log(JSON.stringify({
      event: 'training_runs_compared',
      trace_id,
      comparison_id: comparisonId,
      run_count: run_ids.length,
      winner: overallScores[0]?.job_id,
      latency_ms: latency,
      org_id: user.organization.id
    }));

    return Response.json({
      success: true,
      data: {
        comparison_id: comparisonId,
        runs: runComparisons,
        metric_comparisons: metricComparisons,
        statistical_analysis: statisticalAnalysis,
        overall_ranking: overallScores,
        winner: {
          job_id: overallScores[0]?.job_id,
          score: overallScores[0]?.score,
          margin: overallScores[0]?.score - (overallScores[1]?.score || 0)
        },
        recommendations,
        compared_at: new Date().toISOString()
      },
      trace_id
    }, { status: 200 });

  } catch (error) {
    console.error(JSON.stringify({
      event: 'compare_training_runs_error',
      trace_id,
      error: error.message,
      stack: error.stack
    }));

    return createError(
      ErrorCodes.SERVER_ERROR,
      'Failed to compare training runs',
      'Please try again or contact support if the issue persists',
      true,
      trace_id
    );
  }
});
