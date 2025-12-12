/**
 * @fileoverview Deployment Approval Function
 * @description Approves or rejects staged deployment requests.
 */

import { createClientFromRequest } from 'npm:@base44/sdk@0.8.4';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    
    if (!user || !['admin', 'owner'].includes(user.role)) {
      return Response.json({
        error: 'Forbidden',
        message: 'Only admins and owners can approve deployments'
      }, { status: 403 });
    }
    
    const body = await req.json();
    const { request_id, action, comments } = body;
    
    if (!request_id || !action || !['approve', 'reject'].includes(action)) {
      return Response.json({
        error: 'Validation error',
        message: 'request_id and action (approve/reject) are required'
      }, { status: 400 });
    }
    
    // Fetch approval request
    const [request] = await base44.asServiceRole.entities.ApprovalRequest.filter({
      id: request_id
    });
    
    if (!request) {
      return Response.json({
        error: 'Not found',
        message: 'Approval request not found'
      }, { status: 404 });
    }
    
    if (request.status !== 'pending') {
      return Response.json({
        error: 'Conflict',
        message: `Request already ${request.status}`
      }, { status: 409 });
    }
    
    // Check if expired
    if (request.expires_at && new Date(request.expires_at) < new Date()) {
      await base44.asServiceRole.entities.ApprovalRequest.update(request_id, {
        status: 'expired'
      });
      
      return Response.json({
        error: 'Conflict',
        message: 'Request has expired'
      }, { status: 409 });
    }
    
    // Update approval request
    const status = action === 'approve' ? 'approved' : 'rejected';
    await base44.asServiceRole.entities.ApprovalRequest.update(request_id, {
      status,
      approved_by: user.email,
      approved_at: new Date().toISOString(),
      comments: comments || ''
    });
    
    // Create audit entry
    await base44.asServiceRole.entities.Audit.create({
      action: action === 'approve' ? 'approve' : 'reject',
      entity: 'ApprovalRequest',
      entity_id: request_id,
      actor: user.email,
      severity: 'warning',
      metadata: {
        workflow_id: request.workflow_id,
        version: request.version,
        environment: request.environment,
        comments
      },
      org_id: request.org_id
    });
    
    // If approved, trigger deployment continuation
    if (action === 'approve') {
      // Resume pipeline execution
      await base44.asServiceRole.functions.invoke('executePipeline', {
        pipeline_id: request.pipeline_id,
        workflow_id: request.workflow_id,
        trigger: 'approval',
        config: {
          environment: request.environment,
          resume_from_approval: true
        }
      });
    }
    
    return Response.json({
      success: true,
      request_id,
      status,
      message: `Deployment ${status}`
    });
    
  } catch (error) {
    console.error('[ApproveDeployment] Error:', error);
    
    return Response.json({
      error: 'Approval failed',
      message: error.message,
      trace_id: crypto.randomUUID()
    }, { status: 500 });
  }
});