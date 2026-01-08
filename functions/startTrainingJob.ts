import { createClientFromRequest } from 'npm:@base44/sdk@0.8.4';
import { z } from 'npm:zod@3.22.4';

/**
 * Start Training Job
 *
 * Initiates a training job for an AI agent with specified configuration.
 * Supports multiple training paradigms including supervised, reinforcement,
 * transfer learning, and fine-tuning.
 */

const TrainingConfigSchema = z.object({
  epochs: z.number().int().min(1).max(100).default(10),
  batchSize: z.number().int().min(1).max(128).default(32),
  learningRate: z.number().min(0.00001).max(1).default(0.001),
  validationSplit: z.number().min(0).max(0.5).default(0.2),
  earlyStopping: z.boolean().default(true),
  patience: z.number().int().min(1).max(20).default(3),
  checkpointInterval: z.number().int().min(1).max(50).default(5),
  warmupSteps: z.number().int().min(0).max(1000).default(100),
  maxGradNorm: z.number().min(0.1).max(10).default(1.0),
  trainingType: z.enum(['supervised', 'reinforcement', 'transfer', 'few_shot', 'fine_tuning']).default('supervised'),
  optimizer: z.enum(['adam', 'sgd', 'adamw', 'rmsprop']).default('adam'),
  schedulerType: z.enum(['constant', 'linear', 'cosine', 'polynomial']).default('linear'),
  useDataAugmentation: z.boolean().default(false),
  mixedPrecision: z.boolean().default(false)
});

const TrainingDataSchema = z.object({
  examples: z.array(z.object({
    input: z.string(),
    expected_output: z.string().optional(),
    feedback: z.enum(['correct', 'incorrect', 'partial']).optional(),
    weight: z.number().optional(),
    metadata: z.record(z.any()).optional()
  })).min(1).max(10000),
  validationExamples: z.array(z.object({
    input: z.string(),
    expected_output: z.string().optional()
  })).optional(),
  moduleId: z.string().optional()
});

const InputSchema = z.object({
  agent_id: z.string().min(1, 'agent_id is required'),
  training_data: TrainingDataSchema,
  config: TrainingConfigSchema.optional()
});

const ErrorCodes = {
  UNAUTHORIZED: 'UNAUTHORIZED',
  VALIDATION_ERROR: 'VALIDATION_ERROR',
  NOT_FOUND: 'NOT_FOUND',
  CONFLICT: 'CONFLICT',
  QUOTA_EXCEEDED: 'QUOTA_EXCEEDED',
  SERVER_ERROR: 'SERVER_ERROR'
};

