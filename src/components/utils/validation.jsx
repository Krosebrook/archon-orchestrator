/**
 * Validation Utilities
 * Axis: Security, Quality
 * 
 * Enhanced with:
 * - Zod-like schema validation
 * - Prompt injection defense
 * - XSS protection
 * - Input sanitization
 * - Rate limiting with sliding window
 */

// =============================================================================
// BASIC VALIDATORS
// =============================================================================

export function isValidEmail(email) {
  if (!email || typeof email !== 'string') return false;
  // RFC 5322 compliant (simplified)
  return /^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)*$/.test(email);
}

export function isValidUrl(url) {
  if (!url || typeof url !== 'string') return false;
  try {
    const parsed = new URL(url);
    return ['http:', 'https:'].includes(parsed.protocol);
  } catch {
    return false;
  }
}

export function isValidJson(str) {
  if (typeof str !== 'string') return false;
  try {
    JSON.parse(str);
    return true;
  } catch {
    return false;
  }
}

export function isValidUUID(uuid) {
  if (!uuid || typeof uuid !== 'string') return false;
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(uuid);
}

export function isValidSemver(version) {
  if (!version || typeof version !== 'string') return false;
  return /^\d+\.\d+\.\d+(-[a-zA-Z0-9.]+)?(\+[a-zA-Z0-9.]+)?$/.test(version);
}

// =============================================================================
// SANITIZATION (XSS Protection)
// =============================================================================

const HTML_ENTITIES = {
  '&': '&amp;',
  '<': '&lt;',
  '>': '&gt;',
  '"': '&quot;',
  "'": '&#x27;',
  '/': '&#x2F;',
  '`': '&#x60;',
  '=': '&#x3D;'
};

