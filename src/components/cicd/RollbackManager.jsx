import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { 
  RotateCcw, 
  AlertTriangle,
  CheckCircle2,
  Clock
} from 'lucide-react';
import { toast } from 'sonner';
import { format } from 'date-fns';

export default function RollbackManager({ workflow }) {
  const [versions, setVersions] = useState([]);
  const [selectedVersion, setSelectedVersion] = useState(null);
  const [reason, setReason] = useState('');
  const [isRollingBack, setIsRollingBack] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadVersions();
  }, [workflow.id]);

  const loadVersions = async () => {
    try {
      const history = await base44.entities.WorkflowVersion.filter(
        { workflow_id: workflow.id },
        '-created_date',
        10
      );
      setVersions(history);
    } catch (error) {
      console.error('Failed to load versions:', error);
      toast.error('Failed to load version history');
    } finally {
      setLoading(false);
    }
  };

  const handleRollback = async () => {
    if (!selectedVersion || !reason.trim()) {
      toast.error('Please select a version and provide a reason');
      return;
    }

    setIsRollingBack(true);

    try {
      const { data } = await base44.functions.invoke('rollbackDeployment', {
        workflow_id: workflow.id,
        target_version: selectedVersion.version,
        reason: reason.trim()
      });

      toast.success(data.message || 'Rollback successful');
      setSelectedVersion(null);
      setReason('');
      
      // Reload versions
      await loadVersions();
    } catch (error) {
      console.error('Rollback failed:', error);
      toast.error(error.message || 'Rollback failed');
    } finally {
      setIsRollingBack(false);
    }
  };

  return (
    <Card className="bg-slate-900 border-slate-800">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <RotateCcw className="w-5 h-5" />
          Rollback Management
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-start gap-3 p-3 bg-amber-500/10 border border-amber-500/30 rounded-lg">
          <AlertTriangle className="w-5 h-5 text-amber-500 flex-shrink-0 mt-0.5" />
          <div className="text-sm">
            <p className="font-medium text-amber-500">Rollback Safety</p>
            <p className="text-slate-400 mt-1">
              Rolling back will revert the workflow to a previous version and set status to draft.
              Active runs will be checked before rollback.
            </p>
          </div>
        </div>

        <div className="space-y-3">
          <div>
            <Label>Current Version</Label>
            <div className="flex items-center gap-2 mt-2">
              <Badge className="bg-blue-600">{workflow.version}</Badge>
              <span className="text-sm text-slate-400">
                (deployed {workflow.deployed_at ? format(new Date(workflow.deployed_at), 'PPp') : 'never'})
              </span>
            </div>
          </div>

          <div>
            <Label>Select Target Version</Label>
            <div className="mt-2 space-y-2 max-h-64 overflow-y-auto">
              {loading ? (
                <div className="text-center py-8 text-slate-400">Loading versions...</div>
              ) : versions.length === 0 ? (
                <div className="text-center py-8 text-slate-400">No version history available</div>
              ) : (
                versions.map((version) => (
                  <button
                    key={version.id}
                    onClick={() => setSelectedVersion(version)}
                    className={`w-full p-3 rounded-lg border text-left transition-all ${
                      selectedVersion?.id === version.id
                        ? 'border-blue-500 bg-blue-500/10'
                        : 'border-slate-700 hover:border-slate-600 bg-slate-800'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-2">
                      <Badge variant={version.version === workflow.version ? 'default' : 'outline'}>
                        v{version.version}
                      </Badge>
                      {version.version === workflow.version && (
                        <CheckCircle2 className="w-4 h-4 text-green-500" />
                      )}
                    </div>
                    <p className="text-sm text-slate-400 mb-1">
                      {version.change_summary || 'No description'}
                    </p>
                    <div className="flex items-center gap-2 text-xs text-slate-500">
                      <Clock className="w-3 h-3" />
                      {format(new Date(version.created_date), 'PPp')}
                      <span>•</span>
                      <span>{version.created_by}</span>
                    </div>
                  </button>
                ))
              )}
            </div>
          </div>

          {selectedVersion && selectedVersion.version !== workflow.version && (
            <>
              <div>
                <Label>Rollback Reason</Label>
                <Input
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                  placeholder="e.g., Critical bug in production"
                  className="mt-2 border-slate-700"
                />
              </div>

              <Button
                onClick={handleRollback}
                disabled={isRollingBack || !reason.trim()}
                className="w-full bg-amber-600 hover:bg-amber-700"
              >
                <RotateCcw className="w-4 h-4 mr-2" />
                {isRollingBack ? 'Rolling Back...' : `Rollback to v${selectedVersion.version}`}
              </Button>
            </>
          )}
        </div>
      </CardContent>
    </Card>
  );
}