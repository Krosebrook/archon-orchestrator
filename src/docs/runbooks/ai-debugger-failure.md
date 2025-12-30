# Runbook: AI Debugger Failure

**Operational Runbook for AI Debugging System Issues**

---

## Overview

This runbook provides step-by-step procedures for diagnosing and resolving issues with the AI Debugging system.

---

## Common Issues

### Issue 1: Debug Session Won't Start

**Symptoms:**
- `startDebugSession` returns errors
- Session creation timeouts
- "Session unavailable" errors

**Diagnosis Steps:**

1. Check system health
```javascript
const health = await base44.functions.getSystemHealth();
console.log('Debug system status:', health.data.components.debug);
```

2. Verify agent/execution exists
```javascript
const agent = await base44.entities.Agent.get(agentId);
console.log('Agent status:', agent.status);
```

3. Check session limits
```javascript
const activeSessions = await base44.entities.DebugSession.filter({
  status: 'active',
  user_id: userId
});
console.log('Active sessions:', activeSessions.length);
```

**Resolution:**

- If system unhealthy: Wait for recovery or contact support
- If agent inactive: Activate agent first
- If session limit reached: End unused sessions

---

### Issue 2: Trace Data Missing

**Symptoms:**
- Incomplete execution traces
- Missing events in timeline
- "No trace data found" errors

**Diagnosis Steps:**

1. Verify trace was created
```javascript
const trace = await base44.entities.Trace.get(traceId);
```

2. Check trace collection status
```javascript
const events = await base44.entities.TraceEvent.filter({ trace_id: traceId });
console.log('Events collected:', events.length);
```

3. Review trace configuration
```javascript
console.log('Trace config:', trace.config);
```

**Resolution:**

- If trace not created: Ensure createTrace was called
- If events missing: Check instrumentation code
- If configuration wrong: Update trace settings

---

### Issue 3: Slow Debug Performance

**Symptoms:**
- Debug console loads slowly
- Event queries timeout
- UI unresponsive

**Diagnosis Steps:**

1. Check trace size
```javascript
const stats = await getTraceStats(traceId);
console.log('Event count:', stats.event_count);
console.log('Data size:', stats.size_bytes);
```

2. Review query complexity
3. Check system load

**Resolution:**

- Use sampling for large traces
- Optimize query filters
- Increase timeout limits
- Scale debug infrastructure

---

## Emergency Procedures

### Critical: Debug System Down

1. Check overall system status
2. Review error logs
3. Contact on-call engineer
4. Implement fallback debugging methods
5. Communicate status to users

---

## Escalation

**Level 1:** User documentation and self-service
**Level 2:** Support team assistance
**Level 3:** Engineering team investigation
**Level 4:** Platform team involvement

---

## Related Documentation

- [AI Debugging Assistant](../ai-debugging-assistant.md)
- [Architecture - AI Debugging](../architecture-ai-debugging.md)

---

**Last Updated:** December 30, 2025
**On-Call Contact:** [Add contact info]
