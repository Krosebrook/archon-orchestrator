import { createClientFromRequest } from 'npm:@base44/sdk@0.8.4';

/**
 * Export data in multiple formats (CSV, JSON).
 * Supports workflow runs, agent metrics, and audit logs.
 */
Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const entity = searchParams.get('entity'); // 'runs', 'agents', 'audits'
    const format = searchParams.get('format') || 'json'; // 'json' or 'csv'
    const limit = parseInt(searchParams.get('limit') || '1000');

    let data = [];
    let filename = 'export';

    // Fetch data based on entity type
    switch (entity) {
      case 'runs':
        data = await base44.entities.Run.list('-created_date', limit);
        filename = `workflow-runs-${Date.now()}`;
        break;
      case 'agents':
        data = await base44.entities.Agent.list('-created_date', limit);
        filename = `agents-${Date.now()}`;
        break;
      case 'metrics':
        data = await base44.entities.AgentMetric.list('-timestamp', limit);
        filename = `agent-metrics-${Date.now()}`;
        break;
      case 'audits':
        data = await base44.entities.Audit.list('-created_date', limit);
        filename = `audit-log-${Date.now()}`;
        break;
      default:
        return Response.json({ error: 'Invalid entity type' }, { status: 400 });
    }

    // Format response
    if (format === 'csv') {
      const csv = convertToCSV(data);
      return new Response(csv, {
        headers: {
          'Content-Type': 'text/csv',
          'Content-Disposition': `attachment; filename="${filename}.csv"`
        }
      });
    } else {
      return new Response(JSON.stringify(data, null, 2), {
        headers: {
          'Content-Type': 'application/json',
          'Content-Disposition': `attachment; filename="${filename}.json"`
        }
      });
    }
  } catch (error) {
    console.error('[Export] Error:', error);
    return Response.json({ 
      error: error.message || 'Export failed' 
    }, { status: 500 });
  }
});

/**
 * Convert array of objects to CSV format.
 */
function convertToCSV(data) {
  if (!data || data.length === 0) {
    return '';
  }

  const headers = Object.keys(data[0]);
  const rows = data.map(obj => 
    headers.map(header => {
      const value = obj[header];
      // Escape commas and quotes
      if (value === null || value === undefined) return '';
      const str = String(value);
      return str.includes(',') || str.includes('"') 
        ? `"${str.replace(/"/g, '""')}"` 
        : str;
    }).join(',')
  );

  return [headers.join(','), ...rows].join('\n');
}