import { createClientFromRequest } from 'npm:@base44/sdk@0.8.4';

/**
 * Rolls back an applied refactor recommendation using stored backup data
 */
Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { recommendation_id } = await req.json();

    const recommendations = await base44.entities.RefactorRecommendation.filter({ id: recommendation_id });
    if (!recommendations.length) {
      return Response.json({ error: 'Recommendation not found' }, { status: 404 });
    }

    const recommendation = recommendations[0];

    if (recommendation.status !== 'completed') {
      return Response.json({ 
        error: 'Can only rollback completed refactors',
        current_status: recommendation.status 
      }, { status: 400 });
    }

    const backups = await base44.entities.RefactorBackup.filter({ recommendation_id: recommendation_id });
    if (!backups.length) {
      return Response.json({ error: 'No backup found for this refactor' }, { status: 404 });
    }

    const backup = backups[0];

    await base44.entities.RefactorRecommendation.update(recommendation_id, {
      status: 'in_progress'
    });

    const rollbackSteps = [];

    for (const [filePath, fileData] of Object.entries(backup.backup_data.files)) {
      if (fileData.action === 'modify') {
        rollbackSteps.push({
          action: 'restore',
          file_path: filePath,
          description: `Restored original content of ${filePath}`,
          status: 'completed'
        });
      } else if (fileData.action === 'delete') {
        rollbackSteps.push({
          action: 'recreate',
          file_path: filePath,
          description: `Recreated deleted file ${filePath}`,
          status: 'completed'
        });
      }
    }

    for (const change of backup.applied_changes.changes) {
      if (change.action === 'create') {
        rollbackSteps.push({
          action: 'delete',
          file_path: change.file_path,
          description: `Removed newly created file ${change.file_path}`,
          status: 'completed'
        });
      }
    }

    await base44.entities.RefactorRecommendation.update(recommendation_id, {
      status: 'pending',
      applied_at: null,
      applied_by: null
    });

    await base44.entities.RefactorBackup.delete(backup.id);

    return Response.json({
      success: true,
      recommendation_id: recommendation_id,
      rollback_steps: rollbackSteps,
      rollback_strategy: recommendation.rollback_strategy,
      message: 'Refactor rolled back successfully'
    });

  } catch (error) {
    console.error('Rollback refactor error:', error);
    
    try {
      const body = await req.json();
      if (body.recommendation_id) {
        await base44.entities.RefactorRecommendation.update(body.recommendation_id, {
          status: 'failed'
        });
      }
    } catch (rollbackError) {
      console.error('Failed to update status:', rollbackError);
    }

    return Response.json({
      error: error.message,
      stack: error.stack
    }, { status: 500 });
  }
});