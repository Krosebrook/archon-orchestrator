import React, { useState, useEffect } from 'react';
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
import { handleError } from '../utils/api-client';
import { validateAgentConfig } from '../utils/validation';
import { createAuditLog, redactSensitiveData, AuditActions, AuditEntities } from '../utils/audit-logger';
import { toast } from 'sonner';
import { base44 } from '@/api/base44Client';

const getEmptyAgent = (orgId) => ({
  name: '',
  version: '1.0.0',
  status: 'active',
  config: {
    provider: 'openai',
    model: '',
    temperature: 0.7,
  },
  org_id: orgId,
});

export default function AgentForm({ open, onOpenChange, agent, onSave }) {
  const { organization } = useAuth();
  const [formData, setFormData] = useState(() => getEmptyAgent(organization?.id));
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (agent) {
      setFormData(agent);
    } else {
      setFormData(getEmptyAgent(organization?.id));
    }
  }, [agent, open, organization?.id]);

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
    
    // Validate agent configuration
    const validation = validateAgentConfig(formData.config);
    if (!validation.valid) {
      toast.error(`Validation failed: ${validation.errors.join(', ')}`);
      return;
    }
    
    setIsSaving(true);
    try {
      let result;
      const user = await base44.auth.me();
      
      if (formData.id) {
        // Update existing agent
        result = await Agent.update(formData.id, formData);
        
        // Create audit log
        await base44.entities.Audit.create(createAuditLog(
          AuditActions.UPDATE,
          AuditEntities.AGENT,
          formData.id,
          {
            before: redactSensitiveData(agent),
            after: redactSensitiveData(formData)
          }
        ));
        
        toast.success('Agent updated successfully');
      } else {
        // Create new agent
        result = await Agent.create(formData);
        
        // Create audit log
        await base44.entities.Audit.create(createAuditLog(
          AuditActions.CREATE,
          AuditEntities.AGENT,
          result.id,
          { after: redactSensitiveData(result) }
        ));
        
        toast.success('Agent created successfully');
      }
      
      onOpenChange(false);
      onSave();
    } catch (error) {
      handleError(error);
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
              minLength={3}
              maxLength={100}
              placeholder="My AI Agent"
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