
import { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Agent } from '@/entities/Agent';
import { useAuth } from '@/components/contexts/AuthContext';
import { RBACGuard } from '../shared/RBACGuard';

const emptyAgent = {
  name: '',
  version: '1.0.0',
  status: 'active', // Retaining status in emptyAgent for consistency, even if not shown in form
  config: {
    provider: 'openai',
    model: '',
    temperature: 0.7,
  },
  org_id: 'org_acme', // Assuming a static org_id for prototype
};

export default function AgentForm({ open, onOpenChange, agent, onSave }) {
  const [formData, setFormData] = useState(emptyAgent);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (agent) {
      setFormData(agent);
    } else {
      setFormData(emptyAgent);
    }
  }, [agent, open]);

  const handleInputChange = (field, value) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const handleConfigChange = (field, value) => {
    setFormData((prev) => ({
      ...prev,
      config: { ...prev.config, [field]: value },
    }));
  };

  const { hasPermission } = useAuth();
  const canEdit = hasPermission('agent.edit');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSaving(true);
    try {
      if (formData.id) {
        await Agent.update(formData.id, formData);
      } else {
        await Agent.create(formData);
      }
      onSave(); // Callback to refresh data on the parent page
    } catch (error) {
      console.error('Failed to save agent:', error);
      // Here you would show an error toast
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px] bg-slate-900 border-slate-800 text-white">
        <DialogHeader>
          <DialogTitle>{agent ? 'Edit Agent' : 'Create New Agent'}</DialogTitle>
          <DialogDescription className="text-slate-400">
            Configure your AI agent's model, version, and parameters.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4 py-4">
          <div>
            <Label htmlFor="name" className="text-slate-400">Agent Name</Label>
            <Input
              id="name"
              value={formData.name}
              onChange={(e) => handleInputChange('name', e.target.value)}
              className="bg-slate-800 border-slate-700"
              required
              disabled={!canEdit}
            />
          </div>
          <div>
            <Label htmlFor="version" className="text-slate-400">Version</Label>
            <Input
              id="version"
              value={formData.version}
              onChange={(e) => handleInputChange('version', e.target.value)}
              className="bg-slate-800 border-slate-700"
              required
              disabled={!canEdit}
            />
          </div>
          {/* Status field removed as per outline */}
          <div>
            <Label htmlFor="provider" className="text-slate-400">Provider</Label>
            <Select
              value={formData.config.provider}
              onValueChange={(value) => handleConfigChange('provider', value)}
              disabled={!canEdit}
            >
              <SelectTrigger className="w-full bg-slate-800 border-slate-700">
                <SelectValue placeholder="Select a provider" />
              </SelectTrigger>
              <SelectContent className="bg-slate-900 border-slate-800 text-white">
                <SelectItem value="openai" className="focus:bg-slate-800">OpenAI</SelectItem>
                <SelectItem value="anthropic" className="focus:bg-slate-800">Anthropic</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label htmlFor="model" className="text-slate-400">Model</Label>
            <Input
              id="model"
              value={formData.config.model}
              onChange={(e) => handleConfigChange('model', e.target.value)}
              className="bg-slate-800 border-slate-700"
              placeholder="e.g., gpt-4-turbo"
              required
              disabled={!canEdit}
            />
          </div>
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              className="border-slate-700 text-slate-200 hover:bg-slate-800 hover:text-white"
            >
              Cancel
            </Button>
            <RBACGuard permission="agent.edit">
              <Button
                type="submit"
                className="bg-blue-600 hover:bg-blue-700 text-white"
                disabled={isSaving}
              >
                {isSaving ? 'Saving...' : 'Save Agent'}
              </Button>
            </RBACGuard>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
