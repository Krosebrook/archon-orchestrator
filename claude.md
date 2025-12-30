# Claude AI Integration Guide

**Version:** 1.0  
**Last Updated:** December 30, 2025  
**Claude Version:** Claude 3.5 Sonnet

---

## Overview

Archon Orchestrator natively integrates with Anthropic's Claude AI models, providing powerful language understanding and generation capabilities for your agents.

---

## Supported Models

### Claude 3.5 Sonnet (Recommended)

**Capabilities:**
- Advanced reasoning
- Long context (200K tokens)
- Tool use / function calling
- Vision (image understanding)
- Multilingual support

**Performance:**
- Speed: Fast
- Cost: $3 / $15 per MTok (input/output)
- Quality: Excellent

**Best For:**
- Complex reasoning tasks
- Code generation/analysis
- Multi-step workflows
- Customer support

---

### Claude 3 Opus

**Capabilities:**
- Highest intelligence
- Complex problem solving
- Creative tasks
- Research and analysis

**Performance:**
- Speed: Slower
- Cost: $15 / $75 per MTok
- Quality: Best-in-class

**Best For:**
- Critical decisions
- Complex analysis
- Creative content
- Strategic planning

---

### Claude 3 Haiku

**Capabilities:**
- Fast responses
- Good for simple tasks
- Cost-effective

**Performance:**
- Speed: Very fast
- Cost: $0.25 / $1.25 per MTok
- Quality: Good

**Best For:**
- High-volume tasks
- Simple queries
- Real-time responses
- Classification

---

## Configuration

### Basic Agent Setup

```typescript
const agent = await sdk.entities.create('Agent', {
  name: 'Claude Assistant',
  provider: 'anthropic',
  model: 'claude-3-5-sonnet-20241022',
  config: {
    apiKey: process.env.ANTHROPIC_API_KEY,
    temperature: 0.7,
    maxTokens: 4096,
    topP: 0.9
  }
});
```

---

### System Prompts

**Best Practices:**

```typescript
const systemPrompt = `You are a helpful AI assistant for Archon Orchestrator.

Role: Customer Support Agent
Expertise: Product knowledge, troubleshooting, escalation
Tone: Professional, friendly, empathetic

Guidelines:
1. Always greet the customer
2. Ask clarifying questions
3. Provide step-by-step solutions
4. Escalate if needed
5. Confirm issue resolution

Available Tools:
- search_kb: Search knowledge base
- create_ticket: Create support ticket
- check_status: Check order/account status
- send_email: Send follow-up email

Response Format:
- Be concise but thorough
- Use bullet points for clarity
- Include links when relevant
- End with "Is there anything else I can help with?"`;

agent.systemPrompt = systemPrompt;
```

---

### Tool Use (Function Calling)

Claude excels at using tools. Define tools for your agent:

```typescript
const tools = [
  {
    name: 'search_database',
    description: 'Search the customer database for user information',
    input_schema: {
      type: 'object',
      properties: {
        user_id: {
          type: 'string',
          description: 'The unique user identifier'
        },
        fields: {
          type: 'array',
          items: { type: 'string' },
          description: 'Fields to retrieve'
        }
      },
      required: ['user_id']
    }
  },
  {
    name: 'send_notification',
    description: 'Send a notification to the user',
    input_schema: {
      type: 'object',
      properties: {
        user_id: { type: 'string' },
        message: { type: 'string' },
        channel: {
          type: 'string',
          enum: ['email', 'sms', 'push']
        }
      },
      required: ['user_id', 'message', 'channel']
    }
  }
];

await sdk.functions.invoke('configureAgentTools', {
  agentId: agent.id,
  tools
});
```

---

### Conversation Management

**Multi-turn Conversations:**

```typescript
// Start conversation
const conversation = await sdk.entities.create('Conversation', {
  agentId: agent.id,
  userId: 'user-123'
});

// Send message
const response1 = await sdk.functions.invoke('sendMessage', {
  conversationId: conversation.id,
  message: "Hello! I need help with my account"
});

// Continue conversation (maintains context)
const response2 = await sdk.functions.invoke('sendMessage', {
  conversationId: conversation.id,
  message: "I forgot my password"
});

// Claude remembers previous messages
```

**Context Management:**

