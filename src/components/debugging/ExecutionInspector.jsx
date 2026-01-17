/**
 * @fileoverview Execution Inspector Component
 * @description Step-by-step visualization of agent execution with pause/resume,
 * intermediate thoughts, evidence, API calls, and token tracking.
 * 
 * @module debugging/ExecutionInspector
 * @version 1.0.0
 */

import { useState, useEffect, useRef } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Play, Pause, SkipForward, RotateCcw, 
  Brain, Database, Zap, Clock, DollarSign,
  CheckCircle, XCircle, AlertCircle, Loader2,
  Code, Activity, Edit
} from 'lucide-react';
import { base44 } from '@/api/base44Client';
import { toast } from 'sonner';
import { format } from 'date-fns';
import { handleError } from '../utils/api-client';
import { auditExecute, AuditEntities } from '../utils/audit-logger';
import ExecutionStepViewer from './ExecutionStepViewer';

export default function ExecutionInspector({ run, _onClose }) {
  const [executionSteps, setExecutionSteps] = useState([]);
  const [currentStep, setCurrentStep] = useState(0);
  const [isPaused, setIsPaused] = useState(true);
  const [_isLoading, _setIsLoading] = useState(true);
  const [agent, setAgent] = useState(null);
  const [_metrics, _setMetrics] = useState([]);
  const [_showThoughts, _setShowThoughts] = useState(true);
  const [_modifiedFlow, _setModifiedFlow] = useState(null);
  const intervalRef = useRef(null);

  useEffect(() => {
    loadExecutionData();
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [run.id]);

  const loadExecutionData = async () => {
    setIsLoading(true);
    try {
      const [agentData, metricsData] = await Promise.all([
        base44.entities.Agent.filter({ id: run.agent_id }),
        base44.entities.AgentMetric.filter({ run_id: run.id }, '-timestamp')
      ]);

      setAgent(agentData[0]);
      setMetrics(metricsData);

      // Generate detailed execution steps from run data
      const steps = await generateExecutionSteps(run, agentData[0], metricsData);
      setExecutionSteps(steps);

      // Audit inspection session
      await auditExecute(AuditEntities.RUN, run.id, {
        action: 'inspect_execution',
        step_count: steps.length
      });

    } catch (error) {
      handleError(error);
    } finally {
      setIsLoading(false);
    }
  };

  const generateExecutionSteps = async (run, agent, metrics) => {
    // Reconstruct execution steps from run output, metrics, and events
    const steps = [];
    
    // Initial step
    steps.push({
      id: 'init',
      type: 'initialization',
      timestamp: run.started_at,
      status: 'completed',
      thoughts: [
        `Initializing agent: ${agent?.name}`,
        `Provider: ${agent?.config?.provider}`,
        `Model: ${agent?.config?.model}`,
        `Temperature: ${agent?.config?.temperature || 0.7}`
      ],
      evidence: {
        agent_config: agent?.config,
        run_config: run.spec
      },
      apiCalls: [],
      tokens: { input: 0, output: 0 },
      latency: 0,
      cost: 0
    });

    // Generate steps from metrics
    metrics.forEach((metric, idx) => {
      steps.push({
        id: `step-${idx}`,
        type: 'llm_call',
        timestamp: metric.timestamp,
        status: metric.status === 'success' ? 'completed' : metric.status,
        thoughts: [
          `Processing request to ${metric.provider}/${metric.model}`,
          metric.status === 'error' ? `Error: ${metric.error_code}` : 'Processing complete',
          `Latency: ${metric.latency_ms}ms`
        ],
        evidence: {
          provider: metric.provider,
          model: metric.model,
          status: metric.status,
          error_code: metric.error_code
        },
        apiCalls: [{
          provider: metric.provider,
          model: metric.model,
          endpoint: '/chat/completions',
          status: metric.status === 'success' ? 200 : 500,
          latency: metric.latency_ms
        }],
        tokens: {
          input: metric.prompt_tokens || 0,
          output: metric.completion_tokens || 0
        },
        latency: metric.latency_ms || 0,
        cost: metric.cost_cents || 0
      });
    });

    // Final step
    steps.push({
      id: 'complete',
      type: 'completion',
      timestamp: run.finished_at || new Date().toISOString(),
      status: run.status,
      thoughts: [
        run.status === 'completed' ? 'Execution completed successfully' : `Execution ${run.status}`,
        run.error_message ? `Error: ${run.error_message}` : 'All steps completed',
        `Total duration: ${run.duration_ms}ms`
      ],
      evidence: {
        status: run.status,
        output: run.output,
        error: run.error_message,
        duration: run.duration_ms
      },
      apiCalls: [],
      tokens: { input: 0, output: 0 },
      latency: 0,
      cost: 0
    });

    return steps;
  };

  const playExecution = () => {
    setIsPaused(false);
    intervalRef.current = setInterval(() => {
      setCurrentStep(prev => {
        if (prev >= executionSteps.length - 1) {
          pauseExecution();
          return prev;
        }
        return prev + 1;
      });
    }, 1500);
  };

  const pauseExecution = () => {
    setIsPaused(true);
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
  };

  const stepForward = () => {
    if (currentStep < executionSteps.length - 1) {
      setCurrentStep(currentStep + 1);
    }
  };

  const reset = () => {
    pauseExecution();
    setCurrentStep(0);
  };

  const modifyFlowAtStep = async () => {
    try {
      const _user = await base44.auth.me();
      toast.info('Flow modification interface coming soon');
      
      // Audit modification attempt
      await auditExecute(AuditEntities.RUN, run.id, {
        action: 'modify_flow_attempt',
        step: currentStep
      });
    } catch (error) {
      handleError(error);
    }
  };

  if (isLoading) {
    return (
      <Card className="bg-slate-900 border-slate-800">
        <CardContent className="flex items-center justify-center py-12">
          <Loader2 className="w-8 h-8 animate-spin text-blue-500" />
        </CardContent>
      </Card>
    );
  }

  const step = executionSteps[currentStep];
  const totalTokens = executionSteps.reduce((sum, s) => sum + s.tokens.input + s.tokens.output, 0);
  const totalCost = executionSteps.reduce((sum, s) => sum + s.cost, 0);
  const totalLatency = executionSteps.reduce((sum, s) => sum + s.latency, 0);

  const stepColors = {
    completed: 'bg-green-500/20 text-green-400 border-green-500/30',
    error: 'bg-red-500/20 text-red-400 border-red-500/30',
    running: 'bg-blue-500/20 text-blue-400 border-blue-500/30',
    pending: 'bg-slate-500/20 text-slate-400 border-slate-500/30'
  };

  return (
    <div className="space-y-6">
      {/* Header with controls */}
      <Card className="bg-slate-900 border-slate-800">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-white flex items-center gap-2">
                <Activity className="w-5 h-5" />
                Execution Inspector
              </CardTitle>
              <p className="text-sm text-slate-400 mt-1">
                {agent?.name} - Run {run.id.slice(0, 8)}
              </p>
            </div>
            <div className="flex items-center gap-2">
              <Button
                onClick={reset}
                variant="outline"
                size="sm"
                className="border-slate-700"
              >
                <RotateCcw className="w-4 h-4" />
              </Button>
              {isPaused ? (
                <Button onClick={playExecution} size="sm" className="bg-green-600 hover:bg-green-700">
                  <Play className="w-4 h-4 mr-2" />
                  Play
                </Button>
              ) : (
                <Button onClick={pauseExecution} size="sm" className="bg-orange-600 hover:bg-orange-700">
                  <Pause className="w-4 h-4 mr-2" />
                  Pause
                </Button>
              )}
              <Button onClick={stepForward} size="sm" variant="outline" className="border-slate-700">
                <SkipForward className="w-4 h-4" />
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {/* Progress bar */}
          <div className="space-y-2">
            <div className="flex items-center justify-between text-sm">
              <span className="text-slate-400">Step {currentStep + 1} of {executionSteps.length}</span>
              <span className="text-slate-400">{Math.round((currentStep / (executionSteps.length - 1)) * 100)}%</span>
            </div>
            <div className="h-2 bg-slate-800 rounded-full overflow-hidden">
              <div
                className="h-full bg-blue-500 transition-all duration-300"
                style={{ width: `${(currentStep / (executionSteps.length - 1)) * 100}%` }}
              />
            </div>
          </div>

          {/* Aggregate metrics */}
          <div className="grid grid-cols-4 gap-4 mt-4">
            <div className="p-3 bg-slate-950 rounded border border-slate-800">
              <div className="flex items-center gap-2 text-slate-400 text-xs mb-1">
                <Zap className="w-3 h-3" />
                Total Tokens
              </div>
              <div className="text-white font-semibold">{totalTokens.toLocaleString()}</div>
            </div>
            <div className="p-3 bg-slate-950 rounded border border-slate-800">
              <div className="flex items-center gap-2 text-slate-400 text-xs mb-1">
                <DollarSign className="w-3 h-3" />
                Total Cost
              </div>
              <div className="text-white font-semibold">${(totalCost / 100).toFixed(4)}</div>
            </div>
            <div className="p-3 bg-slate-950 rounded border border-slate-800">
              <div className="flex items-center gap-2 text-slate-400 text-xs mb-1">
                <Clock className="w-3 h-3" />
                Total Latency
              </div>
              <div className="text-white font-semibold">{totalLatency.toLocaleString()}ms</div>
            </div>
            <div className="p-3 bg-slate-950 rounded border border-slate-800">
              <div className="flex items-center gap-2 text-slate-400 text-xs mb-1">
                <Activity className="w-3 h-3" />
                Status
              </div>
              <Badge variant="outline" className={stepColors[run.status] || stepColors.pending}>
                {run.status}
              </Badge>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Current step details */}
      {step && (
        <Card className="bg-slate-900 border-slate-800">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Badge variant="outline" className={stepColors[step.status]}>
                  {step.type.replace(/_/g, ' ')}
                </Badge>
                <span className="text-sm text-slate-400">
                  {format(new Date(step.timestamp), 'HH:mm:ss.SSS')}
                </span>
              </div>
              <Button
                onClick={modifyFlowAtStep}
                variant="outline"
                size="sm"
                className="border-slate-700"
              >
                <Edit className="w-4 h-4 mr-2" />
                Modify Flow
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <Tabs defaultValue="thoughts" className="w-full">
              <TabsList className="bg-slate-800">
                <TabsTrigger value="thoughts">
                  <Brain className="w-4 h-4 mr-2" />
                  Thoughts
                </TabsTrigger>
                <TabsTrigger value="evidence">
                  <Database className="w-4 h-4 mr-2" />
                  Evidence
                </TabsTrigger>
                <TabsTrigger value="api">
                  <Code className="w-4 h-4 mr-2" />
                  API Calls
                </TabsTrigger>
                <TabsTrigger value="metrics">
                  <Activity className="w-4 h-4 mr-2" />
                  Metrics
                </TabsTrigger>
              </TabsList>

              <TabsContent value="thoughts" className="mt-4 space-y-2">
                {step.thoughts.map((thought, idx) => (
                  <div key={idx} className="p-3 bg-slate-950 rounded border border-slate-800">
                    <p className="text-sm text-slate-300">{thought}</p>
                  </div>
                ))}
              </TabsContent>

              <TabsContent value="evidence" className="mt-4">
                <ScrollArea className="h-64">
                  <pre className="text-xs text-slate-300 p-4 bg-slate-950 rounded border border-slate-800">
                    {JSON.stringify(step.evidence, null, 2)}
                  </pre>
                </ScrollArea>
              </TabsContent>

              <TabsContent value="api" className="mt-4 space-y-3">
                {step.apiCalls.length === 0 ? (
                  <p className="text-sm text-slate-400 text-center py-8">No API calls in this step</p>
                ) : (
                  step.apiCalls.map((call, idx) => (
                    <div key={idx} className="p-4 bg-slate-950 rounded border border-slate-800">
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-2">
                          <Badge variant="outline" className={call.status === 200 ? 'bg-green-500/20 text-green-400' : 'bg-red-500/20 text-red-400'}>
                            {call.status}
                          </Badge>
                          <span className="text-sm font-mono text-white">{call.endpoint}</span>
                        </div>
                        <span className="text-xs text-slate-400">{call.latency}ms</span>
                      </div>
                      <div className="text-xs text-slate-400">
                        {call.provider} - {call.model}
                      </div>
                    </div>
                  ))
                )}
              </TabsContent>

              <TabsContent value="metrics" className="mt-4">
                <ExecutionStepViewer 
                  step={step} 
                  totalTokens={totalTokens}
                  totalCost={totalCost}
                />
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>
      )}

      {/* Timeline view */}
      <Card className="bg-slate-900 border-slate-800">
        <CardHeader>
          <CardTitle className="text-white text-sm">Execution Timeline</CardTitle>
        </CardHeader>
        <CardContent>
          <ScrollArea className="h-48">
            <div className="space-y-2">
              {executionSteps.map((s, idx) => {
                const isActive = idx === currentStep;
                const isPast = idx < currentStep;
                const StatusIcon = s.status === 'completed' ? CheckCircle : s.status === 'error' ? XCircle : AlertCircle;
                
                return (
                  <div
                    key={s.id}
                    onClick={() => setCurrentStep(idx)}
                    className={`
                      flex items-center gap-3 p-3 rounded cursor-pointer transition-all
                      ${isActive ? 'bg-blue-500/20 border border-blue-500/50' : 'bg-slate-950 border border-slate-800 hover:bg-slate-950/50'}
                      ${isPast ? 'opacity-60' : ''}
                    `}
                  >
                    <StatusIcon className={`
                      w-4 h-4 flex-shrink-0
                      ${s.status === 'completed' ? 'text-green-400' : s.status === 'error' ? 'text-red-400' : 'text-yellow-400'}
                    `} />
                    <div className="flex-1 min-w-0">
                      <div className="text-sm text-white truncate">{s.type.replace(/_/g, ' ')}</div>
                      <div className="text-xs text-slate-400">{format(new Date(s.timestamp), 'HH:mm:ss')}</div>
                    </div>
                    <div className="text-xs text-slate-400">{s.latency}ms</div>
                  </div>
                );
              })}
            </div>
          </ScrollArea>
        </CardContent>
      </Card>
    </div>
  );
}