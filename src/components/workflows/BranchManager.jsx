import { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { useAuth } from '@/components/contexts/AuthContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { GitBranch, Plus, GitMerge, Shield, CheckCircle, Archive } from 'lucide-react';
import { toast } from 'sonner';

export default function BranchManager({ workflowId, currentBranchId, onBranchChange }) {
  const { organization, user } = useAuth();
  const [branches, setBranches] = useState([]);
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [showMergeDialog, setShowMergeDialog] = useState(false);
  const [mergingBranch, setMergingBranch] = useState(null);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    is_protected: false
  });

  useEffect(() => {
    if (workflowId) {
      loadBranches();
    }
  }, [workflowId]);

  const loadBranches = async () => {
    try {
      const data = await base44.entities.WorkflowBranch.filter({ 
        workflow_id: workflowId 
      }, '-created_date');
      setBranches(data);
    } catch (error) {
      console.error('Failed to load branches:', error);
    }
  };

  const handleCreate = async (e) => {
    e.preventDefault();

    if (!organization?.id) {
      toast.error('Organization not found');
      return;
    }

    try {
      // Get current branch to use as base
      const _branch = branches.find(b => b.id === currentBranchId);
      
      const _branchResult = await base44.entities.WorkflowBranch.create({
        workflow_id: workflowId,
        name: formData.name,
        description: formData.description,
        is_protected: formData.is_protected,
        is_default: false,
        base_version_id: _branch?.head_version_id,
        head_version_id: _branch?.head_version_id,
        status: 'active',
        created_by: user.email,
        org_id: organization.id
      });

      toast.success('Branch created');
      setShowCreateDialog(false);
      setFormData({ name: '', description: '', is_protected: false });
      loadBranches();
    } catch (error) {
      console.error('Failed to create branch:', error);
      toast.error('Failed to create branch');
    }
  };

  const handleMerge = async () => {
    if (!mergingBranch) return;

    const targetBranch = branches.find(b => b.is_default);
    if (!targetBranch) {
      toast.error('No default branch found');
      return;
    }

    try {
      const result = await base44.functions.invoke('mergeBranch', {
        source_branch_id: mergingBranch.id,
        target_branch_id: targetBranch.id,
        merge_strategy: 'auto'
      });

      if (result.status === 'conflicts') {
        toast.error('Merge conflicts detected - resolution required');
        // In production, show conflict resolution UI
      } else {
        toast.success('Branch merged successfully');
        setShowMergeDialog(false);
        setMergingBranch(null);
        loadBranches();
      }
    } catch (error) {
      console.error('Merge failed:', error);
      toast.error('Failed to merge branch');
    }
  };

  const handleArchive = async (branch) => {
    if (!confirm(`Archive branch "${branch.name}"?`)) return;

    try {
      await base44.entities.WorkflowBranch.update(branch.id, {
        status: 'archived'
      });
      toast.success('Branch archived');
      loadBranches();
    } catch (_error) {
      toast.error('Failed to archive branch');
    }
  };

  return (
    <>
      <Card className="bg-slate-900 border-slate-800">
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="text-white flex items-center gap-2">
            <GitBranch className="w-5 h-5" />
            Branches
          </CardTitle>
          <Button
            onClick={() => setShowCreateDialog(true)}
            size="sm"
            className="bg-blue-600 hover:bg-blue-700"
          >
            <Plus className="w-4 h-4 mr-2" />
            New Branch
          </Button>
        </CardHeader>

        <CardContent>
          <div className="space-y-2">
            {branches.filter(b => b.status === 'active').map(branch => (
              <div
                key={branch.id}
                className={`p-3 rounded-lg border transition-all cursor-pointer ${
                  branch.id === currentBranchId
                    ? 'bg-blue-500/10 border-blue-500/30'
                    : 'bg-slate-800 border-slate-700 hover:border-slate-600'
                }`}
                onClick={() => onBranchChange?.(branch)}
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-white font-medium">{branch.name}</span>
                      {branch.is_default && (
                        <Badge variant="outline" className="bg-green-500/20 text-green-400 border-green-500/30">
                          <CheckCircle className="w-3 h-3 mr-1" />
                          Default
                        </Badge>
                      )}
                      {branch.is_protected && (
                        <Badge variant="outline" className="bg-amber-500/20 text-amber-400 border-amber-500/30">
                          <Shield className="w-3 h-3 mr-1" />
                          Protected
                        </Badge>
                      )}
                      {branch.status === 'merged' && (
                        <Badge variant="outline" className="bg-slate-500/20 text-slate-400 border-slate-500/30">
                          Merged
                        </Badge>
                      )}
                    </div>
                    {branch.description && (
                      <p className="text-sm text-slate-400">{branch.description}</p>
                    )}
                    <p className="text-xs text-slate-500 mt-1">
                      Created by {branch.created_by}
                    </p>
                  </div>

                  {!branch.is_default && branch.status === 'active' && (
                    <div className="flex gap-1">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={(e) => {
                          e.stopPropagation();
                          setMergingBranch(branch);
                          setShowMergeDialog(true);
                        }}
                        className="text-green-400 hover:text-green-300"
                      >
                        <GitMerge className="w-4 h-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleArchive(branch);
                        }}
                        className="text-slate-400 hover:text-white"
                      >
                        <Archive className="w-4 h-4" />
                      </Button>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Create Branch Dialog */}
      <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
        <DialogContent className="bg-slate-900 border-slate-800">
          <DialogHeader>
            <DialogTitle className="text-white">Create New Branch</DialogTitle>
          </DialogHeader>

          <form onSubmit={handleCreate} className="space-y-4">
            <div>
              <Label className="text-slate-400">Branch Name</Label>
              <Input
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="e.g., feature/new-integration"
                className="bg-slate-800 border-slate-700 text-white"
                required
              />
            </div>

            <div>
              <Label className="text-slate-400">Description</Label>
              <Textarea
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder="What is this branch for?"
                className="bg-slate-800 border-slate-700 text-white"
                rows={3}
              />
            </div>

            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                checked={formData.is_protected}
                onChange={(e) => setFormData({ ...formData, is_protected: e.target.checked })}
                className="rounded"
              />
              <Label className="text-slate-400">Protected branch (requires approval to merge)</Label>
            </div>

            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setShowCreateDialog(false)}>
                Cancel
              </Button>
              <Button type="submit" className="bg-blue-600 hover:bg-blue-700">
                Create Branch
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Merge Dialog */}
      <Dialog open={showMergeDialog} onOpenChange={setShowMergeDialog}>
        <DialogContent className="bg-slate-900 border-slate-800">
          <DialogHeader>
            <DialogTitle className="text-white">Merge Branch</DialogTitle>
          </DialogHeader>

          <div className="space-y-4">
            <p className="text-slate-400">
              Merge <strong className="text-white">{mergingBranch?.name}</strong> into the default branch?
            </p>
            {mergingBranch?.is_protected && (
              <div className="p-3 bg-amber-500/10 rounded border border-amber-500/30">
                <p className="text-sm text-amber-400">
                  This is a protected branch. Approvals may be required.
                </p>
              </div>
            )}
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowMergeDialog(false)}>
              Cancel
            </Button>
            <Button onClick={handleMerge} className="bg-green-600 hover:bg-green-700">
              <GitMerge className="w-4 h-4 mr-2" />
              Merge
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}