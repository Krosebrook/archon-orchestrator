import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { GraduationCap, Target, Zap, TrendingUp } from 'lucide-react';
import { handleError } from '../components/utils/api-client';
import TrainingModuleManager from '../components/training/TrainingModuleManager';
import SyntheticDataGenerator from '../components/training/SyntheticDataGenerator';
import AdaptiveLearning from '../components/training/AdaptiveLearning';
import TrainingAnalytics from '../components/training/TrainingAnalytics';

export default function AgentTraining() {
  const [agents, setAgents] = useState([]);
  const [modules, setModules] = useState([]);
  const [sessions, setSessions] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setIsLoading(true);
    try {
      const [agentData, moduleData, sessionData] = await Promise.all([
        base44.entities.Agent.list(),
        base44.entities.TrainingModule.list('-last_trained'),
        base44.entities.TrainingSession.list('-started_at', 50)
      ]);
      setAgents(agentData);
      setModules(moduleData);
      setSessions(sessionData);
    } catch (error) {
      handleError(error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-white mb-2">Agent Training</h1>
        <p className="text-slate-400">AI-driven training modules to improve agent performance</p>
      </div>

      <Tabs defaultValue="modules" className="w-full">
        <TabsList className="grid w-full grid-cols-4 bg-slate-800">
          <TabsTrigger value="modules" className="flex items-center gap-2">
            <GraduationCap className="w-4 h-4" />
            Training Modules
          </TabsTrigger>
          <TabsTrigger value="synthetic" className="flex items-center gap-2">
            <Target className="w-4 h-4" />
            Synthetic Data
          </TabsTrigger>
          <TabsTrigger value="adaptive" className="flex items-center gap-2">
            <Zap className="w-4 h-4" />
            Adaptive Learning
          </TabsTrigger>
          <TabsTrigger value="analytics" className="flex items-center gap-2">
            <TrendingUp className="w-4 h-4" />
            Analytics
          </TabsTrigger>
        </TabsList>

        <TabsContent value="modules" className="mt-6">
          <TrainingModuleManager
            agents={agents}
            modules={modules}
            onRefresh={loadData}
          />
        </TabsContent>

        <TabsContent value="synthetic" className="mt-6">
          <SyntheticDataGenerator
            modules={modules}
            onRefresh={loadData}
          />
        </TabsContent>

        <TabsContent value="adaptive" className="mt-6">
          <AdaptiveLearning
            agents={agents}
            sessions={sessions}
            onRefresh={loadData}
          />
        </TabsContent>

        <TabsContent value="analytics" className="mt-6">
          <TrainingAnalytics
            modules={modules}
            sessions={sessions}
            agents={agents}
          />
        </TabsContent>
      </Tabs>
    </div>
  );
}