import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Brain, Loader2, CheckCircle, AlertTriangle, TrendingUp, Zap } from 'lucide-react';
import { base44 } from '@/api/base44Client';
import { toast } from 'sonner';

export default function AIHealthSummary({ agents, metrics, runs }) {
  const [summary, setSummary] = useState(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [autoRefresh, setAutoRefresh] = useState(true);

  useEffect(() => {
    if (autoRefresh) {
      generateSummary();
      const interval = setInterval(generateSummary, 60000); // Every minute
      return () => clearInterval(interval);
    }
  }, [autoRefresh]);

  const generateSummary = async () => {
    setIsGenerating(true);
    try {
      const recentMetrics = metrics.slice(0, 100);
      const recentRuns = runs.slice(0, 50);
      
      const healthData = {
        total_agents: agents.length,
        active_agents: agents.filter(a => a.status === 'active').length,
        error_agents: agents.filter(a => a.status === 'error').length,
        avg_latency: recentMetrics.reduce((s, m) => s + (m.latency_ms || 0), 0) / Math.max(recentMetrics.length, 1),
        avg_cost: recentMetrics.reduce((s, m) => s + (m.cost_cents || 0), 0) / Math.max(recentMetrics.length, 1),
        error_rate: recentMetrics.filter(m => m.status === 'error').length / Math.max(recentMetrics.length, 1),
        success_rate: recentRuns.filter(r => r.status === 'completed').length / Math.max(recentRuns.length, 1),
        avg_cpu: recentMetrics.reduce((s, m) => s + (m.cpu_usage_percent || 0), 0) / Math.max(recentMetrics.length, 1),
        avg_memory: recentMetrics.reduce((s, m) => s + (m.memory_mb || 0), 0) / Math.max(recentMetrics.length, 1)
      };

      const result = await base44.integrations.Core.InvokeLLM({
        prompt: `You are an AI operations assistant. Provide a natural language summary of agent health:

Current System State:
${JSON.stringify(healthData, null, 2)}

Provide:
1. **Overall Health**: One sentence health assessment
2. **Status**: "healthy", "warning", or "critical"
3. **Immediate Actions**: 2-3 specific, actionable steps the team should take RIGHT NOW (prioritized by urgency)
4. **Key Metrics**: 3-4 notable statistics worth highlighting
5. **Trend**: "improving", "stable", or "degrading"

Be concise, direct, and focused on actionable intelligence. Use natural language that a human operator would understand.`,
        response_json_schema: {
          type: "object",
          properties: {
            health: { type: "string" },
            status: { type: "string", enum: ["healthy", "warning", "critical"] },
            actions: { 
              type: "array", 
              items: {
                type: "object",
                properties: {
                  priority: { type: "string", enum: ["urgent", "high", "medium"] },
                  action: { type: "string" },
                  reason: { type: "string" }
                }
              }
            },
            metrics: { type: "array", items: { type: "string" } },
            trend: { type: "string", enum: ["improving", "stable", "degrading"] }
          }
        }
      });

      setSummary({ ...result, timestamp: new Date() });
      toast.success('Health summary updated');
    } catch (error) {
      console.error('Failed to generate summary:', error);
      toast.error('Failed to generate health summary');
    } finally {
      setIsGenerating(false);
    }
  };

  const statusConfig = {
    healthy: { icon: CheckCircle, color: 'text-green-400', bg: 'bg-green-500/20' },
    warning: { icon: AlertTriangle, color: 'text-yellow-400', bg: 'bg-yellow-500/20' },
    critical: { icon: AlertTriangle, color: 'text-red-400', bg: 'bg-red-500/20' }
  };

  const trendConfig = {
    improving: { icon: TrendingUp, color: 'text-green-400', label: 'Improving' },
    stable: { icon: Zap, color: 'text-blue-400', label: 'Stable' },
    degrading: { icon: TrendingUp, color: 'text-red-400', label: 'Degrading', rotate: true }
  };

  const priorityColors = {
    urgent: 'bg-red-500/20 text-red-400 border-red-500/30',
    high: 'bg-orange-500/20 text-orange-400 border-orange-500/30',
    medium: 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30'
  };

  return (
    <Card className="bg-slate-900 border-slate-800">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2 text-white">
            <Brain className="w-5 h-5 text-blue-400" />
            AI Health Summary
          </CardTitle>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setAutoRefresh(!autoRefresh)}
              className={autoRefresh ? 'border-blue-500 text-blue-400' : ''}
            >
              {autoRefresh ? 'Auto ✓' : 'Manual'}
            </Button>
            <Button
              onClick={generateSummary}
              disabled={isGenerating}
              size="sm"
              className="bg-blue-600 hover:bg-blue-700"
            >
              {isGenerating ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                'Refresh'
              )}
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {!summary && !isGenerating && (
          <p className="text-slate-400 text-sm text-center py-8">
            Click "Refresh" to generate AI-powered health summary
          </p>
        )}

        {summary && (
          <>
            <div className={`p-4 rounded-lg ${statusConfig[summary.status]?.bg} border border-slate-700`}>
              <div className="flex items-start gap-3">
                {React.createElement(statusConfig[summary.status]?.icon, { 
                  className: `w-6 h-6 ${statusConfig[summary.status]?.color} flex-shrink-0 mt-0.5` 
                })}
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2">
                    <Badge variant="outline" className={statusConfig[summary.status]?.color}>
                      {summary.status.toUpperCase()}
                    </Badge>
                    {React.createElement(trendConfig[summary.trend]?.icon, {
                      className: `w-4 h-4 ${trendConfig[summary.trend]?.color} ${trendConfig[summary.trend]?.rotate ? 'rotate-180' : ''}`
                    })}
                    <span className={`text-xs ${trendConfig[summary.trend]?.color}`}>
                      {trendConfig[summary.trend]?.label}
                    </span>
                  </div>
                  <p className="text-white font-medium">{summary.health}</p>
                </div>
              </div>
            </div>

            {summary.actions?.length > 0 && (
              <div className="space-y-2">
                <h4 className="text-sm font-semibold text-white">Immediate Actions Required</h4>
                {summary.actions.map((action, idx) => (
                  <div key={idx} className="p-3 bg-slate-950 rounded-lg border border-slate-800">
                    <div className="flex items-start gap-3">
                      <Badge variant="outline" className={priorityColors[action.priority]}>
                        {action.priority}
                      </Badge>
                      <div className="flex-1">
                        <p className="text-sm font-medium text-white">{action.action}</p>
                        <p className="text-xs text-slate-400 mt-1">{action.reason}</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {summary.metrics?.length > 0 && (
              <div className="p-3 bg-slate-950 rounded-lg">
                <h4 className="text-xs font-semibold text-slate-400 mb-2">Key Metrics</h4>
                <ul className="space-y-1">
                  {summary.metrics.map((metric, idx) => (
                    <li key={idx} className="text-xs text-slate-300 flex items-start gap-2">
                      <span className="text-blue-400">•</span>
                      <span>{metric}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            <p className="text-xs text-slate-500 text-center">
              Last updated: {new Date(summary.timestamp).toLocaleTimeString()}
            </p>
          </>
        )}
      </CardContent>
    </Card>
  );
}