import { createClientFromRequest } from 'npm:@base44/sdk@0.8.4';

Deno.serve(async (req) => {
  const trace_id = crypto.randomUUID();
  
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user) {
      return Response.json({ 
        code: 'UNAUTHORIZED',
        message: 'Authentication required',
        retryable: false,
        trace_id
      }, { status: 401 });
    }

    const body = await req.json().catch(() => ({}));
    const { entity_type, action, actor, start_date, end_date, format, limit } = body;

    // Build filter
    const filter = {};
    if (entity_type) filter.entity_type = entity_type;
    if (action) filter.action = action;
    if (actor) filter.actor = actor;

    // Fetch audits
    const audits = await base44.asServiceRole.entities.Audit.filter(
      filter,
      '-created_date',
      limit || 500
    );

    // Filter by date if provided
    let filteredAudits = audits;
    if (start_date || end_date) {
      filteredAudits = audits.filter(a => {
        const date = new Date(a.created_date);
        if (start_date && date < new Date(start_date)) return false;
        if (end_date && date > new Date(end_date)) return false;
        return true;
      });
    }

    // Format output
    if (format === 'csv') {
      const headers = ['timestamp', 'entity_type', 'entity_id', 'action', 'actor', 'metadata'];
      const rows = filteredAudits.map(a => [
        a.created_date,
        a.entity_type,
        a.entity_id,
        a.action,
        a.actor || '',
        JSON.stringify(a.metadata || {})
      ]);
      
      const csv = [
        headers.join(','),
        ...rows.map(r => r.map(v => `"${String(v).replace(/"/g, '""')}"`).join(','))
      ].join('\n');

      return new Response(csv, {
        status: 200,
        headers: {
          'Content-Type': 'text/csv',
          'Content-Disposition': `attachment; filename=audit-log-${new Date().toISOString().split('T')[0]}.csv`,
          'X-Trace-Id': trace_id
        }
      });
    }

    // JSON format (default)
    const summary = {
      total_records: filteredAudits.length,
      by_entity_type: {},
      by_action: {},
      by_actor: {}
    };

    filteredAudits.forEach(a => {
      summary.by_entity_type[a.entity_type] = (summary.by_entity_type[a.entity_type] || 0) + 1;
      summary.by_action[a.action] = (summary.by_action[a.action] || 0) + 1;
      if (a.actor) {
        summary.by_actor[a.actor] = (summary.by_actor[a.actor] || 0) + 1;
      }
    });

    return Response.json({
      success: true,
      data: {
        summary,
        records: filteredAudits.map(a => ({
          id: a.id,
          timestamp: a.created_date,
          entity_type: a.entity_type,
          entity_id: a.entity_id,
          action: a.action,
          actor: a.actor,
          metadata: a.metadata
        })),
        export_info: {
          exported_at: new Date().toISOString(),
          exported_by: user.email,
          filters: { entity_type, action, actor, start_date, end_date }
        }
      }
    }, { headers: { 'X-Trace-Id': trace_id } });

  } catch (error) {
    console.error('Audit export error:', error);
    return Response.json({
      code: 'SERVER_ERROR',
      message: error.message || 'Failed to export audit log',
      retryable: true,
      trace_id
    }, { status: 500 });
  }
});