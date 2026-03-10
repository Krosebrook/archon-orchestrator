/**
 * @fileoverview Performance Utilities
 * @description Performance monitoring, debouncing, throttling, memoization, and batching.
 * Uses web-vitals v4+ APIs (onFID removed; onINP is the replacement).
 */

// =============================================================================
// PERFORMANCE BUDGETS
// =============================================================================

export const PerformanceBudgets = Object.freeze({
  API_CALL_NON_AI: 300,
  API_CALL_AI: 1500,
  REACT_RENDER: 16,
  INITIAL_LOAD_LCP: 2500,
  BUNDLE_SIZE_KB: 180
});

// =============================================================================
// WEB VITALS COLLECTOR (lazy - avoids stale Vite cache issues)
// =============================================================================

class PerformanceCollector {
  constructor() {
    this.metrics = {};
    this._initAsync();
  }

  async _initAsync() {
    try {
      const { onCLS, onINP, onFCP, onLCP, onTTFB } = await import('web-vitals');
      onCLS((m) => { this.metrics.CLS = m; });
      onINP((m) => { this.metrics.INP = m; });
      onFCP((m) => { this.metrics.FCP = m; });
      onLCP((m) => { this.metrics.LCP = m; });
      onTTFB((m) => { this.metrics.TTFB = m; });
    } catch (e) {
      // web-vitals not available - continue without metrics
    }
  }

  getMetrics() {
    return { ...this.metrics };
  }
}

export const performanceCollector = new PerformanceCollector();

// =============================================================================
// MEASUREMENT
// =============================================================================

export function measurePerformance(label, fn) {
  const start = performance.now();
  const result = fn();
  const duration = performance.now() - start;
  if (duration > PerformanceBudgets.REACT_RENDER) {
    console.warn(`[Performance] ${label} took ${duration.toFixed(2)}ms`);
  }
  return result;
}

export function measured(label) {
  return function (target, propertyKey, descriptor) {
    const original = descriptor.value;
    descriptor.value = function (...args) {
      return measurePerformance(`${label}.${propertyKey}`, () => original.apply(this, args));
    };
    return descriptor;
  };
}

// =============================================================================
// DEBOUNCE & THROTTLE
// =============================================================================

export function debounce(fn, waitMs) {
  let timer;
  return function (...args) {
    clearTimeout(timer);
    timer = setTimeout(() => fn.apply(this, args), waitMs);
  };
}

export function throttle(fn, limitMs) {
  let lastCall = 0;
  return function (...args) {
    const now = Date.now();
    if (now - lastCall >= limitMs) {
      lastCall = now;
      return fn.apply(this, args);
    }
  };
}

// =============================================================================
// MEMOIZATION
// =============================================================================

export function memoize(fn, keyFn) {
  const cache = new Map();
  return function (...args) {
    const key = keyFn ? keyFn(...args) : JSON.stringify(args);
    if (cache.has(key)) return cache.get(key);
    const result = fn.apply(this, args);
    cache.set(key, result);
    return result;
  };
}

// =============================================================================
// BATCHING
// =============================================================================

export function createBatcher(fn, { maxSize = 50, waitMs = 100 } = {}) {
  let batch = [];
  let timer;

  const flush = () => {
    if (batch.length === 0) return;
    const items = batch.slice();
    batch = [];
    fn(items);
  };

  return function (item) {
    batch.push(item);
    if (batch.length >= maxSize) {
      clearTimeout(timer);
      flush();
    } else {
      clearTimeout(timer);
      timer = setTimeout(flush, waitMs);
    }
  };
}

// =============================================================================
// LAZY LOADING
// =============================================================================

export function lazy(importFn) {
  let module;
  return async function (...args) {
    if (!module) module = await importFn();
    return module(...args);
  };
}

// =============================================================================
// IDLE TASK SCHEDULING
// =============================================================================

export function runWhenIdle(fn, timeout = 2000) {
  if ('requestIdleCallback' in window) {
    return window.requestIdleCallback(fn, { timeout });
  }
  return setTimeout(fn, 0);
}

export function cancelIdleTask(id) {
  if ('cancelIdleCallback' in window) {
    window.cancelIdleCallback(id);
  } else {
    clearTimeout(id);
  }
}