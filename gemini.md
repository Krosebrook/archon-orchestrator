# Gemini AI Integration Guide

**Version:** 1.0  
**Last Updated:** December 30, 2025  
**Gemini Version:** Gemini 2.0 Flash

---

## Overview

Archon Orchestrator integrates with Google's Gemini AI models, providing multimodal AI capabilities including text, vision, audio, and video understanding.

---

## Supported Models

### Gemini 2.0 Flash (Recommended)

**Capabilities:**
- Multimodal understanding (text, image, audio, video)
- Fast inference
- Long context (1M tokens)
- Native tool use
- Real-time streaming

**Performance:**
- Speed: Very fast
- Cost: Competitive
- Quality: Excellent

**Best For:**
- Multimodal applications
- Real-time interactions
- High-volume workloads
- Cost-sensitive deployments

---

### Gemini 1.5 Pro

**Capabilities:**
- Extended context (2M tokens)
- Superior reasoning
- Complex problem solving
- Multimodal inputs

**Performance:**
- Speed: Fast
- Cost: Higher than Flash
- Quality: Best-in-class

**Best For:**
- Long-context analysis
- Complex reasoning
- Research tasks
- Deep document understanding

---

### Gemini 1.5 Flash

**Capabilities:**
- Efficient processing
- Good quality
- Cost-effective
- Multimodal support

**Performance:**
- Speed: Very fast
- Cost: Low
- Quality: Good

**Best For:**
- High-frequency tasks
- Real-time applications
- Budget-constrained projects
- Simple queries

---

## Configuration

### Basic Agent Setup

```typescript
const agent = await sdk.entities.create('Agent', {
  name: 'Gemini Assistant',
  provider: 'google',
  model: 'gemini-2.0-flash-exp',
  config: {
    apiKey: process.env.GOOGLE_AI_API_KEY,
    temperature: 0.7,
    topK: 40,
    topP: 0.95,
    maxOutputTokens: 8192
  }
});
```

---

### Authentication

**Using API Key:**
```typescript
agent.config.apiKey = process.env.GOOGLE_AI_API_KEY;
```

**Using Service Account (Vertex AI):**
```typescript
agent.config.vertexAI = {
  project: 'your-project-id',
  location: 'us-central1',
  credentials: '/path/to/service-account.json'
};
```

---

### System Instructions

```typescript
const systemInstruction = {
  role: 'system',
  parts: [{
    text: `You are an AI assistant for Archon Orchestrator.

    Capabilities:
    - Answer questions about the platform
    - Help users troubleshoot issues
    - Guide workflow creation
    - Provide best practices

    Style:
    - Be concise and actionable
    - Use examples when helpful
    - Ask clarifying questions
    - Stay on topic

    Constraints:
    - Don't make up information
    - Admit when you don't know
    - Suggest escalation when appropriate`
  }]
};

agent.systemInstruction = systemInstruction;
```

---

## Multimodal Capabilities

### Image Understanding

```typescript
const imageAgent = await sdk.entities.create('Agent', {
  name: 'Image Analyzer',
  model: 'gemini-2.0-flash-exp',
  capabilities: ['vision']
});

// Analyze image
const result = await sdk.functions.invoke('executeAgent', {
  agentId: imageAgent.id,
  input: {
    parts: [
      { text: "Describe this image in detail" },
      {
        inlineData: {
          mimeType: 'image/jpeg',
          data: imageBase64
        }
      }
    ]
  }
});
```

**Use Cases:**
- Product image analysis
- Quality inspection
- Content moderation
- Document scanning
- Medical imaging analysis

---

### Video Understanding

```typescript
const videoAgent = await sdk.entities.create('Agent', {
  name: 'Video Analyzer',
  model: 'gemini-2.0-flash-exp',
  capabilities: ['video']
});

// Analyze video
const result = await sdk.functions.invoke('executeAgent', {
  agentId: videoAgent.id,
  input: {
    parts: [
      { text: "Summarize the key points from this video" },
      {
        fileData: {
          mimeType: 'video/mp4',
          fileUri: 'gs://bucket/video.mp4'
        }
      }
    ]
  }
});
```

**Use Cases:**
- Video summarization
- Action recognition
- Scene understanding
- Content analysis
- Surveillance

---

### Audio Processing

```typescript
const audioAgent = await sdk.entities.create('Agent', {
  name: 'Audio Processor',
  model: 'gemini-2.0-flash-exp',
  capabilities: ['audio']
});

// Process audio
const result = await sdk.functions.invoke('executeAgent', {
  agentId: audioAgent.id,
  input: {
    parts: [
      { text: "Transcribe and summarize this audio" },
      {
        inlineData: {
          mimeType: 'audio/mp3',
          data: audioBase64
        }
      }
    ]
  }
});
```

**Use Cases:**
- Transcription
- Sentiment analysis
- Voice commands
- Call center analytics
- Podcast processing

---

## Function Calling

### Define Functions

