# Runbook: Training Failures

**Severity:** High  
**Last Updated:** December 30, 2025  
**Owner:** ML Operations Team

---

## Overview

This runbook provides step-by-step procedures for diagnosing and resolving AI agent training failures in Archon Orchestrator.

---

## Table of Contents

1. [Quick Reference](#quick-reference)
2. [Symptoms and Detection](#symptoms-and-detection)
3. [Diagnostic Steps](#diagnostic-steps)
4. [Resolution Procedures](#resolution-procedures)
5. [Prevention](#prevention)
6. [Escalation](#escalation)

---

## Quick Reference

### Common Issues Quick Fix

| Issue | Quick Fix | Time |
|-------|-----------|------|
| Out of Memory | Reduce batch size | 5 min |
| Dataset Not Found | Verify dataset ID | 2 min |
| Diverging Loss | Lower learning rate | 10 min |
| Timeout | Increase timeout limit | 5 min |
| Permission Denied | Check IAM roles | 10 min |

---

## Symptoms and Detection

### Symptom 1: Training Job Fails to Start

**Indicators:**
- Job status stuck on "queued"
- Error message: "Failed to initialize training environment"
- No logs generated

**Alert Threshold:** Job queued > 10 minutes

---

### Symptom 2: Training Job Crashes Mid-Training

**Indicators:**
- Sudden status change to "failed"
- Incomplete epochs
- Error in logs
- Metrics stop updating

**Alert Threshold:** Unexpected status change

---

### Symptom 3: Poor Training Performance

**Indicators:**
- Loss not decreasing
- Accuracy not improving
- Validation worse than training
- Metrics plateauing

**Alert Threshold:** No improvement for 3 consecutive epochs

---

### Symptom 4: Resource Exhaustion

**Indicators:**
- Out of Memory (OOM) errors
- CPU/GPU timeout
- Disk space full
- Network timeouts

**Alert Threshold:** Resource usage > 90%

---

## Diagnostic Steps

### Step 1: Check Training Job Status

```bash
# Get training job details
curl -H "Authorization: Bearer $TOKEN" \
  https://api.archon.io/v1/training/jobs/$JOB_ID

# Check recent logs
curl -H "Authorization: Bearer $TOKEN" \
  https://api.archon.io/v1/training/jobs/$JOB_ID/logs?tail=100
```

**What to look for:**
- Job status (queued, running, failed)
- Error messages
- Last successful operation
- Resource usage metrics

---

### Step 2: Review Training Configuration

```typescript
// Verify training configuration
const job = await sdk.functions.invoke('getTrainingJob', {
  jobId: 'job-456'
});

console.log('Config:', job.config);
console.log('Dataset:', job.config.dataset);
console.log('Hyperparameters:', job.config.hyperparameters);
```

**Common Configuration Issues:**
- Invalid dataset ID
- Incompatible hyperparameters
- Missing required fields
- Resource limits too low

---

### Step 3: Validate Training Data

```typescript
// Check dataset health
const validation = await sdk.functions.invoke('validateTrainingData', {
  datasetId: 'dataset-101'
});

console.log('Valid:', validation.valid);
console.log('Issues:', validation.issues);
console.log('Statistics:', validation.statistics);
```

**Data Issues to Check:**
- Dataset exists and is accessible
- Data format is correct
- No corruption in data files
- Sufficient data quantity
- Proper label distribution

---

### Step 4: Check Resource Availability

```typescript
// Check system resources
const resources = await sdk.functions.invoke('getSystemResources');

console.log('CPU:', resources.cpu);
console.log('Memory:', resources.memory);
console.log('GPU:', resources.gpu);
console.log('Disk:', resources.disk);
```

**Resource Checks:**
- Available compute capacity
- Memory limits
- GPU availability (if required)
- Disk space
- Network bandwidth

---

### Step 5: Review Agent Logs

```typescript
// Get detailed agent logs during training
const logs = await sdk.functions.invoke('analyzeAgentLogs', {
  agentId: 'agent-123',
  timeRange: {
    start: trainingStartTime,
    end: trainingEndTime
  },
  level: 'error'
});

console.log('Errors:', logs.errors);
console.log('Patterns:', logs.patterns);
```

---

## Resolution Procedures

### Resolution 1: Out of Memory (OOM)

**Cause:** Training batch size too large for available memory

**Steps:**

1. **Reduce Batch Size**
   ```typescript
   // Restart training with smaller batch
   const newJob = await sdk.functions.invoke('trainAgent', {
     agentId: 'agent-123',
     config: {
       ...previousConfig,
       batchSize: previousConfig.batchSize / 2  // Half the batch size
     }
   });
   ```

2. **Enable Gradient Accumulation** (if supported)
   ```typescript
   config.gradientAccumulation = {
     steps: 2  // Accumulate gradients over 2 steps
   };
   ```

3. **Request More Resources**
   ```typescript
   config.resources = {
     memory: '16GB',  // Increase from 8GB
     gpu: 'A100'      // Upgrade GPU if available
   };
   ```

**Verification:**
- Training starts successfully
- Memory usage stays below 90%
- No OOM errors in logs

---

### Resolution 2: Dataset Not Found

**Cause:** Invalid dataset ID or permissions issue

**Steps:**

1. **Verify Dataset Exists**
   ```bash
   curl -H "Authorization: Bearer $TOKEN" \
     https://api.archon.io/v1/datasets/$DATASET_ID
   ```

2. **Check Permissions**
   ```typescript
   const permissions = await sdk.functions.invoke('checkDatasetPermissions', {
     datasetId: 'dataset-101',
     agentId: 'agent-123'
   });
   ```

3. **Use Correct Dataset ID**
   ```typescript
   // List available datasets
   const datasets = await sdk.entities.query('Dataset', {
     filters: { status: 'ready' }
   });
   console.log('Available datasets:', datasets);
   ```

**Verification:**
- Dataset is accessible
- Correct dataset ID used
- Training starts with proper data

---

### Resolution 3: Diverging Loss

**Cause:** Learning rate too high or data quality issues

**Steps:**

1. **Reduce Learning Rate**
   ```typescript
   config.learningRate = config.learningRate * 0.1;  // Reduce by 10x
   ```

2. **Enable Learning Rate Scheduling**
   ```typescript
   config.learningRateSchedule = {
     type: 'exponential',
     decayRate: 0.96,
     decaySteps: 1000
   };
   ```

3. **Add Gradient Clipping**
   ```typescript
   config.gradientClipping = {
     maxNorm: 1.0
   };
   ```

4. **Check Data Quality**
   ```typescript
   const validation = await sdk.functions.invoke('validateTrainingData', {
     datasetId: config.dataset,
     checks: ['quality', 'outliers', 'duplicates']
   });
   ```

**Verification:**
- Loss decreases consistently
- No sudden spikes in loss
- Validation loss tracks training loss

---

### Resolution 4: Training Timeout

**Cause:** Training takes longer than expected

**Steps:**

1. **Increase Timeout**
   ```typescript
   config.timeout = {
     perEpoch: '30m',    // Increase from 15m
     total: '4h'         // Increase from 2h
   };
   ```

2. **Reduce Dataset Size** (for testing)
   ```typescript
   config.dataSubset = 0.1;  // Use 10% of data for quick test
   ```

3. **Optimize Training**
   ```typescript
   config.optimization = {
     mixedPrecision: true,     // Use FP16 for speed
     cudnn: {
       benchmark: true,        // Optimize CUDA operations
       deterministic: false
     }
   };
   ```

**Verification:**
- Training completes within timeout
- Performance is acceptable
- No quality degradation

---

### Resolution 5: Permission Denied

**Cause:** Insufficient IAM permissions

**Steps:**

1. **Check Current Permissions**
   ```bash
   # Verify agent permissions
   curl -H "Authorization: Bearer $TOKEN" \
     https://api.archon.io/v1/agents/agent-123/permissions
   ```

2. **Grant Required Permissions**
   ```typescript
   await sdk.functions.invoke('grantPermissions', {
     agentId: 'agent-123',
     permissions: [
       'training:start',
       'training:read',
       'dataset:read',
       'model:write'
     ]
   });
   ```

3. **Verify IAM Role**
   - Check that the service account has proper roles
   - Ensure API key has necessary scopes

**Verification:**
- Agent can access training resources
- No permission errors in logs
- Training starts successfully

---

## Prevention

### Best Practices

1. **Validate Configuration Before Training**
   ```typescript
   // Always validate config
   const validation = await sdk.functions.invoke('validateTrainingConfig', {
     config: trainingConfig
   });
   
   if (!validation.valid) {
     console.error('Invalid config:', validation.errors);
     return;
   }
   ```

2. **Start with Small-Scale Test**
   ```typescript
   // Run quick test with subset
   const testConfig = {
     ...fullConfig,
     epochs: 1,
     dataSubset: 0.01  // 1% of data
   };
   ```

3. **Monitor Training Metrics**
   ```typescript
   // Set up monitoring
   await sdk.functions.invoke('setupTrainingMonitoring', {
     jobId: trainingJob.id,
     alerts: {
       lossNotDecreasing: { epochs: 3, threshold: 0.01 },
       memoryUsage: { threshold: 0.9 },
       timeout: { perEpoch: '30m' }
     }
   });
   ```

4. **Use Checkpoints**
   ```typescript
   config.checkpoints = {
     enabled: true,
     frequency: 'epoch',
     keep: 3  // Keep last 3 checkpoints
   };
   ```

5. **Regular Data Validation**
   - Schedule weekly data quality checks
   - Monitor data drift
   - Update datasets regularly

---

### Automated Checks

Set up automated validation:

```typescript
// Pre-training validation pipeline
async function validateBeforeTraining(config) {
  const checks = [];
  
  // Check 1: Configuration validity
  checks.push(await validateConfig(config));
  
  // Check 2: Dataset availability
  checks.push(await validateDataset(config.dataset));
  
  // Check 3: Resource availability
  checks.push(await validateResources(config.resources));
  
  // Check 4: Permissions
  checks.push(await validatePermissions(config.agentId));
  
  return checks.every(check => check.passed);
}
```

---

## Escalation

### When to Escalate

Escalate to senior engineer if:
- Issue persists after following all resolution steps
- Multiple agents affected simultaneously
- Data corruption suspected
- System-wide resource issues
- Security concerns

### Escalation Contacts

| Level | Contact | Response Time |
|-------|---------|---------------|
| L1 | ML Ops Team | 15 minutes |
| L2 | Senior ML Engineer | 1 hour |
| L3 | Platform Engineering | 2 hours |
| L4 | VP Engineering | 4 hours |

### Escalation Template

```
Subject: Training Failure Escalation - [JOB_ID]

Severity: [High/Critical]
Affected Agent: [AGENT_ID]
Training Job: [JOB_ID]
Time of Failure: [TIMESTAMP]

Symptoms:
- [Describe symptoms]

Steps Taken:
1. [Action 1]
2. [Action 2]
...

Current Status:
[Describe current state]

Impact:
[Describe business impact]

Logs:
[Attach relevant logs]
```

---

## Post-Incident Review

After resolving the issue:

1. **Document the incident**
   - What happened?
   - Root cause
   - Resolution steps
   - Time to resolution

2. **Update runbook** if new scenario encountered

3. **Improve monitoring** to catch similar issues earlier

4. **Conduct blameless post-mortem** if severity was high

5. **Share learnings** with the team

---

## Related Documentation

- [Training System Architecture](../architecture/training-system.md)
- [Training API Reference](../api/training-api.md)
- [AI Debugging Assistant Guide](../ai-debugging-assistant.md)

---

## Revision History

| Version | Date | Changes |
|---------|------|---------|
| 1.0 | 2025-12-30 | Initial runbook created |

**Maintainer:** ML Operations Team  
**Last Review:** December 30, 2025  
**Next Review:** Q1 2025
