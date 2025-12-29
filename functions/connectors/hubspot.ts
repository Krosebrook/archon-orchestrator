import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

/**
 * HubSpot Connector
 * Supports: contacts, companies, deals, tickets
 */
Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    
    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { operation, installation_id, params } = await req.json();
    
    const installations = await base44.asServiceRole.entities.ConnectorInstallation.filter({
      id: installation_id,
      org_id: user.organization.id,
      status: 'active',
    });

    if (!installations.length) {
      return Response.json({ error: 'Installation not found' }, { status: 404 });
    }

    const installation = installations[0];
    const credentials = JSON.parse(atob(installation.credentials_encrypted));

    let result;
    switch (operation) {
      case 'list_contacts':
        result = await listContacts(credentials, params);
        break;
      case 'create_contact':
        result = await createContact(credentials, params);
        break;
      case 'list_deals':
        result = await listDeals(credentials, params);
        break;
      case 'create_deal':
        result = await createDeal(credentials, params);
        break;
      case 'get_company':
        result = await getCompany(credentials, params);
        break;
      default:
        return Response.json({ error: `Unknown operation: ${operation}` }, { status: 400 });
    }

    await base44.asServiceRole.entities.ConnectorInstallation.update(installation_id, {
      last_used: new Date().toISOString(),
      usage_count: (installation.usage_count || 0) + 1,
    });

    return Response.json({ success: true, data: result });

  } catch (error) {
    console.error('HubSpot connector error:', error);
    return Response.json({ 
      error: error.message,
      trace_id: `HS_ERROR_${Date.now()}`,
    }, { status: 500 });
  }
});

async function listContacts(credentials, params = {}) {
  const { limit = 10 } = params;
  
  const response = await fetch(`https://api.hubapi.com/crm/v3/objects/contacts?limit=${limit}`, {
    headers: {
      'Authorization': `Bearer ${credentials.access_token}`,
      'Content-Type': 'application/json',
    },
  });

  if (!response.ok) {
    throw new Error(`HubSpot API error: ${response.statusText}`);
  }

  const data = await response.json();
  return data.results;
}

async function createContact(credentials, params) {
  const response = await fetch('https://api.hubapi.com/crm/v3/objects/contacts', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${credentials.access_token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ properties: params }),
  });

  if (!response.ok) {
    throw new Error(`HubSpot API error: ${response.statusText}`);
  }

  return await response.json();
}

async function listDeals(credentials, params = {}) {
  const { limit = 10 } = params;
  
  const response = await fetch(`https://api.hubapi.com/crm/v3/objects/deals?limit=${limit}`, {
    headers: {
      'Authorization': `Bearer ${credentials.access_token}`,
      'Content-Type': 'application/json',
    },
  });

  if (!response.ok) {
    throw new Error(`HubSpot API error: ${response.statusText}`);
  }

  const data = await response.json();
  return data.results;
}

async function createDeal(credentials, params) {
  const response = await fetch('https://api.hubapi.com/crm/v3/objects/deals', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${credentials.access_token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ properties: params }),
  });

  if (!response.ok) {
    throw new Error(`HubSpot API error: ${response.statusText}`);
  }

  return await response.json();
}

async function getCompany(credentials, params) {
  const { company_id } = params;
  
  const response = await fetch(`https://api.hubapi.com/crm/v3/objects/companies/${company_id}`, {
    headers: {
      'Authorization': `Bearer ${credentials.access_token}`,
      'Content-Type': 'application/json',
    },
  });

  if (!response.ok) {
    throw new Error(`HubSpot API error: ${response.statusText}`);
  }

  return await response.json();
}