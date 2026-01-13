/**
 * Web Vitals Performance Monitoring
 * Tracks Core Web Vitals and reports them to analytics/monitoring services
 * 
 * @module utils/web-vitals
 * @see https://web.dev/vitals/
 */

import { onCLS, onFID, onFCP, onLCP, onTTFB, onINP } from 'web-vitals';
import * as Sentry from '@sentry/react';

/**
 * Send Web Vitals metric to Sentry for performance monitoring
 */
function sendToSentry(metric) {
  // Only send in production or when explicitly enabled
  if (!import.meta.env.PROD && !import.meta.env.VITE_WEB_VITALS_DEV) {
    console.log('[Web Vitals]', metric.name, metric.value, metric.rating);
    return;
  }

  // Send to Sentry as a measurement
  if (Sentry.getCurrentHub && Sentry.getCurrentHub().getClient()) {
    const transaction = Sentry.getCurrentHub().getScope().getTransaction();
    if (transaction) {
      transaction.setMeasurement(metric.name, metric.value, 'millisecond');
    }

    // Also send as a custom event for more detailed tracking
    Sentry.captureMessage(`Web Vital: ${metric.name}`, {
      level: metric.rating === 'good' ? 'info' : metric.rating === 'needs-improvement' ? 'warning' : 'error',
      tags: {
        metric_name: metric.name,
        metric_rating: metric.rating,
      },
      contexts: {
        webVitals: {
          name: metric.name,
          value: metric.value,
          rating: metric.rating,
          delta: metric.delta,
          id: metric.id,
          navigationType: metric.navigationType,
        },
      },
    });
  }
}

/**
 * Send Web Vitals metric to Google Analytics (if configured)
 */
function sendToGoogleAnalytics(metric) {
  // Check if Google Analytics is available
  if (window.gtag) {
    window.gtag('event', metric.name, {
      event_category: 'Web Vitals',
      value: Math.round(metric.name === 'CLS' ? metric.value * 1000 : metric.value),
      event_label: metric.id,
      non_interaction: true,
    });
  }
}

/**
 * Send Web Vitals metric to custom analytics endpoint
 */
async function sendToAnalytics(metric) {
  // Send to your custom analytics endpoint
  try {
    await fetch('/api/analytics/web-vitals', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: metric.name,
        value: metric.value,
        rating: metric.rating,
        delta: metric.delta,
        id: metric.id,
        navigationType: metric.navigationType,
        timestamp: Date.now(),
        url: window.location.href,
        userAgent: navigator.userAgent,
      }),
      keepalive: true, // Ensure request completes even if page is unloading
    });
  } catch (error) {
    // Silently fail - don't block user experience
    console.error('[Web Vitals] Failed to send to analytics:', error);
  }
}

/**
 * Log Web Vitals to console with color coding based on rating
 */
function logToConsole(metric) {
  const colors = {
    good: 'color: green; font-weight: bold',
    'needs-improvement': 'color: orange; font-weight: bold',
    poor: 'color: red; font-weight: bold',
  };

  console.log(
    `%c[Web Vitals] ${metric.name}: ${metric.value.toFixed(2)}ms (${metric.rating})`,
    colors[metric.rating] || 'color: gray'
  );
}

/**
 * Handle Web Vitals metric reporting
 */
function handleMetric(metric) {
  // Always log to console in development
  if (import.meta.env.DEV || import.meta.env.VITE_WEB_VITALS_DEBUG) {
    logToConsole(metric);
  }

  // Send to monitoring services
  sendToSentry(metric);
  sendToGoogleAnalytics(metric);
  
  // Send to custom analytics (async, don't block)
  if (import.meta.env.VITE_WEB_VITALS_ENDPOINT) {
    sendToAnalytics(metric).catch(() => {});
  }
}

/**
 * Initialize Web Vitals monitoring
 * Call this function once in your application entry point (main.jsx)
 * 
 * @example
 * import { initWebVitals } from '@/utils/web-vitals';
 * initWebVitals();
 */
export function initWebVitals() {
  // Only initialize if not already done
  if (window.__webVitalsInitialized) {
    return;
  }
  window.__webVitalsInitialized = true;

  // Track Core Web Vitals
  onCLS(handleMetric);  // Cumulative Layout Shift
  onFID(handleMetric);  // First Input Delay (deprecated, but still tracked)
  onFCP(handleMetric);  // First Contentful Paint
  onLCP(handleMetric);  // Largest Contentful Paint
  onTTFB(handleMetric); // Time to First Byte
  onINP(handleMetric);  // Interaction to Next Paint (successor to FID)

  console.log('[Web Vitals] Monitoring initialized');
}

/**
 * Get current Web Vitals thresholds
 * Based on https://web.dev/defining-core-web-vitals-thresholds/
 */
export const WEB_VITALS_THRESHOLDS = {
  CLS: {
    good: 0.1,
    needsImprovement: 0.25,
  },
  FID: {
    good: 100,
    needsImprovement: 300,
  },
  FCP: {
    good: 1800,
    needsImprovement: 3000,
  },
  LCP: {
    good: 2500,
    needsImprovement: 4000,
  },
  TTFB: {
    good: 800,
    needsImprovement: 1800,
  },
  INP: {
    good: 200,
    needsImprovement: 500,
  },
};

/**
 * Determine rating based on metric value and thresholds
 */
export function getMetricRating(metricName, value) {
  const threshold = WEB_VITALS_THRESHOLDS[metricName];
  if (!threshold) return 'unknown';
  
  if (value <= threshold.good) return 'good';
  if (value <= threshold.needsImprovement) return 'needs-improvement';
  return 'poor';
}

export default {
  initWebVitals,
  WEB_VITALS_THRESHOLDS,
  getMetricRating,
};
