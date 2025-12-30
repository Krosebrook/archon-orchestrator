# Runbook: AI Debugger Failures

**Severity:** Medium  
**Last Updated:** December 30, 2025  
**Owner:** DevOps Team

---

## Overview

This runbook provides troubleshooting procedures for AI Debugging Assistant and debug session failures in Archon Orchestrator.

---

## Quick Reference

| Issue | Quick Fix | Time |
|-------|-----------|------|
| Debug session won't start | Check agent status | 2 min |
| Logs not appearing | Clear filters, refresh | 1 min |
| AI Assistant not responding | Check API status | 3 min |
| Timeline navigation broken | Restart session | 5 min |
| Trace visualization blank | Verify traces exist | 3 min |

---

## Common Issues

### Issue 1: Debug Session Fails to Start

**Symptoms:**
- "Failed to create debug session" error
- Button unresponsive
- Infinite loading state

**Diagnostic Steps:**

1. **Check Agent Status**
   ```typescript
   const agent = await sdk.entities.get('Agent', agentId);
   console.log('Status:', agent.status);
   // Must be 'active' or 'deployed'
   ```

2. **Verify Permissions**
   ```typescript
   const permissions = await sdk.functions.invoke('checkPermissions', {
     userId: currentUser.id,
     resource: 'agent',
     action: 'debug'
   });
   ```

3. **Check Active Sessions**
   ```typescript
   const activeSessions = await sdk.entities.query('DebugSession', {
     filters: { agentId, status: 'active' }
   });
   // Limit may be reached
   ```

**Resolution:**

1. If agent is inactive:
   ```typescript
   await sdk.entities.update('Agent', agentId, {
     status: 'active'
   });
   ```

2. If permission issue:
   ```
   Contact admin to grant debug permissions
   ```

3. If session limit reached:
   ```typescript
   // End old sessions
   for (const session of activeSessions.slice(0, -2)) {
     await sdk.functions.invoke('endDebugSession', {
       sessionId: session.id
     });
   }
   ```

---

### Issue 2: Logs Not Appearing

**Symptoms:**
- Empty log viewer
- "No logs found" message
- Old logs visible but new ones don't appear

**Diagnostic Steps:**

1. **Check Filters**
   - Are filters too restrictive?
   - Check time range selection
   - Verify log level filter

2. **Verify Agent is Running**
   ```typescript
   const executions = await sdk.entities.query('AgentExecution', {
     filters: {
       agentId,
       startTime: { $gt: debugSessionStartTime }
     }
   });
   ```

3. **Check Log Streaming Connection**
   ```javascript
   // Browser console
   console.log('WebSocket status:', ws.readyState);
   // 0=CONNECTING, 1=OPEN, 2=CLOSING, 3=CLOSED
   ```

**Resolution:**

1. **Reset Filters**
   ```
   - Click "Clear All Filters"
   - Set time range to "Last Hour"
   - Set level to "All"
   ```

2. **Restart Log Streaming**
   ```
   - Click "Disconnect" button
   - Wait 5 seconds
   - Click "Reconnect"
   ```

3. **Check Network**
   ```bash
   # Verify WebSocket endpoint is reachable
   curl -I https://api.archon.io/v1/logs/stream
   ```

---

### Issue 3: AI Assistant Not Responding

**Symptoms:**
- Messages sent but no response
- "Thinking..." stuck indefinitely
- Error messages in chat

**Diagnostic Steps:**

1. **Check API Status**
   ```bash
   curl https://status.archon.io/api/v1/status
   ```

2. **Verify Debug Context**
   ```typescript
   const context = await sdk.functions.invoke('getDebugContext', {
     sessionId
   });
   console.log('Context loaded:', !!context);
   ```

3. **Check Rate Limits**
   ```
   Look for "Rate limit exceeded" in browser console
   ```

**Resolution:**

1. **Refresh Session**
   ```typescript
   await sdk.functions.invoke('refreshDebugSession', {
     sessionId
   });
   ```

2. **Clear and Resend**
   ```
   - Clear chat history (optional)
   - Rephrase question
   - Try simpler query first
   ```

3. **Check System Status**
   ```
   Visit: https://status.archon.io
   If degraded, wait and retry
   ```

---

### Issue 4: Timeline Navigation Not Working

**Symptoms:**
- Cannot scrub through timeline
- Clicking timestamps does nothing
- Timeline appears empty

**Diagnostic Steps:**

1. **Verify Snapshots Exist**
   ```typescript
   const snapshots = await sdk.entities.query('DebugSnapshot', {
     filters: { sessionId }
   });
   console.log('Snapshot count:', snapshots.length);
   ```

2. **Check Browser Console**
   ```javascript
   // Look for JavaScript errors
   console.error
   ```

