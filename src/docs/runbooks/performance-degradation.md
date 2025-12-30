# Runbook: Performance Degradation

**Severity:** High  
**Last Updated:** December 30, 2025  
**Owner:** Platform Engineering Team

---

## Overview

Procedures for diagnosing and resolving system performance degradation in Archon Orchestrator.

---

## Quick Reference

| Symptom | First Action | Time |
|---------|--------------|------|
| Slow API responses | Check system load | 2 min |
| High latency | Review metrics dashboard | 3 min |
| Timeout errors | Check resource usage | 5 min |
| Database slowdown | Analyze slow queries | 10 min |

---

## Detection & Symptoms

### Performance Indicators

**Response Time:**
- Normal: <500ms (P95)
- Degraded: 500ms-2s
- Critical: >2s

**System Load:**
- Normal: <70% CPU
- Degraded: 70-90%
- Critical: >90%

**Error Rate:**
- Normal: <0.1%
- Degraded: 0.1-1%
- Critical: >1%

---

## Diagnostic Steps

### 1. Check System Metrics

```bash
# View current metrics
curl -H "Authorization: Bearer $TOKEN" \
  https://api.archon.io/v1/metrics/system

# Response includes:
# - CPU usage
# - Memory usage
# - API latency (P50, P95, P99)
# - Error rates
# - Active connections
```

### 2. Identify Bottlenecks

```typescript
// Get performance breakdown
const perf = await sdk.functions.invoke('analyzeSystemPerformance', {
  timeRange: { last: '1h' }
});

console.log('Slowest operations:', perf.slowestOperations);
console.log('Resource bottlenecks:', perf.bottlenecks);
console.log('Error hotspots:', perf.errors);
```

### 3. Review Recent Changes

- Check recent deployments
- Review configuration changes
- Verify traffic patterns
- Check for abuse/attacks

### 4. Database Performance

```typescript
// Analyze database performance
const dbMetrics = await sdk.functions.invoke('getDatabaseMetrics');

console.log('Slow queries:', dbMetrics.slowQueries);
console.log('Connection pool:', dbMetrics.connections);
console.log('Cache hit rate:', dbMetrics.cacheHitRate);
```

---

## Resolution Procedures

### High API Latency

**Cause:** Increased load or slow operations

**Steps:**

1. **Scale Resources**
   ```bash
   # Increase server capacity
   kubectl scale deployment archon-api --replicas=10
   ```

2. **Enable Caching**
   ```typescript
   await sdk.functions.invoke('updateCacheConfig', {
     enabled: true,
     ttl: 300,  // 5 minutes
     maxSize: '1GB'
   });
   ```

3. **Optimize Queries**
   ```sql
   -- Add missing indexes
   CREATE INDEX idx_agents_status ON agents(status);
   CREATE INDEX idx_workflows_created ON workflows(created_at);
   ```

---

### Database Slowdown

**Cause:** Slow queries, missing indexes, lock contention

**Steps:**

1. **Identify Slow Queries**
   ```sql
   SELECT query, mean_exec_time, calls
   FROM pg_stat_statements
   ORDER BY mean_exec_time DESC
   LIMIT 10;
   ```

2. **Optimize Queries**
   - Add indexes on frequently queried columns
   - Rewrite inefficient queries
   - Use query caching where appropriate

3. **Connection Pool Tuning**
   ```javascript
   // Adjust pool size
   pool.max = 50;  // Increase from 20
   pool.idleTimeoutMillis = 30000;
   ```

---

### Memory Pressure

**Cause:** Memory leaks or insufficient capacity

**Steps:**

1. **Identify Memory Hogs**
   ```bash
   # Check process memory usage
   ps aux --sort=-%mem | head -20
   ```

2. **Analyze Heap**
   ```bash
   # Generate heap snapshot
   node --inspect --heap-prof app.js
   ```

3. **Increase Memory Limits**
   ```yaml
   # kubernetes/deployment.yaml
   resources:
     limits:
       memory: "4Gi"  # Increase from 2Gi
   ```

4. **Restart Services** (if leak suspected)
   ```bash
   kubectl rollout restart deployment/archon-api
   ```

---

### High CPU Usage

**Cause:** Inefficient code or high load

**Steps:**

1. **Profile CPU Usage**
   ```bash
   # CPU profiling
   node --inspect --cpu-prof app.js
   ```

2. **Optimize Hot Paths**
   - Review most-called functions
   - Reduce computational complexity
   - Use caching for expensive operations

3. **Distribute Load**
   ```bash
   # Add more worker processes
   PM2 scale app +4
   ```

---

## Prevention

### Monitoring

Set up alerts for:
```yaml
alerts:
  - name: high_api_latency
    condition: p95_latency > 1000ms
    window: 5m
    severity: warning
    
  - name: high_error_rate
    condition: error_rate > 1%
    window: 5m
    severity: critical
    
  - name: high_cpu
    condition: cpu_usage > 85%
    window: 10m
    severity: warning
```

### Capacity Planning

- Monitor growth trends
- Scale proactively
- Load test regularly
- Review resource utilization weekly

### Performance Testing

```bash
# Load testing script
k6 run --vus 100 --duration 30m load-test.js

# Performance benchmarks
npm run benchmark

# Database query analysis
EXPLAIN ANALYZE SELECT ...
```

---

## Escalation

**L1:** Platform Engineer (15 min)  
**L2:** Senior Platform Engineer (1 hour)  
**L3:** VP Engineering (4 hours)

---

**Maintainer:** Platform Engineering Team  
**Last Review:** December 30, 2025
