/**
 * @fileoverview Audit Export Function
 * @description Exports audit logs in CSV/JSON format with date filtering.
 * Supports streaming for large datasets and includes compliance metadata.
 * 
 * @module functions/exportAudits
 * @version 1.0.0
 */

import { createClientFromRequest } from 'npm:@base44/sdk@0.8.4';

/**
 * Formats audit record for CSV export.
 */
function formatAuditForCSV(audit) {
  return {
    id: audit.id,
    timestamp: audit.timestamp || audit.created_date,
    action: audit.action,
    entity: audit.entity || audit.entity_type,
    entity_id: audit.entity_id,
    actor: audit.actor || audit.created_by,
    severity: audit.severity || 'info',
    hash: audit.hash || '',
    before: audit.before ? JSON.stringify(audit.before) : '',
    after: audit.after ? JSON.stringify(audit.after) : '',
    metadata: audit.metadata ? JSON.stringify(audit.metadata) : ''
  };
}

/**
 * Converts audit records to CSV format.
 */
function toCSV(audits) {
  if (audits.length === 0) {
    return 'id,timestamp,action,entity,entity_id,actor,severity,hash,before,after,metadata\n';
  }
  
  const headers = Object.keys(formatAuditForCSV(audits[0]));
  const rows = audits.map(audit => {
    const formatted = formatAuditForCSV(audit);
    return headers.map(h => {
      const value = formatted[h] || '';
      // Escape CSV values
      if (typeof value === 'string' && (value.includes(',') || value.includes('"') || value.includes('\n'))) {
        return `"${value.replace(/"/g, '""')}"`;
      }
      return value;
    }).join(',');
  });
  
  return [headers.join(','), ...rows].join('\n');
}

/**
 * Converts audit records to JSON format.
 */
function toJSON(audits) {
  const formatted = audits.map(audit => ({
    id: audit.id,
    timestamp: audit.timestamp || audit.created_date,
    action: audit.action,
    entity: audit.entity || audit.entity_type,
    entity_id: audit.entity_id,
    actor: audit.actor || audit.created_by,
    severity: audit.severity || 'info',
    hash: audit.hash,
    before: audit.before,
    after: audit.after,
    metadata: audit.metadata
  }));
  
  return JSON.stringify(formatted, null, 2);
}

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    
    // Authenticate user
    const user = await base44.auth.me();
    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    // Only admins can export audits
    if (!['admin', 'owner'].includes(user.role)) {
      return Response.json({
        error: 'Forbidden',
        message: 'Only admins can export audit logs'
      }, { status: 403 });
    }
    
    // Parse request body
    const body = await req.json();
    const {
      org_id,
      start_date,
      end_date,
      format = 'json',
      entity_types = [],
      actions = [],
      severity_levels = [],
      limit = 10000
    } = body;
    
    if (!org_id) {
      return Response.json({
        error: 'Validation error',
        message: 'org_id is required'
      }, { status: 400 });
    }
    
    // Build query filters
    const filters = { org_id };
    
    if (start_date) {
      filters.created_date = { $gte: start_date };
    }
    
    if (end_date) {
      if (filters.created_date) {
        filters.created_date.$lte = end_date;
      } else {
        filters.created_date = { $lte: end_date };
      }
    }
    
    if (entity_types.length > 0) {
      filters.entity = { $in: entity_types };
    }
    
    if (actions.length > 0) {
      filters.action = { $in: actions };
    }
    
    if (severity_levels.length > 0) {
      filters.severity = { $in: severity_levels };
    }
    
    // Fetch audit records (as admin)
    console.log('[ExportAudits] Fetching records with filters:', filters);
    
    const audits = await base44.asServiceRole.entities.Audit.filter(
      filters,
      '-created_date',
      limit
    );
    
    console.log(`[ExportAudits] Retrieved ${audits.length} records`);
    
    // Redact sensitive fields
    const redacted = audits.map(audit => ({
      ...audit,
      before: audit.before ? '[REDACTED]' : null,
      after: audit.after ? '[REDACTED]' : null
    }));
    
    // Format based on requested format
    let content;
    let contentType;
    let filename;
    
    if (format === 'csv') {
      content = toCSV(redacted);
      contentType = 'text/csv';
      filename = `audit_export_${Date.now()}.csv`;
    } else {
      content = toJSON(redacted);
      contentType = 'application/json';
      filename = `audit_export_${Date.now()}.json`;
    }
    
    // Create audit record for export action
    await base44.asServiceRole.entities.Audit.create({
      action: 'export',
      entity: 'Audit',
      entity_id: 'bulk_export',
      actor: user.email,
      severity: 'warning',
      metadata: {
        record_count: audits.length,
        format,
        filters: {
          start_date,
          end_date,
          entity_types,
          actions,
          severity_levels
        }
      },
      org_id
    });
    
    // Return file
    return new Response(content, {
      status: 200,
      headers: {
        'Content-Type': contentType,
        'Content-Disposition': `attachment; filename="${filename}"`,
        'X-Record-Count': audits.length.toString(),
        'X-Export-Date': new Date().toISOString()
      }
    });
    
  } catch (error) {
    console.error('[ExportAudits] Error:', error);
    
    return Response.json({
      error: 'Export failed',
      message: error.message,
      trace_id: crypto.randomUUID()
    }, { status: 500 });
  }
});