import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Bot, Settings, Power } from 'lucide-react';
import { base44 } from '@/api/base44Client';
import { toast } from 'sonner';

export default function AgentRegistry({ agents, onRefresh }) {
  const toggleAgent = async (agent) => {
    try {
      const newStatus = agent.status === 'active' ? 'inactive' : 'active';
      await base44.entities.Agent.update(agent.id, { status: newStatus });
      toast.success(`Agent ${newStatus}`);
      onRefresh();
    } catch (error) {
      console.error('Failed to toggle agent:', error);
      toast.error('Failed to toggle agent');
    }
  };

  return (
    <Card className="bg-slate-900 border-slate-800">
      <CardHeader>
        <CardTitle className="text-white">Agent Registry</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {agents.map((agent) => (
            <div key={agent.id} className="p-4 bg-slate-950 rounded-lg border border-slate-800">
              <div className="flex items-start justify-between">
                <div className="flex items-start gap-3">
                  <div className="p-2 rounded-lg bg-slate-800">
                    <Bot className="w-5 h-5 text-purple-400" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-white font-medium">{agent.name}</span>
                      <Badge variant="outline" className={
                        agent.status === 'active' 
                          ? 'bg-green-500/20 text-green-400 border-green-500/30'
                          : 'bg-slate-500/20 text-slate-400 border-slate-500/30'
                      }>
                        {agent.status}
                      </Badge>
                      <Badge variant="outline" className="bg-slate-800 border-slate-700 text-xs">
                        v{agent.version}
                      </Badge>
                    </div>
                    <div className="text-xs text-slate-400">
                      {agent.config?.provider} • {agent.config?.model}
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Button
                    size="icon"
                    variant="ghost"
                    onClick={() => toggleAgent(agent)}
                    className="text-slate-400 hover:text-white"
                  >
                    <Power className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}