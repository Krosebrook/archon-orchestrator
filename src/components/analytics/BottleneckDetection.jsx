import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Loader2, Sparkles, AlertTriangle } from 'lucide-react';
import { base44 } from '@/api/base44Client';
import { toast } from 'sonner';

export default function BottleneckDetection({ runs, workflows, agents }) {
  const [bottlenecks, setBottlenecks] = useState(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);

  const analyzeBottlenecks = async () => {
    setIsAnalyzing(true);
    try {
      const workflowStats = workflows.map(workflow => {
        const workflowRuns = runs.filter(r => r.workflow_id === workflow.id);
        const avgDuration = workflowRuns.length > 0
          ? workflowRuns.reduce((sum, r) => {
              const start = new Date(r.started_at);
              const end = r.finished_at ? new Date(r.finished_at) : new Date();
              return sum + (end - start);
            }, 0) / workflowRuns.length
          : 0;

        return {
          name: workflow.name,
          runs: workflowRuns.length,
          avgDuration: avgDuration / 1000,
          failureRate: workflowRuns.length > 0
            ? (workflowRuns.filter(r => r.state === 'failed').length / workflowRuns.length) * 100
            : 0
        };
      });

      const result = await base44.integrations.Core.InvokeLLM({
        prompt: `Analyze these workflow execution statistics and identify bottlenecks, inefficiencies, and optimization opportunities.

Workflow Statistics:
${JSON.stringify(workflowStats, null, 2)}

Identify:
1. Performance bottlenecks (slow workflows)
2. Reliability issues (high failure rates)
3. Resource inefficiencies
4. Specific optimization recommendations

Return JSON with bottlenecks ranked by severity:`,
        response_json_schema: {
          type: 'object',
          properties: {
            bottlenecks: {
              type: 'array',
              items: {
                type: 'object',
                properties: {
                  workflow: { type: 'string' },
                  severity: { type: 'string', enum: ['critical', 'high', 'medium', 'low'] },
                  type: { type: 'string', enum: ['performance', 'reliability', 'cost'] },
                  issue: { type: 'string' },
                  impact: { type: 'string' },
                  recommendations: { type: 'array', items: { type: 'string' } }
                }
              }
            },
            summary: { type: 'string' }
          }
        }
      });

      setBottlenecks(result);
      toast.success('Bottleneck analysis complete');
    } catch (error) {
      console.error('Bottleneck analysis failed:', error);
      toast.error('Failed to analyze bottlenecks');
    } finally {
      setIsAnalyzing(false);
    }
  };

  const severityColors = {
    critical: 'bg-red-500/20 text-red-400 border-red-500/30',
    high: 'bg-orange-500/20 text-orange-400 border-orange-500/30',
    medium: 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30',
    low: 'bg-blue-500/20 text-blue-400 border-blue-500/30'
  };

  return (
    <Card className="bg-slate-900 border-slate-800">
      <CardHeader>
        <CardTitle className="text-white flex items-center gap-2">
          <Sparkles className="w-5 h-5 text-purple-400" />
          AI Bottleneck Detection
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {!bottlenecks ? (
          <div className="text-center py-8">
            <p className="text-slate-400 mb-4">
              Let AI analyze your workflows to identify bottlenecks and optimization opportunities
            </p>
            <Button
              onClick={analyzeBottlenecks}
              disabled={isAnalyzing}
              className="bg-purple-600 hover:bg-purple-700"
            >
              {isAnalyzing ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Analyzing...
                </>
              ) : (
                <>
                  <Sparkles className="w-4 h-4 mr-2" />
                  Analyze Bottlenecks
                </>
              )}
            </Button>
          </div>
        ) : (
          <>
            <div className="p-3 bg-slate-950 rounded-lg border border-slate-800">
              <p className="text-sm text-slate-300">{bottlenecks.summary}</p>
            </div>

            <div className="space-y-3 max-h-96 overflow-y-auto">
              {bottlenecks.bottlenecks.map((bottleneck, idx) => (
                <div key={idx} className="p-4 bg-slate-950 rounded-lg border border-slate-800">
                  <div className="flex items-start justify-between mb-2">
                    <div>
                      <div className="font-medium text-white mb-1">{bottleneck.workflow}</div>
                      <div className="flex items-center gap-2">
                        <Badge variant="outline" className={severityColors[bottleneck.severity]}>
                          {bottleneck.severity}
                        </Badge>
                        <Badge variant="outline" className="text-xs capitalize">
                          {bottleneck.type}
                        </Badge>
                      </div>
                    </div>
                    <AlertTriangle className="w-5 h-5 text-orange-400 flex-shrink-0" />
                  </div>
                  
                  <div className="space-y-2 mt-3">
                    <div>
                      <div className="text-xs text-slate-400 mb-1">Issue:</div>
                      <p className="text-sm text-slate-300">{bottleneck.issue}</p>
                    </div>
                    
                    <div>
                      <div className="text-xs text-slate-400 mb-1">Impact:</div>
                      <p className="text-sm text-slate-300">{bottleneck.impact}</p>
                    </div>
                    
                    {bottleneck.recommendations && bottleneck.recommendations.length > 0 && (
                      <div>
                        <div className="text-xs text-slate-400 mb-1">Recommendations:</div>
                        <ul className="space-y-1">
                          {bottleneck.recommendations.map((rec, i) => (
                            <li key={i} className="text-xs text-slate-400 pl-4">• {rec}</li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>

            <Button
              onClick={analyzeBottlenecks}
              disabled={isAnalyzing}
              variant="outline"
              className="w-full border-slate-700"
            >
              Re-analyze
            </Button>
          </>
        )}
      </CardContent>
    </Card>
  );
}