import React, { useState, useEffect, useCallback } from 'react';
import { base44 } from '@/api/base44Client';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import {
  GraduationCap,
  Database,
  Settings,
  Play,
  BarChart3,
  GitCompare,
  Award,
  GitBranch,
  Loader2,
  RefreshCw
} from 'lucide-react';
import { handleError } from '../components/utils/api-client';
import { toast } from 'sonner';

// Import hooks
import { useTraining, TRAINING_STATUS } from '@/hooks/useTraining';
import { useTrainingMetrics } from '@/hooks/useTrainingMetrics';

// Import components
import TrainingDatasetManager from '../components/training/TrainingDatasetManager';
import TrainingConfigPanel from '../components/training/TrainingConfigPanel';
import TrainingJobMonitor from '../components/training/TrainingJobMonitor';
import TrainingResultsDashboard from '../components/training/TrainingResultsDashboard';
import ABTestingFramework from '../components/training/ABTestingFramework';
import TrainingPipelineBuilder from '../components/training/TrainingPipelineBuilder';
import TrainingAnalytics from '../components/training/TrainingAnalytics';

/**
 * Advanced Training Page
 *
 * Comprehensive AI agent training system with:
 * - Dataset management
 * - Training configuration
 * - Real-time monitoring
 * - A/B testing
 * - Results analysis
 * - Pipeline building
 */
