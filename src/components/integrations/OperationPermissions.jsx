import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Workflow, IntegrationPermission } from '@/entities/all';
import { base44 } from '@/api/base44Client';
import { Loader2 } from 'lucide-react';
import { toast } from 'sonner';

export default function OperationPermissions({ integration, open, onOpenChange }) {
  const [workflows, setWorkflows] = useState([]);
  const [permissions, setPermissions] = useState({});
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (open) {
      loadData();
    }
  }, [open, integration.id]);

  const loadData = async () => {
    setIsLoading(true);
    try {
      const [workflowData, permissionData] = await Promise.all([
        Workflow.list(),
        IntegrationPermission.filter({ integration_id: integration.id })
      ]);

      setWorkflows(workflowData);

      const permissionsMap = {};
      permissionData.forEach(perm => {
        permissionsMap[perm.workflow_id] = perm.allowed_operations || [];
      });
      setPermissions(permissionsMap);
    } catch (error) {
      console.error('Failed to load permissions:', error);
      toast.error('Failed to load permissions');
    } finally {
      setIsLoading(false);
    }
  };

  const toggleOperation = (workflowId, operation) => {
    setPermissions(prev => {
      const current = prev[workflowId] || [];
      const updated = current.includes(operation)
        ? current.filter(op => op !== operation)
        : [...current, operation];
      return { ...prev, [workflowId]: updated };
    });
  };

  const handleSave = async () => {
    setIsSaving(true);
    try {
      const user = await base44.auth.me();
      
      // Delete existing permissions
      const existingPerms = await IntegrationPermission.filter({ integration_id: integration.id });
      await Promise.all(existingPerms.map(perm => IntegrationPermission.delete(perm.id)));

      // Create new permissions
      const creates = Object.entries(permissions)
        .filter(([_, ops]) => ops.length > 0)
        .map(([workflowId, allowed_operations]) =>
          IntegrationPermission.create({
            integration_id: integration.id,
            workflow_id: workflowId,
            allowed_operations,
            org_id: user.organization.id
          })
        );

      await Promise.all(creates);
      toast.success('Permissions saved');
      onOpenChange(false);
    } catch (error) {
      console.error('Failed to save permissions:', error);
      toast.error('Failed to save permissions');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="bg-slate-900 border-slate-800 text-white max-w-2xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Operation Permissions: {integration.name}</DialogTitle>
        </DialogHeader>

        {isLoading ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="w-6 h-6 animate-spin text-slate-400" />
          </div>
        ) : (
          <div className="space-y-6 py-4">
            {workflows.length === 0 ? (
              <p className="text-slate-400 text-center py-8">
                No workflows found. Create a workflow to manage permissions.
              </p>
            ) : (
              workflows.map(workflow => (
                <div key={workflow.id} className="p-4 bg-slate-950 rounded-lg border border-slate-800">
                  <h3 className="text-white font-medium mb-3">{workflow.name}</h3>
                  <div className="space-y-2">
                    {integration.supported_operations.map((op, idx) => {
                      const operationName = op.operation;
                      const isChecked = (permissions[workflow.id] || []).includes(operationName);
                      
                      return (
                        <div key={idx} className="flex items-center gap-3">
                          <Checkbox
                            id={`${workflow.id}-${operationName}`}
                            checked={isChecked}
                            onCheckedChange={() => toggleOperation(workflow.id, operationName)}
                            className="border-slate-700"
                          />
                          <label
                            htmlFor={`${workflow.id}-${operationName}`}
                            className="text-sm text-slate-300 cursor-pointer flex-1"
                          >
                            {op.label || operationName}
                          </label>
                        </div>
                      );
                    })}
                  </div>
                </div>
              ))
            )}

            <div className="flex justify-end gap-2 pt-4 border-t border-slate-800">
              <Button variant="outline" onClick={() => onOpenChange(false)} className="border-slate-700">
                Cancel
              </Button>
              <Button onClick={handleSave} disabled={isSaving} className="bg-blue-600 hover:bg-blue-700">
                {isSaving ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Saving...
                  </>
                ) : (
                  'Save Permissions'
                )}
              </Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}