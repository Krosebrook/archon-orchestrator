import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Slider } from '@/components/ui/slider';
import { Switch } from '@/components/ui/switch';
import { ScrollArea } from '@/components/ui/scroll-area';
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Settings, 
  Trash2, 
  Copy, 
  Download, 
  Bot,
  Zap,
  GitBranch,
  Clock,
  DollarSign,
  Tag
} from 'lucide-react';

function WorkflowSettingsPanel({ workflow, onWorkflowChange }) {
  const strategies = [
    { value: 'sequential', label: 'Sequential', desc: 'Execute nodes one after another' },
    { value: 'parallel', label: 'Parallel', desc: 'Execute independent nodes simultaneously' },
    { value: 'consensus', label: 'Consensus', desc: 'Multiple agents vote on decisions' },
    { value: 'hierarchical', label: 'Hierarchical', desc: 'Parent agents delegate to children' }
  ];

  return (
    <div className="space-y-4">
      <div>
        <Label className="text-slate-300">Description</Label>
        <Textarea
          value={workflow?.description || ''}
          onChange={(e) => onWorkflowChange({ ...workflow, description: e.target.value })}
          placeholder="Describe what this workflow does..."
          className="bg-slate-950 border-slate-700 mt-1"
          rows={3}
        />
      </div>

      <div>
        <Label className="text-slate-300">Collaboration Strategy</Label>
        <Select
          value={workflow?.spec?.collaboration_strategy || 'sequential'}
          onValueChange={(value) => onWorkflowChange({
            ...workflow,
            spec: { ...workflow.spec, collaboration_strategy: value }
          })}
        >
          <SelectTrigger className="bg-slate-950 border-slate-700 mt-1">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {strategies.map(s => (
              <SelectItem key={s.value} value={s.value}>
                <div>
                  <div className="font-medium">{s.label}</div>
                  <div className="text-xs text-slate-500">{s.desc}</div>
                </div>
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div>
        <Label className="text-slate-300">Version</Label>
        <Input
          value={workflow?.version || '1.0.0'}
          onChange={(e) => onWorkflowChange({ ...workflow, version: e.target.value })}
          placeholder="1.0.0"
          className="bg-slate-950 border-slate-700 mt-1"
        />
      </div>

      <div>
        <Label className="text-slate-300">Tags</Label>
        <Input
          value={workflow?.tags?.join(', ') || ''}
          onChange={(e) => onWorkflowChange({ 
            ...workflow, 
            tags: e.target.value.split(',').map(t => t.trim()).filter(Boolean) 
          })}
          placeholder="automation, customer-service"
          className="bg-slate-950 border-slate-700 mt-1"
        />
      </div>

      <div className="flex items-center justify-between p-3 bg-slate-950 rounded-lg">
        <div>
          <div className="text-sm text-white">Enable Logging</div>
          <div className="text-xs text-slate-500">Log all node executions</div>
        </div>
        <Switch defaultChecked />
      </div>
    </div>
  );
}

function NodeConfigPanel({ node, agents, skills, onNodeChange, onNodeDelete }) {
  const renderAgentConfig = () => (
    <div className="space-y-4">
      <div>
        <Label className="text-slate-300">Select Agent</Label>
        <Select
          value={node.config?.agent_id || ''}
          onValueChange={(value) => {
            const agent = agents.find(a => a.id === value);
            onNodeChange({
              config: { 
                ...node.config, 
                agent_id: value,
                agent_name: agent?.name 
              }
            });
          }}
        >
          <SelectTrigger className="bg-slate-950 border-slate-700 mt-1">
            <SelectValue placeholder="Choose an agent" />
          </SelectTrigger>
          <SelectContent>
            {agents.map(agent => (
              <SelectItem key={agent.id} value={agent.id}>
                <div className="flex items-center gap-2">
                  <Bot className="w-4 h-4 text-blue-400" />
                  <span>{agent.name}</span>
                  <Badge variant="outline" className="text-xs ml-auto">
                    {agent.config?.model || 'gpt-4'}
                  </Badge>
                </div>
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div>
        <Label className="text-slate-300">Role / Task</Label>
        <Textarea
          value={node.config?.role || ''}
          onChange={(e) => onNodeChange({ config: { ...node.config, role: e.target.value } })}
          placeholder="Define the agent's role and specific task..."
          className="bg-slate-950 border-slate-700 mt-1"
          rows={3}
        />
      </div>

      <div>
        <Label className="text-slate-300">Instructions</Label>
        <Textarea
          value={node.config?.instructions || ''}
          onChange={(e) => onNodeChange({ config: { ...node.config, instructions: e.target.value } })}
          placeholder="Step-by-step instructions for the agent..."
          className="bg-slate-950 border-slate-700 mt-1"
          rows={4}
        />
      </div>

      <div>
        <Label className="text-slate-300">Temperature: {node.config?.temperature ?? 0.7}</Label>
        <Slider
          value={[node.config?.temperature ?? 0.7]}
          onValueChange={([value]) => onNodeChange({ config: { ...node.config, temperature: value } })}
          min={0}
          max={2}
          step={0.1}
          className="mt-2"
        />
      </div>

      <div>
        <Label className="text-slate-300">Max Tokens</Label>
        <Input
          type="number"
          value={node.config?.max_tokens || 2000}
          onChange={(e) => onNodeChange({ config: { ...node.config, max_tokens: parseInt(e.target.value) } })}
          className="bg-slate-950 border-slate-700 mt-1"
        />
      </div>
    </div>
  );

  const renderSkillConfig = () => (
    <div className="space-y-4">
      <div>
        <Label className="text-slate-300">Select Skill</Label>
        <Select
          value={node.config?.skill_id || ''}
          onValueChange={(value) => {
            const skill = skills.find(s => s.id === value);
            onNodeChange({
              config: { 
                ...node.config, 
                skill_id: value,
                skill_name: skill?.name 
              }
            });
          }}
        >
          <SelectTrigger className="bg-slate-950 border-slate-700 mt-1">
            <SelectValue placeholder="Choose a skill" />
          </SelectTrigger>
          <SelectContent>
            {skills.map(skill => (
              <SelectItem key={skill.id} value={skill.id}>
                <div className="flex items-center gap-2">
                  <Zap className="w-4 h-4 text-purple-400" />
                  <span>{skill.name}</span>
                </div>
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div>
        <Label className="text-slate-300">Parameters (JSON)</Label>
        <Textarea
          value={node.config?.parameters || '{}'}
          onChange={(e) => onNodeChange({ config: { ...node.config, parameters: e.target.value } })}
          placeholder='{"param1": "value1"}'
          className="bg-slate-950 border-slate-700 mt-1 font-mono text-sm"
          rows={4}
        />
      </div>
    </div>
  );

  const renderConditionConfig = () => (
    <div className="space-y-4">
      <div>
        <Label className="text-slate-300">Condition Expression</Label>
        <Textarea
          value={node.config?.expression || ''}
          onChange={(e) => onNodeChange({ config: { ...node.config, expression: e.target.value } })}
          placeholder="result.status === 'success' && result.confidence > 0.8"
          className="bg-slate-950 border-slate-700 mt-1 font-mono text-sm"
          rows={3}
        />
      </div>

      <div>
        <Label className="text-slate-300">True Branch Label</Label>
        <Input
          value={node.config?.true_label || 'Yes'}
          onChange={(e) => onNodeChange({ config: { ...node.config, true_label: e.target.value } })}
          className="bg-slate-950 border-slate-700 mt-1"
        />
      </div>

      <div>
        <Label className="text-slate-300">False Branch Label</Label>
        <Input
          value={node.config?.false_label || 'No'}
          onChange={(e) => onNodeChange({ config: { ...node.config, false_label: e.target.value } })}
          className="bg-slate-950 border-slate-700 mt-1"
        />
      </div>
    </div>
  );

  const renderLoopConfig = () => (
    <div className="space-y-4">
      <div>
        <Label className="text-slate-300">Loop Type</Label>
        <Select
          value={node.config?.loop_type || 'count'}
          onValueChange={(value) => onNodeChange({ config: { ...node.config, loop_type: value } })}
        >
          <SelectTrigger className="bg-slate-950 border-slate-700 mt-1">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="count">Fixed Count</SelectItem>
            <SelectItem value="condition">While Condition</SelectItem>
            <SelectItem value="foreach">For Each Item</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {node.config?.loop_type === 'count' && (
        <div>
          <Label className="text-slate-300">Iterations</Label>
          <Input
            type="number"
            value={node.config?.iterations || 3}
            onChange={(e) => onNodeChange({ config: { ...node.config, iterations: parseInt(e.target.value) } })}
            className="bg-slate-950 border-slate-700 mt-1"
            min={1}
            max={100}
          />
        </div>
      )}

      {node.config?.loop_type === 'condition' && (
        <div>
          <Label className="text-slate-300">Continue While</Label>
          <Input
            value={node.config?.while_condition || ''}
            onChange={(e) => onNodeChange({ config: { ...node.config, while_condition: e.target.value } })}
            placeholder="result.hasMore === true"
            className="bg-slate-950 border-slate-700 mt-1 font-mono"
          />
        </div>
      )}
    </div>
  );

  const renderHumanInputConfig = () => (
    <div className="space-y-4">
      <div>
        <Label className="text-slate-300">Review Message</Label>
        <Textarea
          value={node.config?.message || ''}
          onChange={(e) => onNodeChange({ config: { ...node.config, message: e.target.value } })}
          placeholder="Please review and approve this action..."
          className="bg-slate-950 border-slate-700 mt-1"
          rows={3}
        />
      </div>

      <div>
        <Label className="text-slate-300">Timeout (minutes)</Label>
        <Input
          type="number"
          value={node.config?.timeout_minutes || 60}
          onChange={(e) => onNodeChange({ config: { ...node.config, timeout_minutes: parseInt(e.target.value) } })}
          className="bg-slate-950 border-slate-700 mt-1"
        />
      </div>

      <div className="flex items-center justify-between p-3 bg-slate-950 rounded-lg">
        <div>
          <div className="text-sm text-white">Required Approval</div>
          <div className="text-xs text-slate-500">Block execution until approved</div>
        </div>
        <Switch 
          checked={node.config?.required ?? true}
          onCheckedChange={(checked) => onNodeChange({ config: { ...node.config, required: checked } })}
        />
      </div>
    </div>
  );

  const renderDefaultConfig = () => (
    <div>
      <Label className="text-slate-300">Description</Label>
      <Textarea
        value={node.config?.description || ''}
        onChange={(e) => onNodeChange({ config: { ...node.config, description: e.target.value } })}
        placeholder="Describe what this node does..."
        className="bg-slate-950 border-slate-700 mt-1"
        rows={3}
      />
    </div>
  );

  const configRenderers = {
    agent: renderAgentConfig,
    skill: renderSkillConfig,
    condition: renderConditionConfig,
    loop: renderLoopConfig,
    human_input: renderHumanInputConfig
  };

  return (
    <div className="space-y-4">
      <div>
        <Label className="text-slate-300">Node Label</Label>
        <Input
          value={node.label}
          onChange={(e) => onNodeChange({ label: e.target.value })}
          className="bg-slate-950 border-slate-700 mt-1"
        />
      </div>

      {(configRenderers[node.type] || renderDefaultConfig)()}

      <Button
        variant="destructive"
        onClick={onNodeDelete}
        className="w-full mt-4"
      >
        <Trash2 className="w-4 h-4 mr-2" />
        Delete Node
      </Button>
    </div>
  );
}

export default function WorkflowProperties({
  workflow,
  selectedNode,
  agents,
  skills,
  onWorkflowChange,
  onNodeChange,
  onNodeDelete,
  onDuplicate,
  onExport
}) {
  return (
    <div className="w-80 bg-slate-900 rounded-lg border border-slate-800 flex flex-col overflow-hidden">
      <div className="p-4 border-b border-slate-800 flex items-center justify-between">
        <h3 className="font-semibold text-white flex items-center gap-2">
          <Settings className="w-4 h-4 text-slate-400" />
          Properties
        </h3>
        <div className="flex gap-1">
          <Button variant="ghost" size="icon" onClick={onDuplicate} className="text-slate-400 h-8 w-8">
            <Copy className="w-4 h-4" />
          </Button>
          <Button variant="ghost" size="icon" onClick={onExport} className="text-slate-400 h-8 w-8">
            <Download className="w-4 h-4" />
          </Button>
        </div>
      </div>

      <ScrollArea className="flex-1">
        <div className="p-4">
          <Tabs defaultValue={selectedNode ? 'node' : 'workflow'} key={selectedNode?.id || 'workflow'}>
            <TabsList className="w-full bg-slate-800">
              <TabsTrigger value="workflow" className="flex-1">Workflow</TabsTrigger>
              <TabsTrigger value="node" className="flex-1" disabled={!selectedNode}>
                Node {selectedNode && <Badge className="ml-1 text-xs">{selectedNode.type}</Badge>}
              </TabsTrigger>
            </TabsList>

            <TabsContent value="workflow" className="mt-4">
              <WorkflowSettingsPanel workflow={workflow} onWorkflowChange={onWorkflowChange} />
            </TabsContent>

            <TabsContent value="node" className="mt-4">
              {selectedNode ? (
                <NodeConfigPanel
                  node={selectedNode}
                  agents={agents}
                  skills={skills}
                  onNodeChange={onNodeChange}
                  onNodeDelete={onNodeDelete}
                />
              ) : (
                <div className="text-center text-slate-500 py-8">
                  Select a node to configure
                </div>
              )}
            </TabsContent>
          </Tabs>
        </div>
      </ScrollArea>

      {/* Estimated Cost */}
      <div className="p-4 border-t border-slate-800 bg-slate-950/50">
        <div className="flex items-center justify-between text-sm">
          <div className="flex items-center gap-2 text-slate-400">
            <DollarSign className="w-4 h-4" />
            <span>Est. Cost per Run</span>
          </div>
          <span className="text-white font-medium">
            ${((workflow?.spec?.estimated_cost_cents || 0) / 100).toFixed(2)}
          </span>
        </div>
      </div>
    </div>
  );
}