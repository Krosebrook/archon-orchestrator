import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Loader2, TrendingUp, Sparkles } from 'lucide-react';
import { base44 } from '@/api/base44Client';
import { toast } from 'sonner';

export default function PredictiveInsights({ runs, metrics }) {
  const [predictions, setPredictions] = useState(null);
  const [isPredicting, setIsPredicting] = useState(false);

  const generatePredictions = async () => {
    setIsPredicting(true);
    try {
      const recentMetrics = metrics.slice(0, 100);
      const metricsSummary = {
        totalRuns: runs.length,
        avgCost: runs.reduce((sum, r) => sum + (r.cost_cents || 0), 0) / runs.length,
        avgLatency: recentMetrics.reduce((sum, m) => sum + (m.latency_ms || 0), 0) / recentMetrics.length,
        errorRate: runs.filter(r => r.state === 'failed').length / runs.length
      };

      const result = await base44.integrations.Core.InvokeLLM({
        prompt: `Based on historical workflow execution data, generate predictive insights and forecasts.

Current Metrics Summary:
${JSON.stringify(metricsSummary, null, 2)}

Generate predictions for:
1. Expected cost trends (next 7 days)
2. Performance forecasts
3. Potential issues to watch
4. Resource utilization projections
5. Actionable recommendations

Return JSON with predictions:`,
        response_json_schema: {
          type: 'object',
          properties: {
            costForecast: {
              type: 'object',
              properties: {
                next7Days: { type: 'number' },
                trend: { type: 'string', enum: ['increasing', 'stable', 'decreasing'] },
                confidence: { type: 'string', enum: ['high', 'medium', 'low'] }
              }
            },
            performanceForecast: {
              type: 'object',
              properties: {
                expectedLatency: { type: 'number' },
                trend: { type: 'string' },
                bottlenecks: { type: 'array', items: { type: 'string' } }
              }
            },
            risks: {
              type: 'array',
              items: {
                type: 'object',
                properties: {
                  risk: { type: 'string' },
                  probability: { type: 'string', enum: ['high', 'medium', 'low'] },
                  impact: { type: 'string' }
                }
              }
            },
            recommendations: {
              type: 'array',
              items: { type: 'string' }
            }
          }
        }
      });

      setPredictions(result);
      toast.success('Predictions generated');
    } catch (error) {
      console.error('Prediction generation failed:', error);
      toast.error('Failed to generate predictions');
    } finally {
      setIsPredicting(false);
    }
  };

  const getTrendColor = (trend) => {
    if (trend === 'increasing') return 'text-red-400';
    if (trend === 'decreasing') return 'text-green-400';
    return 'text-yellow-400';
  };

  const getProbabilityColor = (prob) => {
    if (prob === 'high') return 'bg-red-500/20 text-red-400 border-red-500/30';
    if (prob === 'medium') return 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30';
    return 'bg-blue-500/20 text-blue-400 border-blue-500/30';
  };

  return (
    <Card className="bg-slate-900 border-slate-800">
      <CardHeader>
        <CardTitle className="text-white flex items-center gap-2">
          <TrendingUp className="w-5 h-5 text-green-400" />
          Predictive Analytics
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {!predictions ? (
          <div className="text-center py-8">
            <p className="text-slate-400 mb-4">
              Generate AI-powered predictions for costs, performance, and potential issues
            </p>
            <Button
              onClick={generatePredictions}
              disabled={isPredicting}
              className="bg-green-600 hover:bg-green-700"
            >
              {isPredicting ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Generating...
                </>
              ) : (
                <>
                  <Sparkles className="w-4 h-4 mr-2" />
                  Generate Predictions
                </>
              )}
            </Button>
          </div>
        ) : (
          <>
            <div className="grid grid-cols-1 gap-3">
              <div className="p-4 bg-slate-950 rounded-lg border border-slate-800">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium text-white">Cost Forecast (7 days)</span>
                  <Badge variant="outline" className="text-xs">
                    {predictions.costForecast.confidence} confidence
                  </Badge>
                </div>
                <div className="text-2xl font-bold text-white mb-1">
                  ${predictions.costForecast.next7Days.toFixed(2)}
                </div>
                <div className={`text-sm ${getTrendColor(predictions.costForecast.trend)}`}>
                  Trend: {predictions.costForecast.trend}
                </div>
              </div>

              <div className="p-4 bg-slate-950 rounded-lg border border-slate-800">
                <div className="text-sm font-medium text-white mb-2">Performance Outlook</div>
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-slate-400">Expected Latency:</span>
                    <span className="text-white">{Math.round(predictions.performanceForecast.expectedLatency)}ms</span>
                  </div>
                  <div className="text-xs text-slate-400">
                    {predictions.performanceForecast.trend}
                  </div>
                </div>
              </div>
            </div>

            {predictions.risks && predictions.risks.length > 0 && (
              <div className="space-y-2">
                <div className="text-sm font-medium text-white">Potential Risks</div>
                {predictions.risks.map((risk, idx) => (
                  <div key={idx} className="p-3 bg-slate-950 rounded-lg border border-slate-800">
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-sm text-white">{risk.risk}</span>
                      <Badge variant="outline" className={getProbabilityColor(risk.probability)}>
                        {risk.probability}
                      </Badge>
                    </div>
                    <p className="text-xs text-slate-400">{risk.impact}</p>
                  </div>
                ))}
              </div>
            )}

            {predictions.recommendations && predictions.recommendations.length > 0 && (
              <div className="space-y-2">
                <div className="text-sm font-medium text-white">Recommendations</div>
                <ul className="space-y-1">
                  {predictions.recommendations.map((rec, idx) => (
                    <li key={idx} className="text-xs text-slate-400 pl-4">• {rec}</li>
                  ))}
                </ul>
              </div>
            )}

            <Button
              onClick={generatePredictions}
              disabled={isPredicting}
              variant="outline"
              className="w-full border-slate-700"
            >
              Refresh Predictions
            </Button>
          </>
        )}
      </CardContent>
    </Card>
  );
}