/**
 * Standardized Webhook Event Schemas
 * JSON Schema definitions for webhook events
 */

export const WebhookEventSchema = {
  type: 'object',
  properties: {
    event_id: {
      type: 'string',
      description: 'Unique event identifier',
    },
    event_type: {
      type: 'string',
      description: 'Type of event (e.g., user.created, order.completed)',
    },
    timestamp: {
      type: 'string',
      format: 'date-time',
      description: 'When the event occurred',
    },
    source: {
      type: 'string',
      description: 'Source system or service',
    },
    data: {
      type: 'object',
      description: 'Event payload data',
      additionalProperties: true,
    },
    metadata: {
      type: 'object',
      description: 'Additional metadata',
      properties: {
        environment: { type: 'string', enum: ['production', 'staging', 'development'] },
        api_version: { type: 'string' },
        idempotency_key: { type: 'string' },
      },
    },
  },
  required: ['event_id', 'event_type', 'timestamp', 'data'],
};

/**
 * Webhook Delivery Metadata Schema
 */
export const WebhookDeliverySchema = {
  type: 'object',
  properties: {
    attempt: {
      type: 'integer',
      minimum: 1,
      description: 'Delivery attempt number',
    },
    max_attempts: {
      type: 'integer',
      default: 3,
      description: 'Maximum retry attempts',
    },
    next_retry: {
      type: 'string',
      format: 'date-time',
      description: 'When to retry if failed',
    },
    signature: {
      type: 'string',
      description: 'HMAC signature for verification',
    },
    signature_algorithm: {
      type: 'string',
      enum: ['sha256', 'sha512'],
      default: 'sha256',
    },
  },
  required: ['attempt', 'signature'],
};

/**
 * Common Event Type Schemas
 */
export const EventTypes = {
  // CRM Events
  'crm.contact.created': {
    type: 'object',
    properties: {
      contact_id: { type: 'string' },
      email: { type: 'string', format: 'email' },
      name: { type: 'string' },
      company: { type: 'string' },
      properties: { type: 'object', additionalProperties: true },
    },
    required: ['contact_id', 'email'],
  },

  'crm.contact.updated': {
    type: 'object',
    properties: {
      contact_id: { type: 'string' },
      changes: {
        type: 'object',
        properties: {
          before: { type: 'object' },
          after: { type: 'object' },
        },
      },
    },
    required: ['contact_id', 'changes'],
  },

  'crm.deal.closed': {
    type: 'object',
    properties: {
      deal_id: { type: 'string' },
      amount: { type: 'number' },
      currency: { type: 'string' },
      status: { type: 'string', enum: ['won', 'lost'] },
    },
    required: ['deal_id', 'amount', 'status'],
  },

  // Communication Events
  'communication.message.received': {
    type: 'object',
    properties: {
      message_id: { type: 'string' },
      channel: { type: 'string' },
      sender: { type: 'string' },
      content: { type: 'string' },
      attachments: {
        type: 'array',
        items: {
          type: 'object',
          properties: {
            url: { type: 'string' },
            type: { type: 'string' },
            name: { type: 'string' },
          },
        },
      },
    },
    required: ['message_id', 'channel', 'sender', 'content'],
  },

  // Project Management Events
  'project.issue.created': {
    type: 'object',
    properties: {
      issue_id: { type: 'string' },
      project_id: { type: 'string' },
      title: { type: 'string' },
      description: { type: 'string' },
      priority: { type: 'string', enum: ['low', 'medium', 'high', 'critical'] },
      assignee: { type: 'string' },
    },
    required: ['issue_id', 'project_id', 'title'],
  },

  'project.issue.status_changed': {
    type: 'object',
    properties: {
      issue_id: { type: 'string' },
      from_status: { type: 'string' },
      to_status: { type: 'string' },
      changed_by: { type: 'string' },
    },
    required: ['issue_id', 'from_status', 'to_status'],
  },

  // Payment Events
  'payment.completed': {
    type: 'object',
    properties: {
      transaction_id: { type: 'string' },
      amount: { type: 'number' },
      currency: { type: 'string' },
      customer_id: { type: 'string' },
      status: { type: 'string' },
    },
    required: ['transaction_id', 'amount', 'currency'],
  },

  // Custom Event Template
  'custom.event': {
    type: 'object',
    properties: {
      resource_id: { type: 'string' },
      action: { type: 'string' },
      data: { type: 'object', additionalProperties: true },
    },
    required: ['resource_id', 'action'],
  },
};

/**
 * Webhook Configuration Schema
 */
export const WebhookConfigSchema = {
  type: 'object',
  properties: {
    url: {
      type: 'string',
      format: 'uri',
      description: 'Webhook endpoint URL',
    },
    events: {
      type: 'array',
      items: { type: 'string' },
      description: 'Event types to subscribe to',
    },
    secret: {
      type: 'string',
      description: 'Secret for signature verification',
    },
    active: {
      type: 'boolean',
      default: true,
      description: 'Whether webhook is active',
    },
    retry_config: {
      type: 'object',
      properties: {
        max_attempts: { type: 'integer', default: 3 },
        backoff_strategy: {
          type: 'string',
          enum: ['linear', 'exponential'],
          default: 'exponential',
        },
        initial_delay_seconds: { type: 'integer', default: 60 },
      },
    },
    filters: {
      type: 'object',
      description: 'Event filtering rules',
      additionalProperties: true,
    },
  },
  required: ['url', 'events', 'secret'],
};

/**
 * Validate event against schema
 */
export function validateEvent(event, eventType) {
  const schema = EventTypes[eventType];
  if (!schema) {
    throw new Error(`Unknown event type: ${eventType}`);
  }

  const errors = [];
  
  // Basic validation (simplified - in production use ajv or similar)
  if (schema.required) {
    for (const field of schema.required) {
      if (!(field in event.data)) {
        errors.push(`Missing required field: ${field}`);
      }
    }
  }

  if (errors.length > 0) {
    throw new Error(`Validation failed: ${errors.join(', ')}`);
  }

  return true;
}

/**
 * Create standardized webhook event
 */
export function createWebhookEvent(eventType, data, options = {}) {
  return {
    event_id: options.event_id || crypto.randomUUID(),
    event_type: eventType,
    timestamp: new Date().toISOString(),
    source: options.source || 'archon',
    data,
    metadata: {
      environment: options.environment || 'production',
      api_version: options.api_version || '1.0',
      idempotency_key: options.idempotency_key,
    },
  };
}