import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Sparkles, Loader2, TrendingUp, AlertTriangle, Lightbulb } from 'lucide-react';
import { base44 } from '@/api/base44Client';
import { toast } from 'sonner';

export default function AIInsightsAssistant({ metrics, agents, runs, reviews }) {
  const [insights, setInsights] = useState(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);

  const analyzeWithAI = async () => {
    setIsAnalyzing(true);
    try {
      const analysisData = {
        totalMetrics: metrics.length,
        totalRuns: runs.length,
        avgCost: metrics.reduce((sum, m) => sum + (m.cost_cents || 0), 0) / Math.max(metrics.length, 1),
        avgLatency: metrics.reduce((sum, m) => sum + (m.latency_ms || 0), 0) / Math.max(metrics.length, 1),
        successRate: runs.filter(r => r.status === 'completed').length / Math.max(runs.length, 1),
        topAgents: agents.slice(0, 5).map(a => ({ name: a.name, status: a.status })),
        avgRating: reviews.reduce((sum, r) => sum + r.rating, 0) / Math.max(reviews.length, 1),
        recentErrors: runs.filter(r => r.status === 'failed').slice(0, 5).map(r => r.error_message)
      };

      const result = await base44.integrations.Core.InvokeLLM({
        prompt: `Analyze this agent analytics data and provide actionable insights:
${JSON.stringify(analysisData, null, 2)}

Provide a structured analysis with:
1. **Performance Summary**: Brief overview of agent health and efficiency
2. **Key Trends**: 3-5 notable patterns or changes
3. **Critical Issues**: Any concerning metrics or failures
4. **Optimization Opportunities**: Specific, actionable recommendations

Be concise, data-driven, and focus on actionable insights.`,
        response_json_schema: {
          type: "object",
          properties: {
            summary: { type: "string" },
            trends: { type: "array", items: { 
              type: "object",
              properties: {
                title: { type: "string" },
                description: { type: "string" },
                severity: { type: "string", enum: ["info", "warning", "critical"] }
              }
            }},
            issues: { type: "array", items: { type: "string" }},
            recommendations: { type: "array", items: {
              type: "object",
              properties: {
                title: { type: "string" },
                action: { type: "string" },
                impact: { type: "string" }
              }
            }}
          }
        }
      });

      setInsights(result);
      toast.success('AI analysis complete');
    } catch (error) {
      console.error('AI analysis failed:', error);
      toast.error('Failed to generate insights');
    } finally {
      setIsAnalyzing(false);
    }
  };

  const severityConfig = {
    info: { icon: TrendingUp, color: 'text-blue-400' },
    warning: { icon: AlertTriangle, color: 'text-yellow-400' },
    critical: { icon: AlertTriangle, color: 'text-red-400' }
  };

  return (
    <Card className="bg-slate-900 border-slate-800">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2 text-white">
            <Sparkles className="w-5 h-5 text-purple-400" />
            AI Insights Assistant
          </CardTitle>
          <Button
            onClick={analyzeWithAI}
            disabled={isAnalyzing}
            className="bg-purple-600 hover:bg-purple-700"
            size="sm"
          >
            {isAnalyzing ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Analyzing...
              </>
            ) : (
              <>
                <Sparkles className="w-4 h-4 mr-2" />
                Analyze with AI
              </>
            )}
          </Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {!insights && !isAnalyzing && (
          <p className="text-slate-400 text-sm text-center py-8">
            Click "Analyze with AI" to get intelligent insights about your agent performance
          </p>
        )}

        {insights && (
          <>
            <div className="p-4 bg-slate-950 rounded-lg border border-slate-800">
              <h4 className="text-sm font-semibold text-white mb-2">Summary</h4>
              <p className="text-slate-300 text-sm">{insights.summary}</p>
            </div>

            {insights.trends?.length > 0 && (
              <div className="space-y-2">
                <h4 className="text-sm font-semibold text-white">Key Trends</h4>
                {insights.trends.map((trend, idx) => {
                  const Icon = severityConfig[trend.severity]?.icon || TrendingUp;
                  const colorClass = severityConfig[trend.severity]?.color || 'text-slate-400';
                  return (
                    <div key={idx} className="p-3 bg-slate-950 rounded-lg border border-slate-800">
                      <div className="flex items-start gap-3">
                        <Icon className={`w-5 h-5 ${colorClass} flex-shrink-0 mt-0.5`} />
                        <div>
                          <h5 className="text-sm font-medium text-white">{trend.title}</h5>
                          <p className="text-xs text-slate-400 mt-1">{trend.description}</p>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}

            {insights.recommendations?.length > 0 && (
              <div className="space-y-2">
                <h4 className="text-sm font-semibold text-white flex items-center gap-2">
                  <Lightbulb className="w-4 h-4 text-yellow-400" />
                  Optimization Recommendations
                </h4>
                {insights.recommendations.map((rec, idx) => (
                  <div key={idx} className="p-3 bg-slate-950 rounded-lg border border-slate-800">
                    <h5 className="text-sm font-medium text-white">{rec.title}</h5>
                    <p className="text-xs text-slate-400 mt-1">{rec.action}</p>
                    <p className="text-xs text-green-400 mt-1">Impact: {rec.impact}</p>
                  </div>
                ))}
              </div>
            )}
          </>
        )}
      </CardContent>
    </Card>
  );
}