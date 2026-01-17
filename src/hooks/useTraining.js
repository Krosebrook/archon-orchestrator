import { useState, useCallback, useEffect, useRef } from 'react';
import { base44 } from '@/api/base44Client';
import { toast } from 'sonner';

/**
 * Training Job Status Constants
 */
export const TRAINING_STATUS = {
  IDLE: 'idle',
  PREPARING: 'preparing',
  RUNNING: 'running',
  PAUSED: 'paused',
  COMPLETED: 'completed',
  FAILED: 'failed',
  CANCELLED: 'cancelled'
};

/**
 * Training Types
 */
export const TRAINING_TYPES = {
  SUPERVISED: 'supervised',
  REINFORCEMENT: 'reinforcement',
  TRANSFER: 'transfer',
  FEW_SHOT: 'few_shot',
  FINE_TUNING: 'fine_tuning'
};

/**
 * Default training configuration
 */
const DEFAULT_CONFIG = {
  epochs: 10,
  batchSize: 32,
  learningRate: 0.001,
  validationSplit: 0.2,
  earlyStopping: true,
  patience: 3,
  checkpointInterval: 5,
  warmupSteps: 100,
  maxGradNorm: 1.0
};

/**
 * Custom hook for managing AI agent training jobs
 * Handles training lifecycle, progress monitoring, and results
 *
 * @param {Object} options - Configuration options
 * @param {string} options.agentId - Agent ID to train
 * @param {Function} options.onComplete - Callback when training completes
 * @param {Function} options.onError - Callback on training error
 * @param {number} options.pollInterval - Progress polling interval (ms)
 * @returns {Object} Training state and control functions
 */
