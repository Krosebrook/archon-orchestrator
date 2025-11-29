/**
 * Performance Utilities
 * Axis: Performance, Observability
 * 
 * Enhanced with:
 * - Performance measurement with thresholds
 * - Memoization with LRU cache
 * - Request batching
 * - Lazy loading utilities
 * - Performance budgets
 * - Metrics collection
 */

// =============================================================================
// PERFORMANCE BUDGETS
// =============================================================================

export const PerformanceBudgets = Object.freeze({
  API_CALL: 300,          // ms - non-AI API calls
  AI_CALL: 1500,          // ms - AI-backed operations
  RENDER: 16,             // ms - React render (60fps)
  DATABASE_QUERY: 100,    // ms - database operations
  FILE_UPLOAD: 5000,      // ms - file uploads
  INITIAL_LOAD: 2500      // ms - initial page load (LCP)
});

// =============================================================================
// PERFORMANCE MEASUREMENT
// =============================================================================

export function measurePerformance(name, fn, options = {}) {
  const { 
    budget = PerformanceBudgets.API_CALL,
    onSlow = null,
    silent = false
  } = options;
  
  return async (...args) => {
    const startTime = performance.now();
    const startMemory = performance.memory?.usedJSHeapSize;
    
    try {
      const result = await fn(...args);
      const duration = performance.now() - startTime;
      const memoryDelta = startMemory ? performance.memory.usedJSHeapSize - startMemory : null;
      
      // Collect metrics
      const metrics = {
        name,
        duration: Math.round(duration * 100) / 100,
        memory_delta_kb: memoryDelta ? Math.round(memoryDelta / 1024) : null,
        budget,
        exceeded: duration > budget,
        timestamp: Date.now()
      };
      
      // Log slow operations
      if (duration > budget && !silent) {
        console.warn(`⚠️ Performance budget exceeded: ${name}`, {
          duration: `${metrics.duration}ms`,
          budget: `${budget}ms`,
          exceeded_by: `${(duration - budget).toFixed(2)}ms`
        });
        
        if (onSlow) {
          onSlow(metrics);
        }
      }
      
      return result;
    } catch (error) {
      const duration = performance.now() - startTime;
      console.error(`❌ ${name} failed after ${duration.toFixed(2)}ms:`, error);
      throw error;
    }
  };
}

// Decorator version for class methods
export function measured(budget = PerformanceBudgets.API_CALL) {
  return function(target, propertyKey, descriptor) {
    const originalMethod = descriptor.value;
    descriptor.value = measurePerformance(
      `${target.constructor.name}.${propertyKey}`,
      originalMethod,
      { budget }
    );
    return descriptor;
  };
}

// =============================================================================
// DEBOUNCE & THROTTLE
// =============================================================================

export function debounce(fn, delay = 300, options = {}) {
  const { leading = false, trailing = true, maxWait = null } = options;
  
  let timeoutId = null;
  let lastCallTime = 0;
  let lastInvokeTime = 0;
  let lastArgs = null;
  let lastThis = null;
  
  function invokeFunc(time) {
    const args = lastArgs;
    const thisArg = lastThis;
    lastArgs = lastThis = null;
    lastInvokeTime = time;
    return fn.apply(thisArg, args);
  }
  
  function shouldInvoke(time) {
    const timeSinceLastCall = time - lastCallTime;
    const timeSinceLastInvoke = time - lastInvokeTime;
    
    return (
      lastCallTime === 0 ||
      timeSinceLastCall >= delay ||
      timeSinceLastCall < 0 ||
      (maxWait !== null && timeSinceLastInvoke >= maxWait)
    );
  }
  
  function timerExpired() {
    const time = Date.now();
    if (shouldInvoke(time)) {
      return trailingEdge(time);
    }
    timeoutId = setTimeout(timerExpired, delay - (time - lastCallTime));
  }
  
  function trailingEdge(time) {
    timeoutId = null;
    if (trailing && lastArgs) {
      return invokeFunc(time);
    }
    lastArgs = lastThis = null;
    return undefined;
  }
  
  function leadingEdge(time) {
    lastInvokeTime = time;
    timeoutId = setTimeout(timerExpired, delay);
    return leading ? invokeFunc(time) : undefined;
  }
  
  function debounced(...args) {
    const time = Date.now();
    const isInvoking = shouldInvoke(time);
    
    lastArgs = args;
    lastThis = this;
    lastCallTime = time;
    
    if (isInvoking) {
      if (timeoutId === null) {
        return leadingEdge(time);
      }
      if (maxWait !== null) {
        timeoutId = setTimeout(timerExpired, delay);
        return invokeFunc(time);
      }
    }
    
    if (timeoutId === null) {
      timeoutId = setTimeout(timerExpired, delay);
    }
    
    return undefined;
  }
  
  debounced.cancel = function() {
    if (timeoutId !== null) {
      clearTimeout(timeoutId);
    }
    lastInvokeTime = 0;
    lastArgs = lastCallTime = lastThis = timeoutId = null;
  };
  
  debounced.flush = function() {
    if (timeoutId !== null) {
      return trailingEdge(Date.now());
    }
    return undefined;
  };
  
  return debounced;
}