```typescript
const functions = [
  {
    name: 'get_weather',
    description: 'Get current weather for a location',
    parameters: {
      type: 'object',
      properties: {
        location: {
          type: 'string',
          description: 'City name or coordinates'
        },
        unit: {
          type: 'string',
          enum: ['celsius', 'fahrenheit'],
          description: 'Temperature unit'
        }
      },
      required: ['location']
    }
  },
  {
    name: 'search_database',
    description: 'Search the customer database',
    parameters: {
      type: 'object',
      properties: {
        query: {
          type: 'string',
          description: 'Search query'
        },
        filters: {
          type: 'object',
          description: 'Optional filters'
        }
      },
      required: ['query']
    }
  }
];

await sdk.functions.invoke('configureAgentTools', {
  agentId: agent.id,
  tools: functions
});
```

### Execute with Functions

```typescript
const response = await sdk.functions.invoke('executeAgent', {
  agentId: agent.id,
  input: {
    parts: [{ text: "What's the weather in San Francisco?" }]
  },
  tools: functions
});

// Handle function calls
if (response.functionCalls) {
  for (const call of response.functionCalls) {
    const result = await executeFunction(call.name, call.args);
    
    // Continue conversation with function result
    const finalResponse = await sdk.functions.invoke('executeAgent', {
      agentId: agent.id,
      input: {
        parts: [{
          functionResponse: {
            name: call.name,
            response: result
          }
        }]
      }
    });
  }
}
```

---

## Long Context Processing

### Analyze Large Documents

Gemini supports up to 2M tokens for 1.5 Pro:

```typescript
const docAgent = await sdk.entities.create('Agent', {
  name: 'Document Analyzer',
  model: 'gemini-1.5-pro',
  config: {
    maxOutputTokens: 8192
  }
});

// Analyze large document
const analysis = await sdk.functions.invoke('executeAgent', {
  agentId: docAgent.id,
  input: {
    parts: [
      { text: "Analyze this legal document and extract key clauses" },
      { text: veryLongDocumentText }  // Up to 2M tokens
    ]
  }
});
```

**Use Cases:**
- Legal document analysis
- Research paper review
- Codebase analysis
- Book summarization
- Contract comparison

---

## Streaming Responses

```typescript
const stream = await sdk.functions.invoke('executeAgentStream', {
  agentId: agent.id,
  input: {
    parts: [{ text: "Write a detailed blog post about AI" }]
  }
});

// Process chunks in real-time
for await (const chunk of stream) {
  if (chunk.text) {
    process.stdout.write(chunk.text);
  }
  
  if (chunk.functionCalls) {
    // Handle function calls
  }
}
```

---

## Use Cases

### 1. Multimodal Customer Support

```typescript
const supportAgent = {
  name: 'Multimodal Support',
  model: 'gemini-2.0-flash-exp',
  systemInstruction: {
    parts: [{ 
      text: 'Customer support agent. Can analyze images, videos, and documents from customers.'
    }]
  },
  capabilities: ['text', 'vision', 'audio'],
  tools: [
    'search_kb',
    'create_ticket',
    'check_status'
  ]
};
```

**Capabilities:**
- Analyze product photos
- Watch demo videos
- Process voice messages
- Read documents

---

### 2. Content Moderation

```typescript
const moderator = {
  name: 'Content Moderator',
  model: 'gemini-2.0-flash-exp',
  systemInstruction: {
    parts: [{
      text: 'Analyze content for safety. Flag inappropriate material.'
    }]
  },
  config: {
    temperature: 0.1,  // Consistent
    safetySettings: [
      {
        category: 'HARM_CATEGORY_HATE_SPEECH',
        threshold: 'BLOCK_LOW_AND_ABOVE'
      },
      {
        category: 'HARM_CATEGORY_SEXUALLY_EXPLICIT',
        threshold: 'BLOCK_LOW_AND_ABOVE'
      }
    ]
  }
};
```

---

### 3. Video Intelligence

```typescript
const videoIntel = {
  name: 'Video Intelligence',
  model: 'gemini-1.5-pro',
  systemInstruction: {
    parts: [{
      text: 'Analyze videos. Extract insights, generate summaries, identify key moments.'
    }]
  },
  capabilities: ['video', 'text']
};
```

**Applications:**
- Video summarization
- Highlight generation
- Scene detection
- Object tracking
- Activity recognition

---

### 4. Code Assistant

```typescript
const codeAssistant = {
  name: 'Code Helper',
  model: 'gemini-2.0-flash-exp',
  systemInstruction: {
    parts: [{
      text: `Expert programmer. Help with:
      - Code generation
      - Bug fixing
      - Code review
      - Optimization
      - Documentation`
    }]
  },
  tools: [
    'analyze_code',
    'run_tests',
    'check_syntax'
  ]
};
```

---

## Best Practices

### 1. Prompt Engineering

**Multimodal Prompts:**
```typescript
// ✅ Good
const input = {
  parts: [
    { text: "Analyze this product image. Check for defects." },
    { inlineData: { mimeType: 'image/jpeg', data: imageData } },
    { text: "Compare with this reference image:" },
    { inlineData: { mimeType: 'image/jpeg', data: referenceData } }
  ]
};

// ❌ Vague
const input = {
  parts: [
    { text: "What do you see?" },
    { inlineData: { mimeType: 'image/jpeg', data: imageData } }
  ]
};
```

