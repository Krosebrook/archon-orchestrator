import { createClientFromRequest } from 'npm:@base44/sdk@0.8.4';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { version_id_a, version_id_b } = await req.json();

    if (!version_id_a || !version_id_b) {
      return Response.json({ error: 'Missing version IDs' }, { status: 400 });
    }

    // Fetch both versions
    const [versionA, versionB] = await Promise.all([
      base44.entities.WorkflowVersion.filter({ id: version_id_a }),
      base44.entities.WorkflowVersion.filter({ id: version_id_b })
    ]);

    if (!versionA[0] || !versionB[0]) {
      return Response.json({ error: 'Version not found' }, { status: 404 });
    }

    const specA = versionA[0].spec;
    const specB = versionB[0].spec;

    // Calculate diff
    const diff = calculateDiff(specA, specB);

    return Response.json({
      version_a: {
        id: versionA[0].id,
        version: versionA[0].version,
        created_date: versionA[0].created_date,
        change_summary: versionA[0].change_summary
      },
      version_b: {
        id: versionB[0].id,
        version: versionB[0].version,
        created_date: versionB[0].created_date,
        change_summary: versionB[0].change_summary
      },
      diff
    });

  } catch (error) {
    console.error('Version comparison failed:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});

function calculateDiff(specA, specB) {
  const nodesA = specA.nodes || [];
  const nodesB = specB.nodes || [];
  const edgesA = specA.edges || [];
  const edgesB = specB.edges || [];

  // Find added, removed, and modified nodes
  const nodeMapA = new Map(nodesA.map(n => [n.id, n]));
  const nodeMapB = new Map(nodesB.map(n => [n.id, n]));

  const addedNodes = nodesB.filter(n => !nodeMapA.has(n.id));
  const removedNodes = nodesA.filter(n => !nodeMapB.has(n.id));
  const modifiedNodes = [];

  for (const nodeB of nodesB) {
    const nodeA = nodeMapA.get(nodeB.id);
    if (nodeA && JSON.stringify(nodeA) !== JSON.stringify(nodeB)) {
      modifiedNodes.push({
        id: nodeB.id,
        before: nodeA,
        after: nodeB,
        changes: detectNodeChanges(nodeA, nodeB)
      });
    }
  }

  // Find added and removed edges
  const edgeKeyA = new Set(edgesA.map(e => `${e.from}-${e.to}`));
  const edgeKeyB = new Set(edgesB.map(e => `${e.from}-${e.to}`));

  const addedEdges = edgesB.filter(e => !edgeKeyA.has(`${e.from}-${e.to}`));
  const removedEdges = edgesA.filter(e => !edgeKeyB.has(`${e.from}-${e.to}`));

  return {
    nodes: {
      added: addedNodes,
      removed: removedNodes,
      modified: modifiedNodes
    },
    edges: {
      added: addedEdges,
      removed: removedEdges
    },
    summary: {
      total_changes: addedNodes.length + removedNodes.length + modifiedNodes.length + addedEdges.length + removedEdges.length,
      nodes_added: addedNodes.length,
      nodes_removed: removedNodes.length,
      nodes_modified: modifiedNodes.length,
      edges_added: addedEdges.length,
      edges_removed: removedEdges.length
    }
  };
}

function detectNodeChanges(nodeA, nodeB) {
  const changes = [];

  if (nodeA.label !== nodeB.label) {
    changes.push({ field: 'label', before: nodeA.label, after: nodeB.label });
  }

  if (nodeA.type !== nodeB.type) {
    changes.push({ field: 'type', before: nodeA.type, after: nodeB.type });
  }

  if (JSON.stringify(nodeA.config) !== JSON.stringify(nodeB.config)) {
    changes.push({ field: 'config', before: nodeA.config, after: nodeB.config });
  }

  if (JSON.stringify(nodeA.position) !== JSON.stringify(nodeB.position)) {
    changes.push({ field: 'position', before: nodeA.position, after: nodeB.position });
  }

  return changes;
}