export function useTraining(options = {}) {
  const {
    agentId: initialAgentId = null,
    onComplete,
    onError,
    pollInterval = 2000
  } = options;

  // Core state
  const [agentId, setAgentId] = useState(initialAgentId);
  const [status, setStatus] = useState(TRAINING_STATUS.IDLE);
  const [config, setConfig] = useState(DEFAULT_CONFIG);
  const [trainingData, setTrainingData] = useState(null);
  const [currentJob, setCurrentJob] = useState(null);

  // Progress state
  const [progress, setProgress] = useState({
    epoch: 0,
    totalEpochs: 0,
    step: 0,
    totalSteps: 0,
    loss: null,
    accuracy: null,
    validationLoss: null,
    validationAccuracy: null,
    estimatedTimeRemaining: null,
    startedAt: null,
    elapsedTime: 0
  });

  // Results state
  const [results, setResults] = useState(null);
  const [checkpoints, setCheckpoints] = useState([]);
  const [history, setHistory] = useState([]);

  // Error handling
  const [error, setError] = useState(null);
  const [isLoading, setIsLoading] = useState(false);

  // Refs for cleanup
  const pollIntervalRef = useRef(null);
  const abortControllerRef = useRef(null);

  /**
   * Clear polling interval
   */
  const clearPolling = useCallback(() => {
    if (pollIntervalRef.current) {
      clearInterval(pollIntervalRef.current);
      pollIntervalRef.current = null;
    }
  }, []);

  /**
   * Cleanup on unmount
   */
  useEffect(() => {
    return () => {
      clearPolling();
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
    };
  }, [clearPolling]);

  /**
   * Update training configuration
   */
  const updateConfig = useCallback((updates) => {
    setConfig(prev => ({ ...prev, ...updates }));
  }, []);

  /**
   * Reset training state
   */
  const reset = useCallback(() => {
    clearPolling();
    setStatus(TRAINING_STATUS.IDLE);
    setProgress({
      epoch: 0,
      totalEpochs: 0,
      step: 0,
      totalSteps: 0,
      loss: null,
      accuracy: null,
      validationLoss: null,
      validationAccuracy: null,
      estimatedTimeRemaining: null,
      startedAt: null,
      elapsedTime: 0
    });
    setResults(null);
    setCurrentJob(null);
    setError(null);
  }, [clearPolling]);

  /**
   * Poll for training progress
   */
  const pollProgress = useCallback(async (jobId) => {
    try {
      const response = await base44.functions.monitorTrainingProgress({ job_id: jobId });
      const data = response.data;

      if (data.status === 'completed') {
        clearPolling();
        setStatus(TRAINING_STATUS.COMPLETED);
        setResults(data.results);
        setProgress(prev => ({
          ...prev,
          epoch: data.progress.current_epoch,
          totalEpochs: data.progress.total_epochs,
          step: data.progress.current_step,
          totalSteps: data.progress.total_steps,
          elapsedTime: Date.now() - (prev.startedAt || Date.now())
        }));
        onComplete?.(data.results);
        toast.success('Training completed successfully!');
      } else if (data.status === 'failed') {
        clearPolling();
        setStatus(TRAINING_STATUS.FAILED);
        setError(data.error);
        onError?.(data.error);
        toast.error(`Training failed: ${data.error?.message || 'Unknown error'}`);
      } else if (data.status === 'running') {
        setProgress(prev => ({
          ...prev,
          epoch: data.progress.current_epoch,
          totalEpochs: data.progress.total_epochs,
          step: data.progress.current_step,
          totalSteps: data.progress.total_steps,
          loss: data.metrics?.loss,
          accuracy: data.metrics?.accuracy,
          validationLoss: data.metrics?.validation_loss,
          validationAccuracy: data.metrics?.validation_accuracy,
          estimatedTimeRemaining: data.progress.estimated_time_remaining_ms,
          elapsedTime: Date.now() - (prev.startedAt || Date.now())
        }));

        // Update history
        if (data.metrics) {
          setHistory(prev => [...prev, {
            epoch: data.progress.current_epoch,
            step: data.progress.current_step,
            ...data.metrics,
            timestamp: Date.now()
          }]);
        }

        // Update checkpoints
        if (data.checkpoints) {
          setCheckpoints(data.checkpoints);
        }
      }
    } catch (err) {
      console.error('Failed to poll training progress:', err);
      // Don't clear polling on transient errors
      if (err.response?.status >= 500) {
        // Server error, keep polling
      } else {
        clearPolling();
        setError(err);
        onError?.(err);
      }
    }
  }, [clearPolling, onComplete, onError]);

  /**
   * Start a training job
   */
  const startTraining = useCallback(async (data = null, customConfig = null) => {
    if (!agentId) {
      toast.error('Please select an agent first');
      return { success: false, error: 'No agent selected' };
    }

    const trainingDataToUse = data || trainingData;
    if (!trainingDataToUse) {
      toast.error('No training data provided');
      return { success: false, error: 'No training data' };
    }

    setIsLoading(true);
    setError(null);
    setStatus(TRAINING_STATUS.PREPARING);
    abortControllerRef.current = new AbortController();

    try {
      const finalConfig = { ...config, ...customConfig };

      const response = await base44.functions.startTrainingJob({
        agent_id: agentId,
        training_data: trainingDataToUse,
        config: finalConfig
      });

      const job = response.data;
      setCurrentJob(job);
      setStatus(TRAINING_STATUS.RUNNING);
      setProgress(prev => ({
        ...prev,
        totalEpochs: finalConfig.epochs,
        startedAt: Date.now()
      }));

      // Start polling for progress
      pollIntervalRef.current = setInterval(() => {
        pollProgress(job.job_id);
      }, pollInterval);

      toast.success('Training job started!');
      return { success: true, job };

    } catch (err) {
      console.error('Failed to start training:', err);
      setStatus(TRAINING_STATUS.FAILED);
      setError(err);
      onError?.(err);
      toast.error(`Failed to start training: ${err.message}`);
      return { success: false, error: err };
    } finally {
      setIsLoading(false);
    }
  }, [agentId, trainingData, config, pollInterval, pollProgress, onError]);

  /**
   * Pause training job
   */
  const pauseTraining = useCallback(async () => {
    if (!currentJob?.job_id) {
      toast.error('No active training job');
      return { success: false };
    }

    try {
      await base44.functions.controlTrainingJob({
        job_id: currentJob.job_id,
        action: 'pause'
      });

      clearPolling();
      setStatus(TRAINING_STATUS.PAUSED);
      toast.info('Training paused');
      return { success: true };
    } catch (err) {
      console.error('Failed to pause training:', err);
      toast.error('Failed to pause training');
      return { success: false, error: err };
    }
  }, [currentJob, clearPolling]);

  /**
   * Resume training job
   */
  const resumeTraining = useCallback(async () => {
    if (!currentJob?.job_id) {
      toast.error('No paused training job');
      return { success: false };
    }

    try {
      await base44.functions.controlTrainingJob({
        job_id: currentJob.job_id,
        action: 'resume'
      });

      setStatus(TRAINING_STATUS.RUNNING);

      // Resume polling
      pollIntervalRef.current = setInterval(() => {
        pollProgress(currentJob.job_id);
      }, pollInterval);

      toast.success('Training resumed');
      return { success: true };
    } catch (err) {
      console.error('Failed to resume training:', err);
      toast.error('Failed to resume training');
      return { success: false, error: err };
    }
  }, [currentJob, pollInterval, pollProgress]);

  /**
   * Cancel training job
   */
  const cancelTraining = useCallback(async () => {
    if (!currentJob?.job_id) {
      toast.error('No active training job');
      return { success: false };
    }

    try {
      await base44.functions.controlTrainingJob({
        job_id: currentJob.job_id,
        action: 'cancel'
      });

      clearPolling();
      setStatus(TRAINING_STATUS.CANCELLED);
      toast.info('Training cancelled');
      return { success: true };
    } catch (err) {
      console.error('Failed to cancel training:', err);
      toast.error('Failed to cancel training');
      return { success: false, error: err };
    }
  }, [currentJob, clearPolling]);

  /**
   * Load checkpoint and resume from it
   */
  const loadCheckpoint = useCallback(async (checkpointId) => {
    if (!currentJob?.job_id) {
      return { success: false, error: 'No training job' };
    }

    try {
      await base44.functions.controlTrainingJob({
        job_id: currentJob.job_id,
        action: 'load_checkpoint',
        checkpoint_id: checkpointId
      });

      toast.success('Checkpoint loaded');
      return { success: true };
    } catch (err) {
      console.error('Failed to load checkpoint:', err);
      toast.error('Failed to load checkpoint');
      return { success: false, error: err };
    }
  }, [currentJob]);

  /**
   * Get percentage complete
   */
  const percentComplete = status === TRAINING_STATUS.COMPLETED
    ? 100
    : progress.totalSteps > 0
      ? Math.round((progress.step / progress.totalSteps) * 100)
      : progress.totalEpochs > 0
        ? Math.round((progress.epoch / progress.totalEpochs) * 100)
        : 0;

  /**
   * Check if training is active
   */
  const isActive = [TRAINING_STATUS.PREPARING, TRAINING_STATUS.RUNNING].includes(status);

  /**
   * Check if can start training
   */
  const canStart = status === TRAINING_STATUS.IDLE && agentId && !isLoading;

  return {
    // State
    agentId,
    status,
    config,
    trainingData,
    currentJob,
    progress,
    results,
    checkpoints,
    history,
    error,
    isLoading,

    // Computed
    percentComplete,
    isActive,
    canStart,

    // Actions
    setAgentId,
    setTrainingData,
    updateConfig,
    startTraining,
    pauseTraining,
    resumeTraining,
    cancelTraining,
    loadCheckpoint,
    reset,

    // Constants
    TRAINING_STATUS,
    TRAINING_TYPES,
    DEFAULT_CONFIG
  };
}

export default useTraining;
