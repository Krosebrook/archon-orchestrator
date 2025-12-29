import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Brain,
  TrendingUp,
  AlertTriangle,
  Zap,
  DollarSign,
  CheckCircle2,
  XCircle,
  Clock,
  Activity,
} from 'lucide-react';
import { base44 } from '@/api/base44Client';
import { toast } from 'sonner';

export default function AIInsightsDashboard({ workflowId }) {
  const [insights, setInsights] = useState([]);
  const [anomalies, setAnomalies] = useState([]);
  const [loading, setLoading] = useState(true);
  const [analyzing, setAnalyzing] = useState(false);

  useEffect(() => {
    loadData();
  }, [workflowId]);

  const loadData = async () => {
    try {
      const [insightsData, anomaliesData] = await Promise.all([
        base44.entities.AIInsight.filter({ workflow_id: workflowId }),
        base44.entities.WorkflowAnomaly.filter({ workflow_id: workflowId }),
      ]);

      setInsights(insightsData.sort((a, b) => new Date(b.created_date) - new Date(a.created_date)));
      setAnomalies(anomaliesData.sort((a, b) => new Date(b.detected_at) - new Date(a.detected_at)));
    } catch (error) {
      toast.error('Failed to load insights');
    } finally {
      setLoading(false);
    }
  };

  const runAnalysis = async () => {
    setAnalyzing(true);
    try {
      const response = await base44.functions.invoke('analyzeWorkflowPerformance', {
        workflow_id: workflowId,
        lookback_days: 7,
      });

      toast.success(`Generated ${response.data.insights.length} new insights`);
      await loadData();
    } catch (error) {
      toast.error('Analysis failed');
    } finally {
      setAnalyzing(false);
    }
  };

  const applyRecommendation = async (insightId) => {
    try {
      await base44.entities.AIInsight.update(insightId, {
        status: 'applied',
        applied_at: new Date().toISOString(),
      });
      toast.success('Recommendation applied');
      loadData();
    } catch (error) {
      toast.error('Failed to apply recommendation');
    }
  };

  const severityColors = {
    info: 'bg-blue-900/30 text-blue-300 border-blue-700',
    low: 'bg-green-900/30 text-green-300 border-green-700',
    medium: 'bg-yellow-900/30 text-yellow-300 border-yellow-700',
    high: 'bg-orange-900/30 text-orange-300 border-orange-700',
    critical: 'bg-red-900/30 text-red-300 border-red-700',
  };

  const insightIcons = {
    performance: TrendingUp,
    optimization: Zap,
    anomaly: AlertTriangle,
    automation: Activity,
    cost: DollarSign,
    reliability: CheckCircle2,
  };

  if (loading) {
    return <div className="text-slate-400">Loading AI insights...</div>;
  }

  return (
    <div className="space-y-6">
      <Card className="bg-slate-900 border-slate-800">
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="text-white flex items-center gap-2">
              <Brain className="w-5 h-5 text-purple-400" />
              AI Insights & Anomaly Detection
            </CardTitle>
            <Button
              onClick={runAnalysis}
              disabled={analyzing}
              className="bg-purple-600 hover:bg-purple-700"
            >
              {analyzing ? 'Analyzing...' : 'Run AI Analysis'}
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="insights">
            <TabsList className="bg-slate-800">
              <TabsTrigger value="insights">
                Insights ({insights.filter(i => i.status === 'new').length})
              </TabsTrigger>
              <TabsTrigger value="anomalies">
                Anomalies ({anomalies.filter(a => a.status === 'detected').length})
              </TabsTrigger>
            </TabsList>

            <TabsContent value="insights" className="space-y-3">
              {insights.length === 0 ? (
                <div className="text-center py-12 text-slate-400">
                  <Brain className="w-16 h-16 mx-auto mb-4 text-slate-600" />
                  <p>No insights yet. Run AI analysis to get started.</p>
                </div>
              ) : (
                insights.map((insight) => {
                  const Icon = insightIcons[insight.insight_type];
                  return (
                    <Card key={insight.id} className="bg-slate-800 border-slate-700">
                      <CardContent className="pt-6">
                        <div className="flex items-start gap-4">
                          <div className={`p-2 rounded-lg ${severityColors[insight.severity]}`}>
                            <Icon className="w-5 h-5" />
                          </div>
                          <div className="flex-1 space-y-3">
                            <div>
                              <div className="flex items-center gap-2 mb-1">
                                <h4 className="font-medium text-white">{insight.title}</h4>
                                <Badge className={severityColors[insight.severity]}>
                                  {insight.severity}
                                </Badge>
                                {insight.automation_candidate && (
                                  <Badge className="bg-purple-900/30 text-purple-300">
                                    Auto-fixable
                                  </Badge>
                                )}
                              </div>
                              <p className="text-sm text-slate-400">{insight.description}</p>
                            </div>

                            {insight.metrics && (
                              <div className="grid grid-cols-3 gap-4 text-xs">
                                <div>
                                  <span className="text-slate-500">Baseline</span>
                                  <div className="text-white font-medium">
                                    {insight.metrics.baseline_value?.toFixed(2)}
                                  </div>
                                </div>
                                <div>
                                  <span className="text-slate-500">Current</span>
                                  <div className="text-white font-medium">
                                    {insight.metrics.current_value?.toFixed(2)}
                                  </div>
                                </div>
                                <div>
                                  <span className="text-slate-500">Deviation</span>
                                  <div className={`font-medium ${insight.metrics.deviation_percentage > 0 ? 'text-red-400' : 'text-green-400'}`}>
                                    {insight.metrics.deviation_percentage?.toFixed(1)}%
                                  </div>
                                </div>
                              </div>
                            )}

                            {insight.recommendation && (
                              <div className="bg-slate-900 rounded p-3 text-sm">
                                <div className="text-slate-300 mb-2">
                                  <strong>Recommendation:</strong> {insight.recommendation.action}
                                </div>
                                <div className="flex items-center justify-between">
                                  <span className="text-slate-500">
                                    Expected: {insight.recommendation.expected_improvement}
                                  </span>
                                  {insight.status === 'new' && (
                                    <Button
                                      size="sm"
                                      onClick={() => applyRecommendation(insight.id)}
                                      className="bg-blue-600"
                                    >
                                      Apply
                                    </Button>
                                  )}
                                  {insight.status === 'applied' && (
                                    <Badge className="bg-green-900/30 text-green-300">
                                      <CheckCircle2 className="w-3 h-3 mr-1" />
                                      Applied
                                    </Badge>
                                  )}
                                </div>
                              </div>
                            )}
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  );
                })
              )}
            </TabsContent>

            <TabsContent value="anomalies" className="space-y-3">
              {anomalies.length === 0 ? (
                <div className="text-center py-12 text-slate-400">
                  <CheckCircle2 className="w-16 h-16 mx-auto mb-4 text-green-600" />
                  <p>No anomalies detected. System running normally.</p>
                </div>
              ) : (
                anomalies.slice(0, 10).map((anomaly) => (
                  <Card key={anomaly.id} className="bg-slate-800 border-slate-700">
                    <CardContent className="pt-6">
                      <div className="flex items-start gap-4">
                        <AlertTriangle className={`w-5 h-5 ${anomaly.severity_score > 0.8 ? 'text-red-400' : 'text-yellow-400'}`} />
                        <div className="flex-1 space-y-2">
                          <div className="flex items-center justify-between">
                            <span className="text-white font-medium">
                              {anomaly.anomaly_type.replace(/_/g, ' ').toUpperCase()}
                            </span>
                            <Badge className={`${anomaly.severity_score > 0.8 ? 'bg-red-900/30 text-red-300' : 'bg-yellow-900/30 text-yellow-300'}`}>
                              Severity: {(anomaly.severity_score * 100).toFixed(0)}%
                            </Badge>
                          </div>
                          
                          {anomaly.root_cause_analysis && (
                            <div className="text-sm text-slate-400">
                              <strong>Probable causes:</strong>
                              <ul className="list-disc list-inside mt-1">
                                {anomaly.root_cause_analysis.probable_causes?.slice(0, 3).map((cause, i) => (
                                  <li key={i}>{cause}</li>
                                ))}
                              </ul>
                            </div>
                          )}

                          <div className="flex items-center gap-4 text-xs text-slate-500">
                            <span className="flex items-center gap-1">
                              <Clock className="w-3 h-3" />
                              {new Date(anomaly.detected_at).toLocaleString()}
                            </span>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))
              )}
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
}