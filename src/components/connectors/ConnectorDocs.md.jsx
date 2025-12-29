# Archon Connector SDK Documentation

## Overview

The Archon Connector SDK provides a comprehensive toolkit for building custom connectors with advanced authentication flows, webhook handling, and testing utilities.

## Installation

The SDK is pre-installed in Archon. Import modules as needed:

```javascript
import { 
  OAuth2PKCE, 
  WebhookValidator, 
  APIClient,
  RateLimiter,
  RetryHandler,
  ConnectorTester,
} from '@/components/connectors/ConnectorSDK';
```

## OAuth 2.0 PKCE Flow

### Basic Usage

```javascript
// 1. Generate PKCE parameters
const codeVerifier = OAuth2PKCE.generateCodeVerifier();
const codeChallenge = OAuth2PKCE.generateCodeChallenge(codeVerifier);

// 2. Build authorization URL
const authURL = OAuth2PKCE.buildAuthURL({
  authUrl: 'https://provider.com/oauth/authorize',
  clientId: 'your-client-id',
  redirectUri: 'https://your-app.com/callback',
  scope: ['read', 'write'],
  state: 'random-state-string',
  codeChallenge,
});

// 3. After user authorizes, exchange code for token
const tokens = await OAuth2PKCE.exchangeCode({
  tokenUrl: 'https://provider.com/oauth/token',
  clientId: 'your-client-id',
  code: 'authorization-code',
  redirectUri: 'https://your-app.com/callback',
  codeVerifier,
});

// 4. Refresh token when needed
const newTokens = await OAuth2PKCE.refreshToken({
  tokenUrl: 'https://provider.com/oauth/token',
  clientId: 'your-client-id',
  refreshToken: tokens.refresh_token,
});
```

## Webhook Signature Validation

### Stripe Webhooks

```javascript
const isValid = WebhookValidator.validateStripe(
  requestBody,
  request.headers['stripe-signature'],
  process.env.STRIPE_WEBHOOK_SECRET
);

if (!isValid) {
  throw new Error('Invalid webhook signature');
}
```

### GitHub Webhooks

```javascript
const isValid = WebhookValidator.validateGitHub(
  requestBody,
  request.headers['x-hub-signature-256'],
  process.env.GITHUB_WEBHOOK_SECRET
);
```

### Slack Webhooks

```javascript
const isValid = WebhookValidator.validateSlack(
  request.headers['x-slack-request-timestamp'],
  request.headers['x-slack-signature'],
  requestBody,
  process.env.SLACK_SIGNING_SECRET
);
```

### Generic HMAC

```javascript
const isValid = WebhookValidator.validateHMAC(
  payload,
  signature,
  secret,
  'sha256'
);
```

## API Client

### Setup

```javascript
const client = new APIClient({
  baseURL: 'https://api.example.com',
  credentials: {
    bearer: 'your-access-token',
    // OR
    apiKey: 'your-api-key',
    // OR
    basic: btoa('username:password'),
  },
  headers: {
    'X-Custom-Header': 'value',
  },
});
```

### Making Requests

```javascript
// GET request
const users = await client.get('/users', {
  params: { page: 1, limit: 10 },
});

// POST request
const newUser = await client.post('/users', {
  name: 'John Doe',
  email: 'john@example.com',
});

// PUT request
const updated = await client.put('/users/123', {
  name: 'Jane Doe',
});

// DELETE request
await client.delete('/users/123');
```

## Rate Limiting

```javascript
const limiter = new RateLimiter(
  100,  // max requests
  60000 // per 60 seconds
);

async function makeRequest() {
  await limiter.acquire();
  // Make your API call here
}
```

## Retry Handler

```javascript
const result = await RetryHandler.retry(
  async () => {
    return await someAPICall();
  },
  {
    maxRetries: 3,
    initialDelay: 1000,
    maxDelay: 10000,
    factor: 2,
    jitter: true,
  }
);
```

## Connector Testing

```javascript
const tester = new ConnectorTester(yourConnector);

// Test connection
await tester.testConnection(credentials);

// Test operations
await tester.testOperation('list_users', { limit: 10 }, credentials);
await tester.testOperation('create_user', { name: 'Test' }, credentials);

// Generate report
const report = tester.generateReport();
console.log(`Success rate: ${report.summary.successRate}`);
```

## Webhook Event Schemas

### Creating Events

```javascript
import { createWebhookEvent } from '@/components/connectors/WebhookSchemas';

const event = createWebhookEvent(
  'crm.contact.created',
  {
    contact_id: '123',
    email: 'user@example.com',
    name: 'John Doe',
  },
  {
    source: 'my-app',
    environment: 'production',
  }
);
```

### Validating Events

```javascript
import { validateEvent } from '@/components/connectors/WebhookSchemas';

try {
  validateEvent(event, 'crm.contact.created');
  // Event is valid
} catch (error) {
  // Handle validation error
}
```

## Complete Connector Example

```javascript
import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';
import { 
  APIClient, 
  RetryHandler, 
  OAuth2PKCE,
  WebhookValidator,
} from '@/components/connectors/ConnectorSDK';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    
    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { operation, installation_id, params } = await req.json();
    
    // Get credentials
    const installations = await base44.asServiceRole.entities.ConnectorInstallation.filter({
      id: installation_id,
      org_id: user.organization.id,
    });

    const credentials = JSON.parse(atob(installations[0].credentials_encrypted));

    // Initialize client
    const client = new APIClient({
      baseURL: 'https://api.example.com',
      credentials: { bearer: credentials.access_token },
    });

    // Execute with retry
    const result = await RetryHandler.retry(async () => {
      switch (operation) {
        case 'list_items':
          return await client.get('/items', { params });
        case 'create_item':
          return await client.post('/items', params);
        default:
          throw new Error('Unknown operation');
      }
    });

    return Response.json({ success: true, data: result });

  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});
```

## Best Practices

1. **Always validate webhook signatures** before processing events
2. **Use retry handlers** for flaky API calls
3. **Implement rate limiting** to respect API limits
4. **Store credentials encrypted** using proper encryption methods
5. **Test thoroughly** using ConnectorTester before deploying
6. **Handle token refresh** automatically for OAuth 2.0
7. **Log all operations** for debugging and auditing
8. **Use standardized schemas** for webhook events

## Error Handling

```javascript
try {
  const result = await connector.execute(operation, params);
} catch (error) {
  if (error.response?.status === 401) {
    // Token expired, refresh and retry
    await refreshToken();
    return await connector.execute(operation, params);
  }
  
  if (error.response?.status === 429) {
    // Rate limited, wait and retry
    await new Promise(resolve => setTimeout(resolve, 60000));
    return await connector.execute(operation, params);
  }
  
  throw error;
}
```

## Support

For issues or questions, refer to the main Archon documentation or create a support ticket.