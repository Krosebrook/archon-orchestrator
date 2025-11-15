import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { X, Save, Trash2 } from 'lucide-react';

export default function WorkflowNodePanel({ selectedNode, agents, tools, onUpdateNode, onDeleteNode, onClose }) {
  const [nodeData, setNodeData] = useState(null);

  useEffect(() => {
    if (selectedNode) {
      setNodeData({ ...selectedNode.data });
    } else {
      setNodeData(null);
    }
  }, [selectedNode]);

  if (!selectedNode || !nodeData) {
    return (
      <div className="flex items-center justify-center h-full text-slate-400">
        Select a node to configure
      </div>
    );
  }

  const handleSave = () => {
    onUpdateNode(selectedNode.id, { data: nodeData });
    onClose();
  };

  const handleDelete = () => {
    onDeleteNode(selectedNode.id);
  };

  return (
    <div className="h-full flex flex-col">
      <div className="flex items-center justify-between p-4 border-b border-slate-800">
        <h3 className="text-lg font-medium text-white">Node Configuration</h3>
        <Button size="sm" variant="ghost" onClick={onClose}>
          <X className="w-4 h-4" />
        </Button>
      </div>

      <div className="flex-1 p-4 space-y-4 overflow-y-auto">
        <div>
          <Label className="text-slate-300">Node Label</Label>
          <Input
            value={nodeData.label}
            onChange={(e) => setNodeData({ ...nodeData, label: e.target.value })}
            className="bg-slate-800 border-slate-700 text-white"
          />
        </div>

        <div>
          <Label className="text-slate-300">Description</Label>
          <Textarea
            value={nodeData.description || ''}
            onChange={(e) => setNodeData({ ...nodeData, description: e.target.value })}
            className="bg-slate-800 border-slate-700 text-white"
            rows={3}
          />
        </div>

        {nodeData.type === 'agent' && (
          <div>
            <Label className="text-slate-300">Select Agent</Label>
            <Select
              value={nodeData.config?.agent_id}
              onValueChange={(value) => setNodeData({
                ...nodeData,
                config: { ...nodeData.config, agent_id: value }
              })}
            >
              <SelectTrigger className="bg-slate-800 border-slate-700">
                <SelectValue placeholder="Choose an agent" />
              </SelectTrigger>
              <SelectContent className="bg-slate-800 border-slate-700">
                {agents?.map((agent) => (
                  <SelectItem key={agent.id} value={agent.id}>
                    {agent.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        )}

        {nodeData.type === 'tool' && (
          <div>
            <Label className="text-slate-300">Select Tool</Label>
            <Select
              value={nodeData.config?.tool_id}
              onValueChange={(value) => setNodeData({
                ...nodeData,
                config: { ...nodeData.config, tool_id: value }
              })}
            >
              <SelectTrigger className="bg-slate-800 border-slate-700">
                <SelectValue placeholder="Choose a tool" />
              </SelectTrigger>
              <SelectContent className="bg-slate-800 border-slate-700">
                {tools?.map((tool) => (
                  <SelectItem key={tool.id} value={tool.id}>
                    {tool.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        )}

        <div>
          <Label className="text-slate-300">Configuration (JSON)</Label>
          <Textarea
            value={JSON.stringify(nodeData.config || {}, null, 2)}
            onChange={(e) => {
              try {
                const parsed = JSON.parse(e.target.value);
                setNodeData({ ...nodeData, config: parsed });
              } catch (err) {
                // Invalid JSON, ignore for now
              }
            }}
            className="bg-slate-800 border-slate-700 text-white font-mono text-sm"
            rows={8}
          />
        </div>
      </div>

      <div className="flex justify-between p-4 border-t border-slate-800">
        <Button variant="destructive" onClick={handleDelete}>
          <Trash2 className="w-4 h-4 mr-2" />
          Delete
        </Button>
        <Button onClick={handleSave} className="bg-blue-600 hover:bg-blue-700">
          <Save className="w-4 h-4 mr-2" />
          Save Changes
        </Button>
      </div>
    </div>
  );
}