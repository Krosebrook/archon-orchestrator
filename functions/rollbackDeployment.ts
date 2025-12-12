/**
 * @fileoverview Deployment Rollback Function
 * @description Reverts workflow to previous version with safety checks.
 */

import { createClientFromRequest } from 'npm:@base44/sdk@0.8.4';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    
    if (!user || !['admin', 'owner', 'operator'].includes(user.role)) {
      return Response.json({
        error: 'Forbidden',
        message: 'Only operators and admins can rollback deployments'
      }, { status: 403 });
    }
    
    const body = await req.json();
    const { workflow_id, target_version, reason } = body;
    
    if (!workflow_id || !target_version) {
      return Response.json({
        error: 'Validation error',
        message: 'workflow_id and target_version required'
      }, { status: 400 });
    }
    
    // Fetch current workflow
    const [workflow] = await base44.asServiceRole.entities.Workflow.filter({
      id: workflow_id
    });
    
    if (!workflow) {
      return Response.json({
        error: 'Not found',
        message: 'Workflow not found'
      }, { status: 404 });
    }
    
    const currentVersion = workflow.version;
    
    // Fetch target version
    const [targetSnapshot] = await base44.asServiceRole.entities.WorkflowVersion.filter({
      workflow_id,
      version: target_version
    });
    
    if (!targetSnapshot) {
      return Response.json({
        error: 'Not found',
        message: `Version ${target_version} not found`
      }, { status: 404 });
    }
    
    // Safety checks
    const activeRuns = await base44.asServiceRole.entities.Run.filter({
      workflow_id,
      status: 'running'
    });
    
    if (activeRuns.length > 0) {
      return Response.json({
        error: 'Conflict',
        message: `Cannot rollback: ${activeRuns.length} runs in progress`,
        hint: 'Wait for active runs to complete or cancel them first'
      }, { status: 409 });
    }
    
    // Create backup of current version
    await base44.asServiceRole.entities.WorkflowVersion.create({
      workflow_id,
      version: currentVersion,
      spec: workflow.spec,
      created_by: user.email,
      change_summary: `Backup before rollback to ${target_version}`,
      org_id: workflow.org_id
    });
    
    // Perform rollback
    await base44.asServiceRole.entities.Workflow.update(workflow_id, {
      version: target_version,
      spec: targetSnapshot.spec,
      status: 'draft', // Safety: require re-activation
      updated_at: new Date().toISOString()
    });
    
    // Create audit entry
    await base44.asServiceRole.entities.Audit.create({
      action: 'rollback',
      entity: 'Workflow',
      entity_id: workflow_id,
      actor: user.email,
      severity: 'warning',
      before: { version: currentVersion },
      after: { version: target_version },
      metadata: {
        reason: reason || 'Manual rollback',
        rolled_back_at: new Date().toISOString()
      },
      org_id: workflow.org_id
    });
    
    // Update deployment environment
    const deployments = await base44.asServiceRole.entities.DeploymentEnvironment.filter({
      workflow_id
    });
    
    for (const deployment of deployments) {
      await base44.asServiceRole.entities.DeploymentEnvironment.update(deployment.id, {
        version: target_version,
        status: 'degraded',
        deployed_at: new Date().toISOString(),
        deployed_by: user.email
      });
    }
    
    return Response.json({
      success: true,
      workflow_id,
      previous_version: currentVersion,
      current_version: target_version,
      status: 'draft',
      message: 'Rollback successful. Re-activate workflow to deploy.',
      rolled_back_at: new Date().toISOString()
    });
    
  } catch (error) {
    console.error('[Rollback] Error:', error);
    
    return Response.json({
      error: 'Rollback failed',
      message: error.message,
      trace_id: crypto.randomUUID()
    }, { status: 500 });
  }
});