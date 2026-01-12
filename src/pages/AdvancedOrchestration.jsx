/**
 * @fileoverview Advanced Orchestration Page
 * @description Unified interface for advanced agent orchestration capabilities
 * @version 1.0.0
 */

import { useState, useEffect } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Clock, GitBranch, Network, Activity } from 'lucide-react';
import { base44 } from '@/api/base44Client';
import { toast } from 'sonner';
import AgentScheduler from '../components/orchestration/AgentScheduler';
import SubTaskManager from '../components/orchestration/SubTaskManager';
import DependencyGraph from '../components/orchestration/DependencyGraph';
import PerformanceMonitor from '../components/orchestration/PerformanceMonitor';

export default function AdvancedOrchestration() {
  const [agents, setAgents] = useState([]);
  const [workflows, setWorkflows] = useState([]);
  const [selectedWorkflow, setSelectedWorkflow] = useState(null);
  const [selectedAgent, setSelectedAgent] = useState(null);
  const [activeRun, setActiveRun] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setIsLoading(true);
    try {
      const [agentsData, workflowsData, runsData] = await Promise.all([
        base44.entities.Agent.list(),
        base44.entities.Workflow.list(),
        base44.entities.Run.list('-created_date', 1),
      ]);

      setAgents(agentsData || []);
      setWorkflows(workflowsData || []);
      
      if (workflowsData && workflowsData.length > 0) {
        setSelectedWorkflow(workflowsData[0].id);
      }
      
      if (agentsData && agentsData.length > 0) {
        setSelectedAgent(agentsData[0].id);
      }

      if (runsData && runsData.length > 0) {
        setActiveRun(runsData[0].id);
      }
    } catch (error) {
      console.error('Failed to load data:', error);
      toast.error('Failed to load orchestration data');
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-slate-400">Loading orchestration...</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-white mb-2">Advanced Orchestration</h1>
        <p className="text-slate-400">
          Manage agent scheduling, dependencies, sub-tasks, and performance monitoring
        </p>
      </div>

      <div className="flex gap-4 mb-6">
        <select
          value={selectedWorkflow || ''}
          onChange={(e) => setSelectedWorkflow(e.target.value)}
          className="bg-slate-900 border border-slate-700 rounded-lg px-4 py-2 text-white"
        >
          <option value="">Select Workflow</option>
          {workflows.map(wf => (
            <option key={wf.id} value={wf.id}>{wf.name}</option>
          ))}
        </select>

        <select
          value={selectedAgent || ''}
          onChange={(e) => setSelectedAgent(e.target.value)}
          className="bg-slate-900 border border-slate-700 rounded-lg px-4 py-2 text-white"
        >
          <option value="">Select Agent</option>
          {agents.map(agent => (
            <option key={agent.id} value={agent.id}>{agent.name}</option>
          ))}
        </select>
      </div>

      <Tabs defaultValue="scheduler" className="w-full">
        <TabsList className="grid w-full grid-cols-4 bg-slate-800">
          <TabsTrigger value="scheduler" className="flex items-center gap-2">
            <Clock className="w-4 h-4" />
            Scheduler
          </TabsTrigger>
          <TabsTrigger value="subtasks" className="flex items-center gap-2">
            <GitBranch className="w-4 h-4" />
            Sub-Tasks
          </TabsTrigger>
          <TabsTrigger value="dependencies" className="flex items-center gap-2">
            <Network className="w-4 h-4" />
            Dependencies
          </TabsTrigger>
          <TabsTrigger value="performance" className="flex items-center gap-2">
            <Activity className="w-4 h-4" />
            Performance
          </TabsTrigger>
        </TabsList>

        <TabsContent value="scheduler" className="mt-6">
          <AgentScheduler 
            agents={agents}
            onScheduleUpdate={loadData}
          />
        </TabsContent>

        <TabsContent value="subtasks" className="mt-6">
          {activeRun ? (
            <SubTaskManager
              parentRunId={activeRun}
              agentId={selectedAgent}
              onSubTaskCreated={loadData}
            />
          ) : (
            <div className="text-center py-12 text-slate-500">
              No active run. Start a workflow to manage sub-tasks.
            </div>
          )}
        </TabsContent>

        <TabsContent value="dependencies" className="mt-6">
          {selectedWorkflow ? (
            <DependencyGraph
              workflowId={selectedWorkflow}
              agents={agents.filter(a => 
                workflows.find(w => w.id === selectedWorkflow)?.spec?.nodes?.some(n => n.data?.agent_id === a.id)
              )}
              onExecutionModeChange={loadData}
            />
          ) : (
            <div className="text-center py-12 text-slate-500">
              Select a workflow to manage dependencies
            </div>
          )}
        </TabsContent>

        <TabsContent value="performance" className="mt-6">
          {selectedAgent ? (
            <PerformanceMonitor
              agentId={selectedAgent}
              onAlertCreated={loadData}
            />
          ) : (
            <div className="text-center py-12 text-slate-500">
              Select an agent to monitor performance
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}