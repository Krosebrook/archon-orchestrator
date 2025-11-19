import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Bot, Settings, UserCircle, Activity, ArrowLeft } from 'lucide-react';
import { base44 } from '@/api/base44Client';
import { useNavigate } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import PersonaCustomizer from '../components/agents/PersonaCustomizer';
import MemoryManager from '../components/agents/MemoryManager';
import ToolDiscovery from '../components/agents/ToolDiscovery';
import TeamBuilder from '../components/agents/TeamBuilder';

export default function AgentDetail() {
  const [searchParams] = useSearchParams();
  const agentId = searchParams.get('id');
  const [agent, setAgent] = useState(null);
  const [metrics, setMetrics] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    if (agentId) {
      loadAgent();
      loadMetrics();
    }
  }, [agentId]);

  const loadAgent = async () => {
    try {
      const data = await base44.entities.Agent.filter({ id: agentId });
      if (data.length > 0) {
        setAgent(data[0]);
      }
    } catch (error) {
      console.error('Failed to load agent:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const loadMetrics = async () => {
    try {
      const data = await base44.entities.AgentMetric.filter({ agent_id: agentId }, '-timestamp', 50);
      setMetrics(data);
    } catch (error) {
      console.error('Failed to load metrics:', error);
    }
  };

  if (isLoading || !agent) {
    return (
      <div className="text-center py-12 text-slate-400">
        Loading agent...
      </div>
    );
  }

  const avgCost = metrics.reduce((sum, m) => sum + (m.cost_cents || 0), 0) / Math.max(metrics.length, 1);
  const avgLatency = metrics.reduce((sum, m) => sum + (m.latency_ms || 0), 0) / Math.max(metrics.length, 1);
  const successRate = metrics.filter(m => m.status === 'success').length / Math.max(metrics.length, 1);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => navigate(createPageUrl('Agents'))}
            className="text-slate-400 hover:text-white"
          >
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <div>
            <h1 className="text-3xl font-bold text-white mb-1">{agent.name}</h1>
            <div className="flex items-center gap-2">
              <Badge variant="outline" className="bg-slate-800 border-slate-700">
                {agent.config?.provider} / {agent.config?.model}
              </Badge>
              <Badge variant="outline" className={
                agent.status === 'active' 
                  ? 'bg-green-500/20 text-green-400 border-green-500/30'
                  : 'bg-slate-500/20 text-slate-400 border-slate-500/30'
              }>
                {agent.status}
              </Badge>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-6">
        <Card className="bg-slate-900 border-slate-800">
          <CardContent className="pt-6">
            <div className="text-sm text-slate-400 mb-1">Avg Cost</div>
            <div className="text-2xl font-bold text-white">${(avgCost / 100).toFixed(2)}</div>
          </CardContent>
        </Card>
        <Card className="bg-slate-900 border-slate-800">
          <CardContent className="pt-6">
            <div className="text-sm text-slate-400 mb-1">Avg Latency</div>
            <div className="text-2xl font-bold text-white">{Math.round(avgLatency)}ms</div>
          </CardContent>
        </Card>
        <Card className="bg-slate-900 border-slate-800">
          <CardContent className="pt-6">
            <div className="text-sm text-slate-400 mb-1">Success Rate</div>
            <div className="text-2xl font-bold text-white">{(successRate * 100).toFixed(1)}%</div>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="persona" className="w-full">
        <TabsList className="grid w-full grid-cols-6 bg-slate-800">
          <TabsTrigger value="persona">
            <UserCircle className="w-4 h-4 mr-2" />
            Persona
          </TabsTrigger>
          <TabsTrigger value="memory">
            <Bot className="w-4 h-4 mr-2" />
            Memory
          </TabsTrigger>
          <TabsTrigger value="tools">
            <Settings className="w-4 h-4 mr-2" />
            Tools
          </TabsTrigger>
          <TabsTrigger value="teams">
            <Bot className="w-4 h-4 mr-2" />
            Teams
          </TabsTrigger>
          <TabsTrigger value="config">
            <Settings className="w-4 h-4 mr-2" />
            Config
          </TabsTrigger>
          <TabsTrigger value="metrics">
            <Activity className="w-4 h-4 mr-2" />
            Metrics
          </TabsTrigger>
        </TabsList>

        <TabsContent value="persona" className="mt-6">
          <PersonaCustomizer agent={agent} onUpdate={loadAgent} />
        </TabsContent>

        <TabsContent value="memory" className="mt-6">
          <MemoryManager agentId={agent.id} />
        </TabsContent>

        <TabsContent value="tools" className="mt-6">
          <ToolDiscovery agentId={agent.id} currentTools={agent.config?.enabled_tools || []} />
        </TabsContent>

        <TabsContent value="teams" className="mt-6">
          <TeamBuilder agentId={agent.id} />
        </TabsContent>

        <TabsContent value="config" className="mt-6">
          <Card className="bg-slate-900 border-slate-800">
            <CardHeader>
              <CardTitle className="text-white">Configuration</CardTitle>
            </CardHeader>
            <CardContent>
              <pre className="bg-slate-950 p-4 rounded-lg text-xs text-slate-300 overflow-auto">
                {JSON.stringify(agent.config, null, 2)}
              </pre>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="metrics" className="mt-6">
          <Card className="bg-slate-900 border-slate-800">
            <CardHeader>
              <CardTitle className="text-white">Recent Metrics</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {metrics.slice(0, 10).map((metric, idx) => (
                  <div key={idx} className="p-3 bg-slate-950 rounded-lg border border-slate-800">
                    <div className="flex justify-between text-sm">
                      <span className="text-slate-400">{metric.provider}/{metric.model}</span>
                      <Badge variant="outline" className={
                        metric.status === 'success'
                          ? 'bg-green-500/20 text-green-400 border-green-500/30'
                          : 'bg-red-500/20 text-red-400 border-red-500/30'
                      }>
                        {metric.status}
                      </Badge>
                    </div>
                    <div className="flex gap-4 mt-2 text-xs text-slate-500">
                      <span>Cost: ${((metric.cost_cents || 0) / 100).toFixed(4)}</span>
                      <span>Latency: {metric.latency_ms}ms</span>
                      <span>Tokens: {(metric.prompt_tokens || 0) + (metric.completion_tokens || 0)}</span>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}