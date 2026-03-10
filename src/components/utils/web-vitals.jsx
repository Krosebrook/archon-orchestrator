/**
 * @fileoverview Web Vitals Reporting
 * @description Reports Core Web Vitals using web-vitals v4+ APIs.
 * onFID was removed in web-vitals v4; onINP is the replacement.
 * @version 2.0.0
 */

// web-vitals v4+: onFID removed, onINP replaces it
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