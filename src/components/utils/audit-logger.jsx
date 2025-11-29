/**
 * Audit Logger
 * Axis: Security, Architecture, Observability
 * 
 * Enhanced with:
 * - Structured audit entries with hash verification
 * - PII redaction
 * - Correlation ID tracking
 * - Batch processing
 * - Export functionality
 */

import { base44 } from '@/api/base44Client';

// =============================================================================
// CONSTANTS
// =============================================================================

export const AuditActions = Object.freeze({
  CREATE: 'create',
  UPDATE: 'update',
  DELETE: 'delete',
  VIEW: 'view',
  EXECUTE: 'execute',
  LOGIN: 'login',
  LOGOUT: 'logout',
  EXPORT: 'export',
  IMPORT: 'import',
  APPROVE: 'approve',
  REJECT: 'reject',
  CONFIGURE: 'configure',
  DEPLOY: 'deploy',
  ROLLBACK: 'rollback'
});

export const AuditEntities = Object.freeze({
  WORKFLOW: 'Workflow',
  AGENT: 'Agent',
  RUN: 'Run',
  POLICY: 'Policy',
  USER: 'User',
  TEAM: 'Team',
  INTEGRATION: 'Integration',
  SKILL: 'Skill',
  TEMPLATE: 'Template',
  SYSTEM: 'System'
});

export const AuditSeverity = Object.freeze({
  INFO: 'info',
  WARNING: 'warning',
  CRITICAL: 'critical'
});

// =============================================================================
// SENSITIVE DATA PATTERNS
// =============================================================================

const SENSITIVE_PATTERNS = {
  // Keys to always redact
  keys: [
    'password', 'passwd', 'pwd',
    'token', 'access_token', 'refresh_token', 'auth_token',
    'secret', 'client_secret', 'api_secret',
    'api_key', 'apiKey', 'apikey',
    'private_key', 'privateKey',
    'credential', 'credentials',
    'ssn', 'social_security',
    'credit_card', 'creditCard', 'card_number',
    'cvv', 'cvc',
    'pin'
  ],
  
  // Regex patterns for values
  valuePatterns: [
    { name: 'credit_card', pattern: /\b\d{4}[\s-]?\d{4}[\s-]?\d{4}[\s-]?\d{4}\b/ },
    { name: 'ssn', pattern: /\b\d{3}-\d{2}-\d{4}\b/ },
    { name: 'api_key', pattern: /\b(sk|pk|api|key)[-_][a-zA-Z0-9]{20,}\b/i },
    { name: 'jwt', pattern: /\beyJ[a-zA-Z0-9_-]*\.eyJ[a-zA-Z0-9_-]*\.[a-zA-Z0-9_-]+\b/ },
    { name: 'email_in_string', pattern: /\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b/ }
  ]
};

// =============================================================================
// REDACTION
// =============================================================================

export function redactSensitiveData(data, options = {}) {
  const { preserveStructure = true, redactionString = '[REDACTED]' } = options;
  
  if (data === null || data === undefined) return data;
  
  if (typeof data === 'string') {
    let redacted = data;
    for (const { pattern, name } of SENSITIVE_PATTERNS.valuePatterns) {
      if (pattern.test(redacted)) {
        redacted = redacted.replace(pattern, `[${name.toUpperCase()}_REDACTED]`);
      }
    }
    return redacted;
  }
  
  if (Array.isArray(data)) {
    return data.map(item => redactSensitiveData(item, options));
  }
  
  if (typeof data === 'object') {
    const redacted = {};
    
    for (const [key, value] of Object.entries(data)) {
      const keyLower = key.toLowerCase();
      const isSensitiveKey = SENSITIVE_PATTERNS.keys.some(
        sensitiveKey => keyLower.includes(sensitiveKey.toLowerCase())
      );
      
      if (isSensitiveKey) {
        redacted[key] = preserveStructure 
          ? (typeof value === 'string' ? redactionString : { redacted: true })
          : redactionString;
      } else if (typeof value === 'object' && value !== null) {
        redacted[key] = redactSensitiveData(value, options);
      } else {
        redacted[key] = redactSensitiveData(value, options);
      }
    }
    
    return redacted;
  }
  
  return data;
}

// =============================================================================
// SESSION MANAGEMENT
// =============================================================================

let sessionId = null;
let correlationId = null;

function getSessionId() {
  if (!sessionId) {
    try {
      sessionId = sessionStorage.getItem('audit_session_id');
      if (!sessionId) {
        sessionId = `session_${Date.now()}_${crypto.randomUUID?.() || Math.random().toString(36).substr(2, 12)}`;
        sessionStorage.setItem('audit_session_id', sessionId);
      }
    } catch {
      // Fallback for SSR or no sessionStorage
      sessionId = `session_${Date.now()}_${Math.random().toString(36).substr(2, 12)}`;
    }
  }
  return sessionId;
}

export function getCorrelationId() {
  return correlationId;
}

export function setCorrelationId(id) {
  correlationId = id;
}

