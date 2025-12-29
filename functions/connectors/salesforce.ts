import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

/**
 * Salesforce Connector
 * Supports: leads, contacts, accounts, opportunities
 */
Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    
    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { operation, installation_id, params } = await req.json();
    
    if (!operation || !installation_id) {
      return Response.json({ 
        error: 'operation and installation_id required' 
      }, { status: 400 });
    }

    // Get installation credentials
    const installations = await base44.asServiceRole.entities.ConnectorInstallation.filter({
      id: installation_id,
      org_id: user.organization.id,
      status: 'active',
    });

    if (!installations.length) {
      return Response.json({ error: 'Installation not found' }, { status: 404 });
    }

    const installation = installations[0];
    const credentials = JSON.parse(decryptCredentials(installation.credentials_encrypted));

    // Execute operation
    let result;
    switch (operation) {
      case 'list_leads':
        result = await listLeads(credentials, params);
        break;
      case 'create_lead':
        result = await createLead(credentials, params);
        break;
      case 'get_account':
        result = await getAccount(credentials, params);
        break;
      case 'create_opportunity':
        result = await createOpportunity(credentials, params);
        break;
      case 'search':
        result = await search(credentials, params);
        break;
      default:
        return Response.json({ error: `Unknown operation: ${operation}` }, { status: 400 });
    }

    // Update usage stats
    await base44.asServiceRole.entities.ConnectorInstallation.update(installation_id, {
      last_used: new Date().toISOString(),
      usage_count: (installation.usage_count || 0) + 1,
    });

    return Response.json({
      success: true,
      data: result,
    });

  } catch (error) {
    console.error('Salesforce connector error:', error);
    return Response.json({ 
      error: error.message,
      trace_id: `SF_ERROR_${Date.now()}`,
    }, { status: 500 });
  }
});

async function listLeads(credentials, params = {}) {
  const { limit = 10, offset = 0 } = params;
  
  const query = `SELECT Id, Name, Email, Company, Status FROM Lead LIMIT ${limit} OFFSET ${offset}`;
  
  const response = await fetch(`${credentials.instance_url}/services/data/v57.0/query?q=${encodeURIComponent(query)}`, {
    headers: {
      'Authorization': `Bearer ${credentials.access_token}`,
      'Content-Type': 'application/json',
    },
  });

  if (!response.ok) {
    throw new Error(`Salesforce API error: ${response.statusText}`);
  }

  const data = await response.json();
  return data.records;
}

async function createLead(credentials, params) {
  const response = await fetch(`${credentials.instance_url}/services/data/v57.0/sobjects/Lead`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${credentials.access_token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(params),
  });

  if (!response.ok) {
    throw new Error(`Salesforce API error: ${response.statusText}`);
  }

  return await response.json();
}

async function getAccount(credentials, params) {
  const { account_id } = params;
  
  const response = await fetch(`${credentials.instance_url}/services/data/v57.0/sobjects/Account/${account_id}`, {
    headers: {
      'Authorization': `Bearer ${credentials.access_token}`,
      'Content-Type': 'application/json',
    },
  });

  if (!response.ok) {
    throw new Error(`Salesforce API error: ${response.statusText}`);
  }

  return await response.json();
}

async function createOpportunity(credentials, params) {
  const response = await fetch(`${credentials.instance_url}/services/data/v57.0/sobjects/Opportunity`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${credentials.access_token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(params),
  });

  if (!response.ok) {
    throw new Error(`Salesforce API error: ${response.statusText}`);
  }

  return await response.json();
}

async function search(credentials, params) {
  const { query } = params;
  
  const response = await fetch(`${credentials.instance_url}/services/data/v57.0/search?q=${encodeURIComponent(query)}`, {
    headers: {
      'Authorization': `Bearer ${credentials.access_token}`,
      'Content-Type': 'application/json',
    },
  });

  if (!response.ok) {
    throw new Error(`Salesforce API error: ${response.statusText}`);
  }

  return await response.json();
}

function decryptCredentials(encrypted) {
  // In production, use proper encryption (KMS, etc.)
  // For now, assume base64 encoding
  return atob(encrypted);
}