/**
 * @fileoverview Web Vitals Reporting
 * @description Reports Core Web Vitals using web-vitals v4+ (onFID removed, onINP added).
 * Sentry integration uses the modern `getActiveSpan` API (getCurrentHub was removed in v8).
 */

import { onCLS, onINP, onFCP, onLCP, onTTFB } from 'web-vitals';

function sendToAnalytics(metric) {
  // Report to console in dev; hook into analytics service in prod
  if (import.meta.env.DEV) {
    console.debug('[WebVitals]', metric.name, metric.value, metric);
  }

  // Optional: send to a custom analytics endpoint
  if (import.meta.env.VITE_ANALYTICS_ENDPOINT) {
    navigator.sendBeacon?.(import.meta.env.VITE_ANALYTICS_ENDPOINT, JSON.stringify({
      name: metric.name,
      value: metric.value,
      rating: metric.rating,
      delta: metric.delta,
      id: metric.id,
    }));
  }
}

export function reportWebVitals(onPerfEntry) {
  const handler = onPerfEntry || sendToAnalytics;
  onCLS(handler);
  onINP(handler);   // Replaces onFID (removed in web-vitals v4)
  onFCP(handler);
  onLCP(handler);
  onTTFB(handler);
}