export default function AdvancedTraining() {
  // Data state
  const [agents, setAgents] = useState([]);
  const [modules, setModules] = useState([]);
  const [sessions, setSessions] = useState([]);
  const [trainingJobs, setTrainingJobs] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  // UI state
  const [activeTab, setActiveTab] = useState('dataset');
  const [selectedAgentId, setSelectedAgentId] = useState('');
  const [trainingData, setTrainingData] = useState([]);
  const [validationSplit, setValidationSplit] = useState(0.2);

  // Training hook
  const training = useTraining({
    agentId: selectedAgentId,
    onComplete: (results) => {
      toast.success('Training completed successfully!');
      loadData();
    },
    onError: (error) => {
      toast.error(`Training failed: ${error.message}`);
    }
  });

  // Metrics hook
  const metrics = useTrainingMetrics({
    agentId: selectedAgentId,
    jobId: training.currentJob?.job_id
  });

  // Load initial data
  useEffect(() => {
    loadData();
  }, []);

  // Update training hook when agent changes
  useEffect(() => {
    training.setAgentId(selectedAgentId);
  }, [selectedAgentId]);

  // Update training data in hook when it changes
  useEffect(() => {
    if (trainingData.length > 0) {
      training.setTrainingData({
        examples: trainingData,
        validationSplit
      });
    }
  }, [trainingData, validationSplit]);

  // Add metrics to history when progress updates
  useEffect(() => {
    if (training.progress?.loss !== null) {
      metrics.addMetric({
        epoch: training.progress.epoch,
        step: training.progress.step,
        loss: training.progress.loss,
        accuracy: training.progress.accuracy,
        validation_loss: training.progress.validationLoss,
        validation_accuracy: training.progress.validationAccuracy
      });
    }
  }, [training.progress]);

  const loadData = async () => {
    setIsLoading(true);
    try {
      const [agentData, moduleData, sessionData, jobData] = await Promise.all([
        base44.entities.Agent.list(),
        base44.entities.TrainingModule.list('-last_trained'),
        base44.entities.TrainingSession.list('-started_at', 50),
        base44.entities.TrainingJob?.list('-started_at', 20).catch(() => [])
      ]);
      setAgents(agentData || []);
      setModules(moduleData || []);
      setSessions(sessionData || []);
      setTrainingJobs(jobData || []);
    } catch (error) {
      handleError(error);
    } finally {
      setIsLoading(false);
    }
  };

  // Start training
  const handleStartTraining = async () => {
    if (!selectedAgentId) {
      toast.error('Please select an agent');
      return;
    }

    if (trainingData.length === 0) {
      toast.error('Please add training data');
      return;
    }

    const result = await training.startTraining();
    if (result.success) {
      setActiveTab('monitor');
    }
  };

  // Execute pipeline
  const handleExecutePipeline = async (pipeline) => {
    toast.success('Pipeline execution started');
    // Pipeline execution would integrate with the training hook
    console.log('Executing pipeline:', pipeline);
  };

  // Get selected agent
  const selectedAgent = agents.find(a => a.id === selectedAgentId);

  // Get current/latest training job for selected agent
  const currentJob = trainingJobs.find(j => j.agent_id === selectedAgentId);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-white mb-2 flex items-center gap-3">
            <GraduationCap className="w-8 h-8 text-purple-400" />
            Advanced Training System
          </h1>
          <p className="text-slate-400">
            Comprehensive AI agent training with real-time monitoring and A/B testing
          </p>
        </div>
        <Button
          onClick={loadData}
          variant="outline"
          disabled={isLoading}
        >
          {isLoading ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : (
            <RefreshCw className="w-4 h-4" />
          )}
        </Button>
      </div>

      {/* Agent Selection & Status */}
      <Card className="bg-slate-900 border-slate-800">
        <CardContent className="pt-6">
          <div className="flex items-center gap-6">
            <div className="flex-1">
              <label className="text-sm text-slate-400 mb-2 block">Target Agent</label>
              <Select value={selectedAgentId} onValueChange={setSelectedAgentId}>
                <SelectTrigger className="bg-slate-800 border-slate-700">
                  <SelectValue placeholder="Select an agent to train" />
                </SelectTrigger>
                <SelectContent className="bg-slate-900 border-slate-800">
                  {agents.map(agent => (
                    <SelectItem key={agent.id} value={agent.id}>
                      {agent.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {selectedAgentId && (
              <>
                <div className="text-center">
                  <p className="text-xs text-slate-500 mb-1">Training Status</p>
                  <Badge className={
                    training.status === TRAINING_STATUS.RUNNING ? 'bg-green-500' :
                      training.status === TRAINING_STATUS.COMPLETED ? 'bg-blue-500' :
                        training.status === TRAINING_STATUS.FAILED ? 'bg-red-500' :
                          'bg-slate-600'
                  }>
                    {training.status}
                  </Badge>
                </div>

                <div className="text-center">
                  <p className="text-xs text-slate-500 mb-1">Data Samples</p>
                  <p className="text-lg font-bold text-white">{trainingData.length}</p>
                </div>

                {training.isActive && (
                  <div className="text-center">
                    <p className="text-xs text-slate-500 mb-1">Progress</p>
                    <p className="text-lg font-bold text-purple-400">{training.percentComplete}%</p>
                  </div>
                )}

                <Button
                  onClick={handleStartTraining}
                  disabled={!training.canStart || trainingData.length === 0}
                  className="bg-purple-600 hover:bg-purple-700"
                >
                  <Play className="w-4 h-4 mr-2" />
                  Start Training
                </Button>
              </>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Main Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-7 bg-slate-800">
          <TabsTrigger value="dataset" className="flex items-center gap-2">
            <Database className="w-4 h-4" />
            Dataset
          </TabsTrigger>
          <TabsTrigger value="config" className="flex items-center gap-2">
            <Settings className="w-4 h-4" />
            Config
          </TabsTrigger>
          <TabsTrigger value="monitor" className="flex items-center gap-2">
            <Play className="w-4 h-4" />
            Monitor
          </TabsTrigger>
          <TabsTrigger value="results" className="flex items-center gap-2">
            <Award className="w-4 h-4" />
            Results
          </TabsTrigger>
          <TabsTrigger value="abtesting" className="flex items-center gap-2">
            <GitCompare className="w-4 h-4" />
            A/B Testing
          </TabsTrigger>
          <TabsTrigger value="pipeline" className="flex items-center gap-2">
            <GitBranch className="w-4 h-4" />
            Pipeline
          </TabsTrigger>
          <TabsTrigger value="analytics" className="flex items-center gap-2">
            <BarChart3 className="w-4 h-4" />
            Analytics
          </TabsTrigger>
        </TabsList>

        {/* Dataset Tab */}
        <TabsContent value="dataset" className="mt-6">
          <TrainingDatasetManager
            onDataChange={setTrainingData}
            initialData={trainingData}
            validationSplit={validationSplit}
            onValidationSplitChange={setValidationSplit}
          />
        </TabsContent>

        {/* Config Tab */}
        <TabsContent value="config" className="mt-6">
          <TrainingConfigPanel
            config={training.config}
            onConfigChange={training.updateConfig}
            estimatedCost={trainingData.length * 0.00001 * training.config.epochs}
            estimatedDuration={trainingData.length * 500 * training.config.epochs / training.config.batchSize}
          />
        </TabsContent>

        {/* Monitor Tab */}
        <TabsContent value="monitor" className="mt-6">
          <TrainingJobMonitor
            status={training.status}
            progress={training.progress}
            metrics={metrics.summary}
            history={training.history}
            checkpoints={training.checkpoints}
            onPause={training.pauseTraining}
            onResume={training.resumeTraining}
            onCancel={training.cancelTraining}
            onLoadCheckpoint={training.loadCheckpoint}
            isLoading={training.isLoading}
          />
        </TabsContent>

        {/* Results Tab */}
        <TabsContent value="results" className="mt-6">
          <TrainingResultsDashboard
            job={training.currentJob || currentJob}
            agent={selectedAgent}
            onRefresh={loadData}
          />
        </TabsContent>

        {/* A/B Testing Tab */}
        <TabsContent value="abtesting" className="mt-6">
          <ABTestingFramework
            trainingJobs={trainingJobs}
            agents={agents}
          />
        </TabsContent>

        {/* Pipeline Tab */}
        <TabsContent value="pipeline" className="mt-6">
          <TrainingPipelineBuilder
            agents={agents}
            onPipelineChange={(pipeline) => console.log('Pipeline changed:', pipeline)}
            onExecute={handleExecutePipeline}
          />
        </TabsContent>

        {/* Analytics Tab */}
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
