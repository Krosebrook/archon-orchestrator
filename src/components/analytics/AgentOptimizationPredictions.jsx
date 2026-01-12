import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { base44 } from '@/api/base44Client';
import { AlertTriangle, TrendingUp, Zap, Activity, Brain } from 'lucide-react';
import { toast } from 'sonner';

export default function AgentOptimizationPredictions({ agents, metrics, runs, selectedAgent }) {
  const [predictions, setPredictions] = useState(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);

  const analyzePredictions = async () => {
    setIsAnalyzing(true);
    try {
      const filteredRuns = selectedAgent === 'all' 
        ? runs 
        : runs.filter(r => r.agent_id === selectedAgent);
      
      const filteredMetrics = selectedAgent === 'all'
        ? metrics
        : metrics.filter(m => m.agent_id === selectedAgent);

      const agentStats = {};
      filteredMetrics.forEach(m => {
        const agentId = m.agent_id;
        if (!agentStats[agentId]) {
          agentStats[agentId] = {
            totalCost: 0,
            totalLatency: 0,
            errorCount: 0,
            requestCount: 0
          };
        }
        agentStats[agentId].totalCost += (m.cost_cents || 0);
        agentStats[agentId].totalLatency += (m.latency_ms || 0);
        agentStats[agentId].requestCount += (m.request_count || 1);
        if (m.status === 'error') agentStats[agentId].errorCount++;
      });

      const analysisData = {
        agents: agents.map(a => ({
          id: a.id,
          name: a.name,
          model: a.config?.model,
          ...agentStats[a.id]
        })),
        runs: filteredRuns.map(r => ({
          state: r.state,
          duration_ms: r.duration_ms,
          agent_id: r.agent_id
        })),
        summary: {
          totalAgents: agents.length,
          totalRuns: filteredRuns.length,
          failureRate: filteredRuns.length > 0 
            ? (filteredRuns.filter(r => r.state === 'failed').length / filteredRuns.length * 100).toFixed(1)
            : 0
        }
      };

      const prompt = `
Analyze this agent performance data and predict potential bottlenecks and optimization opportunities:

${JSON.stringify(analysisData, null, 2)}

Provide predictions in the following JSON format:
{
  "bottlenecks": [
    {
      "type": "latency" | "cost" | "reliability" | "scalability",
      "severity": "high" | "medium" | "low",
      "agent": "agent name or 'all'",
      "description": "detailed description",
      "impact": "predicted impact",
      "probability": "percentage"
    }
  ],
  "recommendations": [
    {
      "title": "short title",
      "description": "detailed recommendation",
      "expectedImprovement": "expected improvement description",
      "effort": "low" | "medium" | "high"
    }
  ],
  "trends": {
    "costTrend": "increasing" | "stable" | "decreasing",
    "performanceTrend": "improving" | "stable" | "degrading",
    "reliabilityTrend": "improving" | "stable" | "degrading"
  }
}`;

      const result = await base44.integrations.Core.InvokeLLM({
        prompt,
        response_json_schema: {
          type: 'object',
          properties: {
            bottlenecks: { type: 'array' },
            recommendations: { type: 'array' },
            trends: { type: 'object' }
          }
        }
      });

      setPredictions(result);
      toast.success('Analysis complete');
    } catch (error) {
      console.error('Prediction analysis failed:', error);
      toast.error('Failed to analyze predictions');
    } finally {
      setIsAnalyzing(false);
    }
  };

  const severityColors = {
    high: 'bg-red-500/20 text-red-400 border-red-500/30',
    medium: 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30',
    low: 'bg-blue-500/20 text-blue-400 border-blue-500/30'
  };

  const effortColors = {
    low: 'bg-green-500/20 text-green-400',
    medium: 'bg-yellow-500/20 text-yellow-400',
    high: 'bg-red-500/20 text-red-400'
  };

  const trendIcons = {
    improving: { icon: TrendingUp, color: 'text-green-400' },
    stable: { icon: Activity, color: 'text-blue-400' },
    degrading: { icon: AlertTriangle, color: 'text-red-400' },
    increasing: { icon: TrendingUp, color: 'text-red-400' },
    decreasing: { icon: TrendingUp, color: 'text-green-400', rotate: true }
  };

  return (
    <div className="space-y-6">
      <Card className="bg-slate-900 border-slate-800">
        <CardContent className="pt-6">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <Brain className="w-8 h-8 text-purple-400" />
              <div>
                <h3 className="text-lg font-semibold text-white">AI-Powered Predictions</h3>
                <p className="text-sm text-slate-400">Analyze patterns and predict optimization opportunities</p>
              </div>
            </div>
            <Button
              onClick={analyzePredictions}
              disabled={isAnalyzing}
              className="bg-purple-600 hover:bg-purple-700"
            >
              {isAnalyzing ? (
                <>
                  <Activity className="w-4 h-4 mr-2 animate-spin" />
                  Analyzing...
                </>
              ) : (
                <>
                  <Zap className="w-4 h-4 mr-2" />
                  Run Analysis
                </>
              )}
            </Button>
          </div>
        </CardContent>
      </Card>

      {predictions && (
        <>
          {predictions.trends && (
            <Card className="bg-slate-900 border-slate-800">
              <CardHeader>
                <CardTitle className="text-white">Performance Trends</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {Object.entries(predictions.trends).map(([key, value]) => {
                    const trendConfig = trendIcons[value] || trendIcons.stable;
                    const Icon = trendConfig.icon;
                    return (
                      <div key={key} className="p-4 bg-slate-950 rounded-lg">
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-sm text-slate-400 capitalize">
                            {key.replace('Trend', '')}
                          </span>
                          <Icon className={`w-5 h-5 ${trendConfig.color} ${trendConfig.rotate ? 'rotate-180' : ''}`} />
                        </div>
                        <span className="text-white font-medium capitalize">{value}</span>
                      </div>
                    );
                  })}
                </div>
              </CardContent>
            </Card>
          )}

          {predictions.bottlenecks && predictions.bottlenecks.length > 0 && (
            <Card className="bg-slate-900 border-slate-800">
              <CardHeader>
                <CardTitle className="text-white flex items-center gap-2">
                  <AlertTriangle className="w-5 h-5 text-orange-400" />
                  Predicted Bottlenecks
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {predictions.bottlenecks.map((bottleneck, idx) => (
                    <div key={idx} className="p-4 bg-slate-950 rounded-lg border border-slate-800">
                      <div className="flex items-start justify-between mb-3">
                        <div className="flex items-center gap-2">
                          <Badge variant="outline" className={severityColors[bottleneck.severity]}>
                            {bottleneck.severity} severity
                          </Badge>
                          <Badge variant="outline" className="bg-slate-800 text-slate-400 capitalize">
                            {bottleneck.type}
                          </Badge>
                        </div>
                        {bottleneck.probability && (
                          <span className="text-xs text-slate-500">{bottleneck.probability} probability</span>
                        )}
                      </div>
                      <h4 className="text-white font-medium mb-2">{bottleneck.agent}</h4>
                      <p className="text-sm text-slate-300 mb-2">{bottleneck.description}</p>
                      <p className="text-sm text-slate-400 italic">Impact: {bottleneck.impact}</p>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {predictions.recommendations && predictions.recommendations.length > 0 && (
            <Card className="bg-slate-900 border-slate-800">
              <CardHeader>
                <CardTitle className="text-white flex items-center gap-2">
                  <TrendingUp className="w-5 h-5 text-green-400" />
                  Optimization Recommendations
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {predictions.recommendations.map((rec, idx) => (
                    <div key={idx} className="p-4 bg-slate-950 rounded-lg border border-slate-800">
                      <div className="flex items-start justify-between mb-3">
                        <h4 className="text-white font-medium">{rec.title}</h4>
                        <Badge variant="outline" className={effortColors[rec.effort]}>
                          {rec.effort} effort
                        </Badge>
                      </div>
                      <p className="text-sm text-slate-300 mb-3">{rec.description}</p>
                      <div className="p-3 bg-green-500/10 border border-green-500/30 rounded-lg">
                        <p className="text-sm text-green-400">
                          <strong>Expected Improvement:</strong> {rec.expectedImprovement}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </>
      )}

      {!predictions && !isAnalyzing && (
        <Card className="bg-slate-900 border-slate-800">
          <CardContent className="py-12 text-center">
            <Brain className="w-12 h-12 text-slate-600 mx-auto mb-4" />
            <p className="text-slate-400">Run AI analysis to get predictions and recommendations</p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}