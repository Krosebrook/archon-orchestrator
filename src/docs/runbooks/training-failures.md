# Runbook: Training Failures

**Operational Runbook for Agent Training Issues**

---

## Overview

This runbook provides procedures for diagnosing and resolving agent training failures.

---

## Common Issues

### Issue 1: Training Job Fails to Start

**Symptoms:**
- `trainAgent` returns immediate error
- "Training initialization failed" message
- No training metrics generated

**Diagnosis Steps:**

1. Verify agent exists and is accessible
```javascript
const agent = await base44.entities.Agent.get(agentId);
console.log('Agent found:', !!agent);
```

2. Validate training data format
```javascript
const validation = validateTrainingData(trainingData);
console.log('Validation errors:', validation.errors);
```

3. Check system resources
```javascript
const health = await base44.functions.getSystemHealth();
console.log('Training system:', health.data.components.training);
```

**Resolution:**

- Fix training data format issues
- Verify agent is active
- Wait for system resources if unavailable
- Reduce batch size if out of memory

---

### Issue 2: Training Diverges or Doesn't Converge

**Symptoms:**
- Loss increases instead of decreasing
- Accuracy doesn't improve
- Erratic training metrics

**Diagnosis Steps:**

1. Review training configuration
```javascript
console.log('Learning rate:', config.learning_rate);
console.log('Batch size:', config.batch_size);
```

2. Check data quality
```javascript
const quality = analyzeDataQuality(trainingData);
console.log('Data quality score:', quality.score);
```

3. Monitor training progress
```javascript
const metrics = await getTrainingMetrics(trainingId);
console.log('Loss trend:', metrics.loss_history);
```

**Resolution:**

- Reduce learning rate (try 0.0001)
- Check for data issues (duplicates, errors)
- Add validation set
- Try different optimizer
- Increase training data

---

### Issue 3: Out of Memory During Training

**Symptoms:**
- "Out of memory" errors
- Training crashes
- System becomes unresponsive

**Diagnosis Steps:**

1. Check memory usage
```javascript
const usage = await getSystemMetrics();
console.log('Memory usage:', usage.memory_percent);
```

2. Review batch size
```javascript
console.log('Current batch size:', config.batch_size);
```

3. Check model size
```javascript
const size = await getModelSize(agentId);
console.log('Model parameters:', size.parameters);
```

**Resolution:**

- Reduce batch size (e.g., from 32 to 8)
- Enable gradient accumulation
- Use model compression
- Scale to larger instance
- Split training into smaller jobs

---

### Issue 4: Training Data Quality Issues

**Symptoms:**
- Poor model performance
- Unexpected behaviors
- Low accuracy despite training

**Diagnosis Steps:**

1. Analyze data distribution
```javascript
const analysis = analyzeTrainingData(trainingData);
console.log('Class balance:', analysis.class_distribution);
console.log('Data diversity:', analysis.diversity_score);
```

2. Check for duplicates
3. Review labels/annotations

**Resolution:**

- Remove duplicates
- Balance dataset
- Add more diverse examples
- Verify labels are correct
- Generate synthetic data

---

## Emergency Procedures

### Critical: Training System Failure

1. Stop all active training jobs
2. Check system health
3. Review error logs
4. Notify engineering team
5. Implement manual fallback
6. Communicate to users

---

## Monitoring

### Key Metrics to Watch

- Training job success rate
- Average training duration
- System resource utilization
- Data quality scores
- Model performance metrics

### Alerts

- Training failure rate > 10%
- Memory usage > 90%
- Training duration > 2x expected
- Data quality score < 0.7

---

## Best Practices

1. **Validate data before training**
2. **Start with small experiments**
3. **Monitor training progress**
4. **Save checkpoints frequently**
5. **Test on validation set**

---

## Escalation

**Level 1:** Check documentation and logs
**Level 2:** Contact ML engineering team
**Level 3:** Escalate to platform team

---

## Related Documentation

- [Architecture - Training System](../architecture/training-system.md)
- [Training API](../api/training-api.md)
- [AGENTS.md](../../../AGENTS.md)

---

**Last Updated:** December 30, 2025
**On-Call Contact:** [Add contact info]
