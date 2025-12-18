import { createClientFromRequest } from 'npm:@base44/sdk@0.8.4';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { source_branch_id, target_branch_id, merge_strategy = 'auto', conflict_resolution } = await req.json();

    if (!source_branch_id || !target_branch_id) {
      return Response.json({ error: 'Missing branch IDs' }, { status: 400 });
    }

    // Fetch branches
    const [sourceBranch, targetBranch] = await Promise.all([
      base44.entities.WorkflowBranch.filter({ id: source_branch_id }),
      base44.entities.WorkflowBranch.filter({ id: target_branch_id })
    ]);

    if (!sourceBranch[0] || !targetBranch[0]) {
      return Response.json({ error: 'Branch not found' }, { status: 404 });
    }

    // Check if target branch is protected
    if (targetBranch[0].is_protected) {
      // In production, check for approval requirements
      return Response.json({ error: 'Protected branch requires approval' }, { status: 403 });
    }

    // Get head versions
    const [sourceVersion, targetVersion] = await Promise.all([
      base44.entities.WorkflowVersion.filter({ id: sourceBranch[0].head_version_id }),
      base44.entities.WorkflowVersion.filter({ id: targetBranch[0].head_version_id })
    ]);

    if (!sourceVersion[0] || !targetVersion[0]) {
      return Response.json({ error: 'Version not found' }, { status: 404 });
    }

    // Perform merge
    const mergeResult = performMerge(
      sourceVersion[0].spec,
      targetVersion[0].spec,
      merge_strategy,
      conflict_resolution
    );

    if (mergeResult.conflicts && mergeResult.conflicts.length > 0 && !conflict_resolution) {
      return Response.json({
        status: 'conflicts',
        conflicts: mergeResult.conflicts,
        message: 'Merge conflicts detected. Please provide conflict resolution.'
      }, { status: 409 });
    }

    // Create new version on target branch
    const newVersion = await base44.entities.WorkflowVersion.create({
      workflow_id: targetBranch[0].workflow_id,
      branch_id: target_branch_id,
      version: incrementVersion(targetVersion[0].version),
      version_number: (targetVersion[0].version_number || 0) + 1,
      spec: mergeResult.merged_spec,
      change_summary: `Merged branch ${sourceBranch[0].name} into ${targetBranch[0].name}`,
      change_type: 'minor',
      parent_version_id: targetVersion[0].id,
      created_by: user.email,
      org_id: user.organization.id
    });

    // Update target branch head
    await base44.entities.WorkflowBranch.update(target_branch_id, {
      head_version_id: newVersion.id
    });

    // Update workflow with merged spec
    await base44.entities.Workflow.update(targetBranch[0].workflow_id, {
      spec: mergeResult.merged_spec,
      version: newVersion.version
    });

    // Mark source branch as merged if merging to main
    if (targetBranch[0].is_default) {
      await base44.entities.WorkflowBranch.update(source_branch_id, {
        status: 'merged',
        merged_at: new Date().toISOString(),
        merged_by: user.email
      });
    }

    return Response.json({
      status: 'success',
      merged_version: newVersion,
      conflicts_resolved: mergeResult.conflicts?.length || 0
    });

  } catch (error) {
    console.error('Branch merge failed:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});

function performMerge(sourceSpec, targetSpec, strategy, conflictResolution) {
  const conflicts = [];
  let mergedSpec = JSON.parse(JSON.stringify(targetSpec));

  const sourceNodes = sourceSpec.nodes || [];
  const targetNodes = targetSpec.nodes || [];
  const sourceEdges = sourceSpec.edges || [];
  const targetEdges = targetSpec.edges || [];

  // Merge nodes
  const nodeMap = new Map(targetNodes.map(n => [n.id, n]));
  
  for (const sourceNode of sourceNodes) {
    const targetNode = nodeMap.get(sourceNode.id);
    
    if (!targetNode) {
      // New node in source - add it
      mergedSpec.nodes.push(sourceNode);
    } else if (JSON.stringify(sourceNode) !== JSON.stringify(targetNode)) {
      // Node modified in both branches
      if (strategy === 'theirs') {
        // Keep source version
        const idx = mergedSpec.nodes.findIndex(n => n.id === sourceNode.id);
        mergedSpec.nodes[idx] = sourceNode;
      } else if (strategy === 'ours') {
        // Keep target version (do nothing)
      } else if (conflictResolution && conflictResolution[sourceNode.id]) {
        // Use provided resolution
        const idx = mergedSpec.nodes.findIndex(n => n.id === sourceNode.id);
        mergedSpec.nodes[idx] = conflictResolution[sourceNode.id];
      } else {
        // Report conflict
        conflicts.push({
          type: 'node_modified',
          node_id: sourceNode.id,
          source: sourceNode,
          target: targetNode
        });
      }
    }
  }

  // Merge edges
  const edgeKeys = new Set(targetEdges.map(e => `${e.from}-${e.to}`));
  
  for (const sourceEdge of sourceEdges) {
    const key = `${sourceEdge.from}-${sourceEdge.to}`;
    if (!edgeKeys.has(key)) {
      mergedSpec.edges.push(sourceEdge);
    }
  }

  // Merge other properties
  if (sourceSpec.collaboration_strategy !== targetSpec.collaboration_strategy) {
    if (!conflictResolution || !conflictResolution.collaboration_strategy) {
      conflicts.push({
        type: 'property_conflict',
        property: 'collaboration_strategy',
        source: sourceSpec.collaboration_strategy,
        target: targetSpec.collaboration_strategy
      });
    } else {
      mergedSpec.collaboration_strategy = conflictResolution.collaboration_strategy;
    }
  }

  return { merged_spec: mergedSpec, conflicts };
}

function incrementVersion(version) {
  const parts = version.split('.');
  parts[1] = String(Number(parts[1]) + 1);
  return parts.join('.');
}