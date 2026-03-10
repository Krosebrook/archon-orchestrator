/**
 * @fileoverview Shared Correlation ID
 * @description Single source of truth for request correlation tracking used by
 * both the API client and audit logger to enable end-to-end request tracing.
 *
 * @module utils/correlation
 */

let _correlationId = null;

/**
 * Get the current correlation ID, generating one if none exists.
 * @returns {string}
 */
export function getCorrelationId() {
  if (!_correlationId) {
    _correlationId = `cid_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }
  return _correlationId;
}

/**
 * Reset and generate a new correlation ID.
 * Call at the start of a new user action or request chain.
 * @returns {string}
 */
export function resetCorrelationId() {
  _correlationId = `cid_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  return _correlationId;
}

/**
 * Set an explicit correlation ID (e.g., from an inbound request header).
 * @param {string} id
 */
export function setCorrelationId(id) {
  _correlationId = id;
}