---

### 2. Safety Settings

```typescript
agent.config.safetySettings = [
  {
    category: 'HARM_CATEGORY_HARASSMENT',
    threshold: 'BLOCK_MEDIUM_AND_ABOVE'
  },
  {
    category: 'HARM_CATEGORY_HATE_SPEECH',
    threshold: 'BLOCK_MEDIUM_AND_ABOVE'
  },
  {
    category: 'HARM_CATEGORY_SEXUALLY_EXPLICIT',
    threshold: 'BLOCK_MEDIUM_AND_ABOVE'
  },
  {
    category: 'HARM_CATEGORY_DANGEROUS_CONTENT',
    threshold: 'BLOCK_MEDIUM_AND_ABOVE'
  }
];
```

---

### 3. Cost Optimization

**Strategies:**

1. **Choose the Right Model:**
   - Flash for most use cases
   - Pro for complex reasoning
   - Use caching for repeated content

2. **Optimize Inputs:**
   - Compress images when possible
   - Use appropriate video resolution
   - Trim unnecessary audio

3. **Batch Processing:**
   ```typescript
   // Process multiple images in one request
   const input = {
     parts: [
       { text: "Analyze these product images:" },
       ...images.map(img => ({
         inlineData: {
           mimeType: 'image/jpeg',
           data: img
         }
       }))
     ]
   };
   ```

---

### 4. Error Handling

```typescript
try {
  const response = await sdk.functions.invoke('executeAgent', {
    agentId: agent.id,
    input,
    config: {
      retries: 3,
      timeout: 60000,  // 60s for video processing
      fallback: {
        model: 'gemini-1.5-flash',  // Fallback to faster model
        condition: 'timeout'
      }
    }
  });
} catch (error) {
  if (error.code === 'SAFETY_BLOCK') {
    // Content blocked by safety filters
    return handleSafetyBlock(error);
  } else if (error.code === 'QUOTA_EXCEEDED') {
    // Rate limit reached
    return handleQuotaExceeded(error);
  }
  throw error;
}
```

---

## Performance Optimization

### Caching

```typescript
agent.config.caching = {
  enabled: true,
  systemInstruction: true,  // Cache system instruction
  contextCaching: {
    enabled: true,
    ttl: 3600  // 1 hour
  }
};
```

### Batching

```typescript
// Process multiple requests efficiently
const batchResponse = await sdk.functions.invoke('executeAgentBatch', {
  agentId: agent.id,
  inputs: [
    { parts: [{ text: "Query 1" }] },
    { parts: [{ text: "Query 2" }] },
    { parts: [{ text: "Query 3" }] }
  ]
});
```

---

## Monitoring

### Track Usage

```typescript
const usage = await sdk.functions.invoke('getAgentUsage', {
  agentId: agent.id,
  timeRange: { last: '24h' }
});

console.log('Text tokens:', usage.textTokens);
console.log('Image count:', usage.images);
console.log('Video minutes:', usage.videoMinutes);
console.log('Total cost:', usage.totalCost);
```

### Performance Metrics

- Latency (P50, P95, P99)
- Token usage
- Request volume
- Error rate
- Safety blocks

---

## Troubleshooting

### Common Issues

**Issue:** Safety Blocks

**Solution:**
- Adjust safety settings
- Rephrase prompts
- Pre-filter content
- Use content moderation

**Issue:** Quota Exceeded

**Solution:**
- Implement rate limiting
- Use request queuing
- Upgrade quota
- Optimize usage

**Issue:** Large File Processing

**Solution:**
- Use Cloud Storage URIs
- Compress files
- Split into chunks
- Use appropriate timeouts

---

## Migration from Other Providers

### From OpenAI

**Key Differences:**

1. **Multimodal Support:**
   - OpenAI: Limited vision
   - Gemini: Text, image, video, audio

2. **Context Length:**
   - OpenAI: 128K tokens (GPT-4 Turbo)
   - Gemini: Up to 2M tokens (1.5 Pro)

3. **Function Calling:**
   - Similar but different schema format

**Migration Steps:**

```typescript
// Convert OpenAI agent to Gemini
const geminiAgent = {
  ...openaiAgent,
  provider: 'google',
  model: 'gemini-2.0-flash-exp',
  systemInstruction: {
    parts: [{ text: openaiAgent.systemMessage }]
  }
};

// Convert tools
geminiAgent.tools = convertToolsToGeminiFormat(openaiAgent.functions);
```

---

## Resources

- **API Documentation:** https://ai.google.dev/docs
- **Vertex AI:** https://cloud.google.com/vertex-ai
- **Model Comparison:** https://ai.google.dev/models/gemini
- **Pricing:** https://ai.google.dev/pricing

---

## Support

- **Technical Issues:** support@archon.io
- **Google AI Issues:** https://support.google.com/
- **Documentation:** [Agents Overview](./agents.md)

---

**Maintainer:** AI Integration Team  
**Last Review:** December 30, 2025  
**Next Review:** Q1 2025
