import { createClientFromRequest } from 'npm:@base44/sdk@0.8.4';
import { z } from 'npm:zod@3.22.4';

/**
 * Evaluate Training Results
 *
 * Performs comprehensive evaluation of a completed training job.
 * Generates detailed performance analysis, quality scores, and recommendations.
 */

const InputSchema = z.object({
  job_id: z.string().min(1, 'job_id is required'),
  test_data: z.array(z.object({
    input: z.string(),
    expected_output: z.string()
  })).optional(),
  evaluation_criteria: z.array(z.enum([
    'accuracy',
    'precision',
    'recall',
    'f1_score',
    'latency',
    'consistency',
    'safety',
    'relevance'
  ])).default(['accuracy', 'precision', 'recall', 'f1_score']),
  benchmark_against: z.string().optional() // Another job_id to compare against
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

    const { job_id, test_data, evaluation_criteria, benchmark_against } = validation.data;

    // Fetch training job
    const jobs = await base44.entities.TrainingJob.filter({ id: job_id });
    if (!jobs || jobs.length === 0) {
      return createError(
        ErrorCodes.NOT_FOUND,
        'Training job not found',
        'Verify the job_id',
        false,
        trace_id
      );
    }
    const job = jobs[0];

    if (job.status !== 'completed') {
      return createError(
        ErrorCodes.PRECONDITION_FAILED,
        'Training job is not completed',
        'Wait for the training job to complete before evaluating',
        false,
        trace_id
      );
    }

    // Fetch agent
    const agents = await base44.entities.Agent.filter({ id: job.agent_id });
    const agent = agents?.[0];

    // Use AI to evaluate training results
    const evaluationPrompt = `Analyze the following training results and provide a comprehensive evaluation:

Training Job Summary:
- Agent: ${agent?.name || 'Unknown'}
- Training Type: ${job.config?.trainingType}
- Epochs Completed: ${job.results?.epochs_completed || job.config?.total_epochs}
- Training Duration: ${job.results?.total_training_time_ms}ms
- Final Loss: ${job.results?.final_loss}
- Final Accuracy: ${job.results?.final_accuracy}
- Validation Loss: ${job.results?.final_validation_loss}
- Validation Accuracy: ${job.results?.final_validation_accuracy}

Training Configuration:
${JSON.stringify(job.config, null, 2)}

Metrics History (if available):
${JSON.stringify(job.metrics_history?.slice(-10) || [], null, 2)}

Evaluate based on these criteria: ${evaluation_criteria.join(', ')}

${test_data ? `Test Data (${test_data.length} samples) provided for evaluation.` : ''}

Provide:
1. Overall quality score (0-100)
2. Individual metric scores
3. Strengths identified
4. Weaknesses/areas for improvement
5. Specific recommendations for next training iteration
6. Overfitting/underfitting analysis
7. Convergence analysis`;

    const evaluation = await base44.integrations.Core.InvokeLLM({
      prompt: evaluationPrompt,
      response_json_schema: {
        type: "object",
        properties: {
          overall_score: { type: "number", minimum: 0, maximum: 100 },
          quality_grade: { type: "string", enum: ["A", "B", "C", "D", "F"] },
          metric_scores: {
            type: "object",
            properties: {
              accuracy: { type: "number" },
              precision: { type: "number" },
              recall: { type: "number" },
              f1_score: { type: "number" },
              consistency: { type: "number" },
              latency: { type: "number" }
            }
          },
          strengths: {
            type: "array",
            items: { type: "string" }
          },
          weaknesses: {
            type: "array",
            items: { type: "string" }
          },
          recommendations: {
            type: "array",
            items: {
              type: "object",
              properties: {
                priority: { type: "string", enum: ["high", "medium", "low"] },
                category: { type: "string" },
                recommendation: { type: "string" },
                expected_impact: { type: "string" }
              }
            }
          },
          analysis: {
            type: "object",
            properties: {
              convergence_status: { type: "string", enum: ["converged", "converging", "not_converged", "diverging"] },
              overfitting_risk: { type: "string", enum: ["none", "low", "moderate", "high"] },
              underfitting_risk: { type: "string", enum: ["none", "low", "moderate", "high"] },
              training_efficiency: { type: "number" },
              data_quality_indicator: { type: "number" }
            }
          },
          summary: { type: "string" }
        }
      }
    });

    // Fetch benchmark job if specified
    let benchmarkComparison = null;
    if (benchmark_against) {
      const benchmarkJobs = await base44.entities.TrainingJob.filter({ id: benchmark_against });
      if (benchmarkJobs && benchmarkJobs.length > 0) {
        const benchmarkJob = benchmarkJobs[0];
        benchmarkComparison = {
          baseline_job_id: benchmark_against,
          baseline_accuracy: benchmarkJob.results?.final_accuracy,
          baseline_loss: benchmarkJob.results?.final_loss,
          accuracy_improvement: ((job.results?.final_accuracy || 0) - (benchmarkJob.results?.final_accuracy || 0)) * 100,
          loss_reduction: ((benchmarkJob.results?.final_loss || 1) - (job.results?.final_loss || 1)) / (benchmarkJob.results?.final_loss || 1) * 100,
          training_time_change: ((job.results?.total_training_time_ms || 0) - (benchmarkJob.results?.total_training_time_ms || 0)) / (benchmarkJob.results?.total_training_time_ms || 1) * 100
        };
      }
    }

    // Calculate additional metrics
    const trainingEfficiency = {
      samples_per_second: (job.training_data?.training_samples || 0) / ((job.results?.total_training_time_ms || 1) / 1000),
      epochs_to_best: job.metrics?.best_accuracy_epoch || job.config?.total_epochs,
      early_stopping_triggered: job.results?.epochs_completed < job.config?.total_epochs,
      checkpoint_count: job.checkpoints?.length || 0
    };

    // Store evaluation results
    await base44.asServiceRole.entities.TrainingEvaluation.create({
      job_id,
      agent_id: job.agent_id,
      evaluation_criteria,
      overall_score: evaluation.overall_score,
      quality_grade: evaluation.quality_grade,
      metric_scores: evaluation.metric_scores,
      analysis: evaluation.analysis,
      recommendations: evaluation.recommendations,
      benchmark_comparison: benchmarkComparison,
      training_efficiency: trainingEfficiency,
      evaluated_at: new Date().toISOString(),
      org_id: user.organization.id
    });

    // Audit log
    await base44.asServiceRole.entities.Audit.create({
      entity_type: 'training_job',
      entity_id: job_id,
      action: 'training_evaluated',
      metadata: {
        overall_score: evaluation.overall_score,
        quality_grade: evaluation.quality_grade,
        recommendations_count: evaluation.recommendations?.length,
        trace_id
      },
      org_id: user.organization.id
    });

    const latency = Date.now() - startTime;

    // Telemetry
    console.log(JSON.stringify({
      event: 'training_evaluated',
      trace_id,
      job_id,
      agent_id: job.agent_id,
      overall_score: evaluation.overall_score,
      quality_grade: evaluation.quality_grade,
      latency_ms: latency,
      org_id: user.organization.id
    }));

    return Response.json({
      success: true,
      data: {
        job_id,
        agent_id: job.agent_id,
        evaluation: {
          overall_score: evaluation.overall_score,
          quality_grade: evaluation.quality_grade,
          metric_scores: evaluation.metric_scores,
          summary: evaluation.summary
        },
        analysis: evaluation.analysis,
        strengths: evaluation.strengths,
        weaknesses: evaluation.weaknesses,
        recommendations: evaluation.recommendations,
        benchmark_comparison: benchmarkComparison,
        training_efficiency: trainingEfficiency,
        training_results: {
          final_loss: job.results?.final_loss,
          final_accuracy: job.results?.final_accuracy,
          final_validation_loss: job.results?.final_validation_loss,
          final_validation_accuracy: job.results?.final_validation_accuracy,
          training_time_ms: job.results?.total_training_time_ms,
          epochs_completed: job.results?.epochs_completed
        },
        evaluated_at: new Date().toISOString()
      },
      trace_id
    }, { status: 200 });

  } catch (error) {
    console.error(JSON.stringify({
      event: 'evaluate_training_results_error',
      trace_id,
      error: error.message,
      stack: error.stack
    }));

    return createError(
      ErrorCodes.SERVER_ERROR,
      'Failed to evaluate training results',
      'Please try again or contact support if the issue persists',
      true,
      trace_id
    );
  }
});
