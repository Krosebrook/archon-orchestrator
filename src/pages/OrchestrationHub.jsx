
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { base44 } from '@/api/base44Client';
import { Brain, Network, Activity, Users, Zap } from 'lucide-react';
import AgentRegistry from '../components/orchestration/AgentRegistry';
import CollaborationControl from '../components/orchestration/CollaborationControl';
import WorkflowAssignment from '../components/orchestration/WorkflowAssignment';
import AgentHealthMonitor from '../components/orchestration/AgentHealthMonitor';
import CollaborationCanvas from '../components/collaboration/CollaborationCanvas';

export default function OrchestrationHub() {
  const [agents, setAgents] = useState([]);
  const [workflows, setWorkflows] = useState([]);
  const [collaborations, setCollaborations] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedCollaboration, setSelectedCollaboration] = useState(null);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setIsLoading(true);
    try {
      const [agentData, workflowData, collabData] = await Promise.all([
        base44.entities.Agent.list(),
        base44.entities.Workflow.list(),
        base44.entities.AgentCollaboration.list()
      ]);
      setAgents(agentData);
      setWorkflows(workflowData);
      setCollaborations(collabData);
    } catch (error) {
      console.error('Failed to load data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const stats = {
    totalAgents: agents.length,
    activeAgents: agents.filter(a => a.status === 'active').length,
    activeCollaborations: collaborations.filter(c => c.state === 'active').length,
    totalWorkflows: workflows.length
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-white mb-2 flex items-center gap-3">
          <Brain className="w-8 h-8 text-purple-400" />
          AI Agent Orchestration Hub
        </h1>
        <p className="text-slate-400">Manage agents, collaborations, and workflow assignments</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="bg-slate-900 border-slate-800">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm text-slate-400">Total Agents</span>
              <Brain className="w-4 h-4 text-slate-500" />
            </div>
            <div className="text-3xl font-bold text-white">{stats.totalAgents}</div>
          </CardContent>
        </Card>

        <Card className="bg-slate-900 border-slate-800">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm text-slate-400">Active Agents</span>
              <Activity className="w-4 h-4 text-green-500" />
            </div>
            <div className="text-3xl font-bold text-green-400">{stats.activeAgents}</div>
          </CardContent>
        </Card>

        <Card className="bg-slate-900 border-slate-800">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm text-slate-400">Collaborations</span>
              <Users className="w-4 h-4 text-blue-500" />
            </div>
            <div className="text-3xl font-bold text-blue-400">{stats.activeCollaborations}</div>
          </CardContent>
        </Card>

        <Card className="bg-slate-900 border-slate-800">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm text-slate-400">Workflows</span>
              <Network className="w-4 h-4 text-purple-500" />
            </div>
            <div className="text-3xl font-bold text-purple-400">{stats.totalWorkflows}</div>
          </CardContent>
        </Card>
      </div>

      {selectedCollaboration ? (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2">
            <CollaborationCanvas collaborationId={selectedCollaboration.id} />
            <Button onClick={() => setSelectedCollaboration(null)} className="mt-4">
              Back to Collaborations
            </Button>
          </div>
          <div className="space-y-6">
            <Card className="bg-slate-900 border-slate-800">
              <CardHeader>
                <CardTitle className="text-white">Participants</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {selectedCollaboration.participant_agents?.map((agentId, idx) => {
                    const agent = agents.find(a => a.id === agentId);
                    return (
                      <div key={idx} className="p-2 bg-slate-950 rounded border border-slate-800">
                        <div className="text-sm text-white">{agent?.name || agentId}</div>
                        <div className="text-xs text-slate-400">{agent?.config?.model}</div>
                      </div>
                    );
                  })}
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      ) : (
        <Tabs defaultValue="registry" className="w-full">
          <TabsList className="grid w-full grid-cols-4 bg-slate-800">
            <TabsTrigger value="registry">Agent Registry</TabsTrigger>
            <TabsTrigger value="collaboration">Collaboration</TabsTrigger>
            <TabsTrigger value="assignment">Assignment</TabsTrigger>
            <TabsTrigger value="health">Health</TabsTrigger>
          </TabsList>

          <TabsContent value="registry" className="mt-6">
            <AgentRegistry agents={agents} onRefresh={loadData} />
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

          <TabsContent value="assignment" className="mt-6">
            <WorkflowAssignment 
              agents={agents}
              workflows={workflows}
              onRefresh={loadData}
            />
          </TabsContent>

          <TabsContent value="health" className="mt-6">
            <AgentHealthMonitor agents={agents} />
          </TabsContent>
        </Tabs>
      )}
    </div>
  );
}
