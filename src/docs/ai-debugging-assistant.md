# AI Debugging Assistant - User Guide

**Version:** 1.0  
**Last Updated:** December 30, 2025  
**Audience:** Developers, DevOps Engineers, QA Teams

---

## Overview

The AI Debugging Assistant is an intelligent companion that helps you debug AI agents, workflows, and orchestration issues in Archon Orchestrator. It uses advanced AI to analyze logs, explain decisions, and provide actionable recommendations to resolve problems quickly.

---

## Table of Contents

1. [Getting Started](#getting-started)
2. [Quick Start Tutorial](#quick-start-tutorial)
3. [Common Debugging Scenarios](#common-debugging-scenarios)
4. [Features](#features)
5. [Best Practices](#best-practices)
6. [Troubleshooting](#troubleshooting)

---

## Getting Started

### Prerequisites

- Active Archon Orchestrator account
- At least one deployed agent or workflow
- Appropriate permissions for debugging

### Accessing the Debugger

1. Navigate to **Agents** or **Workflows** page
2. Select the agent/workflow you want to debug
3. Click the **Debug** button in the top-right corner
4. The AI Debugging Assistant panel will open

---

## Quick Start Tutorial

### Tutorial 1: Debugging a Failed Agent Execution

**Scenario:** Your agent failed to complete a task.

**Steps:**

1. **Start Debug Session**
   ```
   1. Go to Agents → Select your agent
   2. Click "Debug" button
   3. Click "Start New Debug Session"
   ```

2. **Review Recent Logs**
   ```
   1. The log viewer shows real-time logs
   2. Look for ERROR or WARN level messages
   3. Red highlights indicate critical issues
   ```

3. **Ask the AI Assistant**
   ```
   In the chat interface, type:
   "Why did this agent fail?"
   
   The AI will analyze:
   - Error messages
   - Stack traces
   - Recent decisions
   - System state
   ```

4. **Get Recommendations**
   ```
   The AI suggests:
   - Root cause of the failure
   - Step-by-step fix instructions
   - Similar past issues and solutions
   ```

5. **Apply Fixes**
   ```
   1. Follow AI recommendations
   2. Update agent configuration
   3. Retry the execution
   4. Monitor for success
   ```

---

### Tutorial 2: Time-Travel Debugging

**Scenario:** You need to understand what happened at a specific point in time.

**Steps:**

1. **Navigate Timeline**
   ```
   1. Open debug session
   2. Use the timeline scrubber at the bottom
   3. Select a specific timestamp
   ```

2. **Inspect State**
   ```
   The panel shows:
   - Agent state at that moment
   - Variables and context
   - Active tools/functions
   - Memory/knowledge base state
   ```

3. **Compare States**
   ```
   1. Select two different timestamps
   2. Click "Compare"
   3. View diff of changes between states
   ```

---

## Common Debugging Scenarios

### Scenario 1: Agent Not Responding

**Symptoms:**
- Agent appears stuck
- No logs being generated
- Timeout errors

**Debugging Steps:**

1. **Check Agent Status**
   ```
   AI Assistant: "Is my agent alive?"
   ```
   The AI will check:
   - Process status
   - Resource usage
   - Network connectivity

2. **Review Resource Usage**
   ```
   AI Assistant: "Show me resource usage"
   ```
   Check for:
   - High CPU/memory
   - Rate limiting
   - API quota exceeded

3. **Inspect Last Activity**
   ```
   AI Assistant: "What was the last thing this agent did?"
   ```
   Identify where it got stuck

**Common Fixes:**
- Restart the agent
- Increase timeout values
- Check API quotas
- Review rate limits

---

### Scenario 2: Incorrect Agent Decisions

**Symptoms:**
- Agent makes wrong choices
- Uses wrong tools
- Unexpected behavior

**Debugging Steps:**

1. **Explain Decision**
   ```
   1. Find the decision point in logs
   2. Click "Explain Decision"
   3. AI shows reasoning process
   ```

2. **Review Context**
   ```
   AI Assistant: "What context did the agent have?"
   ```
   Check:
   - Input data quality
   - Available tools
   - System prompts
   - Memory/RAG results

3. **Analyze Training Data**
   ```
   AI Assistant: "Was this agent properly trained for this scenario?"
   ```

**Common Fixes:**
- Improve system prompts
- Add/update training data
- Refine tool descriptions
- Update RAG knowledge base

---

### Scenario 3: Performance Issues

**Symptoms:**
- Slow response times
- High latency
- Timeouts

**Debugging Steps:**

1. **Performance Analysis**
   ```
   AI Assistant: "Why is my agent slow?"
   ```
   Reviews:
   - Execution time breakdown
   - API call latencies
   - Token usage
   - Database queries

2. **Identify Bottlenecks**
   ```
   The trace visualization shows:
   - Which steps take longest
   - External API delays
   - Database query times
   ```

3. **Get Optimization Suggestions**
   ```
   AI provides:
   - Caching opportunities
   - Parallel execution suggestions
   - Query optimizations
   ```

---

### Scenario 4: Multi-Agent Coordination Issues

**Symptoms:**
- Agents not collaborating properly
- Message passing failures
- Deadlocks or race conditions

**Debugging Steps:**

1. **View Agent Interactions**
   ```
   1. Open workflow debug view
   2. See agent communication graph
   3. Identify communication breakdowns
   ```

2. **Trace Messages**
   ```
   AI Assistant: "Show me message flow between agents"
   ```
   Visualizes:
   - Message timeline
   - Failed deliveries
   - Response delays

3. **Analyze Coordination Logic**
   ```
   AI Assistant: "Why didn't Agent B respond to Agent A?"
   ```

---

## Features

### 1. Real-Time Log Streaming

- **Auto-scrolling** logs as they arrive
- **Filtering** by log level, source, keywords
- **Search** functionality for specific terms
- **Context** expansion for detailed views

**Usage:**
```
1. Logs appear automatically during execution
2. Use filters: "Show only ERROR logs"
3. Search: Cmd+F or search box
4. Click any log line for full context
```

---

### 2. Interactive Chat Assistant

Ask natural language questions:

**Example Queries:**
```
"Why did this fail?"
"What caused the timeout?"
"Show me performance metrics"
"Explain this error message"
"What should I do next?"
"Compare this run to the last successful one"
```

**AI Capabilities:**
- Understands context from current debug session
- References historical data
- Provides code snippets and examples
- Links to relevant documentation

---

### 3. Trace Visualization

Visual representation of execution flow:

- **Spans** for each operation
- **Timeline** view of execution
- **Dependencies** between operations
- **Performance** metrics per span
- **Errors** highlighted in red

**Interaction:**
```
1. Click any span for details
2. Zoom in/out on timeline
3. Filter by service/operation
4. Export trace for sharing
```

---

### 4. State Inspector

Inspect agent state at any point:

- **Variables** and their values
- **Context** window contents
- **Memory** state
- **Tool** availability
- **Configuration** at that moment

**Usage:**
```
1. Pause execution or select timestamp
2. State Inspector panel shows current state
3. Expand sections for details
4. Copy values for testing
```

---

### 5. Comparison Tools

Compare different executions:

**Compare Runs:**
```
1. Select two workflow runs
2. Click "Compare"
3. See diff of:
   - Input differences
   - Output differences
   - Performance metrics
   - Execution paths
```

**Compare States:**
```
1. Select two timestamps in same session
2. Click "Compare States"
3. View what changed between moments
```

---

## Best Practices

### 1. Effective Questioning

**Good Questions:**
```
✅ "Why did the agent fail at 14:32?"
✅ "What was the agent's context when it made that decision?"
✅ "Show me performance comparison with yesterday"
✅ "What's causing the high memory usage?"
```

**Less Effective Questions:**
```
❌ "Fix it"
❌ "What's wrong?"
❌ "Help"
```

**Tip:** Be specific about what you want to know. Reference timestamps, error messages, or specific operations.

---

### 2. Debugging Workflow

**Recommended Process:**

```
1. Reproduce the Issue
   └─> Run the agent/workflow in debug mode

2. Identify the Failure Point
   └─> Look for errors in logs or trace

3. Gather Context
   └─> Check state, variables, configuration

4. Ask the AI
   └─> Get analysis and recommendations

5. Hypothesize
   └─> Form a theory about the root cause

6. Test
   └─> Apply fixes and re-run

7. Verify
   └─> Confirm the issue is resolved

8. Document
   └─> Save findings for future reference
```

---

### 3. Using Breakpoints

Set breakpoints to pause execution:

```
1. In debug mode, click line numbers in logs
2. Add conditional breakpoints
3. When hit, execution pauses
4. Inspect state before continuing
```

**Example Use Cases:**
- Before critical decisions
- After tool executions
- When specific variables change
- On error conditions

---

### 4. Collaborative Debugging

Share debug sessions with your team:

```
1. Click "Share Session" button
2. Copy the session link
3. Team members can view the same session
4. Chat is shared in real-time
5. Annotations are visible to all
```

---

## Troubleshooting

### Common Issues

#### Issue: "Debug session failed to start"

**Causes:**
- Agent/workflow is not running
- Insufficient permissions
- Resource limits exceeded

**Solutions:**
1. Ensure agent/workflow is deployed and running
2. Check your account permissions
3. Contact admin if resource limits hit

---

#### Issue: "AI Assistant not responding"

**Causes:**
- Network connectivity issues
- High system load
- Service maintenance

**Solutions:**
1. Check your internet connection
2. Refresh the page
3. Try again in a few minutes
4. Check status page for service health

---

#### Issue: "Logs not appearing"

**Causes:**
- Log level filtering too strict
- Time range selection issue
- Agent not generating logs

**Solutions:**
1. Reset filters (click "Clear Filters")
2. Adjust time range to "All Time"
3. Check agent logging configuration
4. Verify agent is actually running

---

#### Issue: "Cannot navigate timeline"

**Causes:**
- No snapshots captured
- Session not started properly
- Browser compatibility

**Solutions:**
1. Ensure debug session was started before execution
2. Check browser console for errors
3. Try a different browser
4. Restart debug session

---

## Keyboard Shortcuts

| Shortcut | Action |
|----------|--------|
| `Cmd/Ctrl + F` | Search logs |
| `Cmd/Ctrl + K` | Open command palette |
| `Space` | Play/Pause execution |
| `→` | Step forward in timeline |
| `←` | Step backward in timeline |
| `Cmd/Ctrl + Enter` | Send chat message |
| `Esc` | Close panels |

---

## Advanced Features

### Custom Queries

Write custom queries for log analysis:

```javascript
// Query logs for specific patterns
logs.filter(log => 
  log.level === 'error' && 
  log.message.includes('timeout')
).groupBy('source');
```

### Export Options

Export debug data:
- **JSON**: Full session data
- **CSV**: Logs and metrics
- **PDF**: Visual report
- **Link**: Shareable session URL

---

## Getting Help

### Resources

- **Documentation**: [Full Architecture Guide](./architecture-ai-debugging.md)
- **API Reference**: [Training API Docs](./api/training-api.md)
- **Runbooks**: [Common Issues](./runbooks/ai-debugger-failure.md)
- **Support**: support@archon-orchestrator.com

### In-App Help

- Click **?** icon in any panel for context help
- Hover over UI elements for tooltips
- Use AI Assistant: "How do I...?"

---

## Feedback

We're constantly improving the AI Debugging Assistant. Share your feedback:

- In-app: Click **Feedback** button
- Email: feedback@archon-orchestrator.com
- GitHub: [Issues](https://github.com/archon-orchestrator/issues)

---

**Document Version:** 1.0  
**Last Updated:** December 30, 2025  
**Next Review:** Q1 2025
