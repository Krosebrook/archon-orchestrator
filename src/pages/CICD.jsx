import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Play, Plus, GitBranch, Server, TestTube } from 'lucide-react';
import { handleError } from '../components/utils/api-client';
import PipelineList from '../components/cicd/PipelineList';
import PipelineForm from '../components/cicd/PipelineForm';
import EnvironmentManager from '../components/cicd/EnvironmentManager';
import TestResults from '../components/cicd/TestResults';
import DeploymentHistory from '../components/cicd/DeploymentHistory';

export default function CICD() {
  const [pipelines, setPipelines] = useState([]);
  const [environments, setEnvironments] = useState([]);
  const [testRuns, setTestRuns] = useState([]);
  const [agents, setAgents] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showPipelineForm, setShowPipelineForm] = useState(false);
  const [editingPipeline, setEditingPipeline] = useState(null);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setIsLoading(true);
    try {
      const [pipelineData, envData, testData, agentData] = await Promise.all([
        base44.entities.CIPipeline.list('-created_date'),
        base44.entities.DeploymentEnvironment.list(),
        base44.entities.TestRun.list('-started_at', 100),
        base44.entities.Agent.list()
      ]);
      setPipelines(pipelineData);
      setEnvironments(envData);
      setTestRuns(testData);
      setAgents(agentData);
    } catch (error) {
      handleError(error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleCreatePipeline = () => {
    setEditingPipeline(null);
    setShowPipelineForm(true);
  };

  const handleEditPipeline = (pipeline) => {
    setEditingPipeline(pipeline);
    setShowPipelineForm(true);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-white mb-2">CI/CD Pipelines</h1>
          <p className="text-slate-400">Automated testing and deployment for your agents</p>
        </div>
        <Button onClick={handleCreatePipeline} className="bg-blue-600 hover:bg-blue-700">
          <Plus className="w-4 h-4 mr-2" />
          New Pipeline
        </Button>
      </div>

      <Tabs defaultValue="pipelines" className="w-full">
        <TabsList className="grid w-full grid-cols-4 bg-slate-800">
          <TabsTrigger value="pipelines" className="flex items-center gap-2">
            <GitBranch className="w-4 h-4" />
            Pipelines
          </TabsTrigger>
          <TabsTrigger value="environments" className="flex items-center gap-2">
            <Server className="w-4 h-4" />
            Environments
          </TabsTrigger>
          <TabsTrigger value="tests" className="flex items-center gap-2">
            <TestTube className="w-4 h-4" />
            Test Results
          </TabsTrigger>
          <TabsTrigger value="deployments" className="flex items-center gap-2">
            <Play className="w-4 h-4" />
            Deployments
          </TabsTrigger>
        </TabsList>

        <TabsContent value="pipelines" className="mt-6">
          <PipelineList
            pipelines={pipelines}
            agents={agents}
            isLoading={isLoading}
            onEdit={handleEditPipeline}
            onRefresh={loadData}
          />
        </TabsContent>

        <TabsContent value="environments" className="mt-6">
          <EnvironmentManager
            environments={environments}
            agents={agents}
            onRefresh={loadData}
          />
        </TabsContent>

        <TabsContent value="tests" className="mt-6">
          <TestResults
            testRuns={testRuns}
            pipelines={pipelines}
            isLoading={isLoading}
          />
        </TabsContent>

        <TabsContent value="deployments" className="mt-6">
          <DeploymentHistory
            environments={environments}
            pipelines={pipelines}
            agents={agents}
          />
        </TabsContent>
      </Tabs>

      {showPipelineForm && (
        <PipelineForm
          open={showPipelineForm}
          onOpenChange={setShowPipelineForm}
          pipeline={editingPipeline}
          agents={agents}
          onSave={loadData}
        />
      )}
    </div>
  );
}