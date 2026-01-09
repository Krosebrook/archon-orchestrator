import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { installationId, operationId, parameters } = await req.json();

    if (!installationId || !operationId) {
      return Response.json({ error: 'Missing required parameters' }, { status: 400 });
    }

    // Fetch installation
    const installations = await base44.asServiceRole.entities.ConnectorInstallation.filter({
      id: installationId,
      org_id: user.organization.id,
    });

    if (!installations || installations.length === 0) {
      return Response.json({ error: 'Installation not found' }, { status: 404 });
    }

    const installation = installations[0];

    if (installation.status !== 'active') {
      return Response.json({ error: 'Connector is not active' }, { status: 400 });
    }

    // Fetch connector definition
    const connectors = await base44.entities.ConnectorDefinition.filter({
      id: installation.connector_id,
    });

    if (!connectors || connectors.length === 0) {
      return Response.json({ error: 'Connector definition not found' }, { status: 404 });
    }

    const connector = connectors[0];

    // Find operation
    const operation = connector.operations.find((op) => op.id === operationId);

    if (!operation) {
      return Response.json({ error: 'Operation not found' }, { status: 404 });
    }

    // Decrypt credentials (in production, use proper encryption/secrets manager)
    const credentials = JSON.parse(installation.credentials_encrypted);

    // Build request
    const baseUrl = connector.auth_config?.base_url || '';
    let url = baseUrl + operation.endpoint;

    // Replace path parameters
    if (parameters) {
      for (const [key, value] of Object.entries(parameters)) {
        url = url.replace(`{${key}}`, encodeURIComponent(value));
      }
    }

    // Build headers
    const headers = {
      'Content-Type': 'application/json',
      ...buildAuthHeaders(connector.auth_type, credentials),
    };

    // Make request
    const requestOptions = {
      method: operation.method,
      headers,
    };

    if (operation.method !== 'GET' && parameters) {
      requestOptions.body = JSON.stringify(parameters);
    }

    const response = await fetch(url, requestOptions);

    if (!response.ok) {
      const errorBody = await response.text();
      return Response.json(
        {
          error: 'Connector request failed',
          status: response.status,
          details: errorBody,
        },
        { status: response.status }
      );
    }

    const result = await response.json();

    // Update usage metrics
    await base44.asServiceRole.entities.ConnectorInstallation.update(installation.id, {
      usage_count: (installation.usage_count || 0) + 1,
      last_used: new Date().toISOString(),
    });

    return Response.json({
      success: true,
      data: result,
      operation: {
        id: operation.id,
        name: operation.name,
      },
    });
  } catch (error) {
    console.error('Connector invocation error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});

function buildAuthHeaders(authType, credentials) {
  switch (authType) {
    case 'api_key':
      return {
        Authorization: `Bearer ${credentials.apiKey}`,
      };
    case 'oauth2':
      return {
        Authorization: `Bearer ${credentials.accessToken}`,
      };
    case 'basic':
      const encoded = btoa(`${credentials.username}:${credentials.password}`);
      return {
        Authorization: `Basic ${encoded}`,
      };
    default:
      return {};
  }
}