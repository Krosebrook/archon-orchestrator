import React, { useState, useEffect } from 'react';
import { Agent, Workflow, AgentCollaboration } from '@/entities/all';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Bot, GitFork, Users, Store } from 'lucide-react';
import AgentRegistry from '../components/orchestration/AgentRegistry';
import WorkflowAssignment from '../components/orchestration/WorkflowAssignment';
import AgentHealthMonitor from '../components/orchestration/AgentHealthMonitor';
import CollaborationControl from '../components/orchestration/CollaborationControl';
import CollaborationCanvas from '../components/collaboration/CollaborationCanvas';
import WorkflowDAG from '../components/orchestration/WorkflowDAG';
import AgentProgressMonitor from '../components/orchestration/AgentProgressMonitor';
import ResourceManager from '../components/orchestration/ResourceManager';
import AgentMarketplace from '../components/orchestration/AgentMarketplace';
import { toast } from 'sonner';

export default function OrchestrationHub() {
  const [agents, setAgents] = useState([]);
  const [workflows, setWorkflows] = useState([]);
  const [collaborations, setCollaborations] = useState([]);
  const [selectedCollaboration, setSelectedCollaboration] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadData();
    const interval = setInterval(loadData, 10000);
    return () => clearInterval(interval);
  }, []);

  const loadData = async () => {
    try {
      const [agentData, workflowData, collabData] = await Promise.all([
        Agent.list(),
        Workflow.list(),
        AgentCollaboration.filter({ state: { $in: ['active', 'paused'] } })
      ]);
      setAgents(agentData);
      setWorkflows(workflowData);
      setCollaborations(collabData);
    } catch (error) {
      console.error('Failed to load orchestration data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  if (selectedCollaboration) {
    const tasks = selectedCollaboration.shared_context?.task_delegation?.tasks || [];
    
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-3xl font-bold text-white">Collaboration Detail</h1>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-6">
            <WorkflowDAG tasks={tasks} agents={agents} />
            <CollaborationCanvas 
              collaborationId={selectedCollaboration.id}
              agents={agents}
            />
          </div>
          <div className="space-y-6">
            <AgentProgressMonitor 
              collaboration={selectedCollaboration} 
              agents={agents}
            />
            <ResourceManager 
              collaboration={selectedCollaboration}
              onUpdate={loadData}
            />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-white mb-2">Orchestration Hub</h1>
          <p className="text-slate-400">Manage agents, workflows, and collaborations</p>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
        <Card className="bg-slate-900 border-slate-800">
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="p-3 rounded-lg bg-blue-500/20">
                <Bot className="w-6 h-6 text-blue-400" />
              </div>
              <div>
                <div className="text-2xl font-bold text-white">{agents.length}</div>
                <div className="text-sm text-slate-400">Active Agents</div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-slate-900 border-slate-800">
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="p-3 rounded-lg bg-purple-500/20">
                <GitFork className="w-6 h-6 text-purple-400" />
              </div>
              <div>
                <div className="text-2xl font-bold text-white">{workflows.length}</div>
                <div className="text-sm text-slate-400">Workflows</div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-slate-900 border-slate-800">
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="p-3 rounded-lg bg-green-500/20">
                <Users className="w-6 h-6 text-green-400" />
              </div>
              <div>
                <div className="text-2xl font-bold text-white">{collaborations.length}</div>
                <div className="text-sm text-slate-400">Active Collaborations</div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="registry" className="w-full">
        <TabsList className="grid w-full grid-cols-5 bg-slate-800">
          <TabsTrigger value="registry">Agents</TabsTrigger>
          <TabsTrigger value="workflows">Workflows</TabsTrigger>
          <TabsTrigger value="collaboration">Collaborations</TabsTrigger>
          <TabsTrigger value="health">Health</TabsTrigger>
          <TabsTrigger value="marketplace">
            <Store className="w-4 h-4 mr-2" />
            Marketplace
          </TabsTrigger>
        </TabsList>

        <TabsContent value="registry" className="mt-6">
          <AgentRegistry agents={agents} onRefresh={loadData} />
        </TabsContent>

        <TabsContent value="workflows" className="mt-6">
          <WorkflowAssignment workflows={workflows} />
        </TabsContent>

        <TabsContent value="collaboration" className="mt-6">
          <CollaborationControl 
            agents={agents} 
            workflows={workflows}
            collaborations={collaborations}
            onRefresh={loadData}
            onSelect={setSelectedCollaboration}
          />
        </TabsContent>

        <TabsContent value="health" className="mt-6">
          <AgentHealthMonitor agents={agents} />
        </TabsContent>

        <TabsContent value="marketplace" className="mt-6">
          <AgentMarketplace onAgentSelect={(agent) => toast.info(`Selected ${agent.name}`)} />
        </TabsContent>
      </Tabs>
    </div>
  );
}