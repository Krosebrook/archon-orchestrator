import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Lightbulb, TrendingUp, DollarSign, Zap, CheckCircle, Loader2 } from 'lucide-react';
import { base44 } from '@/api/base44Client';
import { toast } from 'sonner';

export default function AIOptimizationSuggestions({ metrics, agents, runs, skills }) {
  const [suggestions, setSuggestions] = useState([]);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [appliedSuggestions, setAppliedSuggestions] = useState(new Set());

  useEffect(() => {
    if (metrics.length > 0 && agents.length > 0) {
      generateSuggestions();
    }
  }, [metrics, agents]);

  const generateSuggestions = async () => {
    setIsAnalyzing(true);
    try {
      // Analyze performance data
      const agentPerformance = agents.map(agent => {
        const agentMetrics = metrics.filter(m => m.agent_id === agent.id);
        const agentRuns = runs.filter(r => r.agent_id === agent.id);
        return {
          id: agent.id,
          name: agent.name,
          provider: agent.config?.provider,
          model: agent.config?.model,
          avgCost: agentMetrics.reduce((sum, m) => sum + (m.cost_cents || 0), 0) / Math.max(agentMetrics.length, 1),
          avgLatency: agentMetrics.reduce((sum, m) => sum + (m.latency_ms || 0), 0) / Math.max(agentMetrics.length, 1),
          successRate: agentRuns.filter(r => r.status === 'completed').length / Math.max(agentRuns.length, 1),
          totalRuns: agentRuns.length
        };
      });

      const result = await base44.integrations.Core.InvokeLLM({
        prompt: `Analyze this agent performance data and suggest specific optimizations:
${JSON.stringify(agentPerformance, null, 2)}

For each optimization, provide:
1. Specific agent/workflow to optimize
2. Concrete action (model change, skill addition, config adjustment)
3. Expected impact (cost reduction %, latency improvement, etc.)
4. Implementation difficulty (easy/medium/hard)

Focus on high-impact, actionable optimizations.`,
        response_json_schema: {
          type: "object",
          properties: {
            optimizations: {
              type: "array",
              items: {
                type: "object",
                properties: {
                  title: { type: "string" },
                  agent_id: { type: "string" },
                  action: { type: "string" },
                  impact: { type: "string" },
                  category: { type: "string", enum: ["cost", "performance", "reliability", "skills"] },
                  difficulty: { type: "string", enum: ["easy", "medium", "hard"] },
                  expected_savings: { type: "string" }
                }
              }
            }
          }
        }
      });

      setSuggestions(result.optimizations || []);
      toast.success('Optimization suggestions generated');
    } catch (error) {
      console.error('Failed to generate suggestions:', error);
      toast.error('Failed to generate suggestions');
    } finally {
      setIsAnalyzing(false);
    }
  };

  const applySuggestion = (suggestionIdx) => {
    setAppliedSuggestions(prev => new Set([...prev, suggestionIdx]));
    toast.success('Optimization applied (simulated)');
  };

  const categoryConfig = {
    cost: { icon: DollarSign, color: 'text-green-400', bg: 'bg-green-500/20' },
    performance: { icon: Zap, color: 'text-yellow-400', bg: 'bg-yellow-500/20' },
    reliability: { icon: CheckCircle, color: 'text-blue-400', bg: 'bg-blue-500/20' },
    skills: { icon: Lightbulb, color: 'text-purple-400', bg: 'bg-purple-500/20' }
  };

  const difficultyColors = {
    easy: 'bg-green-500/20 text-green-400',
    medium: 'bg-yellow-500/20 text-yellow-400',
    hard: 'bg-red-500/20 text-red-400'
  };

  return (
    <Card className="bg-slate-900 border-slate-800">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2 text-white">
            <Lightbulb className="w-5 h-5 text-yellow-400" />
            AI Optimization Suggestions
          </CardTitle>
          {suggestions.length > 0 && (
            <Button
              onClick={generateSuggestions}
              disabled={isAnalyzing}
              variant="outline"
              size="sm"
              className="border-slate-700"
            >
              {isAnalyzing ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Refresh'}
            </Button>
          )}
        </div>
      </CardHeader>
      <CardContent>
        {isAnalyzing && suggestions.length === 0 ? (
          <div className="text-center py-8">
            <Loader2 className="w-8 h-8 animate-spin text-purple-400 mx-auto mb-3" />
            <p className="text-slate-400 text-sm">Analyzing performance data...</p>
          </div>
        ) : suggestions.length === 0 ? (
          <p className="text-slate-400 text-sm text-center py-8">
            No optimization suggestions available yet
          </p>
        ) : (
          <div className="space-y-3">
            {suggestions.map((suggestion, idx) => {
              const config = categoryConfig[suggestion.category] || categoryConfig.performance;
              const Icon = config.icon;
              const isApplied = appliedSuggestions.has(idx);

              return (
                <div key={idx} className={`p-4 bg-slate-950 rounded-lg border ${isApplied ? 'border-green-500/30' : 'border-slate-800'}`}>
                  <div className="flex items-start gap-3">
                    <div className={`w-10 h-10 rounded-lg ${config.bg} flex items-center justify-center flex-shrink-0`}>
                      <Icon className={`w-5 h-5 ${config.color}`} />
                    </div>
                    <div className="flex-1">
                      <div className="flex items-start justify-between mb-2">
                        <h4 className="text-sm font-semibold text-white">{suggestion.title}</h4>
                        <Badge variant="outline" className={difficultyColors[suggestion.difficulty]}>
                          {suggestion.difficulty}
                        </Badge>
                      </div>
                      <p className="text-xs text-slate-400 mb-2">{suggestion.action}</p>
                      <div className="flex items-center justify-between mt-3">
                        <div className="space-y-1">
                          <p className="text-xs text-green-400">💰 {suggestion.expected_savings}</p>
                          <p className="text-xs text-slate-500">Impact: {suggestion.impact}</p>
                        </div>
                        {!isApplied ? (
                          <Button
                            onClick={() => applySuggestion(idx)}
                            size="sm"
                            className="bg-purple-600 hover:bg-purple-700"
                          >
                            <TrendingUp className="w-4 h-4 mr-1" />
                            Apply
                          </Button>
                        ) : (
                          <Badge variant="outline" className="bg-green-500/20 text-green-400 border-green-500/30">
                            <CheckCircle className="w-3 h-3 mr-1" />
                            Applied
                          </Badge>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </CardContent>
    </Card>
  );
}