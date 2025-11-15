
import { useState, useEffect } from 'react';
import { Run, Agent, Workflow } from '@/entities/all';
import { DollarSign, Bot, GitFork, AlertTriangle } from 'lucide-react';
import StatCard from '../components/dashboard/StatCard';
import CostChart from '../components/dashboard/CostChart';
import AgentHealth from '../components/dashboard/AgentHealth';
import ActiveRuns from '../components/dashboard/ActiveRuns';
import QuickActions from '../components/dashboard/QuickActions';
import { subDays, format } from 'date-fns';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';

export default function Dashboard() {
  const [runs, setRuns] = useState([]);
  const [agents, setAgents] = useState([]);
  const [workflows, setWorkflows] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      setIsLoading(true);
      try {
        const [runData, agentData, workflowData] = await Promise.all([
          Run.list('-started_at', 20),
          Agent.list(),
          Workflow.list()
        ]);
        setRuns(runData);
        setAgents(agentData);
        setWorkflows(workflowData);
      } catch (error) {
        console.error("Failed to fetch dashboard data:", error);
      } finally {
        setIsLoading(false);
      }
    };
    fetchData();
  }, []);

  const totalCost = runs.reduce((sum, run) => sum + (run.cost_cents || 0), 0);
  const failingAgentsCount = agents.filter(a => a.status === 'error').length;
  const activeAgentsCount = agents.filter(a => a.status === 'active').length;


  const costChartData = Array.from({ length: 30 }).map((_, i) => {
      const date = subDays(new Date(), 29 - i);
      const dailyRuns = runs.filter(run => format(new Date(run.started_at), 'yyyy-MM-dd') === format(date, 'yyyy-MM-dd'));
      const dailyCost = dailyRuns.reduce((sum, run) => sum + (run.cost_cents || 0), 0);
      return {
          name: format(date, 'MMM d'),
          cost: dailyCost
      }
  }).slice(-7);

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-white mb-2">Dashboard</h1>
          <p className="text-slate-400">Overview of your Archon instance.</p>
        </div>
        <div className="text-left sm:text-right">
          <p className="text-sm text-slate-500">Last updated</p>
          <p className="text-white font-medium">{format(new Date(), 'h:mm a')}</p>
        </div>
      </div>
      
      <div className="grid gap-6 grid-cols-1 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard 
          title="Total Spend (30d)" 
          value={`$${(totalCost / 100).toFixed(2)}`}
          icon={DollarSign}
          change="+2.1%"
          isLoading={isLoading}
        />
        <Link to={createPageUrl('Agents')}>
          <StatCard 
            title="Active Agents" 
            value={activeAgentsCount}
            icon={Bot}
            isLoading={isLoading}
          />
        </Link>
        <Link to={createPageUrl('Workflows')}>
          <StatCard 
            title="Total Workflows" 
            value={workflows.length}
            icon={GitFork}
            isLoading={isLoading}
          />
        </Link>
        <Link to={createPageUrl('Agents?status=error')}>
          <StatCard 
            title="Failing Agents" 
            value={failingAgentsCount}
            icon={AlertTriangle}
            isLoading={isLoading}
          />
        </Link>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <CostChart data={costChartData} isLoading={isLoading} />
        </div>
        <AgentHealth agents={agents} isLoading={isLoading} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <ActiveRuns runs={runs.slice(0,5)} workflows={workflows} agents={agents} isLoading={isLoading} />
        </div>
        <QuickActions />
      </div>
    </div>
  );
}