3. **Test with Different Browser**
   - Try Chrome/Firefox/Safari
   - Disable extensions
   - Clear cache

**Resolution:**

1. **If No Snapshots**
   ```
   Debug session needs to be active during agent execution
   Restart session BEFORE running agent
   ```

2. **If Browser Issue**
   ```
   - Clear browser cache
   - Hard refresh (Ctrl+Shift+R)
   - Try incognito mode
   - Update browser to latest version
   ```

3. **Restart Session**
   ```typescript
   await sdk.functions.invoke('endDebugSession', { sessionId });
   const newSession = await sdk.functions.invoke('startDebugSession', {
     agentId
   });
   ```

---

### Issue 5: Trace Visualization Empty

**Symptoms:**
- Blank trace viewer
- "No traces found"
- Traces expected but not showing

**Diagnostic Steps:**

1. **Check if Traces Were Created**
   ```typescript
   const traces = await sdk.entities.query('Trace', {
     filters: {
       agentId,
       timestamp: { $gt: sessionStartTime }
     }
   });
   console.log('Traces found:', traces.length);
   ```

2. **Verify Tracing is Enabled**
   ```typescript
   const agentConfig = await sdk.entities.get('Agent', agentId);
   console.log('Tracing enabled:', agentConfig.tracing?.enabled);
   ```

3. **Check Trace Completion**
   ```typescript
   const incompleteTr aces = traces.filter(t => !t.endTime);
   console.log('Incomplete traces:', incompleteTra ces.length);
   ```

**Resolution:**

1. **Enable Tracing**
   ```typescript
   await sdk.entities.update('Agent', agentId, {
     tracing: {
       enabled: true,
       sampleRate: 1.0  // 100% sampling
     }
   });
   ```

2. **Complete Open Traces**
   ```typescript
   for (const trace of incompleteTraces) {
     await sdk.functions.invoke('endTrace', {
       traceId: trace.id,
       status: 'completed'
     });
   }
   ```

3. **Re-execute with Tracing**
   ```
   Run the agent/workflow again with tracing enabled
   ```

---

## Performance Issues

### Slow Debug UI

**Symptoms:**
- Laggy interface
- Slow log updates
- High browser CPU/memory

**Resolution:**

1. **Reduce Log Volume**
   ```
   - Filter to ERROR/WARN only
   - Reduce time window
   - Pause streaming when not needed
   ```

2. **Clear Old Sessions**
   ```typescript
   // Clean up old sessions
   const oldSessions = await sdk.entities.query('DebugSession', {
     filters: {
       endTime: { $lt: Date.now() - 7 * 24 * 60 * 60 * 1000 }  // 7 days old
     }
   });
   for (const session of oldSessions) {
     await sdk.entities.delete('DebugSession', session.id);
   }
   ```

3. **Optimize Browser**
   ```
   - Close unused tabs
   - Disable heavy extensions
   - Restart browser
   - Clear browser cache
   ```

---

## Prevention

### Best Practices

1. **Start Debug Before Execution**
   ```
   Always start debug session BEFORE running agent
   This ensures all events are captured
   ```

2. **Use Appropriate Filters**
   ```
   Don't leave filters on "All" for long-running agents
   Filter early to reduce data volume
   ```

3. **End Sessions When Done**
   ```typescript
   // Always clean up
   await sdk.functions.invoke('endDebugSession', {
     sessionId
   });
   ```

4. **Monitor Session Limits**
   ```
   Check active session count regularly
   Don't exceed account limits
   ```

5. **Enable Tracing for Complex Workflows**
   ```typescript
   config.tracing = {
     enabled: true,
     detailed: true  // For complex debugging
   };
   ```

---

## Escalation

### When to Escalate

- AI Assistant consistently failing
- System-wide debug failures
- Data loss in debug sessions
- Security concerns with debug data
- Performance severely degraded

### Escalation Path

L1 → DevOps Team (15 min)  
L2 → Platform Engineering (1 hour)  
L3 → Engineering Lead (4 hours)

---

## Monitoring & Alerts

### Key Metrics

- Debug session creation success rate
- AI Assistant response time
- Log streaming latency
- Trace completion rate
- Debug UI performance

### Alert Thresholds

```yaml
debug_session_failures:
  threshold: 5 per hour
  severity: medium

ai_assistant_timeout:
  threshold: >30s response time
  severity: high

log_stream_disconnects:
  threshold: 3 per session
  severity: medium
```

---

## Related Documentation

- [AI Debugging Architecture](../architecture-ai-debugging.md)
- [AI Debugging Assistant Guide](../ai-debugging-assistant.md)
- [Training Failures Runbook](./training-failures.md)

---

**Maintainer:** DevOps Team  
**Last Review:** December 30, 2025  
**Next Review:** Q1 2025
