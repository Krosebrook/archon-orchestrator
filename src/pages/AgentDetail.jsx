import { useState, useEffect, useCallback } from 'react';
import { Agent, Run, Workflow } from '@/entities/all';
import { useLocation, Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { ArrowLeft, Bot } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import RunsTable from '../components/runs/RunsTable';

export default function AgentDetail() {
  const [agent, setAgent] = useState(null);
  const [runs, setRuns] = useState([]);
  const [workflows, setWorkflows] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  const location = useLocation();
  const searchParams = new URLSearchParams(location.search);
  const agentId = searchParams.get('id');

  const loadAgentDetails = useCallback(async () => {
    if (!agentId) return;
    setIsLoading(true);
    try {
      const agentData = await Agent.get(agentId);
      setAgent(agentData);
      const [runData, workflowData] = await Promise.all([
        Run.filter({ agent_id: agentId }, '-created_date', 50),
        Workflow.list(),
      ]);
      setRuns(runData);
      setWorkflows(workflowData);
    } catch (e) {
      console.error("Failed to load agent details", e);
    } finally {
      setIsLoading(false);
    }
  }, [agentId]);

  useEffect(() => {
    loadAgentDetails();
  }, [loadAgentDetails]);

  if (isLoading || !agent) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-10 w-48" />
        <Skeleton className="h-24 w-full" />
        <Skeleton className="h-64 w-full" />
      </div>
    );
  }

  const agentRuns = runs.filter(r => r.agent_id === agent.id);
  const successRate = agentRuns.length > 0 ? (agentRuns.filter(r => r.state === 'completed').length / agentRuns.length) * 100 : 0;
  const totalCost = agentRuns.reduce((sum, run) => sum + (run.cost_cents || 0), 0) / 100;
  
  return (
    <div>
      <Link to={createPageUrl('Agents')} className="inline-flex items-center gap-2 text-slate-400 hover:text-white mb-4">
        <ArrowLeft className="w-4 h-4" />
        Back to All Agents
      </Link>
      
      <div className="flex items-center gap-4 mb-6">
        <div className="w-16 h-16 bg-slate-800 rounded-lg flex items-center justify-center">
            <Bot className="w-8 h-8 text-blue-400" />
        </div>
        <div>
          <h1 className="text-3xl font-bold text-white">{agent.name}</h1>
          <p className="text-slate-400 font-mono text-sm">v{agent.version}</p>
        </div>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <Card className="bg-slate-900 border-slate-800">
          <CardHeader><CardTitle className="text-white text-base">Configuration</CardTitle></CardHeader>
          <CardContent>
            <p className="text-sm text-slate-300">Provider: <span className="font-semibold text-white">{agent.config.provider}</span></p>
            <p className="text-sm text-slate-300">Model: <span className="font-semibold text-white">{agent.config.model}</span></p>
          </CardContent>
        </Card>
        <Card className="bg-slate-900 border-slate-800">
          <CardHeader><CardTitle className="text-white text-base">Total Runs</CardTitle></CardHeader>
          <CardContent>
            <p className="text-3xl font-bold text-white">{agentRuns.length}</p>
          </CardContent>
        </Card>
        <Card className="bg-slate-900 border-slate-800">
          <CardHeader><CardTitle className="text-white text-base">Success Rate</CardTitle></CardHeader>
          <CardContent>
            <p className="text-3xl font-bold text-white">{successRate.toFixed(1)}%</p>
          </CardContent>
        </Card>
        <Card className="bg-slate-900 border-slate-800">
          <CardHeader><CardTitle className="text-white text-base">Total Cost</CardTitle></CardHeader>
          <CardContent>
            <p className="text-3xl font-bold text-white">${totalCost.toFixed(2)}</p>
          </CardContent>
        </Card>
      </div>
      
      <h2 className="text-2xl font-bold text-white mb-4">Recent Runs</h2>
      <RunsTable runs={agentRuns} workflows={workflows} agents={[agent]} isLoading={isLoading} />
    </div>
  );
}