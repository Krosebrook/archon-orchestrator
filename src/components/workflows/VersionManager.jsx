import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { History, RotateCcw, Eye, GitBranch, Loader2 } from 'lucide-react';
import { base44 } from '@/api/base44Client';
import { toast } from 'sonner';
import { format } from 'date-fns';

export default function VersionManager({ workflow, onRestore }) {
  const [versions, setVersions] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRollingBack, setIsRollingBack] = useState(null);

  useEffect(() => {
    loadVersions();
  }, [workflow.id]);

  const loadVersions = async () => {
    try {
      const data = await base44.entities.WorkflowVersion.filter(
        { workflow_id: workflow.id },
        '-created_date',
        20
      );
      setVersions(data);
    } catch (error) {
      console.error('Failed to load versions:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const rollbackToVersion = async (version) => {
    setIsRollingBack(version.id);
    try {
      const user = await base44.auth.me();
      
      // Create audit record
      await base44.entities.Audit.create({
        actor: user.email,
        action: 'workflow.rollback',
        entity: 'Workflow',
        entity_id: workflow.id,
        before: { version: workflow.version, spec: workflow.spec },
        after: { version: version.version_number, spec: version.spec },
        org_id: user.organization?.id || 'org_default'
      });

      // Update workflow to previous version
      await base44.entities.Workflow.update(workflow.id, {
        spec: version.spec,
        version: version.version_number
      });

      toast.success(`Rolled back to version ${version.version_number}`);
      onRestore?.();
    } catch (error) {
      console.error('Rollback failed:', error);
      toast.error('Failed to rollback workflow');
    } finally {
      setIsRollingBack(null);
    }
  };

  const compareVersion = (version) => {
    toast.info('Version comparison coming soon');
  };

  if (isLoading) {
    return (
      <Card className="bg-slate-900 border-slate-800">
        <CardContent className="p-8 text-center">
          <Loader2 className="w-8 h-8 animate-spin mx-auto text-slate-400" />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="bg-slate-900 border-slate-800">
      <CardHeader>
        <CardTitle className="text-white flex items-center gap-2">
          <History className="w-5 h-5" />
          Version History
        </CardTitle>
        <p className="text-sm text-slate-400">
          {versions.length} versions • Current: {workflow.version}
        </p>
      </CardHeader>
      <CardContent>
        {versions.length === 0 ? (
          <div className="text-center py-8 text-slate-400">
            No version history available
          </div>
        ) : (
          <div className="space-y-3">
            {versions.map((version, idx) => {
              const isCurrent = version.version_number === workflow.version;
              const nodeCount = version.spec?.nodes?.length || 0;

              return (
                <div
                  key={version.id}
                  className={`p-4 rounded-lg border ${
                    isCurrent
                      ? 'bg-blue-900/20 border-blue-500/50'
                      : 'bg-slate-950 border-slate-800'
                  }`}
                >
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <GitBranch className="w-4 h-4 text-slate-400" />
                      <span className="text-white font-medium">v{version.version_number}</span>
                      {isCurrent && (
                        <Badge variant="outline" className="bg-blue-500/20 text-blue-400 border-blue-500/30">
                          Current
                        </Badge>
                      )}
                    </div>
                    <div className="text-xs text-slate-500">
                      {format(new Date(version.created_date), 'MMM d, h:mm a')}
                    </div>
                  </div>

                  {version.change_summary && (
                    <p className="text-sm text-slate-400 mb-2">{version.change_summary}</p>
                  )}

                  <div className="flex items-center gap-4 text-xs text-slate-500 mb-3">
                    <span>{nodeCount} nodes</span>
                    {version.created_by && <span>by {version.created_by}</span>}
                  </div>

                  {!isCurrent && (
                    <div className="flex gap-2">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => compareVersion(version)}
                        className="border-slate-700"
                      >
                        <Eye className="w-3 h-3 mr-1" />
                        Compare
                      </Button>
                      <Button
                        size="sm"
                        onClick={() => rollbackToVersion(version)}
                        disabled={isRollingBack !== null}
                        className="bg-orange-600 hover:bg-orange-700"
                      >
                        {isRollingBack === version.id ? (
                          <><Loader2 className="w-3 h-3 mr-1 animate-spin" />Rolling back...</>
                        ) : (
                          <><RotateCcw className="w-3 h-3 mr-1" />Rollback</>
                        )}
                      </Button>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </CardContent>
    </Card>
  );
}