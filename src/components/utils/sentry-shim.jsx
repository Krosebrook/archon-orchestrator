/**
 * Sentry v8+ compatibility shim.
 * getCurrentHub was removed in @sentry/react v8. This provides a no-op
 * so any injected build tooling that references the old API doesn't crash.
 */

// getCurrentHub is a no-op stub for Sentry v8+ compatibility
export function getCurrentHub() {
  return {
    getClient: () => undefined,
    getScope: () => ({ getTransaction: () => undefined }),
    captureException: () => undefined,
    captureMessage: () => undefined,
  };
}