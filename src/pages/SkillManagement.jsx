import { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Sparkles, BarChart3, Zap } from 'lucide-react';
import { handleError } from '../components/utils/api-client';
import AISkillDiscovery from '../components/skills/AISkillDiscovery';
import SkillAnalyticsDashboard from '../components/skills/SkillAnalyticsDashboard';
import DynamicSkillLoader from '../components/skills/DynamicSkillLoader';

export default function SkillManagement() {
  const [agents, setAgents] = useState([]);
  const [workflows, setWorkflows] = useState([]);
  const [_skills, _setSkills] = useState([]);
  const [installations, setInstallations] = useState([]);
  const [_isLoading, _setIsLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setIsLoading(true);
    try {
      const [agentData, workflowData, skillData, installData] = await Promise.all([
        base44.entities.Agent.list(),
        base44.entities.Workflow.list(),
        base44.entities.Skill.list(),
        base44.entities.SkillInstallation.list()
      ]);
      setAgents(agentData);
      setWorkflows(workflowData);
      setSkills(skillData);
      setInstallations(installData);
    } catch (error) {
      handleError(error);
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading) {
    return <div className="text-slate-400 text-center py-12">Loading...</div>;
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-white mb-2">AI Skill Management</h1>
        <p className="text-slate-400">Discover, analyze, and optimize agent skills with AI</p>
      </div>

      <Tabs defaultValue="discovery" className="w-full">
        <TabsList className="grid w-full grid-cols-3 bg-slate-800">
          <TabsTrigger value="discovery" className="flex items-center gap-2">
            <Sparkles className="w-4 h-4" />
            Discovery
          </TabsTrigger>
          <TabsTrigger value="analytics" className="flex items-center gap-2">
            <BarChart3 className="w-4 h-4" />
            Analytics
          </TabsTrigger>
          <TabsTrigger value="loader" className="flex items-center gap-2">
            <Zap className="w-4 h-4" />
            Dynamic Loader
          </TabsTrigger>
        </TabsList>

        <TabsContent value="discovery" className="mt-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {workflows.slice(0, 2).map(workflow => (
              <AISkillDiscovery
                key={workflow.id}
                workflow={workflow}
                agent={agents[0]}
                installedSkills={installations}
              />
            ))}
          </div>
        </TabsContent>

        <TabsContent value="analytics" className="mt-6">
          <SkillAnalyticsDashboard />
        </TabsContent>

        <TabsContent value="loader" className="mt-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {agents.slice(0, 4).map(agent => (
              <DynamicSkillLoader
                key={agent.id}
                agent={agent}
                onSkillLoaded={() => loadData()}
              />
            ))}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}