export function throttle(fn, limit = 300, options = {}) {
  const { leading = true, trailing = true } = options;
  
  let lastCallTime = 0;
  let timeoutId = null;
  let lastArgs = null;
  let lastThis = null;
  
  function invoke() {
    lastCallTime = Date.now();
    timeoutId = null;
    fn.apply(lastThis, lastArgs);
    lastArgs = lastThis = null;
  }
  
  function throttled(...args) {
    const now = Date.now();
    const remaining = limit - (now - lastCallTime);
    
    lastArgs = args;
    lastThis = this;
    
    if (remaining <= 0 || remaining > limit) {
      if (timeoutId !== null) {
        clearTimeout(timeoutId);
        timeoutId = null;
      }
      lastCallTime = now;
      fn.apply(this, args);
      lastArgs = lastThis = null;
    } else if (timeoutId === null && trailing) {
      timeoutId = setTimeout(invoke, remaining);
    }
  }
  
  throttled.cancel = function() {
    if (timeoutId !== null) {
      clearTimeout(timeoutId);
      timeoutId = null;
    }
    lastCallTime = 0;
    lastArgs = lastThis = null;
  };
  
  return throttled;
}

// =============================================================================
// LRU CACHE
// =============================================================================

class LRUCache {
  constructor(maxSize = 100) {
    this.maxSize = maxSize;
    this.cache = new Map();
  }
  
  get(key) {
    if (!this.cache.has(key)) {
      return undefined;
    }
    
    // Move to end (most recently used)
    const value = this.cache.get(key);
    this.cache.delete(key);
    this.cache.set(key, value);
    
    return value;
  }
  
  set(key, value, ttlMs = null) {
    // Remove oldest if at capacity
    if (this.cache.size >= this.maxSize) {
      const firstKey = this.cache.keys().next().value;
      this.cache.delete(firstKey);
    }
    
    const entry = {
      value,
      expiresAt: ttlMs ? Date.now() + ttlMs : null
    };
    
    this.cache.set(key, entry);
    return this;
  }
  
  has(key) {
    const entry = this.cache.get(key);
    if (!entry) return false;
    
    // Check expiration
    if (entry.expiresAt && Date.now() > entry.expiresAt) {
      this.cache.delete(key);
      return false;
    }
    
    return true;
  }
  
  delete(key) {
    return this.cache.delete(key);
  }
  
  clear() {
    this.cache.clear();
  }
  
  get size() {
    return this.cache.size;
  }
  
  // Cleanup expired entries
  prune() {
    const now = Date.now();
    for (const [key, entry] of this.cache.entries()) {
      if (entry.expiresAt && now > entry.expiresAt) {
        this.cache.delete(key);
      }
    }
  }
}

// =============================================================================
// MEMOIZATION
// =============================================================================

export function memoize(fn, options = {}) {
  const {
    maxSize = 100,
    ttlMs = null,
    keyGenerator = (...args) => JSON.stringify(args)
  } = options;
  
  const cache = new LRUCache(maxSize);
  
  function memoized(...args) {
    const key = keyGenerator(...args);
    
    if (cache.has(key)) {
      const entry = cache.get(key);
      return entry.value;
    }
    
    const result = fn.apply(this, args);
    
    // Handle promises
    if (result instanceof Promise) {
      return result.then(value => {
        cache.set(key, { value }, ttlMs);
        return value;
      });
    }
    
    cache.set(key, { value: result }, ttlMs);
    return result;
  }
  
  memoized.cache = cache;
  memoized.clear = () => cache.clear();
  
  return memoized;
}

// =============================================================================
// REQUEST BATCHING
// =============================================================================

class RequestBatcher {
  constructor(batchFn, options = {}) {
    this.batchFn = batchFn;
    this.maxBatchSize = options.maxBatchSize || 50;
    this.delayMs = options.delayMs || 10;
    this.queue = [];
    this.timeoutId = null;
  }
  
  add(item) {
    return new Promise((resolve, reject) => {
      this.queue.push({ item, resolve, reject });
      
      if (this.queue.length >= this.maxBatchSize) {
        this.flush();
      } else if (!this.timeoutId) {
        this.timeoutId = setTimeout(() => this.flush(), this.delayMs);
      }
    });
  }
  
  async flush() {
    if (this.queue.length === 0) return;
    
    clearTimeout(this.timeoutId);
    this.timeoutId = null;
    
    const batch = this.queue.splice(0, this.maxBatchSize);
    const items = batch.map(b => b.item);
    
    try {
      const results = await this.batchFn(items);
      
      batch.forEach((b, i) => {
        b.resolve(results[i]);
      });
    } catch (error) {
      batch.forEach(b => b.reject(error));
    }
  }
}

export function createBatcher(batchFn, options) {
  return new RequestBatcher(batchFn, options);
}

// =============================================================================
// LAZY LOADING
// =============================================================================

