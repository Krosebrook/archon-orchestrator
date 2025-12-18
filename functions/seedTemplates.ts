import { createClientFromRequest } from 'npm:@base44/sdk@0.8.4';

/**
 * Seeds pre-built workflow templates for common use cases
 * Call this once to populate the template library
 */
Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get organization from user
    const orgId = user.organization?.id;
    if (!orgId) {
      return Response.json({ error: 'Organization not found' }, { status: 400 });
    }

    const templates = [
      {
        name: 'Slack Notification Bot',
        description: 'Automatically send formatted notifications to Slack channels based on triggers',
        category: 'integration',
        tags: ['slack', 'notifications', 'alerts', 'messaging'],
        use_case: 'Alert your team about critical events, deployments, or system alerts',
        complexity: 'beginner',
        spec: {
          nodes: [
            {
              id: 'trigger',
              type: 'webhook',
              data: { label: 'Webhook Trigger' },
              position: { x: 100, y: 100 }
            },
            {
              id: 'agent',
              type: 'agent',
              data: { 
                label: 'Format Message',
                config: {
                  provider: 'openai',
                  model: 'gpt-4o-mini',
                  instructions: 'Format the incoming data into a clear, professional Slack message'
                }
              },
              position: { x: 300, y: 100 }
            },
            {
              id: 'slack',
              type: 'integration',
              data: { 
                label: 'Send to Slack',
                integration: 'slack',
                operation: 'send_message'
              },
              position: { x: 500, y: 100 }
            }
          ],
          edges: [
            { id: 'e1', source: 'trigger', target: 'agent' },
            { id: 'e2', source: 'agent', target: 'slack' }
          ]
        },
        required_agents: [
          { role: 'formatter', provider: 'openai', capabilities: ['text_generation'] }
        ],
        estimated_cost_per_run_cents: 5,
        estimated_duration_sec: 3,
        ai_features: ['text_generation'],
        is_featured: true,
        org_id: orgId
      },
      {
        name: 'Customer Support Email Router',
        description: 'Automatically classify and route customer emails to the right department',
        category: 'customer_service',
        tags: ['email', 'classification', 'routing', 'support'],
        use_case: 'Reduce response time by automatically routing customer inquiries',
        complexity: 'intermediate',
        spec: {
          nodes: [
            {
              id: 'email',
              type: 'webhook',
              data: { label: 'Email Received' },
              position: { x: 100, y: 100 }
            },
            {
              id: 'classifier',
              type: 'agent',
              data: {
                label: 'Classify Intent',
                config: {
                  provider: 'anthropic',
                  model: 'claude-3-5-sonnet-20241022',
                  instructions: 'Analyze the email and classify into: billing, technical, sales, or general'
                }
              },
              position: { x: 300, y: 100 }
            },
            {
              id: 'router',
              type: 'router',
              data: { label: 'Route by Category' },
              position: { x: 500, y: 100 }
            },
            {
              id: 'billing',
              type: 'integration',
              data: { label: 'Billing Team', integration: 'sendgrid' },
              position: { x: 700, y: 50 }
            },
            {
              id: 'tech',
              type: 'integration',
              data: { label: 'Tech Support', integration: 'sendgrid' },
              position: { x: 700, y: 150 }
            }
          ],
          edges: [
            { id: 'e1', source: 'email', target: 'classifier' },
            { id: 'e2', source: 'classifier', target: 'router' },
            { id: 'e3', source: 'router', target: 'billing', label: 'billing' },
            { id: 'e4', source: 'router', target: 'tech', label: 'technical' }
          ]
        },
        required_agents: [
          { role: 'classifier', provider: 'anthropic', capabilities: ['classification'] }
        ],
        estimated_cost_per_run_cents: 15,
        estimated_duration_sec: 5,
        ai_features: ['classification', 'routing'],
        is_featured: true,
        org_id: orgId
      },
      {
        name: 'Data Extraction Pipeline',
        description: 'Extract structured data from unstructured documents using AI',
        category: 'data_processing',
        tags: ['extraction', 'documents', 'parsing', 'data'],
        use_case: 'Extract information from invoices, receipts, contracts, or forms',
        complexity: 'intermediate',
        spec: {
          nodes: [
            {
              id: 'upload',
              type: 'trigger',
              data: { label: 'File Upload' },
              position: { x: 100, y: 100 }
            },
            {
              id: 'extractor',
              type: 'agent',
              data: {
                label: 'Extract Data',
                config: {
                  provider: 'openai',
                  model: 'gpt-4o',
                  instructions: 'Extract key fields from the document in JSON format'
                }
              },
              position: { x: 300, y: 100 }
            },
            {
              id: 'validator',
              type: 'agent',
              data: {
                label: 'Validate Data',
                config: {
                  provider: 'openai',
                  model: 'gpt-4o-mini',
                  instructions: 'Validate extracted data for completeness and accuracy'
                }
              },
              position: { x: 500, y: 100 }
            },
            {
              id: 'store',
              type: 'database',
              data: { label: 'Save to Database' },
              position: { x: 700, y: 100 }
            }
          ],
          edges: [
            { id: 'e1', source: 'upload', target: 'extractor' },
            { id: 'e2', source: 'extractor', target: 'validator' },
            { id: 'e3', source: 'validator', target: 'store' }
          ]
        },
        required_agents: [
          { role: 'extractor', provider: 'openai', capabilities: ['vision', 'structured_output'] },
          { role: 'validator', provider: 'openai', capabilities: ['validation'] }
        ],
        estimated_cost_per_run_cents: 25,
        estimated_duration_sec: 8,
        ai_features: ['vision', 'structured_output', 'data_extraction'],
        is_featured: true,
        org_id: orgId
      },
      {
        name: 'Content Generation Workflow',
        description: 'Generate blog posts, social media content, and marketing copy',
        category: 'content_generation',
        tags: ['content', 'writing', 'marketing', 'social'],
        use_case: 'Automate content creation for blogs, social media, and marketing',
        complexity: 'beginner',
        spec: {
          nodes: [
            {
              id: 'input',
              type: 'trigger',
              data: { label: 'Topic Input' },
              position: { x: 100, y: 100 }
            },
            {
              id: 'researcher',
              type: 'agent',
              data: {
                label: 'Research Topic',
                config: {
                  provider: 'anthropic',
                  model: 'claude-3-5-sonnet-20241022',
                  instructions: 'Research the topic and gather key points'
                }
              },
              position: { x: 300, y: 100 }
            },
            {
              id: 'writer',
              type: 'agent',
              data: {
                label: 'Generate Content',
                config: {
                  provider: 'anthropic',
                  model: 'claude-3-5-sonnet-20241022',
                  instructions: 'Write engaging content based on research'
                }
              },
              position: { x: 500, y: 100 }
            },
            {
              id: 'output',
              type: 'output',
              data: { label: 'Save Content' },
              position: { x: 700, y: 100 }
            }
          ],
          edges: [
            { id: 'e1', source: 'input', target: 'researcher' },
            { id: 'e2', source: 'researcher', target: 'writer' },
            { id: 'e3', source: 'writer', target: 'output' }
          ]
        },
        required_agents: [
          { role: 'researcher', provider: 'anthropic', capabilities: ['research'] },
          { role: 'writer', provider: 'anthropic', capabilities: ['content_generation'] }
        ],
        estimated_cost_per_run_cents: 30,
        estimated_duration_sec: 15,
        ai_features: ['content_generation', 'research'],
        is_featured: false,
        org_id: orgId
      },
      {
        name: 'API Data Sync',
        description: 'Sync data between multiple APIs automatically on a schedule',
        category: 'automation',
        tags: ['api', 'sync', 'integration', 'scheduled'],
        use_case: 'Keep data synchronized across CRM, billing, and analytics platforms',
        complexity: 'advanced',
        spec: {
          nodes: [
            {
              id: 'schedule',
              type: 'schedule',
              data: { label: 'Every Hour', schedule: '0 * * * *' },
              position: { x: 100, y: 100 }
            },
            {
              id: 'fetch',
              type: 'api',
              data: { label: 'Fetch Source Data', method: 'GET' },
              position: { x: 300, y: 100 }
            },
            {
              id: 'transform',
              type: 'agent',
              data: {
                label: 'Transform Data',
                config: {
                  provider: 'openai',
                  model: 'gpt-4o-mini',
                  instructions: 'Transform data format between systems'
                }
              },
              position: { x: 500, y: 100 }
            },
            {
              id: 'push',
              type: 'api',
              data: { label: 'Push to Target', method: 'POST' },
              position: { x: 700, y: 100 }
            }
          ],
          edges: [
            { id: 'e1', source: 'schedule', target: 'fetch' },
            { id: 'e2', source: 'fetch', target: 'transform' },
            { id: 'e3', source: 'transform', target: 'push' }
          ]
        },
        required_agents: [
          { role: 'transformer', provider: 'openai', capabilities: ['data_transformation'] }
        ],
        estimated_cost_per_run_cents: 8,
        estimated_duration_sec: 10,
        ai_features: ['data_transformation'],
        is_featured: false,
        org_id: orgId
      },
      {
        name: 'Sentiment Analysis Monitor',
        description: 'Monitor social media and customer feedback for sentiment',
        category: 'analytics',
        tags: ['sentiment', 'monitoring', 'social', 'analytics'],
        use_case: 'Track brand sentiment across social media and reviews',
        complexity: 'intermediate',
        spec: {
          nodes: [
            {
              id: 'collect',
              type: 'trigger',
              data: { label: 'New Mention' },
              position: { x: 100, y: 100 }
            },
            {
              id: 'analyze',
              type: 'agent',
              data: {
                label: 'Analyze Sentiment',
                config: {
                  provider: 'anthropic',
                  model: 'claude-3-5-sonnet-20241022',
                  instructions: 'Analyze sentiment: positive, negative, neutral with confidence'
                }
              },
              position: { x: 300, y: 100 }
            },
            {
              id: 'alert',
              type: 'router',
              data: { label: 'Check Negative' },
              position: { x: 500, y: 100 }
            },
            {
              id: 'notify',
              type: 'integration',
              data: { label: 'Alert Team', integration: 'slack' },
              position: { x: 700, y: 100 }
            }
          ],
          edges: [
            { id: 'e1', source: 'collect', target: 'analyze' },
            { id: 'e2', source: 'analyze', target: 'alert' },
            { id: 'e3', source: 'alert', target: 'notify', label: 'negative' }
          ]
        },
        required_agents: [
          { role: 'analyzer', provider: 'anthropic', capabilities: ['sentiment_analysis'] }
        ],
        estimated_cost_per_run_cents: 12,
        estimated_duration_sec: 4,
        ai_features: ['sentiment_analysis'],
        is_featured: false,
        org_id: orgId
      }
    ];

    // Create all templates
    const created = [];
    for (const template of templates) {
      try {
        const result = await base44.asServiceRole.entities.WorkflowTemplate.create(template);
        created.push(result);
      } catch (error) {
        console.error(`Failed to create template: ${template.name}`, error);
      }
    }

    return Response.json({
      success: true,
      message: `Created ${created.length} workflow templates`,
      templates: created
    });
  } catch (error) {
    console.error('Seed templates error:', error);
    return Response.json({ 
      error: error.message,
      details: error.stack
    }, { status: 500 });
  }
});