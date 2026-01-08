import { useState, useCallback, useEffect, useMemo } from 'react';
import { base44 } from '@/api/base44Client';

/**
 * Metric types for training evaluation
 */
export const METRIC_TYPES = {
  LOSS: 'loss',
  ACCURACY: 'accuracy',
  PRECISION: 'precision',
  RECALL: 'recall',
  F1_SCORE: 'f1_score',
  LATENCY: 'latency',
  COST: 'cost',
  TOKEN_USAGE: 'token_usage'
};

/**
 * Aggregation methods for metrics
 */
export const AGGREGATION_METHODS = {
  MEAN: 'mean',
  MEDIAN: 'median',
  MIN: 'min',
  MAX: 'max',
  SUM: 'sum',
  LAST: 'last'
};

/**
 * Custom hook for tracking and analyzing training metrics
 * Provides real-time metrics visualization, comparison, and benchmarking
 *
 * @param {Object} options - Configuration options
 * @param {string} options.agentId - Agent ID to track metrics for
 * @param {string} options.jobId - Training job ID
 * @param {number} options.windowSize - Rolling window size for stats
 * @returns {Object} Metrics state and analysis functions
 */
export function useTrainingMetrics(options = {}) {
  const {
    agentId = null,
    jobId = null,
    windowSize = 100
  } = options;

  // Raw metrics data
  const [metricsHistory, setMetricsHistory] = useState([]);
  const [validationMetrics, setValidationMetrics] = useState([]);
  const [benchmarks, setBenchmarks] = useState([]);

  // Comparison data
  const [comparisonRuns, setComparisonRuns] = useState([]);
  const [baselineMetrics, setBaselineMetrics] = useState(null);

  // Loading state
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);

  /**
   * Add a metric point to history
   */
  const addMetric = useCallback((metric) => {
    setMetricsHistory(prev => {
      const updated = [...prev, { ...metric, timestamp: Date.now() }];
      // Keep only the last windowSize * 2 entries for memory efficiency
      if (updated.length > windowSize * 2) {
        return updated.slice(-windowSize * 2);
      }
      return updated;
    });
  }, [windowSize]);

  /**
   * Add validation metric
   */
  const addValidationMetric = useCallback((metric) => {
    setValidationMetrics(prev => [...prev, { ...metric, timestamp: Date.now() }]);
  }, []);

  /**
   * Clear all metrics
   */
  const clearMetrics = useCallback(() => {
    setMetricsHistory([]);
    setValidationMetrics([]);
  }, []);

  /**
   * Calculate rolling statistics for a metric
   */
  const calculateRollingStats = useCallback((metricName, window = windowSize) => {
    const values = metricsHistory
      .slice(-window)
      .map(m => m[metricName])
      .filter(v => v !== undefined && v !== null);

    if (values.length === 0) {
      return {
        mean: null,
        median: null,
        min: null,
        max: null,
        std: null,
        trend: null,
        count: 0
      };
    }

    const sorted = [...values].sort((a, b) => a - b);
    const mean = values.reduce((sum, v) => sum + v, 0) / values.length;
    const median = sorted[Math.floor(sorted.length / 2)];
    const min = sorted[0];
    const max = sorted[sorted.length - 1];

    // Standard deviation
    const variance = values.reduce((sum, v) => sum + Math.pow(v - mean, 2), 0) / values.length;
    const std = Math.sqrt(variance);

    // Calculate trend (linear regression slope)
    let trend = null;
    if (values.length >= 2) {
      const n = values.length;
      const sumX = (n * (n - 1)) / 2;
      const sumY = values.reduce((sum, v) => sum + v, 0);
      const sumXY = values.reduce((sum, v, i) => sum + i * v, 0);
      const sumX2 = (n * (n - 1) * (2 * n - 1)) / 6;
      trend = (n * sumXY - sumX * sumY) / (n * sumX2 - sumX * sumX);
    }

    return {
      mean,
      median,
      min,
      max,
      std,
      trend,
      count: values.length
    };
  }, [metricsHistory, windowSize]);

  /**
   * Get latest metric value
   */
  const getLatestMetric = useCallback((metricName) => {
    for (let i = metricsHistory.length - 1; i >= 0; i--) {
      if (metricsHistory[i][metricName] !== undefined) {
        return metricsHistory[i][metricName];
      }
    }
    return null;
  }, [metricsHistory]);

  /**
   * Get metric series for charting
   */
  const getMetricSeries = useCallback((metricName, maxPoints = 100) => {
    const filtered = metricsHistory
      .filter(m => m[metricName] !== undefined)
      .slice(-maxPoints);

    return filtered.map((m, idx) => ({
      x: idx,
      y: m[metricName],
      epoch: m.epoch,
      step: m.step,
      timestamp: m.timestamp
    }));
  }, [metricsHistory]);

  /**
   * Compare current metrics with another run
   */
  const compareWithRun = useCallback(async (otherRunId) => {
    setIsLoading(true);
    try {
      const response = await base44.functions.compareTrainingRuns({
        run_ids: [jobId, otherRunId]
      });

      if (response.data) {
        setComparisonRuns(prev => {
          const existing = prev.find(r => r.runId === otherRunId);
          if (existing) return prev;
          return [...prev, { runId: otherRunId, data: response.data }];
        });
      }

      return response.data;
    } catch (err) {
      setError(err);
      console.error('Failed to compare runs:', err);
      return null;
    } finally {
      setIsLoading(false);
    }
  }, [jobId]);

  /**
   * Load historical metrics for an agent
   */
  const loadHistoricalMetrics = useCallback(async (targetAgentId = agentId, limit = 10) => {
    if (!targetAgentId) return [];

    setIsLoading(true);
    try {
      const sessions = await base44.entities.TrainingSession.filter(
        { agent_id: targetAgentId },
        '-started_at',
        limit
      );

      return sessions.map(session => ({
        sessionId: session.id,
        startedAt: session.started_at,
        completedAt: session.completed_at,
        status: session.status,
        metrics: session.validation_results || {},
        improvements: session.improvements || {}
      }));
    } catch (err) {
      setError(err);
      console.error('Failed to load historical metrics:', err);
      return [];
    } finally {
      setIsLoading(false);
    }
  }, [agentId]);

  /**
   * Set baseline for comparison
   */
  const setBaseline = useCallback((metrics) => {
    setBaselineMetrics(metrics);
  }, []);

  /**
   * Calculate improvement over baseline
   */
  const calculateImprovement = useCallback((metricName, higherIsBetter = true) => {
    if (!baselineMetrics || !baselineMetrics[metricName]) {
      return null;
    }

    const current = getLatestMetric(metricName);
    if (current === null) return null;

    const baseline = baselineMetrics[metricName];
    const diff = current - baseline;
    const percentChange = (diff / Math.abs(baseline)) * 100;

    return {
      absolute: diff,
      percent: percentChange,
      improved: higherIsBetter ? diff > 0 : diff < 0
    };
  }, [baselineMetrics, getLatestMetric]);

  /**
   * Check if metric meets threshold
   */
  const meetsThreshold = useCallback((metricName, threshold, comparison = 'gte') => {
    const value = getLatestMetric(metricName);
    if (value === null) return false;

    switch (comparison) {
      case 'gt': return value > threshold;
      case 'gte': return value >= threshold;
      case 'lt': return value < threshold;
      case 'lte': return value <= threshold;
      case 'eq': return Math.abs(value - threshold) < 0.0001;
      default: return false;
    }
  }, [getLatestMetric]);

  /**
   * Detect convergence
   */
  const detectConvergence = useCallback((metricName = 'loss', threshold = 0.001, window = 10) => {
    const series = getMetricSeries(metricName, window);
    if (series.length < window) return { converged: false, reason: 'insufficient_data' };

    const values = series.map(s => s.y);
    const mean = values.reduce((sum, v) => sum + v, 0) / values.length;
    const variance = values.reduce((sum, v) => sum + Math.pow(v - mean, 2), 0) / values.length;
    const std = Math.sqrt(variance);

    const converged = std < threshold;
    return {
      converged,
      standardDeviation: std,
      mean,
      window,
      reason: converged ? 'low_variance' : 'high_variance'
    };
  }, [getMetricSeries]);

  /**
   * Detect overfitting
   */
  const detectOverfitting = useCallback((gapThreshold = 0.1) => {
    const trainingLoss = getLatestMetric('loss');
    const validationLoss = getLatestMetric('validation_loss');

    if (trainingLoss === null || validationLoss === null) {
      return { detected: false, reason: 'insufficient_data' };
    }

    const gap = validationLoss - trainingLoss;
    const overfitting = gap > gapThreshold;

    return {
      detected: overfitting,
      trainingLoss,
      validationLoss,
      gap,
      gapThreshold,
      reason: overfitting ? 'validation_gap_too_high' : 'normal'
    };
  }, [getLatestMetric]);

  /**
   * Get summary statistics
   */
  const summary = useMemo(() => {
    return {
      loss: calculateRollingStats('loss'),
      accuracy: calculateRollingStats('accuracy'),
      validationLoss: calculateRollingStats('validation_loss'),
      validationAccuracy: calculateRollingStats('validation_accuracy'),
      latency: calculateRollingStats('latency_ms'),
      tokenUsage: calculateRollingStats('token_usage')
    };
  }, [calculateRollingStats]);

  /**
   * Get current performance score (composite metric)
   */
  const performanceScore = useMemo(() => {
    const accuracy = getLatestMetric('accuracy') || 0;
    const loss = getLatestMetric('loss') || 1;
    const validationAccuracy = getLatestMetric('validation_accuracy') || 0;

    // Weighted composite score (higher is better)
    const score = (
      accuracy * 0.4 +
      validationAccuracy * 0.4 +
      (1 - Math.min(loss, 1)) * 0.2
    ) * 100;

    return Math.round(score * 10) / 10;
  }, [getLatestMetric]);

  /**
   * Export metrics data
   */
  const exportMetrics = useCallback((format = 'json') => {
    const data = {
      agentId,
      jobId,
      exportedAt: new Date().toISOString(),
      metricsHistory,
      validationMetrics,
      summary,
      performanceScore
    };

    if (format === 'csv') {
      // Convert to CSV
      const headers = ['timestamp', 'epoch', 'step', 'loss', 'accuracy', 'validation_loss', 'validation_accuracy'];
      const rows = metricsHistory.map(m =>
        headers.map(h => m[h] ?? '').join(',')
      );
      return [headers.join(','), ...rows].join('\n');
    }

    return JSON.stringify(data, null, 2);
  }, [agentId, jobId, metricsHistory, validationMetrics, summary, performanceScore]);

  return {
    // State
    metricsHistory,
    validationMetrics,
    benchmarks,
    comparisonRuns,
    baselineMetrics,
    isLoading,
    error,

    // Computed
    summary,
    performanceScore,

    // Actions
    addMetric,
    addValidationMetric,
    clearMetrics,
    setBaseline,
    setBenchmarks,

    // Analysis functions
    calculateRollingStats,
    getLatestMetric,
    getMetricSeries,
    calculateImprovement,
    meetsThreshold,
    detectConvergence,
    detectOverfitting,

    // Comparison functions
    compareWithRun,
    loadHistoricalMetrics,

    // Export
    exportMetrics,

    // Constants
    METRIC_TYPES,
    AGGREGATION_METHODS
  };
}

export default useTrainingMetrics;
