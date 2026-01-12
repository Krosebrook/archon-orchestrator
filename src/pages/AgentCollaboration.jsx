import { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Plus, Users, MessageSquare, ListTodo, Share2 } from 'lucide-react';
import { handleError } from '../components/utils/api-client';
import CollaborationHub from '../components/collaboration/CollaborationHub';
import InterAgentMessenger from '../components/collaboration/InterAgentMessenger';
import TaskQueue from '../components/collaboration/TaskQueue';
import SharedContextViewer from '../components/collaboration/SharedContextViewer';

export default function AgentCollaboration() {
  const [collaborations, setCollaborations] = useState([]);
  const [teams, setTeams] = useState([]);
  const [agents, setAgents] = useState([]);
  const [workflows, setWorkflows] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setIsLoading(true);
    try {
      const [collabData, teamData, agentData, workflowData] = await Promise.all([
        base44.entities.AgentCollaboration.list('-created_date'),
        base44.entities.AgentTeam.list(),
        base44.entities.Agent.list(),
        base44.entities.Workflow.list()
      ]);
      setCollaborations(collabData);
      setTeams(teamData);
      setAgents(agentData);
      setWorkflows(workflowData);
    } catch (error) {
      handleError(error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-white mb-2">Agent Collaboration</h1>
          <p className="text-slate-400">Enable agents to work together, share context, and delegate tasks</p>
        </div>
        <Button className="bg-blue-600 hover:bg-blue-700">
          <Plus className="w-4 h-4 mr-2" />
          New Collaboration
        </Button>
      </div>

      <Tabs defaultValue="sessions" className="w-full">
        <TabsList className="grid w-full grid-cols-4 bg-slate-800">
          <TabsTrigger value="sessions" className="flex items-center gap-2">
            <Users className="w-4 h-4" />
            Sessions
          </TabsTrigger>
          <TabsTrigger value="messaging" className="flex items-center gap-2">
            <MessageSquare className="w-4 h-4" />
            Messaging
          </TabsTrigger>
          <TabsTrigger value="tasks" className="flex items-center gap-2">
            <ListTodo className="w-4 h-4" />
            Task Queue
          </TabsTrigger>
          <TabsTrigger value="shared" className="flex items-center gap-2">
            <Share2 className="w-4 h-4" />
            Shared Context
          </TabsTrigger>
        </TabsList>

        <TabsContent value="sessions" className="mt-6">
          <CollaborationHub
            collaborations={collaborations}
            teams={teams}
            agents={agents}
            workflows={workflows}
            onRefresh={loadData}
          />
        </TabsContent>

        <TabsContent value="messaging" className="mt-6">
          <InterAgentMessenger
            agents={agents}
            collaborations={collaborations}
          />
        </TabsContent>

        <TabsContent value="tasks" className="mt-6">
          <TaskQueue
            agents={agents}
            workflows={workflows}
            onRefresh={loadData}
          />
        </TabsContent>

        <TabsContent value="shared" className="mt-6">
          <SharedContextViewer
            collaborations={collaborations}
            agents={agents}
          />
        </TabsContent>
      </Tabs>
    </div>
  );
}