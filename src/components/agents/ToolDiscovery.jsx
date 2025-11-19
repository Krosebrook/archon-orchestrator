import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Wrench, Search, Plus, Check, RefreshCw } from 'lucide-react';
import { base44 } from '@/api/base44Client';
import { toast } from 'sonner';

export default function ToolDiscovery({ agentId, currentTools = [] }) {
  const [allTools, setAllTools] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedTools, setSelectedTools] = useState(new Set(currentTools));
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    discoverTools();
  }, []);

  const discoverTools = async () => {
    setIsLoading(true);
    try {
      const tools = await base44.entities.Tool.list();
      setAllTools(tools);
    } catch (error) {
      console.error('Failed to discover tools:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const toggleTool = (toolId) => {
    const newSelected = new Set(selectedTools);
    if (newSelected.has(toolId)) {
      newSelected.delete(toolId);
    } else {
      newSelected.add(toolId);
    }
    setSelectedTools(newSelected);
  };

  const saveToolConfiguration = async () => {
    try {
      const agent = await base44.entities.Agent.filter({ id: agentId });
      if (agent.length === 0) return;

      await base44.entities.Agent.update(agentId, {
        config: {
          ...agent[0].config,
          enabled_tools: Array.from(selectedTools)
        }
      });

      toast.success('Tool configuration saved');
    } catch (error) {
      console.error('Failed to save tools:', error);
      toast.error('Failed to save configuration');
    }
  };

  const filteredTools = allTools.filter(tool =>
    tool.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    tool.description?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <Card className="bg-slate-900 border-slate-800">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="text-white flex items-center gap-2">
            <Wrench className="w-5 h-5" />
            Tool Discovery & Configuration
          </CardTitle>
          <Button onClick={discoverTools} size="sm" variant="outline" className="border-slate-700">
            <RefreshCw className="w-4 h-4 mr-2" />
            Refresh
          </Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-center gap-2">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <Input
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search tools..."
              className="bg-slate-800 border-slate-700 pl-9"
            />
          </div>
          <Badge variant="outline" className="bg-slate-800 border-slate-700">
            {selectedTools.size} selected
          </Badge>
        </div>

        <div className="space-y-2 max-h-96 overflow-y-auto">
          {filteredTools.map((tool) => {
            const isSelected = selectedTools.has(tool.id);
            return (
              <div
                key={tool.id}
                onClick={() => toggleTool(tool.id)}
                className={`p-3 rounded-lg border cursor-pointer transition-all ${
                  isSelected
                    ? 'bg-blue-900/20 border-blue-500/50'
                    : 'bg-slate-950 border-slate-800 hover:border-slate-700'
                }`}
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-white font-medium">{tool.name}</span>
                      {isSelected && <Check className="w-4 h-4 text-blue-400" />}
                    </div>
                    <p className="text-xs text-slate-400 mb-2">{tool.description}</p>
                    <div className="flex flex-wrap gap-1">
                      {tool.capabilities?.map((cap, idx) => (
                        <Badge key={idx} variant="outline" className="bg-slate-800 border-slate-700 text-xs">
                          {cap}
                        </Badge>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        <Button
          onClick={saveToolConfiguration}
          className="w-full bg-green-600 hover:bg-green-700"
        >
          <Check className="w-4 h-4 mr-2" />
          Save Tool Configuration
        </Button>
      </CardContent>
    </Card>
  );
}