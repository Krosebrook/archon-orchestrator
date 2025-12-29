import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

/**
 * Slack Connector
 * Supports: messages, channels, users
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
      case 'send_message':
        result = await sendMessage(credentials, params);
        break;
      case 'list_channels':
        result = await listChannels(credentials, params);
        break;
      case 'get_user':
        result = await getUser(credentials, params);
        break;
      case 'upload_file':
        result = await uploadFile(credentials, params);
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
    console.error('Slack connector error:', error);
    return Response.json({ 
      error: error.message,
      trace_id: `SLACK_ERROR_${Date.now()}`,
    }, { status: 500 });
  }
});

async function sendMessage(credentials, params) {
  const { channel, text, blocks } = params;
  
  const response = await fetch('https://slack.com/api/chat.postMessage', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${credentials.bot_token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      channel,
      text,
      blocks,
    }),
  });

  if (!response.ok) {
    throw new Error(`Slack API error: ${response.statusText}`);
  }

  const data = await response.json();
  if (!data.ok) {
    throw new Error(`Slack API error: ${data.error}`);
  }

  return data;
}

async function listChannels(credentials, params = {}) {
  const { limit = 100 } = params;
  
  const response = await fetch(`https://slack.com/api/conversations.list?limit=${limit}`, {
    headers: {
      'Authorization': `Bearer ${credentials.bot_token}`,
      'Content-Type': 'application/json',
    },
  });

  if (!response.ok) {
    throw new Error(`Slack API error: ${response.statusText}`);
  }

  const data = await response.json();
  if (!data.ok) {
    throw new Error(`Slack API error: ${data.error}`);
  }

  return data.channels;
}

async function getUser(credentials, params) {
  const { user_id } = params;
  
  const response = await fetch(`https://slack.com/api/users.info?user=${user_id}`, {
    headers: {
      'Authorization': `Bearer ${credentials.bot_token}`,
      'Content-Type': 'application/json',
    },
  });

  if (!response.ok) {
    throw new Error(`Slack API error: ${response.statusText}`);
  }

  const data = await response.json();
  if (!data.ok) {
    throw new Error(`Slack API error: ${data.error}`);
  }

  return data.user;
}

async function uploadFile(credentials, params) {
  const { channels, content, filename, title } = params;
  
  const formData = new FormData();
  formData.append('channels', channels);
  formData.append('content', content);
  formData.append('filename', filename);
  if (title) formData.append('title', title);

  const response = await fetch('https://slack.com/api/files.upload', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${credentials.bot_token}`,
    },
    body: formData,
  });

  if (!response.ok) {
    throw new Error(`Slack API error: ${response.statusText}`);
  }

  const data = await response.json();
  if (!data.ok) {
    throw new Error(`Slack API error: ${data.error}`);
  }

  return data.file;
}