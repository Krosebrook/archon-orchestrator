/**
 * @fileoverview Security Utilities
 * @module core/security/SecurityUtils
 * @description Production-grade security helpers
 */

// =============================================================================
// INPUT SANITIZATION
// =============================================================================

/**
 * Sanitize HTML to prevent XSS attacks
 * @param {string} input
 * @returns {string}
 */
export function sanitizeHTML(input) {
  const map = {
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#x27;',
    '/': '&#x2F;',
  };
  return input.replace(/[&<>"'/]/g, (char) => map[char]);
}

/**
 * Remove all HTML tags
 * @param {string} input
 * @returns {string}
 */
export function stripHTML(input) {
  return input.replace(/<[^>]*>/g, '');
}

/**
 * Sanitize SQL to prevent SQL injection
 * @param {string} input
 * @returns {string}
 */
export function sanitizeSQL(input) {
  return input.replace(/['";\\]/g, '\\$&');
}

/**
 * Sanitize shell commands
 * @param {string} input
 * @returns {string}
 */
export function sanitizeShellCommand(input) {
  return input.replace(/[;&|`$()]/g, '');
}

/**
 * Validate and sanitize URL — only http/https allowed
 * @param {string} input
 * @returns {string|null}
 */
export function sanitizeURL(input) {
  try {
    const url = new URL(input);
    if (!['http:', 'https:'].includes(url.protocol)) return null;
    return url.toString();
  } catch {
    return null;
  }
}

// =============================================================================
// VALIDATION
// =============================================================================

/**
 * Validate email format
 * @param {string} email
 * @returns {boolean}
 */
export function isValidEmail(email) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

/**
 * Validate UUID format
 * @param {string} uuid
 * @returns {boolean}
 */
export function isValidUUID(uuid) {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(uuid);
}

/**
 * Validate semantic version
 * @param {string} version
 * @returns {boolean}
 */
export function isValidSemver(version) {
  return /^\d+\.\d+\.\d+$/.test(version);
}

/**
 * Validate JSON string
 * @param {string} str
 * @returns {boolean}
 */
export function isValidJSON(str) {
  try {
    JSON.parse(str);
    return true;
  } catch {
    return false;
  }
}

// =============================================================================
// RATE LIMITING (CLIENT-SIDE)
// =============================================================================

export class RateLimiter {
  /** @type {Map<string, number[]>} */
  requests = new Map();

  /**
   * @param {number} maxRequests
   * @param {number} windowMs
   */
  constructor(maxRequests = 10, windowMs = 60000) {
    this.maxRequests = maxRequests;
    this.windowMs = windowMs;
  }

  /** @param {string} key @returns {boolean} */
  isAllowed(key) {
    const now = Date.now();
    const timestamps = (this.requests.get(key) || []).filter((t) => now - t < this.windowMs);
    if (timestamps.length >= this.maxRequests) return false;
    timestamps.push(now);
    this.requests.set(key, timestamps);
    return true;
  }

  /** @param {string} key */
  reset(key) {
    this.requests.delete(key);
  }

  /** @param {string} key @returns {number} */
  getRemaining(key) {
    const now = Date.now();
    const valid = (this.requests.get(key) || []).filter((t) => now - t < this.windowMs);
    return Math.max(0, this.maxRequests - valid.length);
  }
}

// =============================================================================
// CRYPTO HELPERS
// =============================================================================

/**
 * Generate a random hex token
 * @param {number} length
 * @returns {string}
 */
export function generateToken(length = 32) {
  const array = new Uint8Array(length);
  crypto.getRandomValues(array);
  return Array.from(array, (byte) => byte.toString(16).padStart(2, '0')).join('');
}

/**
 * Hash a string using SHA-256
 * @param {string} input
 * @returns {Promise<string>}
 */
export async function hashString(input) {
  const encoder = new TextEncoder();
  const data = encoder.encode(input);
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  return Array.from(new Uint8Array(hashBuffer))
    .map((byte) => byte.toString(16).padStart(2, '0'))
    .join('');
}

// =============================================================================
// CONTENT SECURITY POLICY
// NOTE: unsafe-inline and unsafe-eval removed — use nonces for any required
// inline scripts. Adjust connect-src to match your actual API domain.
// =============================================================================

export const CSP_DIRECTIVES = {
  'default-src': ["'self'"],
  'script-src': ["'self'"],
  'style-src': ["'self'", "'unsafe-inline'"], // Tailwind requires inline styles
  'img-src': ["'self'", 'data:', 'https:'],
  'font-src': ["'self'", 'data:'],
  'connect-src': ["'self'", 'https://api.base44.com'],
  'frame-ancestors': ["'none'"],
  'base-uri': ["'self'"],
  'form-action': ["'self'"],
};

/**
 * Build the CSP header value string
 * @returns {string}
 */
export function buildCSPHeader() {
  return Object.entries(CSP_DIRECTIVES)
    .map(([directive, sources]) => `${directive} ${sources.join(' ')}`)
    .join('; ');
}

// =============================================================================
// SECURE HEADERS
// =============================================================================

export const SECURE_HEADERS = {
  'X-Frame-Options': 'DENY',
  'X-Content-Type-Options': 'nosniff',
  'X-XSS-Protection': '1; mode=block',
  'Referrer-Policy': 'strict-origin-when-cross-origin',
  'Permissions-Policy': 'geolocation=(), microphone=(), camera=()',
  'Strict-Transport-Security': 'max-age=31536000; includeSubDomains',
};

// =============================================================================
// SECRETS DETECTION
// =============================================================================

const SECRET_PATTERNS = [
  /(?:api[_-]?key|apikey)[\s:=]+['"]?([a-zA-Z0-9_\-]{32,})['"]?/i,
  /(?:secret[_-]?key|secretkey)[\s:=]+['"]?([a-zA-Z0-9_\-]{32,})['"]?/i,
  /(?:access[_-]?token|accesstoken)[\s:=]+['"]?([a-zA-Z0-9_\-]{32,})['"]?/i,
  /(?:private[_-]?key|privatekey)[\s:=]+['"]?([a-zA-Z0-9_\-]{32,})['"]?/i,
  /(?:password|passwd|pwd)[\s:=]+['"]?([a-zA-Z0-9_\-!@#$%^&*]{8,})['"]?/i,
];

/** @param {string} input @returns {boolean} */
export function containsSecrets(input) {
  return SECRET_PATTERNS.some((pattern) => pattern.test(input));
}

/** @param {string} input @returns {string} */
export function redactSecrets(input) {
  let output = input;
  SECRET_PATTERNS.forEach((pattern) => {
    output = output.replace(pattern, (match, secret) => match.replace(secret, '***REDACTED***'));
  });
  return output;
}

// =============================================================================
// PII DETECTION
// =============================================================================

const PII_PATTERNS = [
  /\b\d{3}-\d{2}-\d{4}\b/g,
  /\b\d{16}\b/g,
  /\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b/g,
  /\b\d{3}[-.]?\d{3}[-.]?\d{4}\b/g,
];

/** @param {string} input @returns {boolean} */
export function containsPII(input) {
  return PII_PATTERNS.some((pattern) => pattern.test(input));
}

/** @param {string} input @returns {string} */
export function redactPII(input) {
  let output = input;
  PII_PATTERNS.forEach((pattern) => {
    output = output.replace(pattern, '***REDACTED***');
  });
  return output;
}