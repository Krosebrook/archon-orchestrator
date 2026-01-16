// Web Vitals monitoring - removed to prevent dependency conflicts
// The web-vitals v5 library removed onFID in favor of onINP
// Performance monitoring is now handled directly in layout if needed

// No-op exports to prevent import errors during cache clearing
export const onCLS = () => {};
export const onFCP = () => {};
export const onLCP = () => {};
export const onTTFB = () => {};
export const onINP = () => {};

// No-op default export
export default function observeWebVitals() {
  return () => {};
}