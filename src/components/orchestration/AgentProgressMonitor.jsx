import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Brain, Activity, DollarSign, Clock, Zap } from 'lucide-react';
import { base44 } from '@/api/base44Client';

export default function AgentProgressMonitor({ collaboration, agents = [] }) {
  const [metrics, setMetrics] = useState([]);

  useEffect(() => {
    if (collaboration?.participant_agents) {
      loadMetrics();
      const interval = setInterval(loadMetrics, 5000);
      return () => clearInterval(interval);
    }
  }, [collaboration?.id]);

  const loadMetrics = async () => {
    try {
      const agentIds = collaboration.participant_agents;
      const recentMetrics = await base44.entities.AgentMetric.filter(
        { agent_id: { $in: agentIds } },
        '-timestamp',
        100
      );
      setMetrics(recentMetrics);
    } catch (error) {
      console.error('Failed to load metrics:', error);
    }
  };

  const getAgentMetrics = (agentId) => {
    const agentMetrics = metrics.filter(m => m.agent_id === agentId);
    const totalCost = agentMetrics.reduce((sum, m) => sum + (m.cost_cents || 0), 0);
    const avgLatency = agentMetrics.length > 0 
      ? agentMetrics.reduce((sum, m) => sum + (m.latency_ms || 0), 0) / agentMetrics.length 
      : 0;
    const successRate = agentMetrics.length > 0
      ? (agentMetrics.filter(m => m.status === 'success').length / agentMetrics.length) * 100
      : 0;
    const totalTokens = agentMetrics.reduce((sum, m) => 
      sum + (m.prompt_tokens || 0) + (m.completion_tokens || 0), 0
    );

    return { totalCost, avgLatency, successRate, totalTokens, callCount: agentMetrics.length };
  };

  const tasks = collaboration?.shared_context?.task_delegation?.tasks || [];
  
  return (
    <Card className="bg-slate-900 border-slate-800">
      <CardHeader>
        <CardTitle className="text-white flex items-center gap-2">
          <Activity className="w-5 h-5" />
          Agent Progress Monitor
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {collaboration?.participant_agents?.map((agentId) => {
            const agent = agents.find(a => a.id === agentId);
            const agentTasks = tasks.filter(t => t.assigned_agent_id === agentId);
            const completedTasks = agentTasks.filter(t => t.status === 'completed').length;
            const progress = agentTasks.length > 0 ? Math.round((completedTasks / agentTasks.length) * 100) : 0;
            const metrics = getAgentMetrics(agentId);

            return (
              <div key={agentId} className="p-4 bg-slate-950 rounded-lg border border-slate-800">
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded-lg bg-slate-800">
                      <Brain className="w-4 h-4 text-purple-400" />
                    </div>
                    <div>
                      <div className="text-sm font-medium text-white">{agent?.name || agentId}</div>
                      <div className="text-xs text-slate-400">{agent?.config?.model}</div>
                    </div>
                  </div>
                  <Badge variant="outline" className="bg-blue-500/20 text-blue-400 border-blue-500/30">
                    {agentTasks.length} tasks
                  </Badge>
                </div>

                <div className="mb-3">
                  <div className="flex items-center justify-between text-xs mb-1">
                    <span className="text-slate-400">Task Progress</span>
                    <span className="text-slate-300">{completedTasks}/{agentTasks.length}</span>
                  </div>
                  <Progress value={progress} className="h-2" />
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <div className="p-2 bg-slate-900 rounded border border-slate-800">
                    <div className="flex items-center gap-1 text-xs text-slate-400 mb-1">
                      <DollarSign className="w-3 h-3" />
                      Cost
                    </div>
                    <div className="text-sm font-medium text-white">
                      ${(metrics.totalCost / 100).toFixed(3)}
                    </div>
                  </div>
                  <div className="p-2 bg-slate-900 rounded border border-slate-800">
                    <div className="flex items-center gap-1 text-xs text-slate-400 mb-1">
                      <Clock className="w-3 h-3" />
                      Avg Latency
                    </div>
                    <div className="text-sm font-medium text-white">
                      {Math.round(metrics.avgLatency)}ms
                    </div>
                  </div>
                  <div className="p-2 bg-slate-900 rounded border border-slate-800">
                    <div className="flex items-center gap-1 text-xs text-slate-400 mb-1">
                      <Zap className="w-3 h-3" />
                      Success Rate
                    </div>
                    <div className="text-sm font-medium text-white">
                      {metrics.successRate.toFixed(0)}%
                    </div>
                  </div>
                  <div className="p-2 bg-slate-900 rounded border border-slate-800">
                    <div className="flex items-center gap-1 text-xs text-slate-400 mb-1">
                      <Activity className="w-3 h-3" />
                      API Calls
                    </div>
                    <div className="text-sm font-medium text-white">
                      {metrics.callCount}
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}