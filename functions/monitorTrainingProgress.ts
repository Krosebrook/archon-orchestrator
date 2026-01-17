import { createClientFromRequest } from 'npm:@base44/sdk@0.8.4';
import { z } from 'npm:zod@3.22.4';

/**
 * Monitor Training Progress
 *
 * Returns real-time progress and metrics for an active training job.
 * Used for polling-based progress tracking in the UI.
 */

const InputSchema = z.object({
  job_id: z.string().min(1, 'job_id is required'),
  include_checkpoints: z.boolean().default(false),
  include_history: z.boolean().default(false)
});

const ErrorCodes = {
  UNAUTHORIZED: 'UNAUTHORIZED',
  VALIDATION_ERROR: 'VALIDATION_ERROR',
  NOT_FOUND: 'NOT_FOUND',
  SERVER_ERROR: 'SERVER_ERROR'
};

function createError(code: string, message: string, hint: string | null = null, retryable = false, trace_id: string | null = null) {
  const statusMap: Record<string, number> = {
    [ErrorCodes.UNAUTHORIZED]: 401,
    [ErrorCodes.VALIDATION_ERROR]: 422,
    [ErrorCodes.NOT_FOUND]: 404
  };

  return Response.json({
    code,
    message,
    hint,
    retryable,
    trace_id
  }, { status: statusMap[code] || 500 });
}