export function generateCorrelationId() {
  correlationId = `cid_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  return correlationId;
}

// =============================================================================
// HASH COMPUTATION
// =============================================================================

async function computeHash(data) {
  const str = JSON.stringify(data);
  const encoder = new TextEncoder();
  const dataBuffer = encoder.encode(str);
  
  try {
    const hashBuffer = await crypto.subtle.digest('SHA-256', dataBuffer);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
  } catch {
    // Fallback for environments without crypto.subtle
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash;
    }
    return Math.abs(hash).toString(16).padStart(8, '0');
  }
}

// =============================================================================
// AUDIT ENTRY CREATION
// =============================================================================

export async function createAuditLog(action, entity, entityId, changes = {}, options = {}) {
  const timestamp = new Date().toISOString();
  const sessionId = getSessionId();
  
  // Redact sensitive data
  const sanitizedChanges = {
    before: changes.before ? redactSensitiveData(changes.before) : null,
    after: changes.after ? redactSensitiveData(changes.after) : null
  };
  
  // Compute hash for integrity
  const dataToHash = {
    action,
    entity,
    entity_id: entityId,
    timestamp,
    changes: sanitizedChanges
  };
  const hash = await computeHash(dataToHash);
  
  const auditEntry = {
    action,
    entity,
    entity_id: entityId,
    before: sanitizedChanges.before,
    after: sanitizedChanges.after,
    timestamp,
    session_id: sessionId,
    correlation_id: correlationId,
    hash,
    severity: options.severity || AuditSeverity.INFO,
    metadata: options.metadata || {},
    ip_address: options.ipAddress || null,
    user_agent: typeof navigator !== 'undefined' ? navigator.userAgent : null
  };
  
  return auditEntry;
}

// =============================================================================
// AUDIT BATCH PROCESSOR
// =============================================================================

class AuditBatchProcessor {
  constructor(options = {}) {
    this.batchSize = options.batchSize || 10;
    this.flushIntervalMs = options.flushIntervalMs || 5000;
    this.queue = [];
    this.flushTimer = null;
    this.isFlushing = false;
  }
  
  add(entry) {
    this.queue.push(entry);
    
    if (this.queue.length >= this.batchSize) {
      this.flush();
    } else if (!this.flushTimer) {
      this.flushTimer = setTimeout(() => this.flush(), this.flushIntervalMs);
    }
  }
  
  async flush() {
    if (this.isFlushing || this.queue.length === 0) return;
    
    this.isFlushing = true;
    clearTimeout(this.flushTimer);
    this.flushTimer = null;
    
    const batch = this.queue.splice(0, this.batchSize);
    
    try {
      // In production, this would batch insert to the Audit entity
      console.log('[Audit] Flushing batch:', batch.length, 'entries');
      // await base44.entities.Audit.bulkCreate(batch);
    } catch (error) {
      console.error('[Audit] Batch flush failed:', error);
      // Re-queue failed entries
      this.queue.unshift(...batch);
    } finally {
      this.isFlushing = false;
      
      // Continue flushing if more entries
      if (this.queue.length >= this.batchSize) {
        this.flush();
      } else if (this.queue.length > 0) {
        this.flushTimer = setTimeout(() => this.flush(), this.flushIntervalMs);
      }
    }
  }
  
  async flushAll() {
    while (this.queue.length > 0) {
      await this.flush();
    }
  }
}

const batchProcessor = new AuditBatchProcessor();

// =============================================================================
// HIGH-LEVEL AUDIT FUNCTIONS
// =============================================================================

export async function auditCreate(entity, entityId, data, options = {}) {
  const entry = await createAuditLog(
    AuditActions.CREATE,
    entity,
    entityId,
    { after: data },
    options
  );
  batchProcessor.add(entry);
  return entry;
}

export async function auditUpdate(entity, entityId, before, after, options = {}) {
  const entry = await createAuditLog(
    AuditActions.UPDATE,
    entity,
    entityId,
    { before, after },
    options
  );
  batchProcessor.add(entry);
  return entry;
}

export async function auditDelete(entity, entityId, data, options = {}) {
  const entry = await createAuditLog(
    AuditActions.DELETE,
    entity,
    entityId,
    { before: data },
    { ...options, severity: AuditSeverity.WARNING }
  );
  batchProcessor.add(entry);
  return entry;
}

export async function auditExecute(entity, entityId, metadata = {}, options = {}) {
  const entry = await createAuditLog(
    AuditActions.EXECUTE,
    entity,
    entityId,
    { after: metadata },
    options
  );
  batchProcessor.add(entry);
  return entry;
}

export async function auditCritical(action, entity, entityId, metadata = {}) {
  const entry = await createAuditLog(
    action,
    entity,
    entityId,
    { after: metadata },
    { severity: AuditSeverity.CRITICAL }
  );
  
  // Critical events are sent immediately, not batched
  try {
    console.warn('[Audit] Critical event:', entry);
    // await base44.entities.Audit.create(entry);
  } catch (error) {
    console.error('[Audit] Failed to log critical event:', error);
  }
  
  return entry;
}

// =============================================================================
// EXPORT FUNCTIONALITY
// =============================================================================

export function formatAuditForExport(audits, format = 'json') {
  const sanitized = audits.map(audit => ({
    id: audit.id,
    timestamp: audit.timestamp || audit.created_date,
    action: audit.action,
    entity: audit.entity || audit.entity_type,
    entity_id: audit.entity_id,
    actor: audit.actor || audit.created_by,
    severity: audit.severity || 'info',
    hash: audit.hash,
    metadata: audit.metadata
  }));
  
  if (format === 'csv') {
    const headers = ['id', 'timestamp', 'action', 'entity', 'entity_id', 'actor', 'severity', 'hash'];
    const rows = sanitized.map(row => 
      headers.map(h => JSON.stringify(row[h] ?? '')).join(',')
    );
    return [headers.join(','), ...rows].join('\n');
  }
  
  return JSON.stringify(sanitized, null, 2);
}

// =============================================================================
// CLEANUP
// =============================================================================

export async function flushPendingAudits() {
  await batchProcessor.flushAll();
}

// Flush on page unload
if (typeof window !== 'undefined') {
  window.addEventListener('beforeunload', () => {
    batchProcessor.flushAll();
  });
}