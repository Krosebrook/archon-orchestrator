# Training API Reference

**API Documentation for Agent Training Features**

---

## Overview

The Training API provides comprehensive endpoints for training, fine-tuning, and optimizing AI agents. It supports multiple training paradigms, real-time progress monitoring, A/B testing, and detailed performance evaluation.

**Key Features:**
- Multiple training paradigms (supervised, reinforcement, transfer, few-shot)
- Real-time progress monitoring
- A/B testing for configuration comparison
- Comprehensive evaluation and reporting
- Pipeline-based training workflows

---

## Endpoints

### Start Training Job

**Function:** `startTrainingJob`

**Description:** Initiates a new training job for an AI agent with specified configuration.

**Parameters:**
| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `agent_id` | string | Yes | Agent to train |
| `training_data` | object | Yes | Training data with examples |
| `config` | object | No | Training configuration |

**Training Data Schema:**
```javascript
{
  examples: [
    {
      input: string,           // Input prompt
      expected_output: string, // Expected response
      feedback: 'correct' | 'incorrect' | 'partial',
      weight: number,          // Optional importance weight
      metadata: object         // Optional metadata
    }
  ],
  validationExamples: [...],   // Optional separate validation set
  moduleId: string             // Optional training module reference
}
```

**Config Options:**
| Option | Type | Default | Description |
|--------|------|---------|-------------|
| `epochs` | number | 10 | Training iterations |
| `batchSize` | number | 32 | Samples per batch |
| `learningRate` | number | 0.001 | Learning rate |
| `validationSplit` | number | 0.2 | Validation data ratio |
| `earlyStopping` | boolean | true | Enable early stopping |
| `patience` | number | 3 | Early stopping patience |
| `checkpointInterval` | number | 5 | Checkpoint frequency |
| `trainingType` | string | 'supervised' | Training paradigm |
| `optimizer` | string | 'adam' | Optimizer algorithm |
| `schedulerType` | string | 'linear' | LR scheduler type |

**Example:**
```javascript
const result = await base44.functions.startTrainingJob({
  agent_id: 'agent_abc123',
  training_data: {
    examples: [
      {
        input: 'What is your return policy?',
        expected_output: 'Our return policy allows...',
        feedback: 'correct'
      }
    ]
  },
  config: {
    epochs: 10,
    batchSize: 32,
    learningRate: 0.001,
    trainingType: 'supervised',
    earlyStopping: true
  }
});
```

**Response:**
```json
{
  "success": true,
  "data": {
    "job_id": "job_xyz123",
    "agent_id": "agent_abc123",
    "status": "preparing",
    "config": { ... },
    "progress": {
      "current_epoch": 0,
      "total_epochs": 10,
      "current_step": 0,
      "total_steps": 1000,
      "percent_complete": 0
    },
    "estimates": {
      "total_samples": 100,
      "training_samples": 80,
      "validation_samples": 20,
      "estimated_duration_ms": 300000
    },
    "started_at": "2025-01-08T12:00:00Z"
  },
  "trace_id": "..."
}
```

---

### Monitor Training Progress

**Function:** `monitorTrainingProgress`

**Description:** Returns real-time progress and metrics for an active training job.

**Parameters:**
| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `job_id` | string | Yes | Training job ID |
| `include_checkpoints` | boolean | No | Include checkpoint list |
| `include_history` | boolean | No | Include metrics history |

**Example:**
```javascript
const progress = await base44.functions.monitorTrainingProgress({
  job_id: 'job_xyz123',
  include_checkpoints: true
});
```

