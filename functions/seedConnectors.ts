import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

/**
 * Seed official connector definitions
 */
Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    
    if (!user || (user.role !== 'admin' && user.role !== 'owner')) {
      return Response.json({ error: 'Unauthorized' }, { status: 403 });
    }

    const connectors = [
      {
        name: 'Salesforce',
        description: 'Integrate with Salesforce CRM for leads, contacts, accounts, and opportunities',
        provider: 'salesforce',
        category: 'crm',
        icon_url: 'https://cdn.worldvectorlogo.com/logos/salesforce-2.svg',
        is_official: true,
        auth_type: 'oauth2',
        auth_config: {
          oauth_authorize_url: 'https://login.salesforce.com/services/oauth2/authorize',
          oauth_token_url: 'https://login.salesforce.com/services/oauth2/token',
          oauth_scopes: ['api', 'refresh_token'],
        },
        operations: [
          { id: 'list_leads', name: 'List Leads', method: 'GET' },
          { id: 'create_lead', name: 'Create Lead', method: 'POST' },
          { id: 'get_account', name: 'Get Account', method: 'GET' },
          { id: 'create_opportunity', name: 'Create Opportunity', method: 'POST' },
          { id: 'search', name: 'Search', method: 'GET' },
        ],
        webhook_support: true,
        status: 'active',
      },
      {
        name: 'HubSpot',
        description: 'Connect to HubSpot CRM for contacts, companies, deals, and tickets',
        provider: 'hubspot',
        category: 'crm',
        icon_url: 'https://cdn.worldvectorlogo.com/logos/hubspot-1.svg',
        is_official: true,
        auth_type: 'oauth2',
        auth_config: {
          oauth_authorize_url: 'https://app.hubspot.com/oauth/authorize',
          oauth_token_url: 'https://api.hubapi.com/oauth/v1/token',
          oauth_scopes: ['crm.objects.contacts.read', 'crm.objects.contacts.write', 'crm.objects.deals.read'],
        },
        operations: [
          { id: 'list_contacts', name: 'List Contacts', method: 'GET' },
          { id: 'create_contact', name: 'Create Contact', method: 'POST' },
          { id: 'list_deals', name: 'List Deals', method: 'GET' },
          { id: 'create_deal', name: 'Create Deal', method: 'POST' },
          { id: 'get_company', name: 'Get Company', method: 'GET' },
        ],
        webhook_support: true,
        status: 'active',
      },
      {
        name: 'Jira',
        description: 'Manage Jira issues, projects, sprints, and comments',
        provider: 'jira',
        category: 'project_management',
        icon_url: 'https://cdn.worldvectorlogo.com/logos/jira-1.svg',
        is_official: true,
        auth_type: 'api_key',
        operations: [
          { id: 'list_issues', name: 'List Issues', method: 'GET' },
          { id: 'create_issue', name: 'Create Issue', method: 'POST' },
          { id: 'get_issue', name: 'Get Issue', method: 'GET' },
          { id: 'update_issue', name: 'Update Issue', method: 'PUT' },
          { id: 'add_comment', name: 'Add Comment', method: 'POST' },
          { id: 'list_projects', name: 'List Projects', method: 'GET' },
        ],
        webhook_support: true,
        status: 'active',
      },
      {
        name: 'Slack',
        description: 'Send messages, manage channels, and interact with Slack workspace',
        provider: 'slack',
        category: 'communication',
        icon_url: 'https://cdn.worldvectorlogo.com/logos/slack-new-logo.svg',
        is_official: true,
        auth_type: 'oauth2',
        auth_config: {
          oauth_authorize_url: 'https://slack.com/oauth/v2/authorize',
          oauth_token_url: 'https://slack.com/api/oauth.v2.access',
          oauth_scopes: ['chat:write', 'channels:read', 'users:read'],
        },
        operations: [
          { id: 'send_message', name: 'Send Message', method: 'POST' },
          { id: 'list_channels', name: 'List Channels', method: 'GET' },
          { id: 'get_user', name: 'Get User', method: 'GET' },
          { id: 'upload_file', name: 'Upload File', method: 'POST' },
        ],
        webhook_support: true,
        status: 'active',
      },
    ];

    const created = [];
    for (const connector of connectors) {
      // Check if exists
      const existing = await base44.asServiceRole.entities.ConnectorDefinition.filter({
        provider: connector.provider,
        is_official: true,
      });

      if (existing.length === 0) {
        const result = await base44.asServiceRole.entities.ConnectorDefinition.create(connector);
        created.push(result);
      }
    }

    return Response.json({
      success: true,
      message: `Seeded ${created.length} connectors`,
      connectors: created,
    });

  } catch (error) {
    console.error('Seed connectors error:', error);
    return Response.json({ 
      error: error.message,
      trace_id: `SEED_ERROR_${Date.now()}`,
    }, { status: 500 });
  }
});