```typescript
agent.config.contextManagement = {
  maxTurns: 50,  // Keep last 50 turns
  summarization: {
    enabled: true,
    threshold: 40  // Summarize when reaching 40 turns
  },
  contextWindow: 100000  // Use up to 100K tokens
};
```

---

## Advanced Features

### Vision Capabilities

```typescript
const agent = await sdk.entities.create('Agent', {
  name: 'Image Analyzer',
  model: 'claude-3-5-sonnet-20241022',
  capabilities: ['vision']
});

// Analyze image
const result = await sdk.functions.invoke('executeAgent', {
  agentId: agent.id,
  input: {
    text: "What's in this image? Describe in detail.",
    images: [
      {
        type: 'base64',
        data: imageBase64,
        mediaType: 'image/jpeg'
      }
    ]
  }
});
```

---

### Extended Context

Use Claude's 200K token context for long documents:

```typescript
const agent = await sdk.entities.create('Agent', {
  name: 'Document Analyzer',
  model: 'claude-3-5-sonnet-20241022',
  config: {
    maxTokens: 8192,
    contextWindow: 200000
  }
});

// Analyze long document
const analysis = await sdk.functions.invoke('executeAgent', {
  agentId: agent.id,
  input: {
    text: "Analyze this contract and extract key terms",
    context: longContractText  // Up to 200K tokens
  }
});
```

---

### Streaming Responses

For real-time responses:

```typescript
const stream = await sdk.functions.invoke('executeAgentStream', {
  agentId: agent.id,
  input: { text: "Write a blog post about AI" }
});

// Process chunks
for await (const chunk of stream) {
  console.log(chunk.text);  // Display incrementally
}
```

---

## Use Cases

### 1. Customer Support Chatbot

```typescript
const supportAgent = {
  name: 'Support Bot',
  model: 'claude-3-5-sonnet-20241022',
  systemPrompt: `Customer support specialist. 
  Knowledgeable, patient, solution-oriented.`,
  tools: [
    'search_kb',
    'create_ticket',
    'check_order_status',
    'process_refund'
  ],
  config: {
    temperature: 0.3,  // More consistent
    maxTokens: 2048
  }
};
```

**Metrics:**
- Resolution Rate: 78%
- Avg Response Time: 1.8s
- Customer Satisfaction: 4.5/5

---

### 2. Code Review Assistant

```typescript
const codeReviewer = {
  name: 'Code Reviewer',
  model: 'claude-3-5-sonnet-20241022',
  systemPrompt: `Expert code reviewer. 
  Focus: security, performance, maintainability.
  Provide actionable feedback with examples.`,
  tools: ['analyze_code', 'suggest_fix', 'check_security'],
  config: {
    temperature: 0.2,  // Precise
    maxTokens: 4096
  }
};
```

**Capabilities:**
- Security vulnerability detection
- Performance optimization suggestions
- Code style enforcement
- Best practices recommendations

---

### 3. Content Generator

```typescript
const contentAgent = {
  name: 'Content Creator',
  model: 'claude-3-opus-20240229',  // Best quality
  systemPrompt: `Professional content writer.
  Create engaging, SEO-optimized content.
  Adapt tone to brand voice.`,
  config: {
    temperature: 0.9,  // More creative
    maxTokens: 8192
  }
};
```

**Outputs:**
- Blog posts
- Social media content
- Product descriptions
- Email campaigns
- Documentation

---

### 4. Data Analyst

```typescript
const analyst = {
  name: 'Data Analyst',
  model: 'claude-3-5-sonnet-20241022',
  systemPrompt: `Data analyst with statistical expertise.
  Analyze data, identify patterns, make recommendations.`,
  tools: [
    'query_database',
    'calculate_statistics',
    'generate_visualization'
  ],
  config: {
    temperature: 0.1,  // Analytical
    maxTokens: 4096
  }
};
```

---

## Best Practices

### 1. Prompt Engineering

**Clear Instructions:**
```typescript
// ❌ Vague
"Help with customer issues"

// ✅ Specific
`You are a Tier 1 support agent. Handle customer inquiries about:
- Account access issues
- Billing questions
- Product usage
Escalate technical bugs to engineering.
Response time target: <2 minutes`
```

---

### 2. Error Handling

