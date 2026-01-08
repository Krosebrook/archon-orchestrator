import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useTrainingMetrics, METRIC_TYPES, AGGREGATION_METHODS } from './useTrainingMetrics';

// Mock base44 client
vi.mock('@/api/base44Client', () => ({
  base44: {
    functions: {
      compareTrainingRuns: vi.fn()
    },
    entities: {
      TrainingSession: {
        filter: vi.fn()
      }
    }
  }
}));

import { base44 } from '@/api/base44Client';

describe('useTrainingMetrics Hook', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Initial State', () => {
    it('should initialize with empty metrics history', () => {
      const { result } = renderHook(() => useTrainingMetrics());

      expect(result.current.metricsHistory).toEqual([]);
      expect(result.current.validationMetrics).toEqual([]);
    });

    it('should initialize with null baseline', () => {
      const { result } = renderHook(() => useTrainingMetrics());

      expect(result.current.baselineMetrics).toBeNull();
    });

    it('should have initial performance score of 0', () => {
      const { result } = renderHook(() => useTrainingMetrics());

      expect(result.current.performanceScore).toBe(0);
    });
  });

  describe('Adding Metrics', () => {
    it('should add metric to history', () => {
      const { result } = renderHook(() => useTrainingMetrics());

      act(() => {
        result.current.addMetric({
          epoch: 1,
          step: 100,
          loss: 0.5,
          accuracy: 0.8
        });
      });

      expect(result.current.metricsHistory).toHaveLength(1);
      expect(result.current.metricsHistory[0].loss).toBe(0.5);
      expect(result.current.metricsHistory[0].accuracy).toBe(0.8);
      expect(result.current.metricsHistory[0].timestamp).toBeDefined();
    });

    it('should add validation metric', () => {
      const { result } = renderHook(() => useTrainingMetrics());

      act(() => {
        result.current.addValidationMetric({
          accuracy: 0.85,
          loss: 0.4
        });
      });

      expect(result.current.validationMetrics).toHaveLength(1);
      expect(result.current.validationMetrics[0].accuracy).toBe(0.85);
    });

    it('should clear all metrics', () => {
      const { result } = renderHook(() => useTrainingMetrics());

      act(() => {
        result.current.addMetric({ loss: 0.5 });
        result.current.addValidationMetric({ accuracy: 0.8 });
      });

      expect(result.current.metricsHistory).toHaveLength(1);
      expect(result.current.validationMetrics).toHaveLength(1);

      act(() => {
        result.current.clearMetrics();
      });

      expect(result.current.metricsHistory).toHaveLength(0);
      expect(result.current.validationMetrics).toHaveLength(0);
    });
  });

  describe('Statistical Calculations', () => {
    it('should calculate rolling stats correctly', () => {
      const { result } = renderHook(() => useTrainingMetrics());

      // Add multiple metrics
      act(() => {
        for (let i = 0; i < 10; i++) {
          result.current.addMetric({
            epoch: i,
            loss: 1.0 - i * 0.1,
            accuracy: 0.5 + i * 0.05
          });
        }
      });

      const stats = result.current.calculateRollingStats('loss');

      expect(stats.count).toBe(10);
      expect(stats.min).toBe(0.09999999999999998); // ~0.1
      expect(stats.max).toBe(1.0);
      expect(stats.mean).toBeCloseTo(0.55, 1);
      expect(stats.std).toBeDefined();
      expect(stats.trend).toBeDefined();
    });

    it('should return null stats for empty data', () => {
      const { result } = renderHook(() => useTrainingMetrics());

      const stats = result.current.calculateRollingStats('loss');

      expect(stats.mean).toBeNull();
      expect(stats.count).toBe(0);
    });

    it('should get latest metric value', () => {
      const { result } = renderHook(() => useTrainingMetrics());

      act(() => {
        result.current.addMetric({ loss: 0.5 });
        result.current.addMetric({ loss: 0.4 });
        result.current.addMetric({ loss: 0.3 });
      });

      const latestLoss = result.current.getLatestMetric('loss');
      expect(latestLoss).toBe(0.3);
    });

    it('should return null for missing metric', () => {
      const { result } = renderHook(() => useTrainingMetrics());

      const value = result.current.getLatestMetric('nonexistent');
      expect(value).toBeNull();
    });
  });

  describe('Metric Series', () => {
    it('should get metric series for charting', () => {
      const { result } = renderHook(() => useTrainingMetrics());

      act(() => {
        for (let i = 0; i < 5; i++) {
          result.current.addMetric({
            epoch: i,
            step: i * 10,
            loss: 1.0 - i * 0.2
          });
        }
      });

      const series = result.current.getMetricSeries('loss');

      expect(series).toHaveLength(5);
      expect(series[0].y).toBe(1.0);
      expect(series[4].y).toBeCloseTo(0.2, 1);
    });

    it('should limit series to maxPoints', () => {
      const { result } = renderHook(() => useTrainingMetrics());

      act(() => {
        for (let i = 0; i < 200; i++) {
          result.current.addMetric({ loss: i * 0.01 });
        }
      });

      const series = result.current.getMetricSeries('loss', 50);
      expect(series.length).toBeLessThanOrEqual(50);
    });
  });

  describe('Baseline Comparison', () => {
    it('should set baseline metrics', () => {
      const { result } = renderHook(() => useTrainingMetrics());

      const baseline = { accuracy: 0.7, loss: 0.6 };
      act(() => {
        result.current.setBaseline(baseline);
      });

      expect(result.current.baselineMetrics).toEqual(baseline);
    });

    it('should calculate improvement over baseline', () => {
      const { result } = renderHook(() => useTrainingMetrics());

      act(() => {
        result.current.setBaseline({ accuracy: 0.7 });
        result.current.addMetric({ accuracy: 0.85 });
      });

      const improvement = result.current.calculateImprovement('accuracy', true);

      expect(improvement.absolute).toBeCloseTo(0.15, 2);
      expect(improvement.improved).toBe(true);
    });

    it('should return null when no baseline', () => {
      const { result } = renderHook(() => useTrainingMetrics());

      const improvement = result.current.calculateImprovement('accuracy');
      expect(improvement).toBeNull();
    });
  });

  describe('Threshold Checks', () => {
    it('should check if metric meets threshold (gte)', () => {
      const { result } = renderHook(() => useTrainingMetrics());

      act(() => {
        result.current.addMetric({ accuracy: 0.85 });
      });

      expect(result.current.meetsThreshold('accuracy', 0.8, 'gte')).toBe(true);
      expect(result.current.meetsThreshold('accuracy', 0.9, 'gte')).toBe(false);
    });

    it('should check if metric meets threshold (lt)', () => {
      const { result } = renderHook(() => useTrainingMetrics());

      act(() => {
        result.current.addMetric({ loss: 0.3 });
      });

      expect(result.current.meetsThreshold('loss', 0.5, 'lt')).toBe(true);
      expect(result.current.meetsThreshold('loss', 0.2, 'lt')).toBe(false);
    });
  });

  describe('Convergence Detection', () => {
    it('should detect convergence with low variance', () => {
      const { result } = renderHook(() => useTrainingMetrics());

      // Add metrics with very small variance
      act(() => {
        for (let i = 0; i < 15; i++) {
          result.current.addMetric({ loss: 0.1 + Math.random() * 0.001 });
        }
      });

      const convergence = result.current.detectConvergence('loss', 0.01, 10);

      expect(convergence.window).toBe(10);
      expect(convergence.standardDeviation).toBeDefined();
    });

    it('should return insufficient data for small history', () => {
      const { result } = renderHook(() => useTrainingMetrics());

      act(() => {
        result.current.addMetric({ loss: 0.5 });
      });

      const convergence = result.current.detectConvergence('loss', 0.001, 10);
      expect(convergence.converged).toBe(false);
      expect(convergence.reason).toBe('insufficient_data');
    });
  });

  describe('Overfitting Detection', () => {
    it('should detect overfitting when validation gap is high', () => {
      const { result } = renderHook(() => useTrainingMetrics());

      act(() => {
        result.current.addMetric({
          loss: 0.1,
          validation_loss: 0.5
        });
      });

      const overfitting = result.current.detectOverfitting(0.2);

      expect(overfitting.detected).toBe(true);
      expect(overfitting.gap).toBe(0.4);
    });

    it('should not detect overfitting when gap is small', () => {
      const { result } = renderHook(() => useTrainingMetrics());

      act(() => {
        result.current.addMetric({
          loss: 0.2,
          validation_loss: 0.25
        });
      });

      const overfitting = result.current.detectOverfitting(0.1);

      expect(overfitting.detected).toBe(false);
      expect(overfitting.reason).toBe('normal');
    });

    it('should return insufficient data when metrics missing', () => {
      const { result } = renderHook(() => useTrainingMetrics());

      const overfitting = result.current.detectOverfitting();
      expect(overfitting.detected).toBe(false);
      expect(overfitting.reason).toBe('insufficient_data');
    });
  });

  describe('Summary Statistics', () => {
    it('should compute summary statistics', () => {
      const { result } = renderHook(() => useTrainingMetrics());

      act(() => {
        for (let i = 0; i < 10; i++) {
          result.current.addMetric({
            loss: 0.5 - i * 0.04,
            accuracy: 0.6 + i * 0.03
          });
        }
      });

      expect(result.current.summary).toBeDefined();
      expect(result.current.summary.loss).toBeDefined();
      expect(result.current.summary.accuracy).toBeDefined();
    });
  });

  describe('Performance Score', () => {
    it('should calculate composite performance score', () => {
      const { result } = renderHook(() => useTrainingMetrics());

      act(() => {
        result.current.addMetric({
          accuracy: 0.9,
          loss: 0.2,
          validation_accuracy: 0.88
        });
      });

      expect(result.current.performanceScore).toBeGreaterThan(0);
      expect(result.current.performanceScore).toBeLessThanOrEqual(100);
    });
  });

  describe('Export', () => {
    it('should export metrics as JSON', () => {
      const { result } = renderHook(() => useTrainingMetrics({ agentId: 'test-agent' }));

      act(() => {
        result.current.addMetric({ loss: 0.5, accuracy: 0.8 });
      });

      const exported = result.current.exportMetrics('json');
      const parsed = JSON.parse(exported);

      expect(parsed.agentId).toBe('test-agent');
      expect(parsed.metricsHistory).toHaveLength(1);
    });

    it('should export metrics as CSV', () => {
      const { result } = renderHook(() => useTrainingMetrics());

      act(() => {
        result.current.addMetric({ epoch: 1, step: 10, loss: 0.5, accuracy: 0.8 });
      });

      const csv = result.current.exportMetrics('csv');

      expect(csv).toContain('timestamp');
      expect(csv).toContain('epoch');
      expect(csv).toContain('loss');
    });
  });

  describe('Constants Export', () => {
    it('should export METRIC_TYPES constants', () => {
      expect(METRIC_TYPES.LOSS).toBe('loss');
      expect(METRIC_TYPES.ACCURACY).toBe('accuracy');
      expect(METRIC_TYPES.F1_SCORE).toBe('f1_score');
    });

    it('should export AGGREGATION_METHODS constants', () => {
      expect(AGGREGATION_METHODS.MEAN).toBe('mean');
      expect(AGGREGATION_METHODS.MEDIAN).toBe('median');
      expect(AGGREGATION_METHODS.MAX).toBe('max');
    });
  });
});
