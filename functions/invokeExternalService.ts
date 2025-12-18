import { createClientFromRequest } from 'npm:@base44/sdk@0.8.4';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { connection_id, operation, parameters } = await req.json();

    if (!connection_id || !operation) {
      return Response.json({ error: 'Missing connection_id or operation' }, { status: 400 });
    }

    // Get connection details
    const connections = await base44.entities.ExternalConnection.filter({ id: connection_id });
    if (!connections || connections.length === 0) {
      return Response.json({ error: 'Connection not found' }, { status: 404 });
    }

    const connection = connections[0];
    if (connection.status !== 'active') {
      return Response.json({ error: 'Connection inactive' }, { status: 400 });
    }

    let result;
    const startTime = Date.now();

    // Route to appropriate service handler
    switch (connection.service) {
      case 'slack':
        result = await handleSlack(connection, operation, parameters);
        break;
      case 'github':
        result = await handleGitHub(connection, operation, parameters);
        break;
      case 'aws_s3':
        result = await handleS3(connection, operation, parameters);
        break;
      case 'google_drive':
        result = await handleGoogleDrive(connection, operation, parameters);
        break;
      case 'stripe':
        result = await handleStripe(connection, operation, parameters);
        break;
      case 'sendgrid':
        result = await handleSendGrid(connection, operation, parameters);
        break;
      case 'custom':
        result = await handleCustomAPI(connection, operation, parameters);
        break;
      default:
        throw new Error(`Unsupported service: ${connection.service}`);
    }

    // Update connection stats
    await base44.asServiceRole.entities.ExternalConnection.update(connection_id, {
      last_used: new Date().toISOString(),
      usage_count: (connection.usage_count || 0) + 1
    });

    return Response.json({
      success: true,
      result,
      latency_ms: Date.now() - startTime
    });

  } catch (error) {
    console.error('External service invocation failed:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});

// Slack handler
async function handleSlack(connection, operation, params) {
  const { credentials, config } = connection;
  const token = credentials.access_token || credentials.bot_token;

  switch (operation) {
    case 'send_message': {
      const response = await fetch('https://slack.com/api/chat.postMessage', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          channel: params.channel,
          text: params.text,
          blocks: params.blocks
        })
      });
      return await response.json();
    }
    case 'list_channels': {
      const response = await fetch('https://slack.com/api/conversations.list', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      return await response.json();
    }
    default:
      throw new Error(`Unsupported Slack operation: ${operation}`);
  }
}

// GitHub handler
async function handleGitHub(connection, operation, params) {
  const { credentials } = connection;
  const token = credentials.access_token || credentials.personal_access_token;

  switch (operation) {
    case 'create_issue': {
      const response = await fetch(`https://api.github.com/repos/${params.owner}/${params.repo}/issues`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Accept': 'application/vnd.github+json',
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          title: params.title,
          body: params.body,
          labels: params.labels
        })
      });
      return await response.json();
    }
    case 'list_repos': {
      const response = await fetch('https://api.github.com/user/repos', {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Accept': 'application/vnd.github+json'
        }
      });
      return await response.json();
    }
    default:
      throw new Error(`Unsupported GitHub operation: ${operation}`);
  }
}

// AWS S3 handler
async function handleS3(connection, operation, params) {
  const { credentials, config } = connection;
  
  // Note: For production, use AWS SDK properly
  // This is a simplified example
  const endpoint = config.endpoint || 'https://s3.amazonaws.com';
  
  switch (operation) {
    case 'upload_file': {
      const response = await fetch(`${endpoint}/${params.bucket}/${params.key}`, {
        method: 'PUT',
        headers: {
          'Authorization': `AWS ${credentials.access_key_id}:${credentials.secret_access_key}`,
          'Content-Type': params.content_type || 'application/octet-stream'
        },
        body: params.file_data
      });
      return { uploaded: response.ok, status: response.status };
    }
    case 'list_objects': {
      const response = await fetch(`${endpoint}/${params.bucket}?list-type=2&prefix=${params.prefix || ''}`, {
        headers: {
          'Authorization': `AWS ${credentials.access_key_id}:${credentials.secret_access_key}`
        }
      });
      return await response.text();
    }
    default:
      throw new Error(`Unsupported S3 operation: ${operation}`);
  }
}

// Google Drive handler
async function handleGoogleDrive(connection, operation, params) {
  const { credentials } = connection;
  const token = credentials.access_token;

  switch (operation) {
    case 'list_files': {
      const query = params.query || '';
      const response = await fetch(`https://www.googleapis.com/drive/v3/files?q=${encodeURIComponent(query)}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      return await response.json();
    }
    case 'create_file': {
      const metadata = {
        name: params.name,
        mimeType: params.mime_type
      };
      const response = await fetch('https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ metadata, content: params.content })
      });
      return await response.json();
    }
    default:
      throw new Error(`Unsupported Google Drive operation: ${operation}`);
  }
}

// Stripe handler
async function handleStripe(connection, operation, params) {
  const { credentials } = connection;
  const apiKey = credentials.secret_key;

  switch (operation) {
    case 'create_payment_intent': {
      const response = await fetch('https://api.stripe.com/v1/payment_intents', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${apiKey}`,
          'Content-Type': 'application/x-www-form-urlencoded'
        },
        body: new URLSearchParams({
          amount: params.amount,
          currency: params.currency || 'usd'
        })
      });
      return await response.json();
    }
    case 'list_customers': {
      const response = await fetch('https://api.stripe.com/v1/customers', {
        headers: { 'Authorization': `Bearer ${apiKey}` }
      });
      return await response.json();
    }
    default:
      throw new Error(`Unsupported Stripe operation: ${operation}`);
  }
}

// SendGrid handler
async function handleSendGrid(connection, operation, params) {
  const { credentials } = connection;
  const apiKey = credentials.api_key;

  switch (operation) {
    case 'send_email': {
      const response = await fetch('https://api.sendgrid.com/v3/mail/send', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${apiKey}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          personalizations: [{
            to: [{ email: params.to }],
            subject: params.subject
          }],
          from: { email: params.from },
          content: [{ type: 'text/html', value: params.html }]
        })
      });
      return { sent: response.ok, status: response.status };
    }
    default:
      throw new Error(`Unsupported SendGrid operation: ${operation}`);
  }
}

// Custom API handler
async function handleCustomAPI(connection, operation, params) {
  const { credentials, config } = connection;
  const endpoint = config.base_url;
  const method = params.method || 'GET';
  const path = params.path || '';

  const headers = {
    'Content-Type': 'application/json',
    ...config.default_headers
  };

  // Add authentication
  if (credentials.api_key) {
    headers[config.auth_header || 'Authorization'] = 
      config.auth_prefix ? `${config.auth_prefix} ${credentials.api_key}` : credentials.api_key;
  }

  const response = await fetch(`${endpoint}${path}`, {
    method,
    headers,
    body: params.body ? JSON.stringify(params.body) : undefined
  });

  return await response.json();
}