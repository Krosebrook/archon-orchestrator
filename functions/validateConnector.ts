import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { connectorId, credentials } = await req.json();

    if (!connectorId || !credentials) {
      return Response.json({ error: 'Missing required parameters' }, { status: 400 });
    }

    // Fetch connector definition
    const connector = await base44.entities.ConnectorDefinition.filter({ id: connectorId });
    
    if (!connector || connector.length === 0) {
      return Response.json({ error: 'Connector not found' }, { status: 404 });
    }

    const connectorDef = connector[0];

    // Validate credentials based on auth type
    let validationResult = { valid: false, error: null };

    switch (connectorDef.auth_type) {
      case 'api_key':
        validationResult = await validateApiKey(connectorDef, credentials);
        break;
      case 'oauth2':
        validationResult = await validateOAuth(connectorDef, credentials);
        break;
      case 'basic':
        validationResult = await validateBasicAuth(connectorDef, credentials);
        break;
      default:
        validationResult = { valid: true, error: null };
    }

    return Response.json({
      valid: validationResult.valid,
      error: validationResult.error,
      connector: {
        id: connectorDef.id,
        name: connectorDef.name,
        provider: connectorDef.provider,
      },
    });
  } catch (error) {
    console.error('Connector validation error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});

async function validateApiKey(connector, credentials) {
  if (!credentials.apiKey) {
    return { valid: false, error: 'API key is required' };
  }

  // Test API key with a simple health check if available
  try {
    if (connector.operations && connector.operations.length > 0) {
      const testOperation = connector.operations.find(op => op.method === 'GET');
      if (testOperation) {
        const response = await fetch(connector.auth_config?.base_url + testOperation.endpoint, {
          headers: {
            'Authorization': `Bearer ${credentials.apiKey}`,
          },
        });
        return { valid: response.ok, error: response.ok ? null : 'Invalid API key' };
      }
    }
    return { valid: true, error: null };
  } catch (error) {
    return { valid: false, error: 'Failed to validate API key: ' + error.message };
  }
}

async function validateOAuth(connector, credentials) {
  if (!credentials.accessToken) {
    return { valid: false, error: 'Access token is required' };
  }

  // OAuth tokens are assumed valid if provided
  // Actual validation happens during first API call
  return { valid: true, error: null };
}

async function validateBasicAuth(connector, credentials) {
  if (!credentials.username || !credentials.password) {
    return { valid: false, error: 'Username and password are required' };
  }

  return { valid: true, error: null };
}