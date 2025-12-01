/**
 * @fileoverview Async State Management Hook
 * @description Manages async operation state with loading, error, and success tracking.
 * 
 * @module hooks/useAsync
 * @version 2.0.0
 * 
 * @example
 * const { data, isLoading, isError, execute, reset } = useAsync(fetchAgents);
 * 
 * useEffect(() => {
 *   execute();
 * }, []);
 * 
 * if (isLoading) return <Spinner />;
 * if (isError) return <ErrorMessage />;
 */

import { useState, useCallback, useEffect, useRef } from 'react';
import { handleError } from '../utils/api-client';

/**
 * Hook for managing async operation state.
 * @param {Function} asyncFunction - The async function to execute
 * @param {Object} [options] - Configuration options
 * @param {*} [options.initialData] - Initial data value
 * @param {boolean} [options.silent] - Suppress error toasts
 * @returns {import('../shared/types').UseAsyncReturn}
 */
export function useAsync(asyncFunction, options = {}) {
  const [state, setState] = useState({
    data: options.initialData ?? null,
    error: null,
    isLoading: false,
    isSuccess: false,
    isError: false
  });

  const isMountedRef = useRef(true);

  useEffect(() => {
    return () => { isMountedRef.current = false; };
  }, []);

  const execute = useCallback(async (...args) => {
    setState(prev => ({ ...prev, isLoading: true, isError: false, error: null }));
    try {
      const data = await asyncFunction(...args);
      if (isMountedRef.current) {
        setState({ data, error: null, isLoading: false, isSuccess: true, isError: false });
      }
      return data;
    } catch (error) {
      const normalized = handleError(error, options);
      if (isMountedRef.current) {
        setState({ data: null, error: normalized, isLoading: false, isSuccess: false, isError: true });
      }
      throw normalized;
    }
  }, [asyncFunction, options]);

  const reset = useCallback(() => {
    setState({ data: options.initialData ?? null, error: null, isLoading: false, isSuccess: false, isError: false });
  }, [options.initialData]);

  return { ...state, execute, reset };
}