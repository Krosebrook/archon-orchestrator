import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

/**
 * Jira Connector
 * Supports: issues, projects, sprints, comments
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
      case 'list_issues':
        result = await listIssues(credentials, params);
        break;
      case 'create_issue':
        result = await createIssue(credentials, params);
        break;
      case 'get_issue':
        result = await getIssue(credentials, params);
        break;
      case 'update_issue':
        result = await updateIssue(credentials, params);
        break;
      case 'add_comment':
        result = await addComment(credentials, params);
        break;
      case 'list_projects':
        result = await listProjects(credentials, params);
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
    console.error('Jira connector error:', error);
    return Response.json({ 
      error: error.message,
      trace_id: `JIRA_ERROR_${Date.now()}`,
    }, { status: 500 });
  }
});

async function listIssues(credentials, params = {}) {
  const { jql = 'project is not empty', maxResults = 50 } = params;
  
  const response = await fetch(
    `${credentials.instance_url}/rest/api/3/search?jql=${encodeURIComponent(jql)}&maxResults=${maxResults}`,
    {
      headers: {
        'Authorization': `Basic ${btoa(`${credentials.email}:${credentials.api_token}`)}`,
        'Content-Type': 'application/json',
      },
    }
  );

  if (!response.ok) {
    throw new Error(`Jira API error: ${response.statusText}`);
  }

  const data = await response.json();
  return data.issues;
}

async function createIssue(credentials, params) {
  const response = await fetch(`${credentials.instance_url}/rest/api/3/issue`, {
    method: 'POST',
    headers: {
      'Authorization': `Basic ${btoa(`${credentials.email}:${credentials.api_token}`)}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ fields: params }),
  });

  if (!response.ok) {
    throw new Error(`Jira API error: ${response.statusText}`);
  }

  return await response.json();
}

async function getIssue(credentials, params) {
  const { issue_key } = params;
  
  const response = await fetch(`${credentials.instance_url}/rest/api/3/issue/${issue_key}`, {
    headers: {
      'Authorization': `Basic ${btoa(`${credentials.email}:${credentials.api_token}`)}`,
      'Content-Type': 'application/json',
    },
  });

  if (!response.ok) {
    throw new Error(`Jira API error: ${response.statusText}`);
  }

  return await response.json();
}

async function updateIssue(credentials, params) {
  const { issue_key, fields } = params;
  
  const response = await fetch(`${credentials.instance_url}/rest/api/3/issue/${issue_key}`, {
    method: 'PUT',
    headers: {
      'Authorization': `Basic ${btoa(`${credentials.email}:${credentials.api_token}`)}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ fields }),
  });

  if (!response.ok) {
    throw new Error(`Jira API error: ${response.statusText}`);
  }

  return { success: true };
}

async function addComment(credentials, params) {
  const { issue_key, comment } = params;
  
  const response = await fetch(`${credentials.instance_url}/rest/api/3/issue/${issue_key}/comment`, {
    method: 'POST',
    headers: {
      'Authorization': `Basic ${btoa(`${credentials.email}:${credentials.api_token}`)}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ body: comment }),
  });

  if (!response.ok) {
    throw new Error(`Jira API error: ${response.statusText}`);
  }

  return await response.json();
}

async function listProjects(credentials, params = {}) {
  const response = await fetch(`${credentials.instance_url}/rest/api/3/project`, {
    headers: {
      'Authorization': `Basic ${btoa(`${credentials.email}:${credentials.api_token}`)}`,
      'Content-Type': 'application/json',
    },
  });

  if (!response.ok) {
    throw new Error(`Jira API error: ${response.statusText}`);
  }

  return await response.json();
}