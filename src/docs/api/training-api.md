# Training API Reference

**Version:** 1.0  
**Last Updated:** December 30, 2025  
**Base URL:** `/api/v1/training`

---

## Overview

The Training API provides endpoints for managing agent training, synthetic data generation, model evaluation, and continuous learning in Archon Orchestrator.

---

## Table of Contents

1. [Authentication](#authentication)
2. [Training Endpoints](#training-endpoints)
3. [Data Generation Endpoints](#data-generation-endpoints)
4. [Evaluation Endpoints](#evaluation-endpoints)
5. [Model Management](#model-management)
6. [Error Handling](#error-handling)
7. [Rate Limits](#rate-limits)

---

## Authentication

All API requests require authentication using a Bearer token.

```http
Authorization: Bearer <your_api_token>
```

**Getting an API Token:**
```
1. Navigate to Settings → API Keys
2. Click "Generate New Key"
3. Copy and securely store the token
```

---

## Training Endpoints

### Train Agent

Start a new training job for an agent.

**Endpoint:** `POST /train-agent`

**Request Body:**
```json
{
  "agentId": "agent-123",
  "config": {
    "method": "supervised",
    "dataset": "training-data-v1",
    "epochs": 10,
    "batchSize": 32,
    "learningRate": 0.001,
    "validation": {
      "split": 0.15,
      "frequency": "epoch"
    },
    "curriculum": {
      "enabled": true,
      "stages": [
        { "level": 1, "duration": 3 },
        { "level": 2, "duration": 4 },
        { "level": 3, "duration": 3 }
      ]
    }
  }
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "trainingJobId": "job-456",
    "agentId": "agent-123",
    "status": "queued",
    "estimatedDuration": "30 minutes",
    "startTime": "2025-12-30T15:00:00Z",
    "config": { /* training config */ }
  }
}
```

**Status Codes:**
- `200 OK`: Training job started successfully
- `400 Bad Request`: Invalid configuration
- `401 Unauthorized`: Missing or invalid token
- `404 Not Found`: Agent not found
- `429 Too Many Requests`: Rate limit exceeded

---

### Get Training Status

Check the status of a training job.

**Endpoint:** `GET /train-agent/{jobId}`

**Response:**
```json
{
  "success": true,
  "data": {
    "jobId": "job-456",
    "status": "running",
    "progress": 0.65,
    "currentEpoch": 6,
    "totalEpochs": 10,
    "metrics": {
      "trainingLoss": 0.234,
      "validationLoss": 0.312,
      "accuracy": 0.89
    },
    "estimatedCompletion": "2025-12-30T15:25:00Z"
  }
}
```

**Status Values:**
- `queued`: Waiting to start
- `initializing`: Setting up environment
- `running`: Active training
- `validating`: Running validation
- `completed`: Successfully finished
- `failed`: Training failed
- `cancelled`: Manually stopped

---

### Stop Training

Cancel an ongoing training job.

**Endpoint:** `POST /train-agent/{jobId}/stop`

**Response:**
```json
{
  "success": true,
  "message": "Training job stopped successfully",
  "data": {
    "jobId": "job-456",
    "status": "cancelled",
    "progress": 0.65,
    "checkpointSaved": true
  }
}
```

---

### Adapt Agent Behavior

Update agent behavior based on feedback.

**Endpoint:** `POST /adapt-agent`

**Request Body:**
```json
{
  "agentId": "agent-123",
  "feedback": [
    {
      "input": "What's the weather like?",
      "expected": "Use weather tool to check current conditions",
      "actual": "I don't have weather information",
      "rating": 2,
      "timestamp": "2025-12-30T14:00:00Z"
    }
  ],
  "method": "reinforcement",
  "immediate": false
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "adaptationId": "adapt-789",
    "agentId": "agent-123",
    "feedbackProcessed": 1,
    "status": "queued",
    "estimatedCompletion": "2025-12-30T15:30:00Z"
  }
}
```

---

## Data Generation Endpoints

### Generate Synthetic Training Data

Create synthetic training examples.

**Endpoint:** `POST /generate-synthetic-data`

**Request Body:**
```json
{
  "scenarioType": "customer-support",
  "count": 1000,
  "difficulty": "medium",
  "edgeCases": true,
  "diversity": 0.8,
  "format": "jsonl",
  "constraints": {
    "maxLength": 500,
    "languages": ["en"],
    "topics": ["billing", "technical", "account"]
  }
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "datasetId": "dataset-101",
    "generated": 1000,
    "status": "completed",
    "downloadUrl": "https://api.archon.io/datasets/dataset-101/download",
    "expiresAt": "2025-12-31T15:00:00Z",
    "statistics": {
      "averageLength": 287,
      "uniqueScenarios": 847,
      "edgeCases": 156
    }
  }
}
```

**Scenario Types:**
- `customer-support`
- `code-generation`
- `data-analysis`
- `content-creation`
- `task-automation`
- `custom` (with template)

---

### Validate Training Data

Check quality of training dataset.

**Endpoint:** `POST /validate-data`

**Request Body:**
```json
{
  "datasetId": "dataset-101",
  "checks": {
    "duplicates": true,
    "quality": true,
    "balance": true,
    "bias": true
  }
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "valid": true,
    "issues": [],
    "warnings": [
      {
        "type": "imbalance",
        "message": "Class 'technical' is underrepresented (12% of total)",
        "severity": "medium",
        "suggestion": "Generate more 'technical' examples"
      }
    ],
    "statistics": {
      "totalExamples": 1000,
      "duplicates": 3,
      "averageQuality": 0.92,
      "classBalance": {
        "billing": 0.45,
        "technical": 0.12,
        "account": 0.43
      }
    }
  }
}
```

---

## Evaluation Endpoints

### Evaluate Agent

Run comprehensive evaluation on an agent.

**Endpoint:** `POST /evaluate-agent`

**Request Body:**
```json
{
  "agentId": "agent-123",
  "evaluationType": "comprehensive",
  "testSet": "test-set-v1",
  "metrics": [
    "accuracy",
    "precision",
    "recall",
    "f1",
    "latency",
    "cost"
  ],
  "compareToBaseline": true
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "evaluationId": "eval-202",
    "agentId": "agent-123",
    "results": {
      "accuracy": 0.92,
      "precision": 0.89,
      "recall": 0.94,
      "f1": 0.91,
      "averageLatency": "1.2s",
      "costPerTask": 0.003
    },
    "comparison": {
      "baseline": "v1.0",
      "improvements": {
        "accuracy": "+5%",
        "latency": "-20%"
      }
    },
    "recommendations": [
      "Consider fine-tuning on edge cases",
      "Optimize tool selection logic"
    ]
  }
}
```

---

### Benchmark Agent

Compare agent against standardized benchmarks.

**Endpoint:** `POST /benchmark-agent`

**Request Body:**
```json
{
  "agentId": "agent-123",
  "benchmarks": [
    "standard-reasoning",
    "tool-usage",
    "multi-step-planning"
  ]
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "benchmarkId": "bench-303",
    "results": {
      "standard-reasoning": {
        "score": 85,
        "percentile": 78,
        "details": { /* ... */ }
      },
      "tool-usage": {
        "score": 92,
        "percentile": 88,
        "details": { /* ... */ }
      },
      "multi-step-planning": {
        "score": 78,
        "percentile": 65,
        "details": { /* ... */ }
      }
    },
    "overallRank": "A-",
    "recommendations": [
      "Improve multi-step planning with additional training"
    ]
  }
}
```

---

## Model Management

### List Model Versions

Get all versions of trained models for an agent.

**Endpoint:** `GET /models/{agentId}/versions`

**Query Parameters:**
- `page`: Page number (default: 1)
- `limit`: Results per page (default: 20, max: 100)
- `status`: Filter by status
- `sortBy`: Sort field (default: 'createdAt')
- `order`: Sort order ('asc' or 'desc')

**Response:**
```json
{
  "success": true,
  "data": {
    "versions": [
      {
        "versionId": "v1.2.3",
        "agentId": "agent-123",
        "trainedAt": "2025-12-30T15:00:00Z",
        "status": "deployed",
        "metrics": {
          "accuracy": 0.92,
          "latency": "1.2s"
        },
        "trainingConfig": { /* ... */ },
        "size": "450MB"
      }
    ],
    "pagination": {
      "total": 15,
      "page": 1,
      "limit": 20,
      "pages": 1
    }
  }
}
```

---

### Deploy Model Version

Deploy a specific model version to production.

**Endpoint:** `POST /models/{agentId}/versions/{versionId}/deploy`

**Request Body:**
```json
{
  "environment": "production",
  "rollout": {
    "strategy": "canary",
    "percentage": 10,
    "duration": "1h"
  },
  "rollback": {
    "automatic": true,
    "threshold": {
      "errorRate": 0.05
    }
  }
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "deploymentId": "deploy-404",
    "versionId": "v1.2.3",
    "status": "rolling-out",
    "currentPercentage": 10,
    "estimatedCompletion": "2025-12-30T16:00:00Z"
  }
}
```

---

### Rollback Model

Rollback to a previous model version.

**Endpoint:** `POST /models/{agentId}/versions/{versionId}/rollback`

**Response:**
```json
{
  "success": true,
  "message": "Rolled back to version v1.2.2",
  "data": {
    "previousVersion": "v1.2.3",
    "currentVersion": "v1.2.2",
    "rollbackTime": "2025-12-30T15:45:00Z"
  }
}
```

---

## Error Handling

### Error Response Format

```json
{
  "success": false,
  "error": {
    "code": "INVALID_CONFIG",
    "message": "Training configuration is invalid",
    "details": {
      "field": "learningRate",
      "issue": "Must be between 0 and 1"
    },
    "timestamp": "2025-12-30T15:00:00Z",
    "requestId": "req-12345"
  }
}
```

### Common Error Codes

| Code | Description | HTTP Status |
|------|-------------|-------------|
| `INVALID_CONFIG` | Invalid training configuration | 400 |
| `AGENT_NOT_FOUND` | Agent does not exist | 404 |
| `JOB_NOT_FOUND` | Training job not found | 404 |
| `UNAUTHORIZED` | Missing or invalid authentication | 401 |
| `FORBIDDEN` | Insufficient permissions | 403 |
| `RATE_LIMIT_EXCEEDED` | Too many requests | 429 |
| `INTERNAL_ERROR` | Server error | 500 |
| `TRAINING_FAILED` | Training job failed | 500 |
| `INSUFFICIENT_RESOURCES` | Not enough compute resources | 503 |

---

## Rate Limits

### Default Limits

- **Training Jobs**: 5 concurrent jobs per account
- **API Requests**: 1000 requests per hour
- **Data Generation**: 10,000 examples per hour
- **Evaluation**: 100 evaluations per day

### Rate Limit Headers

```http
X-RateLimit-Limit: 1000
X-RateLimit-Remaining: 847
X-RateLimit-Reset: 1640876400
```

### Exceeding Limits

When rate limit is exceeded, you'll receive:

```json
{
  "success": false,
  "error": {
    "code": "RATE_LIMIT_EXCEEDED",
    "message": "Rate limit exceeded. Try again in 45 minutes.",
    "retryAfter": 2700
  }
}
```

---

## Webhooks

### Training Completion

Receive notification when training completes.

**Webhook URL**: Configure in Settings → Webhooks

**Payload:**
```json
{
  "event": "training.completed",
  "timestamp": "2025-12-30T15:30:00Z",
  "data": {
    "jobId": "job-456",
    "agentId": "agent-123",
    "status": "completed",
    "metrics": {
      "finalAccuracy": 0.92,
      "trainingTime": "28 minutes"
    },
    "modelVersion": "v1.2.3"
  }
}
```

---

## SDK Examples

### JavaScript/TypeScript

```typescript
import { sdk } from '@base44/sdk';

// Train agent
const trainingJob = await sdk.functions.invoke('trainAgent', {
  agentId: 'agent-123',
  config: {
    method: 'supervised',
    epochs: 10
  }
});

// Check status
const status = await sdk.functions.invoke('getTrainingStatus', {
  jobId: trainingJob.jobId
});

// Generate synthetic data
const data = await sdk.functions.invoke('generateSyntheticTrainingData', {
  scenarioType: 'customer-support',
  count: 1000
});
```

### Python

```python
from base44 import SDK

sdk = SDK(api_key='your_api_key')

# Train agent
training_job = sdk.functions.invoke('trainAgent', {
    'agentId': 'agent-123',
    'config': {
        'method': 'supervised',
        'epochs': 10
    }
})

# Check status
status = sdk.functions.invoke('getTrainingStatus', {
    'jobId': training_job['jobId']
})
```

---

## Best Practices

1. **Monitor Training**: Check status regularly
2. **Start Small**: Begin with small datasets and few epochs
3. **Save Checkpoints**: Enable checkpoint saving
4. **Use Validation**: Always split data for validation
5. **Track Metrics**: Monitor all relevant metrics
6. **Version Models**: Keep track of all model versions
7. **Test Before Deploy**: Evaluate thoroughly before production
8. **Gradual Rollout**: Use canary deployments

---

## Support

- **Documentation**: [Training System Architecture](../architecture/training-system.md)
- **Runbooks**: [Training Failures](../runbooks/training-failures.md)
- **API Status**: https://status.archon.io
- **Support Email**: api-support@archon.io

---

**API Version:** 1.0  
**Last Updated:** December 30, 2025  
**Next Review:** Q1 2025
