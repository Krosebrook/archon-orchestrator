import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { base44 } from '@/api/base44Client';
import { GitBranch, Clock, RotateCcw } from 'lucide-react';
import { format } from 'date-fns';
import { toast } from 'sonner';

export default function TemplateVersionHistory({ open, onOpenChange, template, onRestore }) {
  const [versions, setVersions] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (open && template?.id) loadVersions();
  }, [open, template?.id]);

  const loadVersions = async () => {
    setLoading(true);
    try {
      const data = await base44.entities.WorkflowVersion.filter({ workflow_id: template.id }, '-created_date', 20);
      setVersions(data);
    } catch {
      setVersions([]);
    } finally {
      setLoading(false);
    }
  };

  const handleRestore = async (version) => {
    try {
      await base44.entities.WorkflowTemplate.update(template.id, {
        spec: version.spec,
        version: version.version,
      });
      toast.success(`Restored to v${version.version}`);
      onRestore?.();
      onOpenChange(false);
    } catch {
      toast.error('Failed to restore version');
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="bg-slate-900 border-slate-700 text-white max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <GitBranch className="w-5 h-5 text-blue-400" />
            Version History — {template?.name}
          </DialogTitle>
        </DialogHeader>
        <div className="space-y-2 max-h-96 overflow-y-auto py-2">
          {loading && <p className="text-slate-400 text-sm text-center py-4">Loading versions...</p>}
          {!loading && versions.length === 0 && (
            <p className="text-slate-500 text-sm text-center py-8">No version history yet.<br/>Versions are created each time you update a template.</p>
          )}
          {versions.map((v, idx) => (
            <div key={v.id} className="flex items-start justify-between p-3 rounded-lg bg-slate-800 border border-slate-700">
              <div className="flex items-start gap-3">
                <div className="w-8 h-8 rounded-full bg-blue-500/20 flex items-center justify-center mt-0.5">
                  <GitBranch className="w-4 h-4 text-blue-400" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-white font-medium">v{v.version}</span>
                    {idx === 0 && <Badge className="bg-green-500/20 text-green-400 border-0 text-xs">Latest</Badge>}
                    {v.change_type && <Badge variant="outline" className="text-xs border-slate-600">{v.change_type}</Badge>}
                  </div>
                  {v.change_summary && <p className="text-sm text-slate-400 mt-0.5">{v.change_summary}</p>}
                  <div className="flex items-center gap-1 text-xs text-slate-500 mt-1">
                    <Clock className="w-3 h-3" />
                    {v.created_date ? format(new Date(v.created_date), 'MMM d, yyyy HH:mm') : 'Unknown date'}
                    {v.created_by && <span>· {v.created_by}</span>}
                  </div>
                </div>
              </div>
              {idx > 0 && (
                <Button size="sm" variant="ghost" onClick={() => handleRestore(v)}
                  className="text-slate-400 hover:text-white shrink-0">
                  <RotateCcw className="w-3 h-3 mr-1" />
                  Restore
                </Button>
              )}
            </div>
          ))}
        </div>
      </DialogContent>
    </Dialog>
  );
}