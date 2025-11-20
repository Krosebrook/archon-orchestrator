export function isValidEmail(email) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

export function isValidUrl(url) {
  try { new URL(url); return true; } catch { return false; }
}

export function isValidJson(str) {
  try { JSON.parse(str); return true; } catch { return false; }
}

export function sanitizeInput(input) {
  if (typeof input !== 'string') return input;
  return input.replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}

export function validateWorkflowName(name) {
  if (!name?.trim()) return { valid: false, error: 'Workflow name is required' };
  if (name.length < 3) return { valid: false, error: 'Minimum 3 characters' };
  if (name.length > 100) return { valid: false, error: 'Maximum 100 characters' };
  return { valid: true };
}

export function validateAgentConfig(config) {
  const errors = [];
  if (!config.provider) errors.push('Provider is required');
  if (!config.model) errors.push('Model is required');
  if (config.temperature !== undefined && (config.temperature < 0 || config.temperature > 2)) {
    errors.push('Temperature must be 0-2');
  }
  return { valid: errors.length === 0, errors };
}

const requestCounts = new Map();
export function checkRateLimit(key, limit = 10, windowMs = 60000) {
  const now = Date.now();
  const record = requestCounts.get(key) || { count: 0, resetAt: now + windowMs };
  if (now >= record.resetAt) {
    record.count = 0;
    record.resetAt = now + windowMs;
  }
  record.count++;
  requestCounts.set(key, record);
  return { allowed: record.count <= limit, remaining: Math.max(0, limit - record.count) };
}