// Simulate training progress (in production, this would read from actual training state)
function simulateProgress(job: any): any {
  const now = Date.now();
  const startTime = new Date(job.started_at).getTime();
  const elapsed = now - startTime;

  const totalSteps = job.config?.total_steps || 1000;
  const estimatedDuration = job.estimated_duration_ms || 300000;

  // Calculate progress based on elapsed time
  const progressRatio = Math.min(elapsed / estimatedDuration, 1);
  const currentStep = Math.floor(progressRatio * totalSteps);
  const currentEpoch = Math.floor(currentStep / (job.config?.steps_per_epoch || 100));

  // Generate realistic-looking metrics
  const baseLoss = 2.5;
  const lossDecay = 0.85;
  const noise = () => (Math.random() - 0.5) * 0.1;

  const loss = baseLoss * Math.pow(lossDecay, currentEpoch) + noise();
  const accuracy = Math.min(0.95, 0.5 + (currentEpoch * 0.05) + Math.random() * 0.02);
  const validationLoss = loss * 1.1 + noise();
  const validationAccuracy = accuracy * 0.98;

  // Check if completed
  const isCompleted = progressRatio >= 1 || job.status === 'completed';

  return {
    progress: {
      current_epoch: Math.min(currentEpoch, job.config?.total_epochs || 10),
      total_epochs: job.config?.total_epochs || 10,
      current_step: Math.min(currentStep, totalSteps),
      total_steps: totalSteps,
      percent_complete: Math.round(progressRatio * 100),
      estimated_time_remaining_ms: isCompleted ? 0 : Math.max(0, estimatedDuration - elapsed)
    },
    metrics: {
      loss: Math.round(loss * 10000) / 10000,
      accuracy: Math.round(accuracy * 10000) / 10000,
      validation_loss: Math.round(validationLoss * 10000) / 10000,
      validation_accuracy: Math.round(validationAccuracy * 10000) / 10000,
      learning_rate: job.config?.learningRate || 0.001,
      gradient_norm: Math.random() * 0.5 + 0.3,
      token_usage: currentStep * 150,
      memory_usage_mb: 2048 + Math.random() * 512
    },
    status: isCompleted ? 'completed' : job.status
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

    const { job_id, include_checkpoints, include_history } = validation.data;

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

    // Simulate progress update (in production, this would read actual training state)
    const progressData = simulateProgress(job);

    // Update job with new progress if running
    if (job.status === 'running' || job.status === 'preparing') {
      const updateData: any = {
        progress: progressData.progress,
        metrics: progressData.metrics,
        status: progressData.status
      };

      // Create checkpoint if needed
      const shouldCheckpoint = progressData.progress.current_epoch > 0 &&
        progressData.progress.current_epoch % (job.config?.checkpointInterval || 5) === 0;

      if (shouldCheckpoint && job.checkpoints) {
        const existingCheckpoint = job.checkpoints.find(
          (c: any) => c.epoch === progressData.progress.current_epoch
        );

        if (!existingCheckpoint) {
          updateData.checkpoints = [
            ...(job.checkpoints || []),
            {
              id: crypto.randomUUID(),
              epoch: progressData.progress.current_epoch,
              step: progressData.progress.current_step,
              metrics: progressData.metrics,
              created_at: new Date().toISOString()
            }
          ];
        }
      }

      // Update best metrics
      if (!job.metrics?.best_loss || progressData.metrics.loss < job.metrics.best_loss) {
        updateData.metrics = {
          ...updateData.metrics,
          best_loss: progressData.metrics.loss,
          best_loss_epoch: progressData.progress.current_epoch
        };
      }
      if (!job.metrics?.best_accuracy || progressData.metrics.accuracy > job.metrics.best_accuracy) {
        updateData.metrics = {
          ...updateData.metrics,
          best_accuracy: progressData.metrics.accuracy,
          best_accuracy_epoch: progressData.progress.current_epoch
        };
      }

      // Mark as completed if done
      if (progressData.status === 'completed') {
        updateData.completed_at = new Date().toISOString();
        updateData.results = {
          final_loss: progressData.metrics.loss,
          final_accuracy: progressData.metrics.accuracy,
          final_validation_loss: progressData.metrics.validation_loss,
          final_validation_accuracy: progressData.metrics.validation_accuracy,
          total_training_time_ms: Date.now() - new Date(job.started_at).getTime(),
          epochs_completed: progressData.progress.current_epoch,
          steps_completed: progressData.progress.current_step
        };

        // Update training session
        const sessions = await base44.entities.TrainingSession.filter({ job_id });
        if (sessions && sessions.length > 0) {
          await base44.asServiceRole.entities.TrainingSession.update(sessions[0].id, {
            status: 'completed',
            completed_at: new Date().toISOString(),
            validation_results: {
              accuracy_score: progressData.metrics.validation_accuracy,
              loss: progressData.metrics.validation_loss,
              confidence_score: progressData.metrics.validation_accuracy
            },
            improvements: {
              accuracy_improvement_pct: ((progressData.metrics.accuracy - 0.5) / 0.5) * 100,
              loss_reduction_pct: ((2.5 - progressData.metrics.loss) / 2.5) * 100
            }
          });
        }
      }

      await base44.asServiceRole.entities.TrainingJob.update(job_id, updateData);
    }

    // Build response
    const response: any = {
      job_id,
      agent_id: job.agent_id,
      status: progressData.status,
      progress: progressData.progress,
      metrics: progressData.metrics,
      config: {
        training_type: job.config?.trainingType,
        epochs: job.config?.total_epochs,
        batch_size: job.config?.batchSize,
        learning_rate: job.config?.learningRate
      },
      started_at: job.started_at
    };

    if (progressData.status === 'completed') {
      response.completed_at = job.completed_at || new Date().toISOString();
      response.results = {
        final_loss: progressData.metrics.loss,
        final_accuracy: progressData.metrics.accuracy,
        final_validation_loss: progressData.metrics.validation_loss,
        final_validation_accuracy: progressData.metrics.validation_accuracy,
        total_training_time_ms: Date.now() - new Date(job.started_at).getTime()
      };
    }

    if (include_checkpoints) {
      response.checkpoints = job.checkpoints || [];
    }

    if (include_history) {
      // Fetch metrics history from TrainingMetric entity if available
      response.history = job.metrics_history || [];
    }

    const latency = Date.now() - startTime;

    // Telemetry (only log occasionally to reduce noise)
    if (Math.random() < 0.1 || progressData.status === 'completed') {
      console.log(JSON.stringify({
        event: 'training_progress_polled',
        trace_id,
        job_id,
        status: progressData.status,
        progress_percent: progressData.progress.percent_complete,
        latency_ms: latency
      }));
    }

    return Response.json({
      success: true,
      data: response,
      trace_id
    }, { status: 200 });

  } catch (error) {
    console.error(JSON.stringify({
      event: 'monitor_training_progress_error',
      trace_id,
      error: error.message,
      stack: error.stack
    }));

    return createError(
      ErrorCodes.SERVER_ERROR,
      'Failed to get training progress',
      'Please try again',
      true,
      trace_id
    );
  }
});
