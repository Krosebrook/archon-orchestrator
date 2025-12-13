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
 */
export function sanitizeHTML(input: string): string {
  const map: Record<string, string> = {
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#x27;',
    '/': '&#x2F;',
  };
  
  return input.replace(/[&<>"'/]/g, char => map[char]);
}

/**
 * Remove all HTML tags
 */
export function stripHTML(input: string): string {
  return input.replace(/<[^>]*>/g, '');
}

/**
 * Sanitize SQL to prevent SQL injection
 */
export function sanitizeSQL(input: string): string {
  return input.replace(/['";\\]/g, '\\$&');
}

/**
 * Sanitize shell commands
 */
export function sanitizeShellCommand(input: string): string {
  return input.replace(/[;&|`$()]/g, '');
}

/**
 * Validate and sanitize URL
 */
export function sanitizeURL(input: string): string | null {
  try {
    const url = new URL(input);
    
    // Only allow http and https protocols
    if (!['http:', 'https:'].includes(url.protocol)) {
      return null;
    }
    
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
 */
export function isValidEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

/**
 * Validate UUID format
 */
export function isValidUUID(uuid: string): boolean {
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
  return uuidRegex.test(uuid);
}

/**
 * Validate semantic version
 */
export function isValidSemver(version: string): boolean {
  const semverRegex = /^\d+\.\d+\.\d+$/;
  return semverRegex.test(version);
}

/**
 * Validate JSON string
 */
export function isValidJSON(str: string): boolean {
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
  private requests: Map<string, number[]> = new Map();
  
  constructor(
    private maxRequests: number = 10,
    private windowMs: number = 60000
  ) {}

  /**
   * Check if request is allowed
   */
  isAllowed(key: string): boolean {
    const now = Date.now();
    const timestamps = this.requests.get(key) || [];
    
    // Remove old timestamps outside the window
    const validTimestamps = timestamps.filter(t => now - t < this.windowMs);
    
    // Check if limit is exceeded
    if (validTimestamps.length >= this.maxRequests) {
      return false;
    }
    
    // Add current timestamp
    validTimestamps.push(now);
    this.requests.set(key, validTimestamps);
    
    return true;
  }

  /**
   * Reset rate limit for a key
   */
  reset(key: string): void {
    this.requests.delete(key);
  }

  /**
   * Get remaining requests
   */
  getRemaining(key: string): number {
    const now = Date.now();
    const timestamps = this.requests.get(key) || [];
    const validTimestamps = timestamps.filter(t => now - t < this.windowMs);
    
    return Math.max(0, this.maxRequests - validTimestamps.length);
  }
}

// =============================================================================
// CRYPTO HELPERS
// =============================================================================

/**
 * Generate a random token
 */
export function generateToken(length: number = 32): string {
  const array = new Uint8Array(length);
  crypto.getRandomValues(array);
  return Array.from(array, byte => byte.toString(16).padStart(2, '0')).join('');
}

/**
 * Hash a string using SHA-256
 */
export async function hashString(input: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(input);
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map(byte => byte.toString(16).padStart(2, '0')).join('');
}

// =============================================================================
// CONTENT SECURITY POLICY
// =============================================================================

export const CSP_DIRECTIVES = {
  'default-src': ["'self'"],
  'script-src': ["'self'", "'unsafe-inline'", "'unsafe-eval'"],
  'style-src': ["'self'", "'unsafe-inline'"],
  'img-src': ["'self'", 'data:', 'https:'],
  'font-src': ["'self'", 'data:'],
  'connect-src': ["'self'", 'https://api.base44.com'],
  'frame-ancestors': ["'none'"],
  'base-uri': ["'self'"],
  'form-action': ["'self'"],
};

export function buildCSPHeader(): string {
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

/**
 * Check if string contains potential secrets
 */
export function containsSecrets(input: string): boolean {
  return SECRET_PATTERNS.some(pattern => pattern.test(input));
}

/**
 * Redact secrets from string
 */
export function redactSecrets(input: string): string {
  let output = input;
  
  SECRET_PATTERNS.forEach(pattern => {
    output = output.replace(pattern, (match, secret) => {
      return match.replace(secret, '***REDACTED***');
    });
  });
  
  return output;
}

// =============================================================================
// PII DETECTION
// =============================================================================

const PII_PATTERNS = [
  /\b\d{3}-\d{2}-\d{4}\b/g, // SSN
  /\b\d{16}\b/g, // Credit card
  /\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b/g, // Email
  /\b\d{3}[-.]?\d{3}[-.]?\d{4}\b/g, // Phone number
];

/**
 * Check if string contains PII
 */
export function containsPII(input: string): boolean {
  return PII_PATTERNS.some(pattern => pattern.test(input));
}

/**
 * Redact PII from string
 */
export function redactPII(input: string): string {
  let output = input;
  
  PII_PATTERNS.forEach(pattern => {
    output = output.replace(pattern, '***REDACTED***');
  });
  
  return output;
}