function createError(code: string, message: string, hint: string | null = null, retryable = false, trace_id: string | null = null) {
  const statusMap: Record<string, number> = {
    [ErrorCodes.UNAUTHORIZED]: 401,
    [ErrorCodes.VALIDATION_ERROR]: 422,
    [ErrorCodes.NOT_FOUND]: 404,
    [ErrorCodes.CONFLICT]: 409,
    [ErrorCodes.QUOTA_EXCEEDED]: 429
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
  const job_id = crypto.randomUUID();
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

    const { agent_id, training_data, config: userConfig } = validation.data;
    const config = { ...TrainingConfigSchema.parse({}), ...userConfig };

    // Fetch and validate agent
    const agents = await base44.entities.Agent.filter({ id: agent_id });
    if (!agents || agents.length === 0) {
      return createError(
        ErrorCodes.NOT_FOUND,
        'Agent not found',
        'Verify the agent_id and ensure you have access',
        false,
        trace_id
      );
    }
    const agent = agents[0];

    // Check for existing active training jobs
    const activeJobs = await base44.entities.TrainingJob.filter({
      agent_id,
      status: 'running'
    });

    if (activeJobs && activeJobs.length > 0) {
      return createError(
        ErrorCodes.CONFLICT,
        'Agent already has an active training job',
        'Cancel or wait for the existing job to complete',
        false,
        trace_id
      );
    }

    // Calculate training estimates
    const totalSamples = training_data.examples.length;
    const validationSamples = training_data.validationExamples?.length ||
      Math.floor(totalSamples * config.validationSplit);
    const trainingSamples = totalSamples - validationSamples;
    const stepsPerEpoch = Math.ceil(trainingSamples / config.batchSize);
    const totalSteps = stepsPerEpoch * config.epochs;
    const estimatedDurationMs = totalSteps * 500; // Rough estimate: 500ms per step

    // Prepare training data for storage
    const preparedData = {
      training_examples: training_data.examples.slice(0, Math.floor(totalSamples * (1 - config.validationSplit))),
      validation_examples: training_data.validationExamples ||
        training_data.examples.slice(Math.floor(totalSamples * (1 - config.validationSplit))),
      total_samples: totalSamples,
      training_samples: trainingSamples,
      validation_samples: validationSamples,
      prepared_at: new Date().toISOString()
    };

    // Create training job record
    const trainingJob = await base44.asServiceRole.entities.TrainingJob.create({
      id: job_id,
      agent_id,
      status: 'preparing',
      config: {
        ...config,
        total_epochs: config.epochs,
        total_steps: totalSteps,
        steps_per_epoch: stepsPerEpoch
      },
      training_data: preparedData,
      progress: {
        current_epoch: 0,
        current_step: 0,
        total_epochs: config.epochs,
        total_steps: totalSteps,
        percent_complete: 0
      },
      metrics: {
        loss: null,
        accuracy: null,
        validation_loss: null,
        validation_accuracy: null,
        best_loss: null,
        best_accuracy: null
      },
      checkpoints: [],
      started_at: new Date().toISOString(),
      estimated_duration_ms: estimatedDurationMs,
      org_id: user.organization.id,
      created_by: user.id
    });

    // Create training session for analytics
    await base44.asServiceRole.entities.TrainingSession.create({
      agent_id,
      module_id: training_data.moduleId || null,
      training_type: config.trainingType,
      status: 'started',
      started_at: new Date().toISOString(),
      config,
      training_samples: trainingSamples,
      job_id,
      org_id: user.organization.id
    });

    // Initialize training execution (simulated async start)
    // In production, this would queue a background job
    setTimeout(async () => {
      try {
        await base44.asServiceRole.entities.TrainingJob.update(job_id, {
          status: 'running',
          progress: {
            current_epoch: 0,
            current_step: 0,
            total_epochs: config.epochs,
            total_steps: totalSteps,
            percent_complete: 0
          }
        });
      } catch (err) {
        console.error('Failed to update job status:', err);
      }
    }, 1000);

    // Audit log
    await base44.asServiceRole.entities.Audit.create({
      entity_type: 'training_job',
      entity_id: job_id,
      action: 'training_started',
      metadata: {
        agent_id,
        agent_name: agent.name,
        training_type: config.trainingType,
        total_samples: totalSamples,
        epochs: config.epochs,
        estimated_duration_ms: estimatedDurationMs,
        trace_id
      },
      org_id: user.organization.id
    });

    const latency = Date.now() - startTime;

    // Telemetry
    console.log(JSON.stringify({
      event: 'training_job_started',
      trace_id,
      job_id,
      agent_id,
      training_type: config.trainingType,
      total_samples: totalSamples,
      epochs: config.epochs,
      total_steps: totalSteps,
      estimated_duration_ms: estimatedDurationMs,
      latency_ms: latency,
      org_id: user.organization.id
    }));

    return Response.json({
      success: true,
      data: {
        job_id,
        agent_id,
        status: 'preparing',
        config: {
          training_type: config.trainingType,
          epochs: config.epochs,
          batch_size: config.batchSize,
          learning_rate: config.learningRate
        },
        progress: {
          current_epoch: 0,
          total_epochs: config.epochs,
          current_step: 0,
          total_steps: totalSteps,
          percent_complete: 0
        },
        estimates: {
          total_samples: totalSamples,
          training_samples: trainingSamples,
          validation_samples: validationSamples,
          steps_per_epoch: stepsPerEpoch,
          total_steps: totalSteps,
          estimated_duration_ms: estimatedDurationMs
        },
        started_at: trainingJob.started_at
      },
      trace_id
    }, { status: 201 });

  } catch (error) {
    console.error(JSON.stringify({
      event: 'start_training_job_error',
      trace_id,
      job_id,
      error: error.message,
      stack: error.stack
    }));

    return createError(
      ErrorCodes.SERVER_ERROR,
      'Failed to start training job',
      'Please try again or contact support if the issue persists',
      true,
      trace_id
    );
  }
});
