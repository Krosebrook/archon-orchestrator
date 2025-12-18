import { createClientFromRequest } from 'npm:@base44/sdk@0.8.4';
import { createHmac } from 'node:crypto';

Deno.serve(async (req) => {
  const startTime = Date.now();
  
  try {
    // Parse webhook ID from URL path
    const url = new URL(req.url);
    const pathParts = url.pathname.split('/');
    const webhookId = pathParts[pathParts.length - 1];

    if (!webhookId) {
      return Response.json({ error: 'Webhook ID required' }, { status: 400 });
    }

    // Initialize SDK with service role to access webhook config
    const base44 = createClientFromRequest(req);
    
    // Get webhook endpoint configuration
    const webhooks = await base44.asServiceRole.entities.WebhookEndpoint.filter({ id: webhookId });
    if (!webhooks || webhooks.length === 0) {
      return Response.json({ error: 'Webhook not found' }, { status: 404 });
    }

    const webhook = webhooks[0];
    if (!webhook.enabled) {
      return Response.json({ error: 'Webhook disabled' }, { status: 403 });
    }

    // Parse request
    const body = await req.text();
    const headers = Object.fromEntries(req.headers.entries());
    let payload;
    
    try {
      payload = JSON.parse(body);
    } catch {
      payload = { raw: body };
    }

    // Verify webhook signature if secret exists
    if (webhook.secret_key) {
      const signature = headers['x-webhook-signature'] || headers['x-hub-signature-256'];
      if (!signature) {
        return Response.json({ error: 'Missing signature' }, { status: 401 });
      }

      const expectedSignature = createHmac('sha256', webhook.secret_key)
        .update(body)
        .digest('hex');

      const providedSignature = signature.replace('sha256=', '');
      
      if (expectedSignature !== providedSignature) {
        return Response.json({ error: 'Invalid signature' }, { status: 401 });
      }
    }

    // Get event type
    const eventType = payload.event_type || payload.type || headers['x-event-type'] || 'webhook.received';

    // Create webhook event record
    const webhookEvent = await base44.asServiceRole.entities.WebhookEvent.create({
      webhook_endpoint_id: webhookId,
      event_type: eventType,
      payload,
      headers: {
        'content-type': headers['content-type'],
        'user-agent': headers['user-agent']
      },
      source_ip: req.headers.get('x-forwarded-for') || 'unknown',
      status: 'processing',
      org_id: webhook.org_id
    });

    // Trigger workflow
    let runId = null;
    let errorMessage = null;

    try {
      // Get workflow
      const workflows = await base44.asServiceRole.entities.Workflow.filter({ id: webhook.workflow_id });
      if (workflows && workflows.length > 0) {
        const workflow = workflows[0];

        // Get first available agent
        const agents = await base44.asServiceRole.entities.Agent.filter({ org_id: webhook.org_id, status: 'active' });
        const agent = agents[0];

        if (!agent) {
          throw new Error('No active agents available');
        }

        // Create workflow run
        const run = await base44.asServiceRole.entities.Run.create({
          workflow_id: webhook.workflow_id,
          agent_id: agent.id,
          state: 'running',
          started_at: new Date().toISOString(),
          input_data: payload,
          metadata: {
            trigger: 'webhook',
            webhook_id: webhookId,
            webhook_event_id: webhookEvent.id,
            event_type: eventType
          },
          org_id: webhook.org_id,
          cost_cents: 0,
          tokens_in: 0,
          tokens_out: 0
        });

        runId = run.id;

        // Log event
        await base44.asServiceRole.entities.Event.create({
          run_id: runId,
          agent_id: agent.id,
          event_type: 'webhook.triggered',
          message: `Workflow triggered by webhook: ${eventType}`,
          metadata: {
            webhook_id: webhookId,
            event_type: eventType
          },
          org_id: webhook.org_id
        });
      } else {
        throw new Error('Workflow not found');
      }

      // Update webhook event as completed
      await base44.asServiceRole.entities.WebhookEvent.update(webhookEvent.id, {
        status: 'completed',
        workflow_run_id: runId,
        processing_time_ms: Date.now() - startTime
      });

      // Update webhook endpoint stats
      await base44.asServiceRole.entities.WebhookEndpoint.update(webhookId, {
        last_triggered: new Date().toISOString(),
        trigger_count: (webhook.trigger_count || 0) + 1
      });

    } catch (err) {
      errorMessage = err.message;
      
      // Update webhook event as failed
      await base44.asServiceRole.entities.WebhookEvent.update(webhookEvent.id, {
        status: 'failed',
        error_message: errorMessage,
        processing_time_ms: Date.now() - startTime
      });
    }

    // Return success response
    return Response.json({
      success: !errorMessage,
      webhook_event_id: webhookEvent.id,
      workflow_run_id: runId,
      error: errorMessage,
      processing_time_ms: Date.now() - startTime
    }, { status: errorMessage ? 500 : 200 });

  } catch (error) {
    console.error('Webhook processing error:', error);
    return Response.json({
      error: error.message,
      processing_time_ms: Date.now() - startTime
    }, { status: 500 });
  }
});