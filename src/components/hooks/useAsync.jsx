import { useState, useCallback, useEffect, useRef } from 'react';
import { handleError } from '../utils/api-client';

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