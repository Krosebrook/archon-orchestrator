/**
 * @fileoverview Observability Hooks
 * @module core/hooks/useObservability
 * @description React hooks for observability and performance tracking
 */

import { useEffect, useRef, useCallback } from 'react';
import { tracer, metricsCollector, performanceTracker } from '../observability/Instrumentation';
import type { SpanContext } from '../observability/Instrumentation';

// =============================================================================
// TRACE HOOK
// =============================================================================

/**
 * Hook for automatic span tracking in React components
 */
export function useTrace(name: string, parentContext?: SpanContext) {
  const spanRef = useRef<any>(null);

  useEffect(() => {
    (async () => {
      spanRef.current = await tracer.startSpan({ name }, parentContext);
    })();

    return () => {
      if (spanRef.current) {
        spanRef.current.end({ status: 'ok' });
      }
    };
  }, [name, parentContext]);

  return spanRef.current;
}

// =============================================================================
// PERFORMANCE HOOK
// =============================================================================

/**
 * Hook for measuring component render performance
 */
export function usePerformance(componentName: string) {
  const renderCount = useRef(0);
  const firstRenderTime = useRef<number | null>(null);

  useEffect(() => {
    renderCount.current += 1;

    if (renderCount.current === 1) {
      firstRenderTime.current = performance.now();
    }

    // Log slow renders (> 16ms = 60fps threshold)
    const renderTime = performance.now();
    if (renderCount.current > 1) {
      const timeSinceLastRender = renderTime - (firstRenderTime.current || 0);
      if (timeSinceLastRender > 16) {
        console.warn(`[Performance] Slow render in ${componentName}: ${timeSinceLastRender.toFixed(2)}ms`);
      }
    }
  });

  return {
    renderCount: renderCount.current,
    firstRenderTime: firstRenderTime.current,
  };
}

// =============================================================================
// API PERFORMANCE HOOK
// =============================================================================

/**
 * Hook for tracking API call performance
 */
export function useAPIPerformance() {
  const trackAPICall = useCallback(async <T,>(
    endpoint: string,
    method: string,
    fn: () => Promise<T>
  ): Promise<T> => {
    const start = performance.now();
    
    try {
      const result = await fn();
      const latency = performance.now() - start;
      
      await metricsCollector.recordLatency(endpoint, method, latency, 200);
      
      return result;
    } catch (error) {
      const latency = performance.now() - start;
      const errorCode = (error as any).code || 'UNKNOWN';
      const errorMessage = (error as Error).message;
      
      await metricsCollector.recordLatency(endpoint, method, latency, 500);
      await metricsCollector.recordError(endpoint, errorCode, errorMessage);
      
      throw error;
    }
  }, []);

  return { trackAPICall };
}

// =============================================================================
// MEMORY TRACKING HOOK
// =============================================================================

/**
 * Hook for tracking component memory usage
 */
export function useMemoryTracking(componentName: string) {
  useEffect(() => {
    if ('memory' in performance) {
      const memory = (performance as any).memory;
      console.log(`[Memory] ${componentName}:`, {
        usedJSHeapSize: (memory.usedJSHeapSize / 1048576).toFixed(2) + ' MB',
        totalJSHeapSize: (memory.totalJSHeapSize / 1048576).toFixed(2) + ' MB',
      });
    }
  }, [componentName]);
}

// =============================================================================
// ERROR BOUNDARY HOOK
// =============================================================================

/**
 * Hook for error tracking
 */
export function useErrorTracking() {
  const trackError = useCallback((error: Error, errorInfo?: any) => {
    console.error('[Error]', {
      message: error.message,
      stack: error.stack,
      componentStack: errorInfo?.componentStack,
    });

    // In production, send to error tracking service
    metricsCollector.recordError(
      'component-error',
      error.name,
      error.message
    );
  }, []);

  return { trackError };
}

// =============================================================================
// NETWORK MONITORING HOOK
// =============================================================================

/**
 * Hook for monitoring network connectivity
 */
export function useNetworkMonitoring() {
  const isOnline = useRef(navigator.onLine);

  useEffect(() => {
    const handleOnline = () => {
      isOnline.current = true;
      console.log('[Network] Connection restored');
    };

    const handleOffline = () => {
      isOnline.current = false;
      console.warn('[Network] Connection lost');
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  return { isOnline: isOnline.current };
}

// =============================================================================
// VIEWPORT TRACKING HOOK
// =============================================================================

/**
 * Hook for tracking element visibility
 */
export function useViewportTracking(elementRef: React.RefObject<HTMLElement>, threshold = 0.5) {
  const isVisible = useRef(false);

  useEffect(() => {
    const element = elementRef.current;
    if (!element) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting && !isVisible.current) {
          isVisible.current = true;
          console.log('[Viewport] Element became visible:', element.id || element.className);
        } else if (!entry.isIntersecting && isVisible.current) {
          isVisible.current = false;
        }
      },
      { threshold }
    );

    observer.observe(element);

    return () => {
      observer.disconnect();
    };
  }, [elementRef, threshold]);

  return { isVisible: isVisible.current };
}