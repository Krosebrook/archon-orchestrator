import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Play, CheckCircle2, XCircle, Clock, GitBranch, TestTube, Rocket, AlertTriangle, Eye } from 'lucide-react';
import { base44 } from '@/api/base44Client';
import { toast } from 'sonner';
import { format } from 'date-fns';
import CIGateManager from './CIGateManager';
import GateConfiguration from './GateConfiguration';
import PipelineFlow from './PipelineFlow';

const STAGE_ICONS = {
  analyze: GitBranch,
  test: TestTube,
  apply: Rocket,
  verify: Eye
};

const STATUS_CONFIG = {
  pending: { color: 'text-slate-500', badge: 'bg-slate-500/20 text-slate-400 border-slate-500/30' },
  running: { color: 'text-blue-500', badge: 'bg-blue-500/20 text-blue-400 border-blue-500/30' },
  success: { color: 'text-green-500', badge: 'bg-green-500/20 text-green-400 border-green-500/30' },
  failed: { color: 'text-red-500', badge: 'bg-red-500/20 text-red-400 border-red-500/30' },
  cancelled: { color: 'text-yellow-500', badge: 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30' }
};

export default function CIPipeline({ sessionId }) {
  const [pipelines, setPipelines] = useState([]);
  const [selectedPipeline, setSelectedPipeline] = useState(null);
  const [gates, setGates] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadPipelines();
    
    // Real-time polling every 2 seconds
    const interval = setInterval(() => {
      loadPipelines();
      if (selectedPipeline) {
        loadGates(selectedPipeline.id);
      }
    }, 2000);
    
    return () => clearInterval(interval);
  }, [sessionId, selectedPipeline?.id]);

  const loadPipelines = async () => {
    try {
      const data = await base44.entities.RefactorPipeline.filter({ session_id: sessionId }, '-created_date', 10);
      setPipelines(data);
      
      if (!selectedPipeline && data.length > 0) {
        setSelectedPipeline(data[0]);
      } else if (selectedPipeline) {
        const updatedSelected = data.find(p => p.id === selectedPipeline.id);
        if (updatedSelected) {
          // Check for status changes and notify
          if (selectedPipeline.status !== updatedSelected.status) {
            handlePipelineStatusChange(updatedSelected);
          }
          setSelectedPipeline(updatedSelected);
        }
      }
    } catch (error) {
      console.error('Failed to load pipelines:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const loadGates = async (pipelineId) => {
    try {
      const gateData = await base44.entities.CIGate.filter({ pipeline_id: pipelineId });
      
      // Check for gate status changes
      gates.forEach(oldGate => {
        const newGate = gateData.find(g => g.id === oldGate.id);
        if (newGate && oldGate.status !== newGate.status) {
          handleGateStatusChange(newGate);
        }
      });
      
      setGates(gateData);
    } catch (error) {
      console.error('Failed to load gates:', error);
    }
  };

  const handlePipelineStatusChange = (pipeline) => {
    if (pipeline.status === 'failed') {
      toast.error(`Pipeline ${pipeline.name} failed`, {
        description: 'Check the logs for details',
        action: {
          label: 'View',
          onClick: () => setSelectedPipeline(pipeline)
        }
      });
    } else if (pipeline.status === 'success') {
      toast.success(`Pipeline ${pipeline.name} completed successfully`);
    }
  };

  const handleGateStatusChange = (gate) => {
    if (gate.status === 'failed') {
      toast.error(`Gate "${gate.name}" failed`, {
        description: `${gate.gate_type} gate blocked the pipeline`,
        action: {
          label: 'Review',
          onClick: () => {}
        }
      });
    } else if (gate.status === 'pending' && gate.gate_type === 'approval') {
      toast.info(`Approval required for "${gate.name}"`, {
        description: 'Pipeline is waiting for approval',
        action: {
          label: 'Approve',
          onClick: () => {}
        }
      });
    } else if (gate.status === 'passed') {
      toast.success(`Gate "${gate.name}" passed`);
    }
  };

  const triggerPipeline = async () => {
    try {
      const user = await base44.auth.me();
      await base44.entities.RefactorPipeline.create({
        name: `Pipeline ${new Date().toLocaleTimeString()}`,
        session_id: sessionId,
        trigger: 'manual',
        status: 'pending',
        stages: [
          { name: 'analyze', status: 'pending' },
          { name: 'test', status: 'pending' },
          { name: 'apply', status: 'pending' },
          { name: 'verify', status: 'pending' }
        ],
        org_id: user.organization?.id || 'org_default'
      });
      toast.success('Pipeline triggered');
      loadPipelines();
    } catch (error) {
      console.error('Failed to trigger pipeline:', error);
      toast.error('Failed to trigger pipeline');
    }
  };

  const cancelPipeline = async (pipelineId) => {
    try {
      await base44.entities.RefactorPipeline.update(pipelineId, { status: 'cancelled' });
      toast.success('Pipeline cancelled');
      loadPipelines();
    } catch (error) {
      console.error('Failed to cancel pipeline:', error);
      toast.error('Failed to cancel pipeline');
    }
  };

  if (isLoading) {
    return (
      <Card className="bg-slate-900 border-slate-800">
        <CardContent className="p-8 text-center text-slate-400">Loading...</CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <Card className="bg-slate-900 border-slate-800">
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="text-white">CI/CD Pipelines</CardTitle>
            <Button onClick={triggerPipeline} className="bg-blue-600 hover:bg-blue-700">
              <Play className="w-4 h-4 mr-2" />
              Trigger Pipeline
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {pipelines.length === 0 ? (
            <div className="text-center py-12 text-slate-400">
              No pipelines yet. Trigger a pipeline to get started.
            </div>
          ) : (
            <div className="space-y-3">
              {pipelines.map((pipeline) => {
                const config = STATUS_CONFIG[pipeline.status] || STATUS_CONFIG.pending;
                const completedStages = pipeline.stages?.filter(s => s.status === 'success').length || 0;
                const totalStages = pipeline.stages?.length || 0;
                const progress = totalStages > 0 ? Math.round((completedStages / totalStages) * 100) : 0;

                return (
                  <div
                    key={pipeline.id}
                    onClick={() => setSelectedPipeline(pipeline)}
                    className={`p-4 bg-slate-950 rounded-lg border cursor-pointer transition-all ${
                      selectedPipeline?.id === pipeline.id ? 'border-blue-500 ring-1 ring-blue-500/20' : 'border-slate-800 hover:border-slate-700'
                    }`}
                  >
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="text-white font-medium">{pipeline.name}</span>
                          <Badge variant="outline" className={config.badge}>
                            {pipeline.status}
                          </Badge>
                          <Badge variant="outline" className="bg-slate-800 border-slate-700 text-xs">
                            {pipeline.trigger}
                          </Badge>
                        </div>
                        <div className="text-xs text-slate-500">
                          {format(new Date(pipeline.created_date), 'MMM d, h:mm a')}
                        </div>
                      </div>
                      {pipeline.status === 'running' && (
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={(e) => {
                            e.stopPropagation();
                            cancelPipeline(pipeline.id);
                          }}
                          className="border-red-700 text-red-400 hover:bg-red-900/20"
                        >
                          Cancel
                        </Button>
                      )}
                    </div>
                    <Progress value={progress} className="h-1.5 mb-2" />
                    <div className="flex items-center gap-2 text-xs text-slate-400">
                      {pipeline.stages?.map((stage, idx) => {
                        const StageIcon = STAGE_ICONS[stage.name] || Clock;
                        const stageConfig = STATUS_CONFIG[stage.status] || STATUS_CONFIG.pending;
                        return (
                          <div key={idx} className="flex items-center gap-1">
                            <StageIcon className={`w-3 h-3 ${stageConfig.color}`} />
                            <span className="capitalize">{stage.name}</span>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>

      {selectedPipeline && (
        <div className="space-y-6">
          <PipelineFlow stages={selectedPipeline.stages} gates={gates} />
          
          <GateConfiguration pipelineId={selectedPipeline.id} onSave={() => loadGates(selectedPipeline.id)} />
          
          <Card className="bg-slate-900 border-slate-800">
            <CardHeader>
              <CardTitle className="text-white">Pipeline Details</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {selectedPipeline.deployment_url && (
                <div className="p-3 bg-blue-900/20 rounded-lg border border-blue-800/30">
                  <div className="text-sm text-blue-400 mb-1">Preview Deployment</div>
                  <a
                    href={selectedPipeline.deployment_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-xs text-blue-300 hover:underline"
                  >
                    {selectedPipeline.deployment_url}
                  </a>
                </div>
              )}

              {selectedPipeline.test_results && (
                <div className="p-3 bg-slate-950 rounded-lg border border-slate-800">
                  <div className="text-sm text-white font-medium mb-2">Test Results</div>
                  <div className="grid grid-cols-3 gap-2 text-xs">
                    <div className="text-green-400">Passed: {selectedPipeline.test_results.passed}</div>
                    <div className="text-red-400">Failed: {selectedPipeline.test_results.failed}</div>
                    <div className="text-blue-400">Coverage: {selectedPipeline.test_results.coverage}%</div>
                  </div>
                </div>
              )}

              {selectedPipeline.approvers && selectedPipeline.approvers.length > 0 && (
                <div className="p-3 bg-green-900/20 rounded-lg border border-green-800/30">
                  <div className="text-sm text-green-400 mb-1">Approved By</div>
                  <div className="text-xs text-green-300">
                    {selectedPipeline.approvers.join(', ')}
                  </div>
                </div>
              )}

              <div className="space-y-3">
                <div className="text-sm font-medium text-slate-300">Pipeline Stages</div>
                {selectedPipeline.stages?.map((stage, idx) => {
                  const StageIcon = STAGE_ICONS[stage.name] || Clock;
                  const config = STATUS_CONFIG[stage.status] || STATUS_CONFIG.pending;
                  
                  return (
                    <div key={idx} className="p-3 bg-slate-950 rounded-lg border border-slate-800">
                      <div className="flex items-start gap-3">
                        <StageIcon className={`w-5 h-5 ${config.color}`} />
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <span className="text-white font-medium capitalize">{stage.name}</span>
                            <Badge variant="outline" className={config.badge}>
                              {stage.status}
                            </Badge>
                          </div>
                          {stage.started_at && (
                            <div className="text-xs text-slate-500 mb-2">
                              Started: {format(new Date(stage.started_at), 'h:mm:ss a')}
                              {stage.finished_at && (
                                <> • Duration: {Math.round((new Date(stage.finished_at) - new Date(stage.started_at)) / 1000)}s</>
                              )}
                            </div>
                          )}
                          {stage.logs && stage.logs.length > 0 && (
                            <details className="mt-2">
                              <summary className="text-xs text-slate-400 cursor-pointer">View logs ({stage.logs.length})</summary>
                              <div className="mt-2 space-y-1">
                                {stage.logs.map((log, logIdx) => (
                                  <div key={logIdx} className="text-xs text-slate-300 bg-slate-900 px-2 py-1 rounded font-mono">
                                    {log}
                                  </div>
                                ))}
                              </div>
                            </details>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>

              {selectedPipeline.rollback_commit && (
                <div className="p-3 bg-orange-900/20 rounded-lg border border-orange-800/30">
                  <div className="flex items-start gap-2">
                    <AlertTriangle className="w-4 h-4 text-orange-400 mt-0.5" />
                    <div>
                      <div className="text-sm text-orange-400 font-medium">Rollback Available</div>
                      <div className="text-xs text-orange-300 mt-1">
                        Commit: <code className="bg-orange-950 px-1 py-0.5 rounded">{selectedPipeline.rollback_commit}</code>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          <CIGateManager pipelineId={selectedPipeline.id} gates={gates} onGateUpdate={() => loadGates(selectedPipeline.id)} />
        </div>
      )}
    </div>
  );
}