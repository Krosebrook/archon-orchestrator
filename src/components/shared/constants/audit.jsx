/**
 * @fileoverview Audit Constants
 * @description Audit action taxonomy and entity types for comprehensive
 * tamper-evident audit trails following Archon canonical standards.
 * 
 * @module shared/constants/audit
 * @version 2.0.0
 */

/**
 * Standard audit actions
 * @readonly
 * @enum {string}
 */
export const AuditActions = Object.freeze({
  CREATE: 'create',
  UPDATE: 'update',
  DELETE: 'delete',
  EXECUTE: 'execute',
  APPROVE: 'approve',
  REJECT: 'reject',
  EXPORT: 'export',
  IMPORT: 'import',
  LOGIN: 'login',
  LOGOUT: 'logout',
  ACCESS: 'access',
  CONFIGURE: 'configure',
  DEPLOY: 'deploy',
  ROLLBACK: 'rollback',
  DEBUG: 'debug',
  MODIFY: 'modify'
});

/**
 * Auditable entity types
 * @readonly
 * @enum {string}
 */
export const AuditEntities = Object.freeze({
  AGENT: 'Agent',
  WORKFLOW: 'Workflow',
  RUN: 'Run',
  POLICY: 'Policy',
  APPROVAL: 'Approval',
  USER: 'User',
  TEAM: 'Team',
  SKILL: 'Skill',
  INTEGRATION: 'Integration',
  TEMPLATE: 'Template',
  TOOL: 'Tool',
  SYSTEM: 'System',
  SESSION: 'Session',
  EXPORT: 'Export',
  WEBHOOK: 'Webhook'
});

/**
 * Audit severity levels
 * @readonly
 * @enum {string}
 */
export const AuditSeverity = Object.freeze({
  INFO: 'info',
  WARNING: 'warning',
  CRITICAL: 'critical'
});

/**
 * High-risk actions that require immediate logging (no batching)
 * @readonly
 */
export const CriticalAuditActions = Object.freeze(new Set([
  AuditActions.DELETE,
  AuditActions.APPROVE,
  AuditActions.REJECT,
  AuditActions.DEPLOY,
  AuditActions.ROLLBACK,
  AuditActions.CONFIGURE,
  AuditActions.MODIFY
]));

/**
 * Actions that always require admin approval
 * @readonly
 */
export const ApprovalRequiredActions = Object.freeze(new Set([
  `${AuditEntities.POLICY}.${AuditActions.DELETE}`,
  `${AuditEntities.AGENT}.${AuditActions.DELETE}`,
  `${AuditEntities.WORKFLOW}.${AuditActions.DEPLOY}`,
  `${AuditEntities.SYSTEM}.${AuditActions.CONFIGURE}`
]));

/**
 * PII field patterns to redact in audit logs
 * @readonly
 */
export const PII_FIELD_PATTERNS = Object.freeze([
  'password',
  'passwd',
  'pwd',
  'token',
  'access_token',
  'refresh_token',
  'auth_token',
  'secret',
  'client_secret',
  'api_secret',
  'api_key',
  'apiKey',
  'apikey',
  'private_key',
  'privateKey',
  'credential',
  'credentials',
  'ssn',
  'social_security',
  'credit_card',
  'creditCard',
  'card_number',
  'cvv',
  'cvc',
  'pin',
  'email',
  'phone',
  'address'
]);

/**
 * Get severity for an audit action
 * @param {string} action - Audit action
 * @param {string} entity - Entity type
 * @returns {string} Severity level
 */
export function getAuditSeverity(action, entity) {
  if (CriticalAuditActions.has(action)) {
    return AuditSeverity.CRITICAL;
  }
  
  if (action === AuditActions.EXECUTE && entity === AuditEntities.WORKFLOW) {
    return AuditSeverity.INFO;
  }
  
  if ([AuditActions.UPDATE, AuditActions.CONFIGURE].includes(action)) {
    return AuditSeverity.WARNING;
  }
  
  return AuditSeverity.INFO;
}

/**
 * Check if action requires approval
 * @param {string} entity - Entity type
 * @param {string} action - Action type
 * @returns {boolean}
 */
export function requiresApproval(entity, action) {
  return ApprovalRequiredActions.has(`${entity}.${action}`);
}

/**
 * Generate audit message for action
 * @param {string} action - Action type
 * @param {string} entity - Entity type
 * @param {string} entityId - Entity ID
 * @param {Object} [metadata] - Additional context
 * @returns {string} Human-readable message
 */
export function generateAuditMessage(action, entity, entityId, metadata = {}) {
  const templates = {
    [AuditActions.CREATE]: `Created ${entity} ${entityId}`,
    [AuditActions.UPDATE]: `Updated ${entity} ${entityId}`,
    [AuditActions.DELETE]: `Deleted ${entity} ${entityId}`,
    [AuditActions.EXECUTE]: `Executed ${entity} ${entityId}`,
    [AuditActions.APPROVE]: `Approved ${entity} ${entityId}`,
    [AuditActions.REJECT]: `Rejected ${entity} ${entityId}`,
    [AuditActions.DEPLOY]: `Deployed ${entity} ${entityId}`,
    [AuditActions.ROLLBACK]: `Rolled back ${entity} ${entityId}`,
    [AuditActions.ACCESS]: `Accessed ${entity} ${entityId}`
  };
  
  let message = templates[action] || `Performed ${action} on ${entity} ${entityId}`;
  
  if (metadata.reason) {
    message += ` - Reason: ${metadata.reason}`;
  }
  
  return message;
}