/**
 * @fileoverview Web Vitals Reporting
 * @description Reports Core Web Vitals using web-vitals v4+ APIs.
 * onFID was removed in web-vitals v4; onINP is the replacement.
 * @version 3.0.0
 */

function sendToConsole(metric) {
  if (import.meta.env.DEV) {
    console.debug('[WebVitals]', metric.name, Math.round(metric.value), metric.rating);
  }
}

export async function reportWebVitals(onPerfEntry) {
  try {
    const { onCLS, onINP, onFCP, onLCP, onTTFB } = await import('web-vitals');
    const handler = typeof onPerfEntry === 'function' ? onPerfEntry : sendToConsole;
    onCLS(handler);
    onINP(handler);
    onFCP(handler);
    onLCP(handler);
    onTTFB(handler);
  } catch (e) {
    // web-vitals unavailable
  }
}