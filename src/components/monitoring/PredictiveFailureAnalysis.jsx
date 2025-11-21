import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { AlertTriangle, TrendingDown, Clock, Shield, Loader2 } from 'lucide-react';
import { base44 } from '@/api/base44Client';
import { toast } from 'sonner';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

export default function PredictiveFailureAnalysis({ agents, metrics, runs }) {
  const [predictions, setPredictions] = useState(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);

  useEffect(() => {
    if (metrics.length > 50) {
      analyzePredictivePatterns();
    }
  }, []);

  const analyzePredictivePatterns = async () => {
    setIsAnalyzing(true);
    try {
      // Build historical performance profile
      const agentProfiles = {};
      agents.forEach(agent => {
        const agentMetrics = metrics.filter(m => m.agent_id === agent.id);
        const agentRuns = runs.filter(r => r.agent_id === agent.id);
        
        if (agentMetrics.length > 10) {
          const recent = agentMetrics.slice(0, 20);
          const historical = agentMetrics.slice(20, 100);
          
          agentProfiles[agent.id] = {
            name: agent.name,
            status: agent.status,
            recent_error_rate: recent.filter(m => m.status === 'error').length / recent.length,
            historical_error_rate: historical.filter(m => m.status === 'error').length / Math.max(historical.length, 1),
            recent_avg_latency: recent.reduce((s, m) => s + (m.latency_ms || 0), 0) / recent.length,
            historical_avg_latency: historical.reduce((s, m) => s + (m.latency_ms || 0), 0) / Math.max(historical.length, 1),
            recent_avg_cpu: recent.reduce((s, m) => s + (m.cpu_usage_percent || 0), 0) / recent.length,
            historical_avg_cpu: historical.reduce((s, m) => s + (m.cpu_usage_percent || 0), 0) / Math.max(historical.length, 1),
            recent_failures: agentRuns.filter(r => r.status === 'failed').length,
            total_runs: agentRuns.length,
            last_failure: agentRuns.find(r => r.status === 'failed')?.finished_at
          };
        }
      });

      const result = await base44.integrations.Core.InvokeLLM({
        prompt: `As a predictive AI system analyst, analyze these agent performance profiles to predict potential failures:

${JSON.stringify(agentProfiles, null, 2)}

Based on historical data and current trends, predict:
1. Which agents are at risk of failure in the next 24 hours
2. Estimated time to failure
3. Root cause analysis
4. Preventive measures with specific steps

Focus on agents showing degradation patterns, increasing error rates, or resource exhaustion trends.`,
        response_json_schema: {
          type: "object",
          properties: {
            risk_agents: {
              type: "array",
              items: {
                type: "object",
                properties: {
                  agent_id: { type: "string" },
                  agent_name: { type: "string" },
                  failure_probability: { type: "number" },
                  estimated_time_to_failure: { type: "string" },
                  risk_factors: { type: "array", items: { type: "string" } },
                  root_cause: { type: "string" },
                  preventive_measures: { type: "array", items: { type: "string" } },
                  severity: { type: "string", enum: ["low", "medium", "high", "critical"] }
                }
              }
            },
            overall_risk_score: { type: "number" },
            confidence: { type: "number" }
          }
        }
      });

      setPredictions({ ...result, timestamp: new Date() });
      toast.success('Predictive analysis complete');
    } catch (error) {
      console.error('Predictive analysis failed:', error);
      toast.error('Failed to analyze failure patterns');
    } finally {
      setIsAnalyzing(false);
    }
  };

  const severityConfig = {
    critical: { color: 'text-red-400', bg: 'bg-red-500/20', border: 'border-red-500/30' },
    high: { color: 'text-orange-400', bg: 'bg-orange-500/20', border: 'border-orange-500/30' },
    medium: { color: 'text-yellow-400', bg: 'bg-yellow-500/20', border: 'border-yellow-500/30' },
    low: { color: 'text-blue-400', bg: 'bg-blue-500/20', border: 'border-blue-500/30' }
  };

  const getRiskLevel = (score) => {
    if (score >= 75) return 'critical';
    if (score >= 50) return 'high';
    if (score >= 25) return 'medium';
    return 'low';
  };

  const riskLevel = predictions ? getRiskLevel(predictions.overall_risk_score) : 'low';
  const config = severityConfig[riskLevel];

  return (
    <Card className="bg-slate-900 border-slate-800">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2 text-white">
            <TrendingDown className="w-5 h-5 text-red-400" />
            Predictive Failure Analysis
          </CardTitle>
          <Button
            onClick={analyzePredictivePatterns}
            disabled={isAnalyzing}
            size="sm"
            className="bg-red-600 hover:bg-red-700"
          >
            {isAnalyzing ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Analyzing...
              </>
            ) : (
              'Analyze'
            )}
          </Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {!predictions && !isAnalyzing && (
          <div className="text-center py-12">
            <Shield className="w-12 h-12 text-slate-600 mx-auto mb-3" />
            <p className="text-slate-400 text-sm">
              Click "Analyze" to predict potential agent failures
            </p>
            <p className="text-xs text-slate-500 mt-1">
              Uses AI to analyze historical patterns and current trends
            </p>
          </div>
        )}

        {predictions && (
          <>
            <div className={`p-4 rounded-lg ${config.bg} border ${config.border}`}>
              <div className="flex items-center justify-between mb-2">
                <div>
                  <h4 className="text-sm font-semibold text-white">Overall Risk Score</h4>
                  <p className="text-2xl font-bold text-white mt-1">
                    {predictions.overall_risk_score.toFixed(1)}%
                  </p>
                </div>
                <Badge variant="outline" className={`${config.color} ${config.bg} ${config.border}`}>
                  {riskLevel.toUpperCase()}
                </Badge>
              </div>
              <div className="flex items-center gap-2 mt-3 text-xs text-slate-400">
                <Shield className="w-3 h-3" />
                Confidence: {(predictions.confidence * 100).toFixed(0)}%
              </div>
            </div>

            {predictions.risk_agents?.length > 0 ? (
              <div className="space-y-3">
                <h4 className="text-sm font-semibold text-white">At-Risk Agents</h4>
                {predictions.risk_agents.map((risk, idx) => {
                  const riskConfig = severityConfig[risk.severity];
                  return (
                    <div key={idx} className="p-4 bg-slate-950 rounded-lg border border-slate-800">
                      <div className="flex items-start justify-between mb-3">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <h5 className="text-sm font-medium text-white">{risk.agent_name}</h5>
                            <Badge variant="outline" className={`${riskConfig.color} ${riskConfig.bg}`}>
                              {risk.severity}
                            </Badge>
                          </div>
                          <p className="text-xs text-slate-400">
                            Failure probability: {(risk.failure_probability * 100).toFixed(0)}%
                          </p>
                        </div>
                        <div className="flex items-center gap-1 text-xs text-orange-400">
                          <Clock className="w-3 h-3" />
                          {risk.estimated_time_to_failure}
                        </div>
                      </div>

                      <div className="space-y-3 text-xs">
                        <div>
                          <p className="text-slate-500 mb-1">Root Cause:</p>
                          <p className="text-slate-300">{risk.root_cause}</p>
                        </div>

                        {risk.risk_factors?.length > 0 && (
                          <div>
                            <p className="text-slate-500 mb-1">Risk Factors:</p>
                            <ul className="space-y-1">
                              {risk.risk_factors.map((factor, i) => (
                                <li key={i} className="text-red-400 flex items-start gap-2">
                                  <AlertTriangle className="w-3 h-3 flex-shrink-0 mt-0.5" />
                                  {factor}
                                </li>
                              ))}
                            </ul>
                          </div>
                        )}

                        {risk.preventive_measures?.length > 0 && (
                          <div className="p-3 bg-slate-900 rounded border border-green-500/30">
                            <p className="text-green-400 mb-2 font-medium">Preventive Measures:</p>
                            <ol className="space-y-1 list-decimal list-inside">
                              {risk.preventive_measures.map((measure, i) => (
                                <li key={i} className="text-slate-300">{measure}</li>
                              ))}
                            </ol>
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="text-center py-8">
                <Shield className="w-12 h-12 text-green-400 mx-auto mb-3" />
                <p className="text-green-400 font-medium">No critical risks detected</p>
                <p className="text-xs text-slate-500 mt-1">All agents are performing within expected parameters</p>
              </div>
            )}

            <p className="text-xs text-slate-500 text-center">
              Analysis completed: {new Date(predictions.timestamp).toLocaleString()}
            </p>
          </>
        )}
      </CardContent>
    </Card>
  );
}