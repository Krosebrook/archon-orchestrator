import { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Plus, Minus, Edit, ArrowRight, GitCompare } from 'lucide-react';
import { toast } from 'sonner';

export default function VersionComparison({ versionIdA, versionIdB, onClose }) {
  const [comparison, setComparison] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (versionIdA && versionIdB) {
      loadComparison();
    }
  }, [versionIdA, versionIdB]);

  const loadComparison = async () => {
    setIsLoading(true);
    try {
      const result = await base44.functions.invoke('compareVersions', {
        version_id_a: versionIdA,
        version_id_b: versionIdB
      });
      setComparison(result);
    } catch (error) {
      console.error('Comparison failed:', error);
      toast.error('Failed to compare versions');
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading) {
    return (
      <Card className="bg-slate-900 border-slate-800">
        <CardContent className="py-8 text-center text-slate-400">
          Loading comparison...
        </CardContent>
      </Card>
    );
  }

  if (!comparison) {
    return null;
  }

  const { version_a, version_b, diff } = comparison;

  return (
    <Card className="bg-slate-900 border-slate-800">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="text-white flex items-center gap-2">
            <GitCompare className="w-5 h-5" />
            Version Comparison
          </CardTitle>
          {onClose && (
            <Button variant="ghost" size="sm" onClick={onClose}>
              Close
            </Button>
          )}
        </div>
        <div className="flex items-center gap-4 mt-4 text-sm">
          <div className="flex-1 p-3 bg-slate-800 rounded">
            <div className="text-slate-400 mb-1">Version A</div>
            <div className="text-white font-mono">{version_a.version}</div>
            <div className="text-xs text-slate-500 mt-1">
              {new Date(version_a.created_date).toLocaleString()}
            </div>
          </div>
          <ArrowRight className="w-5 h-5 text-slate-600" />
          <div className="flex-1 p-3 bg-slate-800 rounded">
            <div className="text-slate-400 mb-1">Version B</div>
            <div className="text-white font-mono">{version_b.version}</div>
            <div className="text-xs text-slate-500 mt-1">
              {new Date(version_b.created_date).toLocaleString()}
            </div>
          </div>
        </div>
      </CardHeader>

      <CardContent className="space-y-6">
        {/* Summary */}
        <div className="grid grid-cols-5 gap-2">
          <div className="p-3 bg-slate-800 rounded text-center">
            <div className="text-2xl font-bold text-white">{diff.summary.total_changes}</div>
            <div className="text-xs text-slate-400">Total Changes</div>
          </div>
          <div className="p-3 bg-green-500/10 rounded text-center border border-green-500/30">
            <div className="text-2xl font-bold text-green-400">{diff.summary.nodes_added}</div>
            <div className="text-xs text-green-400">Nodes Added</div>
          </div>
          <div className="p-3 bg-red-500/10 rounded text-center border border-red-500/30">
            <div className="text-2xl font-bold text-red-400">{diff.summary.nodes_removed}</div>
            <div className="text-xs text-red-400">Nodes Removed</div>
          </div>
          <div className="p-3 bg-blue-500/10 rounded text-center border border-blue-500/30">
            <div className="text-2xl font-bold text-blue-400">{diff.summary.nodes_modified}</div>
            <div className="text-xs text-blue-400">Nodes Modified</div>
          </div>
          <div className="p-3 bg-purple-500/10 rounded text-center border border-purple-500/30">
            <div className="text-2xl font-bold text-purple-400">
              {diff.summary.edges_added + diff.summary.edges_removed}
            </div>
            <div className="text-xs text-purple-400">Edge Changes</div>
          </div>
        </div>

        {/* Added Nodes */}
        {diff.nodes.added.length > 0 && (
          <div>
            <div className="flex items-center gap-2 mb-3">
              <Plus className="w-4 h-4 text-green-400" />
              <h3 className="text-white font-medium">Added Nodes ({diff.nodes.added.length})</h3>
            </div>
            <div className="space-y-2">
              {diff.nodes.added.map((node, idx) => (
                <div key={idx} className="p-3 bg-green-500/10 rounded border border-green-500/30">
                  <div className="flex items-center gap-2">
                    <Badge className="bg-green-500/20 text-green-400">{node.type}</Badge>
                    <span className="text-white">{node.label}</span>
                  </div>
                  {node.config && Object.keys(node.config).length > 0 && (
                    <div className="mt-2 text-xs text-slate-400">
                      Config: {JSON.stringify(node.config)}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Removed Nodes */}
        {diff.nodes.removed.length > 0 && (
          <div>
            <div className="flex items-center gap-2 mb-3">
              <Minus className="w-4 h-4 text-red-400" />
              <h3 className="text-white font-medium">Removed Nodes ({diff.nodes.removed.length})</h3>
            </div>
            <div className="space-y-2">
              {diff.nodes.removed.map((node, idx) => (
                <div key={idx} className="p-3 bg-red-500/10 rounded border border-red-500/30">
                  <div className="flex items-center gap-2">
                    <Badge className="bg-red-500/20 text-red-400">{node.type}</Badge>
                    <span className="text-white line-through">{node.label}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Modified Nodes */}
        {diff.nodes.modified.length > 0 && (
          <div>
            <div className="flex items-center gap-2 mb-3">
              <Edit className="w-4 h-4 text-blue-400" />
              <h3 className="text-white font-medium">Modified Nodes ({diff.nodes.modified.length})</h3>
            </div>
            <div className="space-y-2">
              {diff.nodes.modified.map((mod, idx) => (
                <div key={idx} className="p-3 bg-blue-500/10 rounded border border-blue-500/30">
                  <div className="flex items-center gap-2 mb-2">
                    <Badge className="bg-blue-500/20 text-blue-400">{mod.after.type}</Badge>
                    <span className="text-white">{mod.after.label}</span>
                  </div>
                  <div className="space-y-1 text-xs">
                    {mod.changes.map((change, cidx) => (
                      <div key={cidx} className="flex items-start gap-2">
                        <span className="text-slate-500">{change.field}:</span>
                        <div className="flex-1">
                          <div className="text-red-400">- {JSON.stringify(change.before)}</div>
                          <div className="text-green-400">+ {JSON.stringify(change.after)}</div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Edge Changes */}
        {(diff.edges.added.length > 0 || diff.edges.removed.length > 0) && (
          <div>
            <h3 className="text-white font-medium mb-3">Connection Changes</h3>
            <div className="space-y-2">
              {diff.edges.added.map((edge, idx) => (
                <div key={idx} className="p-2 bg-green-500/10 rounded border border-green-500/30 text-sm">
                  <Plus className="w-3 h-3 inline text-green-400 mr-2" />
                  <span className="text-white">
                    {edge.from} → {edge.to}
                  </span>
                </div>
              ))}
              {diff.edges.removed.map((edge, idx) => (
                <div key={idx} className="p-2 bg-red-500/10 rounded border border-red-500/30 text-sm">
                  <Minus className="w-3 h-3 inline text-red-400 mr-2" />
                  <span className="text-white line-through">
                    {edge.from} → {edge.to}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

        {diff.summary.total_changes === 0 && (
          <div className="text-center py-8 text-slate-400">
            No differences found between these versions
          </div>
        )}
      </CardContent>
    </Card>
  );
}