**Response:**
```json
{
  "success": true,
  "data": {
    "job_id": "job_xyz123",
    "status": "running",
    "progress": {
      "current_epoch": 5,
      "total_epochs": 10,
      "current_step": 500,
      "total_steps": 1000,
      "percent_complete": 50,
      "estimated_time_remaining_ms": 150000
    },
    "metrics": {
      "loss": 0.2456,
      "accuracy": 0.8734,
      "validation_loss": 0.2789,
      "validation_accuracy": 0.8612,
      "learning_rate": 0.0008,
      "token_usage": 75000
    },
    "checkpoints": [
      {
        "id": "ckpt_1",
        "epoch": 5,
        "step": 500,
        "metrics": { ... }
      }
    ]
  }
}
```

---

### Evaluate Training Results

**Function:** `evaluateTrainingResults`

**Description:** Performs comprehensive evaluation of completed training job.

**Parameters:**
| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `job_id` | string | Yes | Training job ID |
| `test_data` | array | No | Additional test data |
| `evaluation_criteria` | array | No | Metrics to evaluate |
| `benchmark_against` | string | No | Baseline job ID for comparison |

**Evaluation Criteria Options:**
- `accuracy`
- `precision`
- `recall`
- `f1_score`
- `latency`
- `consistency`
- `safety`
- `relevance`

**Example:**
```javascript
const evaluation = await base44.functions.evaluateTrainingResults({
  job_id: 'job_xyz123',
  evaluation_criteria: ['accuracy', 'precision', 'recall', 'f1_score'],
  benchmark_against: 'job_baseline456'
});
```

**Response:**
```json
{
  "success": true,
  "data": {
    "job_id": "job_xyz123",
    "evaluation": {
      "overall_score": 85,
      "quality_grade": "B",
      "metric_scores": {
        "accuracy": 0.87,
        "precision": 0.84,
        "recall": 0.89,
        "f1_score": 0.86
      },
      "summary": "Training achieved good results with strong recall..."
    },
    "analysis": {
      "convergence_status": "converged",
      "overfitting_risk": "low",
      "underfitting_risk": "none",
      "training_efficiency": 82
    },
    "strengths": ["High recall", "Fast convergence"],
    "weaknesses": ["Slight precision drop in edge cases"],
    "recommendations": [
      {
        "priority": "medium",
        "category": "data",
        "recommendation": "Add more edge case examples",
        "expected_impact": "5-10% precision improvement"
      }
    ],
    "benchmark_comparison": {
      "accuracy_improvement": 3.5,
      "loss_reduction": 12.3
    }
  }
}
```

---

### Compare Training Runs (A/B Testing)

**Function:** `compareTrainingRuns`

**Description:** Performs comprehensive comparison between multiple training runs with statistical analysis.

**Parameters:**
| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `run_ids` | array | Yes | 2-10 job IDs to compare |
| `comparison_metrics` | array | No | Metrics to compare |
| `statistical_tests` | boolean | No | Run statistical tests |
| `generate_recommendations` | boolean | No | Generate AI recommendations |

**Comparison Metrics Options:**
- `accuracy`, `loss`, `validation_accuracy`, `validation_loss`
- `training_time`, `convergence_speed`, `final_performance`
- `stability`, `cost_efficiency`

**Example:**
```javascript
const comparison = await base44.functions.compareTrainingRuns({
  run_ids: ['job_a123', 'job_b456'],
  comparison_metrics: ['accuracy', 'loss', 'training_time'],
  statistical_tests: true,
  generate_recommendations: true
});
```

**Response:**
```json
{
  "success": true,
  "data": {
    "comparison_id": "cmp_xyz",
    "runs": [
      { "job_id": "job_a123", "results": { ... } },
      { "job_id": "job_b456", "results": { ... } }
    ],
    "metric_comparisons": {
      "accuracy": {
        "best": { "job_id": "job_a123", "value": 0.89 },
        "worst": { "job_id": "job_b456", "value": 0.85 }
      }
    },
    "statistical_analysis": {
      "significant": true,
      "pValue": 0.023,
      "effectSize": 0.45,
      "improvement_percent": 4.7
    },
    "overall_ranking": [
      { "job_id": "job_a123", "score": 0.87 },
      { "job_id": "job_b456", "score": 0.82 }
    ],
    "winner": {
      "job_id": "job_a123",
      "score": 0.87,
      "margin": 0.05
    },
    "recommendations": {
      "summary": "Run A shows statistically significant improvement...",
      "optimal_config": { ... },
      "next_steps": [...]
    }
  }
}
```

