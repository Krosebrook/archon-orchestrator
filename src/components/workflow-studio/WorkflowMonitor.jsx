import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Activity, AlertTriangle, TrendingUp, Zap, Loader2 } from 'lucide-react';
import { base44 } from '@/api/base44Client';
import { toast } from 'sonner';
import { format, parseISO } from 'date-fns';

export default function WorkflowMonitor({ runs, workflows, agents }) {
  const [analysis, setAnalysis] = useState({});
  const [isAnalyzing, setIsAnalyzing] = useState({});

  const analyzeRun = async (run) => {
    const workflow = workflows.find(w => w.id === run.workflow_id);
    const agent = agents.find(a => a.id === run.agent_id);

    if (!workflow || !agent) return;

    setIsAnalyzing(prev => ({ ...prev, [run.id]: true }));

    try {
      const result = await base44.integrations.Core.InvokeLLM({
        prompt: `Analyze this running workflow and suggest optimizations or interventions.

Run Details:
- State: ${run.state}
- Started: ${run.started_at}
- Cost so far: ${run.cost_cents} cents
- Tokens in: ${run.tokens_in}
- Tokens out: ${run.tokens_out}

Workflow: ${workflow.name}
Agent: ${agent.name} (${agent.config.provider}/${agent.config.model})

Provide:
1. Performance assessment
2. Cost optimization suggestions
3. Any recommended interventions (if applicable)
4. Predicted completion time and cost

Return JSON:
{
  "status": "healthy|warning|critical",
  "assessment": "brief assessment",
  "optimizations": ["suggestion 1", "suggestion 2"],
  "interventions": ["intervention 1"],
  "predicted_completion_sec": 60,
  "predicted_final_cost_cents": 25
}`,
        response_json_schema: {
          type: 'object',
          properties: {
            status: { type: 'string', enum: ['healthy', 'warning', 'critical'] },
            assessment: { type: 'string' },
            optimizations: { type: 'array', items: { type: 'string' } },
            interventions: { type: 'array', items: { type: 'string' } },
            predicted_completion_sec: { type: 'integer' },
            predicted_final_cost_cents: { type: 'integer' }
          }
        }
      });

      setAnalysis(prev => ({ ...prev, [run.id]: result }));
    } catch (error) {
      console.error('Analysis failed:', error);
      toast.error('Failed to analyze run');
    } finally {
      setIsAnalyzing(prev => ({ ...prev, [run.id]: false }));
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'healthy': return 'bg-green-500/20 text-green-400 border-green-500/30';
      case 'warning': return 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30';
      case 'critical': return 'bg-red-500/20 text-red-400 border-red-500/30';
      default: return 'bg-slate-500/20 text-slate-400 border-slate-500/30';
    }
  };

  return (
    <div className="space-y-4">
      <Card className="bg-slate-900 border-slate-800">
        <CardHeader>
          <CardTitle className="text-white flex items-center gap-2">
            <Activity className="w-5 h-5 text-green-400" />
            Active Workflow Monitor
          </CardTitle>
        </CardHeader>
        <CardContent>
          {runs.length === 0 ? (
            <div className="text-center py-8 text-slate-400">
              No active runs to monitor
            </div>
          ) : (
            <div className="space-y-4">
              {runs.map((run) => {
                const workflow = workflows.find(w => w.id === run.workflow_id);
                const agent = agents.find(a => a.id === run.agent_id);
                const runAnalysis = analysis[run.id];

                return (
                  <div key={run.id} className="p-4 bg-slate-950 rounded-lg border border-slate-800">
                    <div className="flex items-start justify-between mb-3">
                      <div>
                        <div className="font-medium text-white">{workflow?.name || 'Unknown Workflow'}</div>
                        <div className="text-xs text-slate-400 mt-1">
                          Agent: {agent?.name || 'Unknown'} • Started {format(parseISO(run.started_at), 'HH:mm:ss')}
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge variant="outline" className="text-xs">
                          ${(run.cost_cents / 100).toFixed(3)}
                        </Badge>
                        <Badge variant="outline" className={`text-xs ${run.state === 'running' ? 'bg-blue-500/20 text-blue-400' : ''}`}>
                          {run.state}
                        </Badge>
                      </div>
                    </div>

                    {!runAnalysis ? (
                      <Button
                        onClick={() => analyzeRun(run)}
                        disabled={isAnalyzing[run.id]}
                        size="sm"
                        className="w-full bg-purple-600 hover:bg-purple-700"
                      >
                        {isAnalyzing[run.id] ? (
                          <>
                            <Loader2 className="w-3 h-3 mr-2 animate-spin" />
                            Analyzing...
                          </>
                        ) : (
                          <>
                            <Zap className="w-3 h-3 mr-2" />
                            Analyze & Optimize
                          </>
                        )}
                      </Button>
                    ) : (
                      <div className="space-y-3 mt-3">
                        <div className={`p-3 rounded-lg border ${getStatusColor(runAnalysis.status)}`}>
                          <div className="flex items-center gap-2 mb-2">
                            {runAnalysis.status === 'critical' && <AlertTriangle className="w-4 h-4" />}
                            <span className="text-sm font-medium">Status: {runAnalysis.status}</span>
                          </div>
                          <p className="text-xs opacity-90">{runAnalysis.assessment}</p>
                        </div>

                        {runAnalysis.optimizations && runAnalysis.optimizations.length > 0 && (
                          <div className="p-3 bg-slate-900 rounded-lg border border-slate-800">
                            <div className="flex items-center gap-2 mb-2">
                              <TrendingUp className="w-4 h-4 text-blue-400" />
                              <span className="text-sm font-medium text-white">Optimizations</span>
                            </div>
                            <ul className="space-y-1">
                              {runAnalysis.optimizations.map((opt, idx) => (
                                <li key={idx} className="text-xs text-slate-400 pl-4">• {opt}</li>
                              ))}
                            </ul>
                          </div>
                        )}

                        {runAnalysis.interventions && runAnalysis.interventions.length > 0 && (
                          <div className="p-3 bg-red-500/10 rounded-lg border border-red-500/30">
                            <div className="flex items-center gap-2 mb-2">
                              <AlertTriangle className="w-4 h-4 text-red-400" />
                              <span className="text-sm font-medium text-red-400">Recommended Interventions</span>
                            </div>
                            <ul className="space-y-1">
                              {runAnalysis.interventions.map((int, idx) => (
                                <li key={idx} className="text-xs text-red-300 pl-4">• {int}</li>
                              ))}
                            </ul>
                          </div>
                        )}

                        <div className="grid grid-cols-2 gap-3">
                          <div className="p-2 bg-slate-900 rounded border border-slate-800 text-center">
                            <div className="text-xs text-slate-400">Predicted Completion</div>
                            <div className="text-sm font-medium text-white mt-1">
                              {runAnalysis.predicted_completion_sec}s
                            </div>
                          </div>
                          <div className="p-2 bg-slate-900 rounded border border-slate-800 text-center">
                            <div className="text-xs text-slate-400">Final Cost</div>
                            <div className="text-sm font-medium text-white mt-1">
                              ${(runAnalysis.predicted_final_cost_cents / 100).toFixed(3)}
                            </div>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}