```typescript
try {
  const response = await sdk.functions.invoke('executeAgent', {
    agentId: agent.id,
    input: { text: userMessage },
    config: {
      retries: 3,
      timeout: 30000,  // 30s
      fallback: {
        agent: 'fallback-agent-id',
        condition: 'error'
      }
    }
  });
} catch (error) {
  if (error.code === 'RATE_LIMIT') {
    // Wait and retry
    await delay(1000);
    return retry();
  } else if (error.code === 'OVERLOADED') {
    // Use fallback model
    return executeWithFallback();
  }
  throw error;
}
```

---

### 3. Cost Optimization

**Strategies:**

1. **Use Appropriate Models:**
   - Haiku for simple tasks
   - Sonnet for most use cases
   - Opus only when necessary

2. **Optimize Prompts:**
   - Remove unnecessary context
   - Use concise system prompts
   - Cache frequently used context

3. **Implement Caching:**
   ```typescript
   agent.caching = {
     enabled: true,
     ttl: 3600,  // 1 hour
     keys: ['system_prompt', 'tool_definitions']
   };
   ```

4. **Monitor Usage:**
   ```typescript
   const usage = await sdk.functions.invoke('getAgentUsage', {
     agentId: agent.id,
     timeRange: { last: '24h' }
   });
   console.log('Tokens used:', usage.totalTokens);
   console.log('Cost:', usage.totalCost);
   ```

---

### 4. Safety & Compliance

**Content Filtering:**
```typescript
agent.safety = {
  contentFilter: {
    enabled: true,
    level: 'strict'
  },
  pii: {
    detection: true,
    redaction: true
  },
  toxicity: {
    detection: true,
    threshold: 0.7
  }
};
```

**Audit Logging:**
```typescript
agent.audit = {
  enabled: true,
  logLevel: 'detailed',
  retention: '90d',
  fields: ['input', 'output', 'tools_used', 'tokens']
};
```

---

## Monitoring & Analytics

### Key Metrics

```typescript
const metrics = await sdk.functions.invoke('getAgentMetrics', {
  agentId: agent.id,
  metrics: [
    'requests_per_minute',
    'average_latency',
    'token_usage',
    'error_rate',
    'user_satisfaction'
  ]
});
```

### Dashboards

- Request volume
- Response times
- Token usage & costs
- Error rates
- User satisfaction scores

---

## Troubleshooting

### Common Issues

**Issue:** Rate Limits

**Solution:**
- Implement exponential backoff
- Use request queuing
- Scale with multiple API keys
- Upgrade API tier

**Issue:** Slow Responses

**Solution:**
- Reduce max_tokens
- Optimize system prompt
- Use Haiku for simple tasks
- Enable streaming

**Issue:** Inconsistent Outputs

**Solution:**
- Lower temperature (0.1-0.3)
- Provide more examples
- Use stricter prompts
- Add output validation

---

## Migration Guide

### From GPT to Claude

**Key Differences:**

1. **System Messages:**
   - GPT: First message is system role
   - Claude: Separate `system` parameter

2. **Tool Calling:**
   - GPT: `functions` parameter
   - Claude: `tools` parameter with different schema

3. **Context:**
   - GPT: 128K tokens (GPT-4 Turbo)
   - Claude: 200K tokens

**Migration Steps:**

```typescript
// Convert GPT agent to Claude
const claudeAgent = {
  ...gptAgent,
  provider: 'anthropic',
  model: 'claude-3-5-sonnet-20241022',
  config: {
    ...gptAgent.config,
    // Adjust parameters
    temperature: gptAgent.config.temperature,
    maxTokens: gptAgent.config.max_tokens,
    topP: gptAgent.config.top_p
  }
};

// Convert tools format
claudeAgent.tools = convertToolsToClaudeFormat(gptAgent.functions);
```

---

## Resources

- **API Documentation:** https://docs.anthropic.com/
- **Model Comparison:** https://anthropic.com/claude
- **Prompt Library:** https://docs.anthropic.com/prompts
- **Best Practices:** https://docs.anthropic.com/best-practices

---

## Support

- **Technical Issues:** support@archon.io
- **Claude API Issues:** support@anthropic.com
- **Documentation:** [Agents Overview](./agents.md)

---

**Maintainer:** AI Integration Team  
**Last Review:** December 30, 2025  
**Next Review:** Q1 2025
