import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { AlertTriangle, TrendingUp, TrendingDown, Zap } from 'lucide-react';
import { base44 } from '@/api/base44Client';

export default function PredictiveAnomalyDetector({ metrics, agents }) {
  const [anomalies, setAnomalies] = useState([]);
  const [predictions, setPredictions] = useState(null);

  useEffect(() => {
    detectAnomalies();
  }, [metrics]);

  const detectAnomalies = async () => {
    // Statistical anomaly detection
    const costData = metrics.map(m => m.cost_cents || 0);
    const latencyData = metrics.map(m => m.latency_ms || 0);
    
    const detected = [];
    
    // Cost anomalies
    const avgCost = costData.reduce((a, b) => a + b, 0) / costData.length;
    const costStdDev = Math.sqrt(costData.reduce((sum, val) => sum + Math.pow(val - avgCost, 2), 0) / costData.length);
    metrics.forEach((m, _idx) => {
      if (m.cost_cents > avgCost + 2 * costStdDev) {
        detected.push({
          type: 'cost',
          severity: 'high',
          agent_id: m.agent_id,
          value: m.cost_cents,
          message: `Cost spike detected: ${(m.cost_cents / 100).toFixed(2)}$ (${((m.cost_cents - avgCost) / avgCost * 100).toFixed(0)}% above average)`
        });
      }
    });

    // Latency anomalies
    const avgLatency = latencyData.reduce((a, b) => a + b, 0) / latencyData.length;
    metrics.forEach((m, _idx) => {
      if (m.latency_ms > avgLatency * 2) {
        detected.push({
          type: 'latency',
          severity: 'medium',
          agent_id: m.agent_id,
          value: m.latency_ms,
          message: `Latency spike: ${m.latency_ms}ms (${((m.latency_ms - avgLatency) / avgLatency * 100).toFixed(0)}% slower)`
        });
      }
    });

    // Error rate anomalies
    const errorRate = metrics.filter(m => m.status === 'error').length / metrics.length;
    if (errorRate > 0.1) {
      detected.push({
        type: 'errors',
        severity: 'critical',
        message: `High error rate: ${(errorRate * 100).toFixed(1)}%`,
        value: errorRate
      });
    }

    setAnomalies(detected.slice(0, 10));

    // AI-powered predictions
    if (detected.length > 0) {
      predictFutureIssues(detected);
    }
  };

  const predictFutureIssues = async (currentAnomalies) => {
    try {
      const result = await base44.integrations.Core.InvokeLLM({
        prompt: `Based on these detected anomalies, predict potential future issues:
${JSON.stringify(currentAnomalies, null, 2)}

Provide predictions for the next 24 hours.`,
        response_json_schema: {
          type: "object",
          properties: {
            predictions: {
              type: "array",
              items: {
                type: "object",
                properties: {
                  issue: { type: "string" },
                  probability: { type: "string" },
                  preventive_action: { type: "string" }
                }
              }
            }
          }
        }
      });
      setPredictions(result);
    } catch (error) {
      console.error('Prediction failed:', error);
    }
  };

  const severityColors = {
    critical: 'bg-red-500/20 text-red-400 border-red-500/30',
    high: 'bg-orange-500/20 text-orange-400 border-orange-500/30',
    medium: 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30',
    low: 'bg-blue-500/20 text-blue-400 border-blue-500/30'
  };

  const typeIcons = {
    cost: TrendingUp,
    latency: Zap,
    errors: AlertTriangle
  };

  return (
    <Card className="bg-slate-900 border-slate-800">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-white">
          <AlertTriangle className="w-5 h-5 text-red-400" />
          Predictive Anomaly Detection
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {anomalies.length === 0 ? (
          <p className="text-slate-400 text-sm text-center py-8">
            No anomalies detected. System performance is normal.
          </p>
        ) : (
          <>
            <div className="space-y-2">
              {anomalies.map((anomaly, idx) => {
                const Icon = typeIcons[anomaly.type] || AlertTriangle;
                return (
                  <div key={idx} className="p-3 bg-slate-950 rounded-lg border border-slate-800">
                    <div className="flex items-start justify-between">
                      <div className="flex items-start gap-3 flex-1">
                        <Icon className="w-5 h-5 text-orange-400 flex-shrink-0 mt-0.5" />
                        <div className="flex-1">
                          <p className="text-sm text-white">{anomaly.message}</p>
                          {anomaly.agent_id && (
                            <p className="text-xs text-slate-500 mt-1">
                              Agent: {agents.find(a => a.id === anomaly.agent_id)?.name || 'Unknown'}
                            </p>
                          )}
                        </div>
                      </div>
                      <Badge variant="outline" className={severityColors[anomaly.severity]}>
                        {anomaly.severity}
                      </Badge>
                    </div>
                  </div>
                );
              })}
            </div>

            {predictions?.predictions && (
              <div className="mt-4 p-4 bg-slate-950 rounded-lg border border-purple-500/30">
                <h4 className="text-sm font-semibold text-white mb-3 flex items-center gap-2">
                  <TrendingDown className="w-4 h-4 text-purple-400" />
                  AI Predictions (Next 24h)
                </h4>
                <div className="space-y-2">
                  {predictions.predictions.map((pred, idx) => (
                    <div key={idx} className="text-sm">
                      <p className="text-slate-300">{pred.issue}</p>
                      <p className="text-xs text-slate-500 mt-1">Probability: {pred.probability}</p>
                      <p className="text-xs text-green-400 mt-1">Action: {pred.preventive_action}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </>
        )}
      </CardContent>
    </Card>
  );
}