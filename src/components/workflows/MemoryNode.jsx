import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Brain, Save, Search } from 'lucide-react';

export default function MemoryNode({ node, agents, onUpdate, open, onOpenChange }) {
  const isReadNode = node.type === 'memory_read';
  
  const [config, setConfig] = useState(node.data.config || {
    agent_id: '',
    memory_type: 'long_term',
    operation: isReadNode ? 'retrieve' : 'store',
    query: '',
    content: '',
    importance: 50,
    tags: [],
    context: ''
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
    const agent = agents.find(a => a.id === config.agent_id);
    const operation = isReadNode ? 'Read' : 'Write';
    return `Memory ${operation}: ${agent?.name || 'Select Agent'}`;
  };

  const Icon = isReadNode ? Search : Save;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="bg-slate-900 border-slate-800 text-white max-w-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Icon className="w-5 h-5 text-indigo-400" />
            Configure Memory {isReadNode ? 'Retrieval' : 'Storage'}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div>
            <Label className="text-slate-300">Agent</Label>
            <Select value={config.agent_id} onValueChange={(val) => setConfig({ ...config, agent_id: val })}>
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

          <div>
            <Label className="text-slate-300">Memory Type</Label>
            <Select value={config.memory_type} onValueChange={(val) => setConfig({ ...config, memory_type: val })}>
              <SelectTrigger className="bg-slate-950 border-slate-700">
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="bg-slate-900 border-slate-800">
                <SelectItem value="short_term">
                  <div>
                    <div>Short-term</div>
                    <div className="text-xs text-slate-400">Current session context</div>
                  </div>
                </SelectItem>
                <SelectItem value="long_term">
                  <div>
                    <div>Long-term</div>
                    <div className="text-xs text-slate-400">Persistent knowledge</div>
                  </div>
                </SelectItem>
                <SelectItem value="episodic">
                  <div>
                    <div>Episodic</div>
                    <div className="text-xs text-slate-400">Past events & interactions</div>
                  </div>
                </SelectItem>
                <SelectItem value="semantic">
                  <div>
                    <div>Semantic</div>
                    <div className="text-xs text-slate-400">Facts & concepts</div>
                  </div>
                </SelectItem>
              </SelectContent>
            </Select>
          </div>

          {isReadNode ? (
            <div>
              <Label className="text-slate-300">Search Query</Label>
              <Textarea
                value={config.query}
                onChange={(e) => setConfig({ ...config, query: e.target.value })}
                placeholder="What should I search for in memory? e.g., 'user preferences' or '{{previous_output}}'"
                className="bg-slate-950 border-slate-700"
                rows={3}
              />
              <p className="text-xs text-slate-500 mt-1">
                Use semantic search to find relevant memories. Supports dynamic variables.
              </p>
            </div>
          ) : (
            <>
              <div>
                <Label className="text-slate-300">Content to Store</Label>
                <Textarea
                  value={config.content}
                  onChange={(e) => setConfig({ ...config, content: e.target.value })}
                  placeholder="What content should be stored? e.g., '{{agent_output}}' or direct text"
                  className="bg-slate-950 border-slate-700"
                  rows={4}
                />
              </div>

              <div>
                <Label className="text-slate-300">Importance (0-100)</Label>
                <Input
                  type="number"
                  min="0"
                  max="100"
                  value={config.importance}
                  onChange={(e) => setConfig({ ...config, importance: parseInt(e.target.value) || 50 })}
                  className="bg-slate-950 border-slate-700"
                />
                <p className="text-xs text-slate-500 mt-1">
                  Higher importance memories are retained longer
                </p>
              </div>
            </>
          )}

          <div>
            <Label className="text-slate-300">Context</Label>
            <Input
              value={config.context}
              onChange={(e) => setConfig({ ...config, context: e.target.value })}
              placeholder="Optional context label, e.g., 'user_onboarding' or 'support_ticket_123'"
              className="bg-slate-950 border-slate-700"
            />
          </div>

          <div>
            <Label className="text-slate-300">Tags (comma-separated)</Label>
            <Input
              value={Array.isArray(config.tags) ? config.tags.join(', ') : ''}
              onChange={(e) => setConfig({ ...config, tags: e.target.value.split(',').map(t => t.trim()).filter(Boolean) })}
              placeholder="e.g., preferences, user_data, analytics"
              className="bg-slate-950 border-slate-700"
            />
          </div>

          <div className="pt-2 border-t border-slate-800">
            <div className="flex items-center gap-2 mb-2">
              <Badge variant="outline" className="bg-indigo-500/20 text-indigo-400 border-indigo-500/30">
                {isReadNode ? 'Memory Retrieval' : 'Memory Storage'}
              </Badge>
              <Badge variant="outline" className="bg-slate-800 text-slate-400 border-slate-700 capitalize">
                {config.memory_type}
              </Badge>
            </div>
            <p className="text-xs text-slate-400">
              {isReadNode 
                ? 'Retrieve relevant memories using semantic search with vector embeddings'
                : 'Store information for future agent access with automatic embedding generation'
              }
            </p>
          </div>
        </div>

        <div className="flex justify-end gap-2">
          <Button variant="outline" onClick={() => onOpenChange(false)} className="border-slate-700">
            Cancel
          </Button>
          <Button onClick={handleSave} className="bg-indigo-600 hover:bg-indigo-700">
            <Brain className="w-4 h-4 mr-2" />
            Save Configuration
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}