export function lazy(factory, options = {}) {
  const { timeout = 5000 } = options;
  
  let promise = null;
  let result = null;
  let error = null;
  let loaded = false;
  
  return {
    get() {
      if (loaded) {
        if (error) throw error;
        return result;
      }
      
      if (!promise) {
        promise = Promise.race([
          factory(),
          new Promise((_, reject) => 
            setTimeout(() => reject(new Error('Lazy load timeout')), timeout)
          )
        ])
        .then(value => {
          result = value;
          loaded = true;
          return value;
        })
        .catch(err => {
          error = err;
          loaded = true;
          throw err;
        });
      }
      
      return promise;
    },
    
    preload() {
      return this.get();
    },
    
    isLoaded() {
      return loaded;
    },
    
    reset() {
      promise = null;
      result = null;
      error = null;
      loaded = false;
    }
  };
}

// =============================================================================
// PERFORMANCE METRICS COLLECTOR
// =============================================================================

class PerformanceMetricsCollector {
  constructor() {
    this.metrics = [];
    this.maxMetrics = 1000;
  }
  
  record(name, duration, metadata = {}) {
    this.metrics.push({
      name,
      duration,
      timestamp: Date.now(),
      ...metadata
    });
    
    // Trim if too many
    if (this.metrics.length > this.maxMetrics) {
      this.metrics = this.metrics.slice(-this.maxMetrics / 2);
    }
  }
  
  getStats(name, windowMs = 60000) {
    const now = Date.now();
    const relevant = this.metrics.filter(
      m => m.name === name && now - m.timestamp < windowMs
    );
    
    if (relevant.length === 0) {
      return null;
    }
    
    const durations = relevant.map(m => m.duration).sort((a, b) => a - b);
    const sum = durations.reduce((a, b) => a + b, 0);
    
    return {
      count: durations.length,
      avg: sum / durations.length,
      min: durations[0],
      max: durations[durations.length - 1],
      p50: durations[Math.floor(durations.length * 0.5)],
      p95: durations[Math.floor(durations.length * 0.95)],
      p99: durations[Math.floor(durations.length * 0.99)]
    };
  }
  
  getAllStats(windowMs = 60000) {
    const names = [...new Set(this.metrics.map(m => m.name))];
    const stats = {};
    
    for (const name of names) {
      stats[name] = this.getStats(name, windowMs);
    }
    
    return stats;
  }
  
  clear() {
    this.metrics = [];
  }
}

export const performanceCollector = new PerformanceMetricsCollector();

// =============================================================================
// WEB VITALS OBSERVER
// =============================================================================

export function observeWebVitals(callback) {
  if (typeof window === 'undefined' || !('PerformanceObserver' in window)) {
    return () => {};
  }
  
  const observers = [];
  
  // Largest Contentful Paint
  try {
    const lcpObserver = new PerformanceObserver((list) => {
      const entries = list.getEntries();
      const lastEntry = entries[entries.length - 1];
      callback({ name: 'LCP', value: lastEntry.startTime, rating: lastEntry.startTime < 2500 ? 'good' : lastEntry.startTime < 4000 ? 'needs-improvement' : 'poor' });
    });
    lcpObserver.observe({ type: 'largest-contentful-paint', buffered: true });
    observers.push(lcpObserver);
  } catch (e) {}
  
  // First Input Delay
  try {
    const fidObserver = new PerformanceObserver((list) => {
      const entries = list.getEntries();
      entries.forEach(entry => {
        callback({ name: 'FID', value: entry.processingStart - entry.startTime, rating: entry.processingStart - entry.startTime < 100 ? 'good' : entry.processingStart - entry.startTime < 300 ? 'needs-improvement' : 'poor' });
      });
    });
    fidObserver.observe({ type: 'first-input', buffered: true });
    observers.push(fidObserver);
  } catch (e) {}
  
  // Cumulative Layout Shift
  try {
    let clsValue = 0;
    const clsObserver = new PerformanceObserver((list) => {
      for (const entry of list.getEntries()) {
        if (!entry.hadRecentInput) {
          clsValue += entry.value;
        }
      }
      callback({ name: 'CLS', value: clsValue, rating: clsValue < 0.1 ? 'good' : clsValue < 0.25 ? 'needs-improvement' : 'poor' });
    });
    clsObserver.observe({ type: 'layout-shift', buffered: true });
    observers.push(clsObserver);
  } catch (e) {}
  
  return () => {
    observers.forEach(o => o.disconnect());
  };
}

// =============================================================================
// IDLE CALLBACK WRAPPER
// =============================================================================

export function runWhenIdle(fn, options = {}) {
  const { timeout = 1000 } = options;
  
  if ('requestIdleCallback' in window) {
    return window.requestIdleCallback(fn, { timeout });
  }
  
  // Fallback
  return setTimeout(fn, 1);
}

export function cancelIdleTask(id) {
  if ('cancelIdleCallback' in window) {
    window.cancelIdleCallback(id);
  } else {
    clearTimeout(id);
  }
}