import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { X } from 'lucide-react';

export default function NodeConfigPanel({ node, agents, skills, onUpdate, onClose }) {
  const renderConfig = () => {
    switch (node.type) {
      case 'agent_action':
        return (
          <div className="space-y-4">
            <div>
              <Label>Select Agent</Label>
              <Select
                value={node.config.agent_id || ''}
                onValueChange={(value) => onUpdate({ config: { ...node.config, agent_id: value } })}
              >
                <SelectTrigger className="bg-slate-950 border-slate-700">
                  <SelectValue placeholder="Choose agent" />
                </SelectTrigger>
                <SelectContent>
                  {agents.map(agent => (
                    <SelectItem key={agent.id} value={agent.id}>{agent.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Prompt</Label>
              <Textarea
                value={node.config.prompt || ''}
                onChange={(e) => onUpdate({ config: { ...node.config, prompt: e.target.value } })}
                placeholder="What should the agent do?"
                className="bg-slate-950 border-slate-700"
              />
            </div>
          </div>
        );

      case 'skill_execution':
        return (
          <div className="space-y-4">
            <div>
              <Label>Select Skill</Label>
              <Select
                value={node.config.skill_id || ''}
                onValueChange={(value) => onUpdate({ config: { ...node.config, skill_id: value } })}
              >
                <SelectTrigger className="bg-slate-950 border-slate-700">
                  <SelectValue placeholder="Choose skill" />
                </SelectTrigger>
                <SelectContent>
                  {skills.map(skill => (
                    <SelectItem key={skill.id} value={skill.id}>{skill.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Parameters (JSON)</Label>
              <Textarea
                value={node.config.parameters || '{}'}
                onChange={(e) => onUpdate({ config: { ...node.config, parameters: e.target.value } })}
                placeholder='{"key": "value"}'
                className="bg-slate-950 border-slate-700 font-mono text-sm"
              />
            </div>
          </div>
        );

      case 'memory_read':
      case 'memory_write':
        return (
          <div className="space-y-4">
            <div>
              <Label>Memory Key</Label>
              <Input
                value={node.config.memory_key || ''}
                onChange={(e) => onUpdate({ config: { ...node.config, memory_key: e.target.value } })}
                placeholder="e.g., user_preferences"
                className="bg-slate-950 border-slate-700"
              />
            </div>
            {node.type === 'memory_write' && (
              <div>
                <Label>Value</Label>
                <Textarea
                  value={node.config.value || ''}
                  onChange={(e) => onUpdate({ config: { ...node.config, value: e.target.value } })}
                  placeholder="Data to store"
                  className="bg-slate-950 border-slate-700"
                />
              </div>
            )}
          </div>
        );

      case 'condition':
        return (
          <div className="space-y-4">
            <div>
              <Label>Condition Expression</Label>
              <Input
                value={node.config.expression || ''}
                onChange={(e) => onUpdate({ config: { ...node.config, expression: e.target.value } })}
                placeholder="e.g., result.status === 'success'"
                className="bg-slate-950 border-slate-700 font-mono"
              />
            </div>
          </div>
        );

      case 'loop':
        return (
          <div className="space-y-4">
            <div>
              <Label>Loop Type</Label>
              <Select
                value={node.config.loop_type || 'count'}
                onValueChange={(value) => onUpdate({ config: { ...node.config, loop_type: value } })}
              >
                <SelectTrigger className="bg-slate-950 border-slate-700">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="count">Fixed Count</SelectItem>
                  <SelectItem value="condition">While Condition</SelectItem>
                  <SelectItem value="foreach">For Each Item</SelectItem>
                </SelectContent>
              </Select>
            </div>
            {node.config.loop_type === 'count' && (
              <div>
                <Label>Iterations</Label>
                <Input
                  type="number"
                  value={node.config.iterations || 1}
                  onChange={(e) => onUpdate({ config: { ...node.config, iterations: parseInt(e.target.value) } })}
                  className="bg-slate-950 border-slate-700"
                />
              </div>
            )}
          </div>
        );

      case 'human_input':
        return (
          <div className="space-y-4">
            <div>
              <Label>Message</Label>
              <Textarea
                value={node.config.message || ''}
                onChange={(e) => onUpdate({ config: { ...node.config, message: e.target.value } })}
                placeholder="Message to show to human reviewer"
                className="bg-slate-950 border-slate-700"
              />
            </div>
          </div>
        );

      default:
        return <p className="text-slate-400 text-sm">No configuration needed</p>;
    }
  };

  return (
    <div className="w-80 bg-slate-900 border-l border-slate-800 overflow-y-auto">
      <div className="p-4 border-b border-slate-800 flex items-center justify-between">
        <h3 className="font-semibold text-white">Configure Node</h3>
        <Button size="icon" variant="ghost" onClick={onClose} className="text-slate-400">
          <X className="w-4 h-4" />
        </Button>
      </div>
      <div className="p-4 space-y-4">
        <div>
          <Label>Node Label</Label>
          <Input
            value={node.label}
            onChange={(e) => onUpdate({ label: e.target.value })}
            className="bg-slate-950 border-slate-700 text-white"
          />
        </div>
        <div>
          <Label>Description</Label>
          <Textarea
            value={node.config.description || ''}
            onChange={(e) => onUpdate({ config: { ...node.config, description: e.target.value } })}
            placeholder="Optional description"
            className="bg-slate-950 border-slate-700"
          />
        </div>
        {renderConfig()}
      </div>
    </div>
  );
}