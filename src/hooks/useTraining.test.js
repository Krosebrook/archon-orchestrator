import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook, act, waitFor } from '@testing-library/react';
import { useTraining, TRAINING_STATUS, TRAINING_TYPES } from './useTraining';

// Mock base44 client
vi.mock('@/api/base44Client', () => ({
  base44: {
    functions: {
      startTrainingJob: vi.fn(),
      controlTrainingJob: vi.fn(),
      monitorTrainingProgress: vi.fn()
    }
  }
}));

// Mock sonner toast
vi.mock('sonner', () => ({
  toast: {
    success: vi.fn(),
    error: vi.fn(),
    info: vi.fn()
  }
}));

import { base44 } from '@/api/base44Client';
import { toast } from 'sonner';

describe('useTraining Hook', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  describe('Initial State', () => {
    it('should initialize with idle status', () => {
      const { result } = renderHook(() => useTraining());

      expect(result.current.status).toBe(TRAINING_STATUS.IDLE);
      expect(result.current.isActive).toBe(false);
      expect(result.current.agentId).toBeNull();
    });

    it('should initialize with default config', () => {
      const { result } = renderHook(() => useTraining());

      expect(result.current.config).toEqual(expect.objectContaining({
        epochs: 10,
        batchSize: 32,
        learningRate: 0.001,
        validationSplit: 0.2,
        earlyStopping: true
      }));
    });

    it('should accept initial agentId from options', () => {
      const { result } = renderHook(() => useTraining({ agentId: 'test-agent-123' }));

      expect(result.current.agentId).toBe('test-agent-123');
    });
  });

  describe('Configuration', () => {
    it('should update config correctly', () => {
      const { result } = renderHook(() => useTraining());

      act(() => {
        result.current.updateConfig({ epochs: 20, learningRate: 0.0001 });
      });

      expect(result.current.config.epochs).toBe(20);
      expect(result.current.config.learningRate).toBe(0.0001);
      expect(result.current.config.batchSize).toBe(32); // Unchanged
    });

    it('should set agent ID', () => {
      const { result } = renderHook(() => useTraining());

      act(() => {
        result.current.setAgentId('new-agent-id');
      });

      expect(result.current.agentId).toBe('new-agent-id');
    });

    it('should set training data', () => {
      const { result } = renderHook(() => useTraining());
      const trainingData = {
        examples: [{ input: 'test', expected_output: 'output' }]
      };

      act(() => {
        result.current.setTrainingData(trainingData);
      });

      expect(result.current.trainingData).toEqual(trainingData);
    });
  });

  describe('Start Training', () => {
    it('should require agent ID to start training', async () => {
      const { result } = renderHook(() => useTraining());

      let response;
      await act(async () => {
        response = await result.current.startTraining([{ input: 'test', expected_output: 'output' }]);
      });

      expect(response.success).toBe(false);
      expect(toast.error).toHaveBeenCalledWith('Please select an agent first');
    });

    it('should require training data to start training', async () => {
      const { result } = renderHook(() => useTraining({ agentId: 'test-agent' }));

      let response;
      await act(async () => {
        response = await result.current.startTraining();
      });

      expect(response.success).toBe(false);
      expect(toast.error).toHaveBeenCalledWith('No training data provided');
    });

    it('should successfully start training with valid inputs', async () => {
      base44.functions.startTrainingJob.mockResolvedValueOnce({
        data: {
          job_id: 'job-123',
          status: 'preparing'
        }
      });

      const { result } = renderHook(() => useTraining({ agentId: 'test-agent' }));

      const trainingData = {
        examples: [{ input: 'test input', expected_output: 'test output' }]
      };

      let response;
      await act(async () => {
        response = await result.current.startTraining(trainingData);
      });

      expect(response.success).toBe(true);
      expect(result.current.status).toBe(TRAINING_STATUS.RUNNING);
      expect(result.current.currentJob).toBeTruthy();
      expect(toast.success).toHaveBeenCalledWith('Training job started!');
    });

    it('should handle start training error', async () => {
      const error = new Error('API Error');
      base44.functions.startTrainingJob.mockRejectedValueOnce(error);

      const onError = vi.fn();
      const { result } = renderHook(() => useTraining({ agentId: 'test-agent', onError }));

      const trainingData = {
        examples: [{ input: 'test input', expected_output: 'test output' }]
      };

      let response;
      await act(async () => {
        response = await result.current.startTraining(trainingData);
      });

      expect(response.success).toBe(false);
      expect(result.current.status).toBe(TRAINING_STATUS.FAILED);
      expect(onError).toHaveBeenCalledWith(error);
    });
  });

  describe('Training Controls', () => {
    it('should pause training', async () => {
      base44.functions.startTrainingJob.mockResolvedValueOnce({
        data: { job_id: 'job-123' }
      });
      base44.functions.controlTrainingJob.mockResolvedValueOnce({ success: true });

      const { result } = renderHook(() => useTraining({ agentId: 'test-agent' }));

      // Start training first
      await act(async () => {
        await result.current.startTraining({
          examples: [{ input: 'test', expected_output: 'output' }]
        });
      });

      // Pause
      let response;
      await act(async () => {
        response = await result.current.pauseTraining();
      });

      expect(response.success).toBe(true);
      expect(result.current.status).toBe(TRAINING_STATUS.PAUSED);
    });

    it('should resume training', async () => {
      base44.functions.startTrainingJob.mockResolvedValueOnce({
        data: { job_id: 'job-123' }
      });
      base44.functions.controlTrainingJob.mockResolvedValue({ success: true });

      const { result } = renderHook(() => useTraining({ agentId: 'test-agent' }));

      // Start and pause
      await act(async () => {
        await result.current.startTraining({
          examples: [{ input: 'test', expected_output: 'output' }]
        });
        await result.current.pauseTraining();
      });

      // Resume
      await act(async () => {
        await result.current.resumeTraining();
      });

      expect(result.current.status).toBe(TRAINING_STATUS.RUNNING);
    });

    it('should cancel training', async () => {
      base44.functions.startTrainingJob.mockResolvedValueOnce({
        data: { job_id: 'job-123' }
      });
      base44.functions.controlTrainingJob.mockResolvedValueOnce({ success: true });

      const { result } = renderHook(() => useTraining({ agentId: 'test-agent' }));

      // Start training
      await act(async () => {
        await result.current.startTraining({
          examples: [{ input: 'test', expected_output: 'output' }]
        });
      });

      // Cancel
      await act(async () => {
        await result.current.cancelTraining();
      });

      expect(result.current.status).toBe(TRAINING_STATUS.CANCELLED);
    });
  });

  describe('Reset', () => {
    it('should reset all state', async () => {
      base44.functions.startTrainingJob.mockResolvedValueOnce({
        data: { job_id: 'job-123' }
      });

      const { result } = renderHook(() => useTraining({ agentId: 'test-agent' }));

      // Start training
      await act(async () => {
        await result.current.startTraining({
          examples: [{ input: 'test', expected_output: 'output' }]
        });
      });

      // Reset
      act(() => {
        result.current.reset();
      });

      expect(result.current.status).toBe(TRAINING_STATUS.IDLE);
      expect(result.current.currentJob).toBeNull();
      expect(result.current.progress.epoch).toBe(0);
      expect(result.current.results).toBeNull();
    });
  });

  describe('Computed Properties', () => {
    it('should calculate percent complete correctly', async () => {
      const { result } = renderHook(() => useTraining());

      // Initially 0
      expect(result.current.percentComplete).toBe(0);
    });

    it('should determine canStart correctly', () => {
      const { result } = renderHook(() => useTraining());

      // No agent ID
      expect(result.current.canStart).toBe(false);
    });

    it('should determine isActive correctly', () => {
      const { result } = renderHook(() => useTraining());

      expect(result.current.isActive).toBe(false);
    });
  });

  describe('Constants Export', () => {
    it('should export TRAINING_STATUS constants', () => {
      const { result } = renderHook(() => useTraining());

      expect(result.current.TRAINING_STATUS).toEqual(TRAINING_STATUS);
      expect(TRAINING_STATUS.IDLE).toBe('idle');
      expect(TRAINING_STATUS.RUNNING).toBe('running');
      expect(TRAINING_STATUS.COMPLETED).toBe('completed');
    });

    it('should export TRAINING_TYPES constants', () => {
      const { result } = renderHook(() => useTraining());

      expect(result.current.TRAINING_TYPES).toEqual(TRAINING_TYPES);
      expect(TRAINING_TYPES.SUPERVISED).toBe('supervised');
      expect(TRAINING_TYPES.REINFORCEMENT).toBe('reinforcement');
    });
  });
});
