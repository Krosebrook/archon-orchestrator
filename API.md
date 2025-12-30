# API Reference Documentation

**Archon Orchestrator - REST API Reference**

Version: 1.0  
Last Updated: December 30, 2025

---

## Table of Contents

1. [Overview](#overview)
2. [Authentication](#authentication)
3. [API Conventions](#api-conventions)
4. [Rate Limiting](#rate-limiting)
5. [Error Handling](#error-handling)
6. [Agents API](#agents-api)
7. [Workflows API](#workflows-api)
8. [Metrics & Monitoring API](#metrics--monitoring-api)
9. [Audit & Compliance API](#audit--compliance-api)
10. [Training API](#training-api)
11. [Cost Management API](#cost-management-api)
12. [Integration API](#integration-api)
13. [Webhooks](#webhooks)
14. [Code Examples](#code-examples)

---

## Overview

The Archon Orchestrator API is a RESTful API built on the Base44 platform. All endpoints are serverless functions deployed to edge locations for low latency worldwide.

### Base URL

```
https://your-project.base44.com/functions/
```

### API Characteristics

- **RESTful Design** - Standard HTTP methods (GET, POST, PUT, DELETE)
- **JSON Format** - All requests and responses use JSON
- **Stateless** - Each request contains all necessary information
- **Authenticated** - All endpoints require authentication
- **Traced** - Every request gets a unique trace ID
- **Versioned** - API versioning through headers (future)

---

## Authentication

All API requests require authentication via Base44's authentication system.

### Authentication Methods

#### 1. Session Token (Browser)

```javascript
// Automatically handled by Base44 SDK in browser
import { createClient } from '@base44/sdk';

const base44 = createClient();
const user = await base44.auth.me();
```

#### 2. API Key (Server-to-Server)

```bash
curl -X POST https://your-project.base44.com/functions/createAgent \
  -H "Authorization: Bearer YOUR_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{"name": "My Agent"}'
```

### Authentication Headers

```
Authorization: Bearer <token>
Content-Type: application/json
```

### Authentication Errors

```json
{
  "code": "UNAUTHORIZED",
  "message": "Authentication required",
  "retryable": false,
  "trace_id": "550e8400-e29b-41d4-a716-446655440000"
}
```

---

## API Conventions

### HTTP Methods

| Method | Purpose | Idempotent |
|--------|---------|------------|
| GET | Retrieve resources | Yes |
| POST | Create resources | No |
| PUT | Update resources (full) | Yes |
| PATCH | Update resources (partial) | No |
| DELETE | Delete resources | Yes |

### Request Format

All POST/PUT/PATCH requests must include:

```json
{
  "param1": "value1",
  "param2": "value2"
}
```

### Response Format

#### Success Response

```json
{
  "success": true,
  "data": {
    "id": "123",
    "name": "Resource Name",
    "created_at": "2025-12-30T00:00:00Z"
  }
}
```

#### Error Response

```json
{
  "code": "ERROR_CODE",
  "message": "Human-readable error message",
  "hint": "Suggestion for resolution",
  "retryable": true,
  "trace_id": "550e8400-e29b-41d4-a716-446655440000"
}
```

### Pagination

For endpoints returning lists:

```javascript
// Request
GET /functions/listAgents?limit=20&offset=40

// Response
{
  "success": true,
  "data": {
    "items": [...],
    "total": 100,
    "limit": 20,
    "offset": 40,
    "has_more": true
  }
}
```

### Filtering

Use query parameters for filtering:

```
GET /functions/listAgents?status=active&provider=openai
```

### Sorting

Use `sort` and `order` parameters:

```
GET /functions/listAgents?sort=created_at&order=desc
```

---

## Rate Limiting

### Rate Limits

| Tier | Requests/Minute | Requests/Hour | Requests/Day |
|------|-----------------|---------------|--------------|
| Free | 60 | 1,000 | 10,000 |
| Pro | 600 | 10,000 | 100,000 |
| Enterprise | Custom | Custom | Custom |

### Rate Limit Headers

```
X-RateLimit-Limit: 60
X-RateLimit-Remaining: 45
X-RateLimit-Reset: 1609459200
```

### Rate Limit Exceeded

```json
{
  "code": "RATE_LIMIT_EXCEEDED",
  "message": "Too many requests",
  "hint": "Retry after 30 seconds",
  "retryable": true,
  "trace_id": "...",
  "retry_after": 30
}
```

---

## Error Handling

### HTTP Status Codes

| Code | Meaning | Description |
|------|---------|-------------|
| 200 | OK | Request succeeded |
| 201 | Created | Resource created successfully |
| 400 | Bad Request | Invalid request format |
| 401 | Unauthorized | Authentication required |
| 403 | Forbidden | Insufficient permissions |
| 404 | Not Found | Resource doesn't exist |
| 422 | Unprocessable Entity | Validation error |
| 429 | Too Many Requests | Rate limit exceeded |
| 500 | Internal Server Error | Server error |
| 503 | Service Unavailable | Temporary issue |

### Error Codes

| Code | HTTP Status | Description |
|------|-------------|-------------|
| `VALIDATION_ERROR` | 422 | Invalid input data |
| `UNAUTHORIZED` | 401 | Authentication failed |
| `FORBIDDEN` | 403 | Authorization failed |
| `NOT_FOUND` | 404 | Resource not found |
| `CONFLICT` | 409 | Resource conflict (e.g., duplicate) |
| `RATE_LIMIT_EXCEEDED` | 429 | Too many requests |
| `SERVER_ERROR` | 500 | Unexpected server error |
| `SERVICE_UNAVAILABLE` | 503 | Service temporarily unavailable |

### Handling Errors

```javascript
try {
  const response = await fetch('/functions/createAgent', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    },
    body: JSON.stringify({ name: 'My Agent' })
  });
  
  const result = await response.json();
  
  if (!response.ok) {
    console.error('Error:', result.code, result.message);
    if (result.retryable) {
      // Implement retry logic
    }
  }
} catch (error) {
  console.error('Network error:', error);
}
```

---

## Agents API

### Create Agent

**Endpoint:** `POST /functions/createAgent`

**Description:** Create a new AI agent

**Request Body:**
```json
{
  "name": "Customer Support Agent",
  "description": "Handles customer inquiries",
  "provider": "openai",
  "model": "gpt-4o",
  "temperature": 0.7,
  "max_tokens": 2000,
  "capabilities": ["chat", "analysis"],
  "persona": "Helpful and professional customer service representative"
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "id": "agent_abc123",
    "name": "Customer Support Agent",
    "status": "active",
    "config": {
      "provider": "openai",
      "model": "gpt-4o",
      "temperature": 0.7,
      "max_tokens": 2000
    }
  }
}
```

**Status Codes:**
- `201` - Agent created successfully
- `422` - Validation error
- `409` - Agent with name already exists

---

### Execute Agent

**Endpoint:** `POST /functions/executeAgent`

**Description:** Execute an agent with a prompt

**Request Body:**
```json
{
  "agent_id": "agent_abc123",
  "prompt": "What are the benefits of our premium plan?",
  "context": {
    "user_tier": "free",
    "conversation_id": "conv_xyz"
  },
  "output_schema": {
    "type": "object",
    "properties": {
      "answer": { "type": "string" },
      "confidence": { "type": "number" }
    }
  }
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "result": {
      "answer": "Our premium plan includes...",
      "confidence": 0.95
    },
    "agent_name": "Customer Support Agent",
    "model": "gpt-4o",
    "latency_ms": 1250
  }
}
```

**Status Codes:**
- `200` - Execution successful
- `404` - Agent not found
- `403` - Agent not active

---

### List Agents

**Endpoint:** `GET /functions/listAgents`

**Query Parameters:**
- `status` - Filter by status (active, inactive, archived)
- `provider` - Filter by AI provider
- `limit` - Results per page (default: 20, max: 100)
- `offset` - Pagination offset

**Response:**
```json
{
  "success": true,
  "data": {
    "agents": [
      {
        "id": "agent_abc123",
        "name": "Customer Support Agent",
        "status": "active",
        "provider": "openai",
        "model": "gpt-4o",
        "created_at": "2025-01-01T00:00:00Z"
      }
    ],
    "total": 1
  }
}
```

---

### Get Agent Metrics

**Endpoint:** `POST /functions/getAgentMetrics`

**Request Body:**
```json
{
  "agent_id": "agent_abc123",
  "time_range": {
    "start": "2025-01-01T00:00:00Z",
    "end": "2025-01-31T23:59:59Z"
  },
  "metric_types": ["latency", "cost", "tokens"]
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "metrics": [
      {
        "timestamp": "2025-01-15T10:30:00Z",
        "latency_ms": 1250,
        "cost_cents": 5,
        "tokens_used": 150,
        "status": "success"
      }
    ],
    "aggregates": {
      "total_calls": 1500,
      "total_cost_cents": 7500,
      "avg_latency_ms": 1100,
      "success_rate": 0.99
    }
  }
}
```

---

### Train Agent

**Endpoint:** `POST /functions/trainAgent`

**Request Body:**
```json
{
  "agent_id": "agent_abc123",
  "training_data": [
    {
      "input": "What's your return policy?",
      "expected_output": "Our return policy allows...",
      "feedback": "Good response"
    }
  ],
  "training_type": "supervised"
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "training_id": "train_xyz",
    "examples_processed": 1,
    "status": "completed"
  }
}
```

---

## Workflows API

### Create Workflow

**Endpoint:** `POST /functions/createWorkflow`

**Request Body:**
```json
{
  "name": "Customer Onboarding",
  "description": "Automated customer onboarding process",
  "definition": {
    "nodes": [
      {
        "id": "start",
        "type": "trigger",
        "config": { "event": "user_signup" }
      },
      {
        "id": "send_welcome",
        "type": "agent",
        "config": { "agent_id": "agent_abc123" }
      },
      {
        "id": "create_account",
        "type": "action",
        "config": { "action": "create_user_account" }
      }
    ],
    "edges": [
      { "source": "start", "target": "send_welcome" },
      { "source": "send_welcome", "target": "create_account" }
    ]
  }
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "id": "workflow_123",
    "name": "Customer Onboarding",
    "status": "draft"
  }
}
```

---

### Run Workflow

**Endpoint:** `POST /functions/runWorkflow`

**Request Body:**
```json
{
  "workflow_id": "workflow_123",
  "input": {
    "user_email": "user@example.com",
    "user_name": "John Doe"
  },
  "options": {
    "dry_run": false,
    "timeout_ms": 30000
  }
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "run_id": "run_abc",
    "status": "completed",
    "output": {
      "account_created": true,
      "welcome_sent": true
    },
    "execution_time_ms": 2500
  }
}
```

---

### Analyze Workflow Performance

**Endpoint:** `POST /functions/analyzeWorkflowPerformance`

**Request Body:**
```json
{
  "workflow_id": "workflow_123",
  "time_range": {
    "start": "2025-01-01T00:00:00Z",
    "end": "2025-01-31T23:59:59Z"
  }
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "performance_metrics": {
      "total_runs": 1000,
      "success_rate": 0.98,
      "avg_duration_ms": 2500,
      "bottlenecks": [
        {
          "node_id": "send_welcome",
          "avg_time_ms": 1800
        }
      ]
    },
    "recommendations": [
      "Consider caching frequently used templates",
      "Optimize agent prompt for faster responses"
    ]
  }
}
```

---

## Metrics & Monitoring API

### Collect Metrics

**Endpoint:** `POST /functions/collectMetrics`

**Request Body:**
```json
{
  "metric_types": ["agents", "workflows", "costs"],
  "time_range": {
    "start": "2025-01-01T00:00:00Z",
    "end": "2025-01-31T23:59:59Z"
  }
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "metrics": {
      "agents": {
        "total_executions": 5000,
        "avg_latency_ms": 1200,
        "success_rate": 0.99
      },
      "workflows": {
        "total_runs": 1000,
        "avg_duration_ms": 2500,
        "success_rate": 0.98
      },
      "costs": {
        "total_cents": 15000,
        "by_provider": {
          "openai": 12000,
          "anthropic": 3000
        }
      }
    },
    "timestamp": "2025-01-31T23:59:59Z"
  }
}
```

---

### Get System Health

**Endpoint:** `GET /functions/getSystemHealth`

**Response:**
```json
{
  "success": true,
  "data": {
    "status": "healthy",
    "components": {
      "agents": "healthy",
      "workflows": "healthy",
      "database": "healthy",
      "functions": "healthy"
    },
    "metrics": {
      "uptime_seconds": 2592000,
      "active_agents": 50,
      "active_workflows": 25
    },
    "issues": []
  }
}
```

---

## Audit & Compliance API

### Export Audit Log

**Endpoint:** `POST /functions/exportAuditLog`

**Request Body:**
```json
{
  "time_range": {
    "start": "2025-01-01T00:00:00Z",
    "end": "2025-01-31T23:59:59Z"
  },
  "entity_types": ["agent", "workflow", "user"],
  "format": "json"
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "download_url": "https://storage.../audit_log.json",
    "record_count": 5000,
    "file_size": 1048576,
    "expires_at": "2025-02-01T00:00:00Z"
  }
}
```

---

### Generate Compliance Report

**Endpoint:** `POST /functions/generateComplianceReport`

**Request Body:**
```json
{
  "report_type": "gdpr",
  "time_period": {
    "start": "2025-01-01T00:00:00Z",
    "end": "2025-03-31T23:59:59Z"
  }
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "report_url": "https://storage.../compliance_report.pdf",
    "findings": [
      {
        "category": "data_retention",
        "status": "compliant",
        "details": "All data retention policies followed"
      }
    ]
  }
}
```

---

### Simulate Policy

**Endpoint:** `POST /functions/simulatePolicy`

**Request Body:**
```json
{
  "policy_id": "policy_123",
  "test_scenarios": [
    {
      "action": "agent.execute",
      "actor": "user@example.com",
      "resource": "agent_abc123"
    }
  ]
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "results": [
      {
        "scenario": "agent.execute",
        "would_allow": true,
        "reason": "User has execute permission"
      }
    ]
  }
}
```

---

## Training API

### Generate Synthetic Training Data

**Endpoint:** `POST /functions/generateSyntheticTrainingData`

**Request Body:**
```json
{
  "data_type": "customer_queries",
  "count": 100,
  "parameters": {
    "difficulty": "medium",
    "topics": ["billing", "support", "features"]
  }
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "training_examples": [
      {
        "input": "How do I upgrade my plan?",
        "expected_output": "To upgrade your plan...",
        "metadata": {
          "topic": "billing",
          "difficulty": "easy"
        }
      }
    ],
    "quality_score": 0.92
  }
}
```

---

## Cost Management API

### Forecast Costs

**Endpoint:** `POST /functions/forecastCosts`

**Request Body:**
```json
{
  "forecast_period_days": 30,
  "granularity": "day"
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "forecast": [
      {
        "date": "2025-02-01",
        "estimated_cost_cents": 500,
        "confidence": 0.85
      }
    ],
    "total_estimated": 15000
  }
}
```

---

### Generate Cost Optimizations

**Endpoint:** `POST /functions/generateCostOptimizations`

**Request Body:**
```json
{
  "time_range": {
    "start": "2025-01-01T00:00:00Z",
    "end": "2025-01-31T23:59:59Z"
  }
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "recommendations": [
      {
        "type": "model_selection",
        "description": "Switch to gpt-4o-mini for simple queries",
        "potential_savings_cents": 3000,
        "difficulty": "low"
      }
    ]
  }
}
```

---

## Integration API

### Invoke External Service

**Endpoint:** `POST /functions/invokeExternalService`

**Request Body:**
```json
{
  "service_name": "slack",
  "endpoint": "/api/chat.postMessage",
  "method": "POST",
  "payload": {
    "channel": "#general",
    "text": "Workflow completed successfully"
  }
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "response": { "ok": true, "ts": "1609459200.000100" },
    "status_code": 200,
    "latency_ms": 150
  }
}
```

---

## Webhooks

### Webhook Events

Archon can send webhook notifications for various events:

| Event | Description |
|-------|-------------|
| `agent.created` | New agent created |
| `agent.executed` | Agent execution completed |
| `workflow.started` | Workflow execution started |
| `workflow.completed` | Workflow execution completed |
| `workflow.failed` | Workflow execution failed |
| `cost.threshold_exceeded` | Cost threshold exceeded |
| `anomaly.detected` | Anomaly detected in system |

### Webhook Payload Format

```json
{
  "event": "workflow.completed",
  "timestamp": "2025-12-30T00:00:00Z",
  "data": {
    "workflow_id": "workflow_123",
    "run_id": "run_abc",
    "status": "completed",
    "duration_ms": 2500
  },
  "signature": "sha256=abc123..."
}
```

### Verifying Webhook Signatures

```javascript
import crypto from 'crypto';

function verifyWebhook(payload, signature, secret) {
  const hmac = crypto.createHmac('sha256', secret);
  const digest = 'sha256=' + hmac.update(payload).digest('hex');
  return crypto.timingSafeEqual(
    Buffer.from(signature),
    Buffer.from(digest)
  );
}
```

---

## Code Examples

### JavaScript/TypeScript (Frontend)

```javascript
import { createClient } from '@base44/sdk';

const base44 = createClient();

// Create an agent
async function createAgent() {
  const response = await base44.functions.createAgent({
    name: 'Customer Support Agent',
    description: 'Handles customer inquiries',
    provider: 'openai',
    model: 'gpt-4o'
  });
  
  console.log('Agent created:', response.data.id);
  return response.data;
}

// Execute an agent
async function executeAgent(agentId, prompt) {
  const response = await base44.functions.executeAgent({
    agent_id: agentId,
    prompt: prompt
  });
  
  console.log('Agent response:', response.data.result);
  return response.data.result;
}

// List agents with filtering
async function listAgents() {
  const response = await base44.functions.listAgents({
    status: 'active',
    limit: 10
  });
  
  console.log('Active agents:', response.data.agents);
  return response.data.agents;
}
```

### cURL (Command Line)

```bash
# Create an agent
curl -X POST https://your-project.base44.com/functions/createAgent \
  -H "Authorization: Bearer YOUR_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Customer Support Agent",
    "provider": "openai",
    "model": "gpt-4o"
  }'

# Execute an agent
curl -X POST https://your-project.base44.com/functions/executeAgent \
  -H "Authorization: Bearer YOUR_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "agent_id": "agent_abc123",
    "prompt": "What are your business hours?"
  }'

# Get agent metrics
curl -X POST https://your-project.base44.com/functions/getAgentMetrics \
  -H "Authorization: Bearer YOUR_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "agent_id": "agent_abc123",
    "time_range": {
      "start": "2025-01-01T00:00:00Z",
      "end": "2025-01-31T23:59:59Z"
    }
  }'
```

### Python

```python
import requests
import json

BASE_URL = "https://your-project.base44.com/functions"
API_KEY = "your_api_key"

headers = {
    "Authorization": f"Bearer {API_KEY}",
    "Content-Type": "application/json"
}

# Create an agent
def create_agent():
    payload = {
        "name": "Customer Support Agent",
        "provider": "openai",
        "model": "gpt-4o"
    }
    response = requests.post(
        f"{BASE_URL}/createAgent",
        headers=headers,
        json=payload
    )
    return response.json()

# Execute an agent
def execute_agent(agent_id, prompt):
    payload = {
        "agent_id": agent_id,
        "prompt": prompt
    }
    response = requests.post(
        f"{BASE_URL}/executeAgent",
        headers=headers,
        json=payload
    )
    return response.json()

# Usage
agent = create_agent()
print(f"Created agent: {agent['data']['id']}")

result = execute_agent(agent['data']['id'], "Hello!")
print(f"Agent response: {result['data']['result']}")
```

### Node.js (Backend)

```javascript
const axios = require('axios');

const BASE_URL = 'https://your-project.base44.com/functions';
const API_KEY = 'your_api_key';

const client = axios.create({
  baseURL: BASE_URL,
  headers: {
    'Authorization': `Bearer ${API_KEY}`,
    'Content-Type': 'application/json'
  }
});

// Create an agent
async function createAgent() {
  try {
    const response = await client.post('/createAgent', {
      name: 'Customer Support Agent',
      provider: 'openai',
      model: 'gpt-4o'
    });
    return response.data;
  } catch (error) {
    console.error('Error creating agent:', error.response.data);
    throw error;
  }
}

// Execute an agent with retry logic
async function executeAgentWithRetry(agentId, prompt, maxRetries = 3) {
  for (let i = 0; i < maxRetries; i++) {
    try {
      const response = await client.post('/executeAgent', {
        agent_id: agentId,
        prompt: prompt
      });
      return response.data;
    } catch (error) {
      if (error.response?.data?.retryable && i < maxRetries - 1) {
        await new Promise(resolve => setTimeout(resolve, 1000 * (i + 1)));
        continue;
      }
      throw error;
    }
  }
}

// Usage
(async () => {
  const agent = await createAgent();
  console.log('Agent created:', agent.data.id);
  
  const result = await executeAgentWithRetry(agent.data.id, 'Hello!');
  console.log('Agent response:', result.data.result);
})();
```

---

## Best Practices

### 1. Error Handling

Always handle errors gracefully:

```javascript
try {
  const response = await base44.functions.executeAgent({...});
  // Success path
} catch (error) {
  if (error.code === 'RATE_LIMIT_EXCEEDED') {
    // Wait and retry
    await sleep(error.retry_after * 1000);
  } else if (error.retryable) {
    // Retry with exponential backoff
  } else {
    // Handle permanent error
  }
}
```

### 2. Use Trace IDs

Always log trace IDs for debugging:

```javascript
const response = await fetch('/functions/createAgent', {...});
const traceId = response.headers.get('X-Trace-Id');
console.log('Trace ID:', traceId);
```

### 3. Implement Timeouts

Set appropriate timeouts:

```javascript
const controller = new AbortController();
setTimeout(() => controller.abort(), 30000);

const response = await fetch('/functions/executeAgent', {
  signal: controller.signal,
  ...
});
```

### 4. Cache Responses

Cache responses when appropriate:

```javascript
const cache = new Map();

async function getAgentCached(agentId) {
  if (cache.has(agentId)) {
    return cache.get(agentId);
  }
  
  const agent = await base44.functions.getAgent({ agent_id: agentId });
  cache.set(agentId, agent);
  return agent;
}
```

### 5. Batch Operations

Batch operations when possible:

```javascript
// Instead of multiple calls
for (const agentId of agentIds) {
  await executeAgent(agentId, prompt);
}

// Use parallel execution
await Promise.all(
  agentIds.map(id => executeAgent(id, prompt))
);
```

---

## Support

### Getting Help

- **Documentation**: Full documentation at [docs](../src/docs)
- **GitHub Issues**: [Report bugs](https://github.com/Krosebrook/archon-orchestrator/issues)
- **Base44 Support**: [support@base44.com](mailto:support@base44.com)

### API Status

Check API status at: [status.base44.com](https://status.base44.com)

---

## Related Documentation

- [AGENTS.md](./AGENTS.md) - Detailed function documentation
- [ARCHITECTURE.md](./ARCHITECTURE.md) - System architecture
- [README.md](./README.md) - Project overview

---

**Last Updated:** December 30, 2025  
**API Version:** 1.0  
**Maintained By:** Archon Development Team
