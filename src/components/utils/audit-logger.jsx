export function createAuditLog(action, entity, entityId, changes = {}) {
  return {
    action,
    entity,
    entity_id: entityId,
    before: changes.before || null,
    after: changes.after || null,
    timestamp: new Date().toISOString(),
    session_id: getSessionId()
  };
}

function getSessionId() {
  let id = sessionStorage.getItem('audit_session_id');
  if (!id) {
    id = `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    sessionStorage.setItem('audit_session_id', id);
  }
  return id;
}

export function redactSensitiveData(data) {
  if (!data || typeof data !== 'object') return data;
  const sensitive = ['password', 'token', 'secret', 'api_key', 'apiKey'];
  const redacted = { ...data };
  for (const key in redacted) {
    if (sensitive.some(s => key.toLowerCase().includes(s))) {
      redacted[key] = '[REDACTED]';
    } else if (typeof redacted[key] === 'object') {
      redacted[key] = redactSensitiveData(redacted[key]);
    }
  }
  return redacted;
}

export const AuditActions = { CREATE: 'create', UPDATE: 'update', DELETE: 'delete', VIEW: 'view', EXECUTE: 'execute' };
export const AuditEntities = { WORKFLOW: 'Workflow', AGENT: 'Agent', RUN: 'Run', POLICY: 'Policy' };