---

### Generate Training Report

**Function:** `generateTrainingReport`

**Description:** Creates comprehensive training reports in multiple formats.

**Parameters:**
| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `job_id` | string | Conditional | Specific job ID |
| `agent_id` | string | Conditional | Agent ID for summary |
| `report_type` | string | No | Report type |
| `include_sections` | array | No | Sections to include |
| `format` | string | No | Output format (json/markdown/html) |

**Report Types:**
- `single_job` - Single training job report
- `agent_summary` - Agent training history summary
- `comparison` - Multi-run comparison report
- `executive` - Executive summary

**Example:**
```javascript
const report = await base44.functions.generateTrainingReport({
  job_id: 'job_xyz123',
  report_type: 'single_job',
  include_sections: ['summary', 'metrics', 'charts', 'recommendations'],
  format: 'html'
});
```

---

### Generate Synthetic Training Data

**Function:** `generateSyntheticTrainingData`

**Description:** Generate AI-powered synthetic training examples.

**Parameters:**
| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `module_id` | string | Yes | Training module ID |
| `sample_count` | number | No | Examples to generate (1-50) |
| `difficulty` | string | No | Difficulty level |

**Example:**
```javascript
const result = await base44.functions.generateSyntheticTrainingData({
  module_id: 'module_abc',
  sample_count: 20,
  difficulty: 'medium'
});
```

---

### Adapt Agent Behavior

**Function:** `adaptAgentBehavior`

**Description:** Dynamically adapt agent behavior based on performance trends.

**Parameters:**
| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `agent_id` | string | Yes | Agent to adapt |
| `feedback_window_days` | number | No | Analysis window |
| `auto_apply` | boolean | No | Auto-apply low-risk changes |

**Example:**
```javascript
const adaptation = await base44.functions.adaptAgentBehavior({
  agent_id: 'agent_abc123',
  feedback_window_days: 7,
  auto_apply: false
});
```

---

## Error Codes

| Code | HTTP Status | Description |
|------|-------------|-------------|
| `UNAUTHORIZED` | 401 | Authentication required |
| `VALIDATION_ERROR` | 422 | Invalid request parameters |
| `NOT_FOUND` | 404 | Resource not found |
| `CONFLICT` | 409 | Conflicting operation |
| `QUOTA_EXCEEDED` | 429 | Rate limit exceeded |
| `PRECONDITION_FAILED` | 412 | Required state not met |
| `SERVER_ERROR` | 500 | Internal server error |

---

## Webhooks

Subscribe to training events:

```javascript
// Training job completed
{
  "event": "training.completed",
  "job_id": "job_xyz123",
  "agent_id": "agent_abc123",
  "results": { ... }
}

// Training job failed
{
  "event": "training.failed",
  "job_id": "job_xyz123",
  "error": { ... }
}
```

---

## Best Practices

1. **Data Quality**
   - Validate training data before starting
   - Use balanced datasets
   - Include diverse examples

2. **Configuration**
   - Start with default configurations
   - Use presets for common scenarios
   - Enable early stopping

3. **Monitoring**
   - Poll progress at reasonable intervals (2-5 seconds)
   - Monitor for overfitting
   - Save checkpoints frequently

4. **Evaluation**
   - Always evaluate completed jobs
   - Compare against baselines
   - Follow recommendations

---

## Related Documentation

- [Architecture - Training System](../architecture/training-system.md)
- [Runbook - Training Failures](../runbooks/training-failures.md)
- [AGENTS.md](../../../AGENTS.md)

---

**Last Updated:** January 8, 2026
**API Version:** 2.0
