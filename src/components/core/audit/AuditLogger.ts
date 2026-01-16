/**
 * @fileoverview Production Audit Logger
 * @module core/audit/AuditLogger
 * @description Comprehensive audit logging with hash verification
 */

import { base44 } from '@/api/base44Client';
import { createHash } from 'crypto';

// =============================================================================
// TYPES
// =============================================================================

export type AuditAction = 
  | 'create'
  | 'update'
  | 'delete'
  | 'execute'
  | 'approve'
  | 'reject'
  | 'export'
  | 'share'
  | 'login'
  | 'logout';

export type AuditResource = 
  | 'workflow'
  | 'agent'
  | 'run'
  | 'policy'
  | 'approval'
  | 'user'
  | 'integration'
  | 'skill';

export interface AuditLogEntry {
  action: AuditAction;
  resource: AuditResource;
  resource_id: string;
  actor_email: string;
  org_id: string;
  before?: Record<string, unknown> | null;
  after?: Record<string, unknown> | null;
  metadata?: Record<string, unknown>;
  ip_address?: string;
  user_agent?: string;
}

export interface AuditLogRecord extends AuditLogEntry {
  id: string;
  timestamp: string;
  hash: string;
}

// =============================================================================
// AUDIT LOGGER
// =============================================================================

export class AuditLogger {
  private static instance: AuditLogger;

  private constructor() {}

  static getInstance(): AuditLogger {
    if (!AuditLogger.instance) {
      AuditLogger.instance = new AuditLogger();
    }
    return AuditLogger.instance;
  }

  /**
   * Log an audit event with cryptographic hash
   */
  async log(entry: AuditLogEntry): Promise<AuditLogRecord | null> {
    try {
      // Generate hash for integrity
      const hash = this.generateHash(entry);

      // Create audit record
      const record = await base44.asServiceRole.entities.Audit.create({
        action: entry.action,
        resource: entry.resource,
        resource_id: entry.resource_id,
        actor_email: entry.actor_email,
        org_id: entry.org_id,
        before: entry.before || null,
        after: entry.after || null,
        metadata: entry.metadata || {},
        hash,
        ip_address: entry.ip_address,
        user_agent: entry.user_agent,
      });

      console.log('[Audit]', {
        action: entry.action,
        resource: entry.resource,
        actor: entry.actor_email,
        trace_id: entry.metadata?.trace_id,
      });

      return record as AuditLogRecord;
    } catch (error) {
      console.error('[Audit] Failed to log:', error);
      // Don't throw - audit failure shouldn't break operations
      return null;
    }
  }

  /**
   * Log a create operation
   */
  async logCreate(
    resource: AuditResource,
    resourceId: string,
    actorEmail: string,
    orgId: string,
    data: Record<string, unknown>,
    metadata?: Record<string, unknown>
  ): Promise<AuditLogRecord | null> {
    return this.log({
      action: 'create',
      resource,
      resource_id: resourceId,
      actor_email: actorEmail,
      org_id: orgId,
      after: data,
      metadata,
    });
  }

  /**
   * Log an update operation
   */
  async logUpdate(
    resource: AuditResource,
    resourceId: string,
    actorEmail: string,
    orgId: string,
    before: Record<string, unknown>,
    after: Record<string, unknown>,
    metadata?: Record<string, unknown>
  ): Promise<AuditLogRecord | null> {
    return this.log({
      action: 'update',
      resource,
      resource_id: resourceId,
      actor_email: actorEmail,
      org_id: orgId,
      before,
      after,
      metadata,
    });
  }

  /**
   * Log a delete operation
   */
  async logDelete(
    resource: AuditResource,
    resourceId: string,
    actorEmail: string,
    orgId: string,
    data: Record<string, unknown>,
    metadata?: Record<string, unknown>
  ): Promise<AuditLogRecord | null> {
    return this.log({
      action: 'delete',
      resource,
      resource_id: resourceId,
      actor_email: actorEmail,
      org_id: orgId,
      before: data,
      metadata,
    });
  }

  /**
   * Log an execution operation
   */
  async logExecute(
    resource: AuditResource,
    resourceId: string,
    actorEmail: string,
    orgId: string,
    metadata?: Record<string, unknown>
  ): Promise<AuditLogRecord | null> {
    return this.log({
      action: 'execute',
      resource,
      resource_id: resourceId,
      actor_email: actorEmail,
      org_id: orgId,
      metadata,
    });
  }

  /**
   * Verify audit log integrity
   */
  verifyIntegrity(record: AuditLogRecord): boolean {
    const recalculatedHash = this.generateHash({
      action: record.action,
      resource: record.resource,
      resource_id: record.resource_id,
      actor_email: record.actor_email,
      org_id: record.org_id,
      before: record.before,
      after: record.after,
      metadata: record.metadata,
    });

    return recalculatedHash === record.hash;
  }

  /**
   * Generate cryptographic hash for audit entry
   */
  private generateHash(entry: Omit<AuditLogEntry, 'ip_address' | 'user_agent'>): string {
    const data = JSON.stringify({
      action: entry.action,
      resource: entry.resource,
      resource_id: entry.resource_id,
      actor_email: entry.actor_email,
      org_id: entry.org_id,
      before: entry.before,
      after: entry.after,
      metadata: entry.metadata,
    });

    return createHash('sha256').update(data).digest('hex');
  }

  /**
   * Query audit logs with filters
   */
  async query(filters: {
    org_id: string;
    resource?: AuditResource;
    resource_id?: string;
    actor_email?: string;
    action?: AuditAction;
    start_date?: string;
    end_date?: string;
    limit?: number;
  }): Promise<AuditLogRecord[]> {
    try {
      const queryFilters: Record<string, unknown> = {
        org_id: filters.org_id,
      };

      if (filters.resource) queryFilters.resource = filters.resource;
      if (filters.resource_id) queryFilters.resource_id = filters.resource_id;
      if (filters.actor_email) queryFilters.actor_email = filters.actor_email;
      if (filters.action) queryFilters.action = filters.action;

      const records = await base44.asServiceRole.entities.Audit.filter(
        queryFilters,
        '-created_date',
        filters.limit || 100
      );

      return records as AuditLogRecord[];
    } catch (error) {
      console.error('[Audit] Query failed:', error);
      return [];
    }
  }

  /**
   * Export audit logs for compliance
   */
  async export(orgId: string, format: 'json' | 'csv' = 'json'): Promise<string> {
    try {
      const records = await this.query({ org_id: orgId, limit: 10000 });

      if (format === 'csv') {
        return this.toCSV(records);
      }

      return JSON.stringify(records, null, 2);
    } catch (error) {
      console.error('[Audit] Export failed:', error);
      throw error;
    }
  }

  /**
   * Convert audit records to CSV
   */
  private toCSV(records: AuditLogRecord[]): string {
    if (records.length === 0) return '';

    const headers = [
      'timestamp',
      'action',
      'resource',
      'resource_id',
      'actor_email',
      'org_id',
      'hash',
    ];

    const rows = records.map(record => [
      record.timestamp,
      record.action,
      record.resource,
      record.resource_id,
      record.actor_email,
      record.org_id,
      record.hash,
    ]);

    return [
      headers.join(','),
      ...rows.map(row => row.map(cell => `"${cell}"`).join(',')),
    ].join('\n');
  }
}

// =============================================================================
// SINGLETON EXPORT
// =============================================================================

export const auditLogger = AuditLogger.getInstance();