export function sanitizeHtml(input) {
  if (typeof input !== 'string') return input;
  return input.replace(/[&<>"'`=/]/g, char => HTML_ENTITIES[char]);
}

export function sanitizeInput(input, options = {}) {
  if (input === null || input === undefined) return input;
  
  if (typeof input === 'string') {
    let sanitized = input;
    
    // Trim if requested
    if (options.trim !== false) {
      sanitized = sanitized.trim();
    }
    
    // HTML escape by default
    if (options.escapeHtml !== false) {
      sanitized = sanitizeHtml(sanitized);
    }
    
    // Remove null bytes
    sanitized = sanitized.replace(/\0/g, '');
    
    // Normalize unicode if requested
    if (options.normalizeUnicode) {
      sanitized = sanitized.normalize('NFC');
    }
    
    // Truncate if max length specified
    if (options.maxLength && sanitized.length > options.maxLength) {
      sanitized = sanitized.substring(0, options.maxLength);
    }
    
    return sanitized;
  }
  
  if (Array.isArray(input)) {
    return input.map(item => sanitizeInput(item, options));
  }
  
  if (typeof input === 'object') {
    const sanitized = {};
    for (const [key, value] of Object.entries(input)) {
      sanitized[sanitizeInput(key, options)] = sanitizeInput(value, options);
    }
    return sanitized;
  }
  
  return input;
}

// =============================================================================
// PROMPT INJECTION DEFENSE
// =============================================================================

const PROMPT_INJECTION_PATTERNS = [
  // Direct instruction override
  /ignore\s+(previous|all|above|prior)\s+(instructions?|prompts?|rules?)/i,
  /disregard\s+(previous|all|above|prior)/i,
  /forget\s+(everything|all|previous)/i,
  
  // Role manipulation
  /you\s+are\s+(now|actually)\s+(a|an)/i,
  /pretend\s+(to\s+be|you\'re)/i,
  /act\s+as\s+(if\s+you\'re|a)/i,
  /roleplay\s+as/i,
  
  // System prompt extraction
  /what\s+(is|are)\s+your\s+(instructions?|rules?|system\s+prompt)/i,
  /show\s+(me\s+)?your\s+(system\s+)?prompt/i,
  /reveal\s+(your\s+)?instructions/i,
  
  // Jailbreak attempts
  /do\s+anything\s+now/i,
  /developer\s+mode/i,
  /jailbreak/i,
  /bypass\s+(restrictions?|filters?|safety)/i,
  
  // Code injection
  /<\s*script[^>]*>/i,
  /javascript\s*:/i,
  /on(error|load|click)\s*=/i,
  
  // SQL injection patterns (for context awareness)
  /(\b(union|select|insert|update|delete|drop|alter)\b.*\b(from|into|table|database)\b)/i,
  /(--)|(\/\*)/,
  
  // Template injection
  /\{\{.*\}\}/,
  /\$\{.*\}/
];

export function detectPromptInjection(input) {
  if (typeof input !== 'string') return { safe: true, threats: [] };
  
  const threats = [];
  const lowerInput = input.toLowerCase();
  
  for (const pattern of PROMPT_INJECTION_PATTERNS) {
    if (pattern.test(input)) {
      threats.push({
        pattern: pattern.source,
        match: input.match(pattern)?.[0]
      });
    }
  }
  
  // Check for suspicious character sequences
  if ((input.match(/[<>{}[\]]/g) || []).length > 10) {
    threats.push({ pattern: 'excessive_special_chars', match: 'Multiple special characters detected' });
  }
  
  // Check for base64 encoded payloads (potential obfuscation)
  const base64Pattern = /[A-Za-z0-9+/]{40,}={0,2}/;
  if (base64Pattern.test(input)) {
    threats.push({ pattern: 'base64_payload', match: 'Potential encoded payload detected' });
  }
  
  return {
    safe: threats.length === 0,
    threats,
    riskLevel: threats.length === 0 ? 'none' : threats.length <= 2 ? 'low' : 'high'
  };
}

export function sanitizePromptInput(input, options = {}) {
  if (typeof input !== 'string') return input;
  
  let sanitized = input;
  
  // Remove control characters
  sanitized = sanitized.replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/g, '');
  
  // Normalize whitespace
  sanitized = sanitized.replace(/\s+/g, ' ').trim();
  
  // Escape markdown-like patterns that could be interpreted as instructions
  if (options.escapeMarkdown) {
    sanitized = sanitized
      .replace(/^#+\s/gm, '')
      .replace(/^>\s/gm, '')
      .replace(/^-\s/gm, '• ')
      .replace(/\*\*/g, '')
      .replace(/__/g, '');
  }
  
  // Truncate to max length
  const maxLength = options.maxLength || 10000;
  if (sanitized.length > maxLength) {
    sanitized = sanitized.substring(0, maxLength) + '...';
  }
  
  return sanitized;
}

// =============================================================================
// SCHEMA VALIDATION (Zod-like)
// =============================================================================

class ValidationResult {
  constructor(valid, errors = [], data = null) {
    this.valid = valid;
    this.errors = errors;
    this.data = data;
  }
  
  static success(data) {
    return new ValidationResult(true, [], data);
  }
  
  static failure(errors) {
    return new ValidationResult(false, Array.isArray(errors) ? errors : [errors], null);
  }
}

export const Schema = {
  string(options = {}) {
    return (value, path = '') => {
      if (value === undefined || value === null) {
        if (options.optional) return ValidationResult.success(options.default ?? null);
        return ValidationResult.failure({ path, message: 'Required field is missing' });
      }
      
      if (typeof value !== 'string') {
        return ValidationResult.failure({ path, message: 'Expected string' });
      }
      
      let processed = value;
      
      if (options.trim !== false) {
        processed = processed.trim();
      }
      
      if (options.minLength && processed.length < options.minLength) {
        return ValidationResult.failure({ path, message: `Minimum length is ${options.minLength}` });
      }
      
      if (options.maxLength && processed.length > options.maxLength) {
        return ValidationResult.failure({ path, message: `Maximum length is ${options.maxLength}` });
      }
      
      if (options.pattern && !options.pattern.test(processed)) {
        return ValidationResult.failure({ path, message: options.patternMessage || 'Invalid format' });
      }
      
      if (options.email && !isValidEmail(processed)) {
        return ValidationResult.failure({ path, message: 'Invalid email address' });
      }
      
      if (options.url && !isValidUrl(processed)) {
        return ValidationResult.failure({ path, message: 'Invalid URL' });
      }
      
      if (options.enum && !options.enum.includes(processed)) {
        return ValidationResult.failure({ path, message: `Must be one of: ${options.enum.join(', ')}` });
      }
      
      return ValidationResult.success(processed);
    };
  },
  
  number(options = {}) {
    return (value, path = '') => {
      if (value === undefined || value === null) {
        if (options.optional) return ValidationResult.success(options.default ?? null);
        return ValidationResult.failure({ path, message: 'Required field is missing' });
      }
      
      const num = typeof value === 'string' ? parseFloat(value) : value;
      
      if (typeof num !== 'number' || isNaN(num)) {
        return ValidationResult.failure({ path, message: 'Expected number' });
      }
      
      if (options.integer && !Number.isInteger(num)) {
        return ValidationResult.failure({ path, message: 'Expected integer' });
      }
      
      if (options.min !== undefined && num < options.min) {
        return ValidationResult.failure({ path, message: `Minimum value is ${options.min}` });
      }
      
      if (options.max !== undefined && num > options.max) {
        return ValidationResult.failure({ path, message: `Maximum value is ${options.max}` });
      }
      
      if (options.positive && num <= 0) {
        return ValidationResult.failure({ path, message: 'Must be positive' });
      }
      
      return ValidationResult.success(num);
    };
  },
  
  boolean(options = {}) {
    return (value, path = '') => {
      if (value === undefined || value === null) {
        if (options.optional) return ValidationResult.success(options.default ?? null);
        return ValidationResult.failure({ path, message: 'Required field is missing' });
      }
      
      if (typeof value === 'string') {
        if (value.toLowerCase() === 'true') return ValidationResult.success(true);
        if (value.toLowerCase() === 'false') return ValidationResult.success(false);
      }
      
      if (typeof value !== 'boolean') {
        return ValidationResult.failure({ path, message: 'Expected boolean' });
      }
      
      return ValidationResult.success(value);
    };
  },
  
  array(itemSchema, options = {}) {
    return (value, path = '') => {
      if (value === undefined || value === null) {
        if (options.optional) return ValidationResult.success(options.default ?? []);
        return ValidationResult.failure({ path, message: 'Required field is missing' });
      }
      
      if (!Array.isArray(value)) {
        return ValidationResult.failure({ path, message: 'Expected array' });
      }
      
      if (options.minLength && value.length < options.minLength) {
        return ValidationResult.failure({ path, message: `Minimum ${options.minLength} items required` });
      }
      
      if (options.maxLength && value.length > options.maxLength) {
        return ValidationResult.failure({ path, message: `Maximum ${options.maxLength} items allowed` });
      }
      
      const results = [];
      const errors = [];
      
      for (let i = 0; i < value.length; i++) {
        const result = itemSchema(value[i], `${path}[${i}]`);
        if (!result.valid) {
          errors.push(...result.errors);
        } else {
          results.push(result.data);
        }
      }
      
      if (errors.length > 0) {
        return ValidationResult.failure(errors);
      }
      
      return ValidationResult.success(results);
    };
  },
  
  object(shape, options = {}) {
    return (value, path = '') => {
      if (value === undefined || value === null) {
        if (options.optional) return ValidationResult.success(options.default ?? null);
        return ValidationResult.failure({ path, message: 'Required field is missing' });
      }
      
      if (typeof value !== 'object' || Array.isArray(value)) {
        return ValidationResult.failure({ path, message: 'Expected object' });
      }
      
      const result = {};
      const errors = [];
      
      for (const [key, validator] of Object.entries(shape)) {
        const fieldPath = path ? `${path}.${key}` : key;
        const fieldResult = validator(value[key], fieldPath);
        
        if (!fieldResult.valid) {
          errors.push(...fieldResult.errors);
        } else if (fieldResult.data !== null) {
          result[key] = fieldResult.data;
        }
      }
      
      // Check for extra keys if strict mode
      if (options.strict) {
        const allowedKeys = new Set(Object.keys(shape));
        for (const key of Object.keys(value)) {
          if (!allowedKeys.has(key)) {
            errors.push({ path: path ? `${path}.${key}` : key, message: 'Unknown field' });
          }
        }
      }
      
      if (errors.length > 0) {
        return ValidationResult.failure(errors);
      }
      
      return ValidationResult.success(result);
    };
  }
};

export function validate(schema, value) {
  return schema(value);
}

// =============================================================================
// DOMAIN-SPECIFIC VALIDATORS
// =============================================================================

export const WorkflowNameSchema = Schema.string({
  minLength: 3,
  maxLength: 100,
  pattern: /^[a-zA-Z0-9][a-zA-Z0-9\s_-]*$/,
  patternMessage: 'Must start with letter/number, can contain spaces, underscores, hyphens'
});

export const AgentConfigSchema = Schema.object({
  provider: Schema.string({ enum: ['openai', 'anthropic'] }),
  model: Schema.string({ minLength: 1, maxLength: 50 }),
  temperature: Schema.number({ min: 0, max: 2, optional: true, default: 0.7 }),
  max_tokens: Schema.number({ integer: true, min: 1, max: 100000, optional: true, default: 2000 }),
  capabilities: Schema.array(Schema.string({ maxLength: 50 }), { optional: true, default: [] })
});

export function validateWorkflowName(name) {
  const result = WorkflowNameSchema(name);
  return { valid: result.valid, error: result.errors[0]?.message };
}

export function validateAgentConfig(config) {
  const result = AgentConfigSchema(config);
  return { valid: result.valid, errors: result.errors.map(e => e.message) };
}

// =============================================================================
// RATE LIMITING (Sliding Window)
// =============================================================================

class SlidingWindowRateLimiter {
  constructor() {
    this.windows = new Map();
  }
  
  check(key, limit = 10, windowMs = 60000) {
    const now = Date.now();
    const windowStart = now - windowMs;
    
    let timestamps = this.windows.get(key) || [];
    
    // Remove expired timestamps
    timestamps = timestamps.filter(t => t > windowStart);
    
    const count = timestamps.length;
    const allowed = count < limit;
    
    if (allowed) {
      timestamps.push(now);
    }
    
    this.windows.set(key, timestamps);
    
    // Cleanup old entries periodically
    if (Math.random() < 0.01) {
      this.cleanup(windowMs);
    }
    
    return {
      allowed,
      remaining: Math.max(0, limit - count - (allowed ? 1 : 0)),
      resetAt: timestamps.length > 0 ? timestamps[0] + windowMs : now + windowMs,
      limit
    };
  }
  
  cleanup(maxAge = 60000) {
    const now = Date.now();
    for (const [key, timestamps] of this.windows.entries()) {
      const validTimestamps = timestamps.filter(t => t > now - maxAge);
      if (validTimestamps.length === 0) {
        this.windows.delete(key);
      } else {
        this.windows.set(key, validTimestamps);
      }
    }
  }
  
  reset(key) {
    this.windows.delete(key);
  }
}

const rateLimiter = new SlidingWindowRateLimiter();

export function checkRateLimit(key, limit = 10, windowMs = 60000) {
  return rateLimiter.check(key, limit, windowMs);
}

export function resetRateLimit(key) {
  rateLimiter.reset(key);
}