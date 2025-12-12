/**
 * @fileoverview Metrics Hook
 * @description React hook for collecting metrics in components.
 */

import { useCallback } from 'react';
import { metricsService } from '../services/MetricsService';
import type { MetricCollectionParams, UUID } from '../shared/types/domain';
import { useAuth } from '../contexts/AuthContext';

/**
 * Hook for collecting metrics in React components.
 * 
 * @example
 * const { collectMetric, recordLatency } = useMetrics();
 * 
 * const handleAction = async () => {
 *   const start = Date.now();
 *   try {
 *     await performAction();
 *     await recordLatency('action.performed', Date.now() - start);
 *   } catch (error) {
 *     await collectMetric({ status: 'error', ... });
 *   }
 * };
 */
export function useMetrics() {
  const { organization } = useAuth();

  const collectMetric = useCallback(async (params: Omit<MetricCollectionParams, 'org_id'>) => {
    if (!organization?.id) {
      console.warn('[Metrics] No organization context, skipping metric');
      return null;
    }

    const result = await metricsService.collectMetric({
      ...params,
      org_id: organization.id as UUID
    });

    if (!result.ok) {
      console.error('[Metrics] Failed to collect metric:', result.error);
      return null;
    }

    return result.value;
  }, [organization?.id]);

  const recordLatency = useCallback(async (
    operation: string,
    latency_ms: number,
    additional?: {
      agent_id?: UUID;
      run_id?: UUID;
      status?: string;
    }
  ) => {
    return collectMetric({
      provider: 'system',
      model: operation,
      latency_ms,
      status: additional?.status || 'success',
      agent_id: additional?.agent_id,
      run_id: additional?.run_id
    });
  }, [collectMetric]);

  const recordError = useCallback(async (
    operation: string,
    error: Error | string,
    additional?: {
      agent_id?: UUID;
      run_id?: UUID;
    }
  ) => {
    return collectMetric({
      provider: 'system',
      model: operation,
      latency_ms: 0,
      status: 'error',
      agent_id: additional?.agent_id,
      run_id: additional?.run_id
    });
  }, [collectMetric]);

  return {
    collectMetric,
    recordLatency,
    recordError
  };
}