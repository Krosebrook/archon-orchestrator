import { useState, useEffect } from 'react';
import { Agent, Workflow, Run } from '@/entities/all';
import { Card, CardContent } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Sparkles, GitBranch, Activity, Wand2, Wrench } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import AIAssistant from '../components/workflow-studio/AIAssistant';
import AgentSequencer from '../components/workflow-studio/AgentSequencer';
import WorkflowGenerator from '../components/workflow-studio/WorkflowGenerator';
import WorkflowMonitor from '../components/workflow-studio/WorkflowMonitor';
import { toast } from 'sonner';

export default function WorkflowStudio() {
  const navigate = useNavigate();
  const [agents, setAgents] = useState([]);
  const [workflows, setWorkflows] = useState([]);
  const [activeRuns, setActiveRuns] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadData();
    const interval = setInterval(loadData, 5000);
    return () => clearInterval(interval);
  }, []);

  const loadData = async () => {
    try {
      const [agentData, workflowData, runData] = await Promise.all([
        Agent.list(),
        Workflow.list(),
        Run.filter({ state: 'running' })
      ]);
      setAgents(agentData);
      setWorkflows(workflowData);
      setActiveRuns(runData);
    } catch (error) {
      console.error('Failed to load studio data:', error);
      toast.error('Failed to load data');
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-slate-400">Loading Workflow Studio...</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-white mb-2 flex items-center gap-2">
            <Wand2 className="w-8 h-8 text-purple-400" />
            Workflow Studio
          </h1>
          <p className="text-slate-400">AI-powered workflow orchestration and optimization</p>
        </div>
        <Button 
          onClick={() => navigate(createPageUrl('TemplateCustomizer'))}
          className="bg-purple-600 hover:bg-purple-700"
        >
          <Wrench className="w-4 h-4 mr-2" />
          Template Customizer
        </Button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
        <Card className="bg-slate-900 border-slate-800">
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="p-3 rounded-lg bg-purple-500/20">
                <Sparkles className="w-6 h-6 text-purple-400" />
              </div>
              <div>
                <div className="text-2xl font-bold text-white">{agents.length}</div>
                <div className="text-sm text-slate-400">Available Agents</div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-slate-900 border-slate-800">
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="p-3 rounded-lg bg-blue-500/20">
                <GitBranch className="w-6 h-6 text-blue-400" />
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
                <Activity className="w-6 h-6 text-green-400" />
              </div>
              <div>
                <div className="text-2xl font-bold text-white">{activeRuns.length}</div>
                <div className="text-sm text-slate-400">Active Runs</div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="assistant" className="w-full">
        <TabsList className="grid w-full grid-cols-4 bg-slate-800">
          <TabsTrigger value="assistant">
            <Sparkles className="w-4 h-4 mr-2" />
            AI Assistant
          </TabsTrigger>
          <TabsTrigger value="sequencer">Agent Sequencer</TabsTrigger>
          <TabsTrigger value="generator">Workflow Generator</TabsTrigger>
          <TabsTrigger value="monitor">Active Monitor</TabsTrigger>
        </TabsList>

        <TabsContent value="assistant" className="mt-6">
          <AIAssistant agents={agents} workflows={workflows} onRefresh={loadData} />
        </TabsContent>

        <TabsContent value="sequencer" className="mt-6">
          <AgentSequencer agents={agents} />
        </TabsContent>

        <TabsContent value="generator" className="mt-6">
          <WorkflowGenerator agents={agents} onRefresh={loadData} />
        </TabsContent>

        <TabsContent value="monitor" className="mt-6">
          <WorkflowMonitor runs={activeRuns} workflows={workflows} agents={agents} />
        </TabsContent>
      </Tabs>
    </div>
  );
}