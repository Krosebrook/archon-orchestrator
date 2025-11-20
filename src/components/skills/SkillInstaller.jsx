import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { SkillInstallation } from '@/entities/all';
import { base44 } from '@/api/base44Client';
import { toast } from 'sonner';
import { Shield, AlertTriangle } from 'lucide-react';

export default function SkillInstaller({ skill, agents, open, onOpenChange, onInstall }) {
  const [selectedAgents, setSelectedAgents] = useState([]);
  const [isInstalling, setIsInstalling] = useState(false);
  const [acceptRisks, setAcceptRisks] = useState(false);

  const handleInstall = async () => {
    if (selectedAgents.length === 0) {
      toast.error('Please select at least one agent');
      return;
    }

    if (!acceptRisks) {
      toast.error('Please review and accept the security considerations');
      return;
    }

    setIsInstalling(true);
    try {
      const user = await base44.auth.me();

      for (const agentId of selectedAgents) {
        await SkillInstallation.create({
          skill_id: skill.id,
          agent_id: agentId,
          installed_by: user.email,
          status: 'active',
          config: {},
          org_id: user.organization.id
        });
      }

      // Update skill install count
      await Skill.update(skill.id, {
        install_count: (skill.install_count || 0) + selectedAgents.length
      });

      toast.success(`Skill installed on ${selectedAgents.length} agent(s)`);
      onInstall?.();
      onOpenChange(false);
      setSelectedAgents([]);
      setAcceptRisks(false);
    } catch (error) {
      console.error('Installation failed:', error);
      toast.error('Failed to install skill');
    } finally {
      setIsInstalling(false);
    }
  };

  const toggleAgent = (agentId) => {
    setSelectedAgents(prev =>
      prev.includes(agentId)
        ? prev.filter(id => id !== agentId)
        : [...prev, agentId]
    );
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="bg-slate-900 border-slate-800 text-white max-w-2xl">
        <DialogHeader>
          <DialogTitle className="text-xl">Install {skill?.name}</DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          <div>
            <Label className="text-slate-300 mb-3 block">Select Agents</Label>
            <div className="space-y-2 max-h-60 overflow-y-auto">
              {agents.map(agent => (
                <div
                  key={agent.id}
                  className="flex items-center gap-3 p-3 bg-slate-950 rounded-lg cursor-pointer hover:bg-slate-800 transition-colors"
                  onClick={() => toggleAgent(agent.id)}
                >
                  <Checkbox
                    checked={selectedAgents.includes(agent.id)}
                    onCheckedChange={() => toggleAgent(agent.id)}
                  />
                  <div className="flex-1">
                    <div className="font-medium">{agent.name}</div>
                    <div className="text-xs text-slate-500">{agent.config?.model || 'N/A'}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {skill?.spec?.permissions && skill.spec.permissions.length > 0 && (
            <div className="p-4 bg-yellow-500/10 border border-yellow-500/30 rounded-lg">
              <div className="flex items-start gap-3">
                <AlertTriangle className="w-5 h-5 text-yellow-400 flex-shrink-0 mt-0.5" />
                <div>
                  <div className="text-sm font-medium text-yellow-400 mb-2">Required Permissions</div>
                  <ul className="space-y-1 text-sm text-slate-300">
                    {skill.spec.permissions.map((perm, idx) => (
                      <li key={idx}>• {perm}</li>
                    ))}
                  </ul>
                </div>
              </div>
            </div>
          )}

          <div className="p-4 bg-blue-500/10 border border-blue-500/30 rounded-lg">
            <div className="flex items-start gap-3">
              <Shield className="w-5 h-5 text-blue-400 flex-shrink-0 mt-0.5" />
              <div>
                <div className="text-sm font-medium text-blue-400 mb-2">Sandbox Execution</div>
                <div className="text-sm text-slate-400">
                  This skill runs in a secure sandbox with:
                  <ul className="mt-2 space-y-1">
                    <li>• Timeout: {skill?.sandbox_config?.timeout_ms || 5000}ms</li>
                    <li>• Max Memory: {skill?.sandbox_config?.max_memory_mb || 128}MB</li>
                    <li>• Restricted API Access</li>
                  </ul>
                </div>
              </div>
            </div>
          </div>

          <div className="flex items-start gap-3">
            <Checkbox
              id="accept-risks"
              checked={acceptRisks}
              onCheckedChange={setAcceptRisks}
            />
            <Label htmlFor="accept-risks" className="text-sm text-slate-400 cursor-pointer">
              I understand this skill will have access to the selected agents and their configurations.
              I have reviewed the permissions and security settings.
            </Label>
          </div>

          <div className="flex gap-3">
            <Button
              variant="outline"
              onClick={() => onOpenChange(false)}
              className="flex-1 bg-slate-800 border-slate-700"
            >
              Cancel
            </Button>
            <Button
              onClick={handleInstall}
              disabled={isInstalling || selectedAgents.length === 0 || !acceptRisks}
              className="flex-1 bg-blue-600 hover:bg-blue-700"
            >
              {isInstalling ? 'Installing...' : 'Install Skill'}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}