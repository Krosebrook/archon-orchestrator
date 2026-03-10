/**
 * @fileoverview Web Vitals Reporting
 * @description Reports Core Web Vitals using web-vitals v5+ (onFID removed, onINP added).
 * No Sentry getCurrentHub dependency - uses only stable web-vitals and Sentry v8 APIs.
 */

import { onCLS, onINP, onFCP, onLCP, onTTFB } from 'web-vitals';

function sendToConsole(metric) {
  if (import.meta.env.DEV) {
    console.debug('[WebVitals]', metric.name, Math.round(metric.value), metric.rating);
  }
}

export function reportWebVitals(onPerfEntry) {
  const handler = typeof onPerfEntry === 'function' ? onPerfEntry : sendToConsole;
  onCLS(handler);
  onINP(handler);   // Replaces onFID (removed in web-vitals v4)
  onFCP(handler);
  onLCP(handler);
  onTTFB(handler);
}