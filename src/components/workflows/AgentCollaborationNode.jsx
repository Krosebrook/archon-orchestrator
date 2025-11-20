import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Users, ArrowRightLeft, Share2, MessageSquare } from 'lucide-react';

const COLLABORATION_TYPES = {
  trigger: { 
    icon: ArrowRightLeft, 
    label: 'Agent Trigger', 
    description: 'Trigger another agent to execute a task' 
  },
  handoff: { 
    icon: Users, 
    label: 'Agent Handoff', 
    description: 'Transfer control to another agent' 
  },
  context_share: { 
    icon: Share2, 
    label: 'Share Context', 
    description: 'Share data securely between agents' 
  },
  multi_agent: { 
    icon: MessageSquare, 
    label: 'Multi-Agent Task', 
    description: 'Coordinate multiple agents on a shared task' 
  }
};

export default function AgentCollaborationNode({ node, agents, onUpdate, open, onOpenChange }) {
  const [config, setConfig] = useState(node.data.config || {
    collaboration_type: 'trigger',
    target_agent_id: '',
    context_mapping: {},
    security_level: 'encrypted',
    coordination_strategy: 'sequential'
  });

  const handleSave = () => {
    onUpdate({
      ...node,
      data: {
        ...node.data,
        config,
        label: getNodeLabel()
      }
    });
    onOpenChange(false);
  };

  const getNodeLabel = () => {
    const type = COLLABORATION_TYPES[config.collaboration_type];
    const targetAgent = agents.find(a => a.id === config.target_agent_id);
    return `${type.label}: ${targetAgent?.name || 'Select Agent'}`;
  };

  const CollabIcon = COLLABORATION_TYPES[config.collaboration_type]?.icon || Users;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="bg-slate-900 border-slate-800 text-white max-w-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <CollabIcon className="w-5 h-5 text-purple-400" />
            Configure Agent Collaboration
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div>
            <Label className="text-slate-300">Collaboration Type</Label>
            <Select value={config.collaboration_type} onValueChange={(val) => setConfig({ ...config, collaboration_type: val })}>
              <SelectTrigger className="bg-slate-950 border-slate-700">
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="bg-slate-900 border-slate-800">
                {Object.entries(COLLABORATION_TYPES).map(([key, type]) => (
                  <SelectItem key={key} value={key}>
                    <div className="flex items-center gap-2">
                      <type.icon className="w-4 h-4" />
                      <div>
                        <div>{type.label}</div>
                        <div className="text-xs text-slate-400">{type.description}</div>
                      </div>
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label className="text-slate-300">Target Agent</Label>
            <Select value={config.target_agent_id} onValueChange={(val) => setConfig({ ...config, target_agent_id: val })}>
              <SelectTrigger className="bg-slate-950 border-slate-700">
                <SelectValue placeholder="Select agent" />
              </SelectTrigger>
              <SelectContent className="bg-slate-900 border-slate-800">
                {agents.map(agent => (
                  <SelectItem key={agent.id} value={agent.id}>
                    {agent.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {config.collaboration_type === 'multi_agent' && (
            <div>
              <Label className="text-slate-300">Coordination Strategy</Label>
              <Select value={config.coordination_strategy} onValueChange={(val) => setConfig({ ...config, coordination_strategy: val })}>
                <SelectTrigger className="bg-slate-950 border-slate-700">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-slate-900 border-slate-800">
                  <SelectItem value="sequential">Sequential - Execute in order</SelectItem>
                  <SelectItem value="parallel">Parallel - Execute simultaneously</SelectItem>
                  <SelectItem value="consensus">Consensus - Require agreement</SelectItem>
                  <SelectItem value="hierarchical">Hierarchical - Leader coordinates</SelectItem>
                </SelectContent>
              </Select>
            </div>
          )}

          <div>
            <Label className="text-slate-300">Context to Share</Label>
            <Textarea
              value={config.context_mapping ? JSON.stringify(config.context_mapping, null, 2) : '{}'}
              onChange={(e) => {
                try {
                  setConfig({ ...config, context_mapping: JSON.parse(e.target.value) });
                } catch (e) {}
              }}
              placeholder='{"input_data": "{{previous_output}}", "user_context": "{{user_id}}"}'
              className="bg-slate-950 border-slate-700 font-mono text-sm"
              rows={4}
            />
            <p className="text-xs text-slate-500 mt-1">
              Use {'{{'} and {'}}' } for dynamic values from previous nodes
            </p>
          </div>

          <div>
            <Label className="text-slate-300">Security Level</Label>
            <Select value={config.security_level} onValueChange={(val) => setConfig({ ...config, security_level: val })}>
              <SelectTrigger className="bg-slate-950 border-slate-700">
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="bg-slate-900 border-slate-800">
                <SelectItem value="encrypted">
                  <div>
                    <div>Encrypted</div>
                    <div className="text-xs text-slate-400">End-to-end encryption</div>
                  </div>
                </SelectItem>
                <SelectItem value="signed">
                  <div>
                    <div>Signed</div>
                    <div className="text-xs text-slate-400">Integrity verification</div>
                  </div>
                </SelectItem>
                <SelectItem value="plain">
                  <div>
                    <div>Plain</div>
                    <div className="text-xs text-slate-400">No encryption (same org)</div>
                  </div>
                </SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="pt-2 border-t border-slate-800">
            <div className="flex items-center gap-2 mb-2">
              <Badge variant="outline" className="bg-purple-500/20 text-purple-400 border-purple-500/30">
                Agent Collaboration
              </Badge>
              <Badge variant="outline" className="bg-slate-800 text-slate-400 border-slate-700">
                {config.security_level}
              </Badge>
            </div>
            <p className="text-xs text-slate-400">
              Agents will communicate securely through the orchestration layer with audit trails
            </p>
          </div>
        </div>

        <div className="flex justify-end gap-2">
          <Button variant="outline" onClick={() => onOpenChange(false)} className="border-slate-700">
            Cancel
          </Button>
          <Button onClick={handleSave} className="bg-purple-600 hover:bg-purple-700">
            Save Configuration
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}