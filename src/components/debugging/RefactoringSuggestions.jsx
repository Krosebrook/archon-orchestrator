import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Sparkles, Loader2, Code, TrendingUp, Zap } from 'lucide-react';
import { base44 } from '@/api/base44Client';
import { toast } from 'sonner';
import { handleError } from '../utils/api-client';

export default function RefactoringSuggestions({ agents, _onRefresh }) {
  const [selectedAgent, setSelectedAgent] = useState('');
  const [suggestions, setSuggestions] = useState(null);
  const [isGenerating, setIsGenerating] = useState(false);

  const generateSuggestions = async () => {
    if (!selectedAgent) {
      toast.error('Please select an agent');
      return;
    }

    setIsGenerating(true);
    try {
      const user = await base44.auth.me();
      const agent = agents.find(a => a.id === selectedAgent);
      if (!agent) {
        toast.error('Agent not found');
        return;
      }
      const metrics = await base44.entities.AgentMetric.filter({ agent_id: selectedAgent }, '-timestamp', 100);
      
      const performanceProfile = {
        agent: {
          name: agent.name,
          provider: agent.config?.provider,
          model: agent.config?.model,
          config: agent.config
        },
        performance: {
          avg_latency: metrics.reduce((s, m) => s + (m.latency_ms || 0), 0) / Math.max(metrics.length, 1),
          error_rate: metrics.filter(m => m.status === 'error').length / Math.max(metrics.length, 1),
          avg_cost: metrics.reduce((s, m) => s + (m.cost_cents || 0), 0) / Math.max(metrics.length, 1),
          avg_tokens: metrics.reduce((s, m) => s + (m.prompt_tokens || 0) + (m.completion_tokens || 0), 0) / Math.max(metrics.length, 1)
        }
      };

      const result = await base44.integrations.Core.InvokeLLM({
        prompt: `You are a senior AI engineer specializing in LLM optimization. Analyze this agent configuration and performance data:

${JSON.stringify(performanceProfile, null, 2)}

Provide specific, actionable refactoring suggestions to improve:
1. **Performance**: Reduce latency and improve throughput
2. **Reliability**: Reduce error rates and improve stability
3. **Cost**: Optimize token usage and reduce costs
4. **Configuration**: Better model settings, temperature, max_tokens, etc.

For each suggestion:
- Explain WHAT to change
- Explain WHY it will help
- Quantify EXPECTED impact (%, ms, $)
- Provide SPECIFIC code/config changes

Prioritize suggestions by impact.`,
        response_json_schema: {
          type: "object",
          properties: {
            suggestions: {
              type: "array",
              items: {
                type: "object",
                properties: {
                  category: { type: "string", enum: ["performance", "reliability", "cost", "config"] },
                  priority: { type: "string", enum: ["high", "medium", "low"] },
                  title: { type: "string" },
                  description: { type: "string" },
                  expected_impact: { type: "string" },
                  implementation: { type: "string" }
                }
              }
            },
            overall_assessment: { type: "string" }
          }
        }
      });

      setSuggestions(result);
      
      // Audit log
      await base44.entities.Audit.create({
        entity_type: 'agent',
        entity_id: selectedAgent,
        action: 'refactor_analysis',
        metadata: { suggestion_count: result.suggestions?.length || 0 },
        org_id: user.organization.id
      });
      
      toast.success('Suggestions generated');
    } catch (error) {
      handleError(error);
    } finally {
      setIsGenerating(false);
    }
  };

  const priorityColors = {
    high: 'bg-red-500/20 text-red-400 border-red-500/30',
    medium: 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30',
    low: 'bg-blue-500/20 text-blue-400 border-blue-500/30'
  };

  const categoryIcons = {
    performance: Zap,
    reliability: TrendingUp,
    cost: TrendingUp,
    config: Code
  };

  return (
    <div className="space-y-6">
      <Card className="bg-slate-900 border-slate-800">
        <CardHeader>
          <CardTitle className="text-white">Select Agent</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex gap-4">
            <Select value={selectedAgent} onValueChange={setSelectedAgent}>
              <SelectTrigger className="bg-slate-800 border-slate-700 flex-1">
                <SelectValue placeholder="Select an agent to analyze" />
              </SelectTrigger>
              <SelectContent className="bg-slate-900 border-slate-800">
                {agents.map(agent => (
                  <SelectItem key={agent.id} value={agent.id}>
                    {agent.name} ({agent.config?.provider}/{agent.config?.model})
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Button
              onClick={generateSuggestions}
              disabled={isGenerating || !selectedAgent}
              className="bg-purple-600 hover:bg-purple-700"
            >
              {isGenerating ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Analyzing...
                </>
              ) : (
                <>
                  <Sparkles className="w-4 h-4 mr-2" />
                  Generate
                </>
              )}
            </Button>
          </div>
        </CardContent>
      </Card>

      {suggestions && (
        <>
          {suggestions.overall_assessment && (
            <Card className="bg-slate-900 border-slate-800">
              <CardContent className="pt-6">
                <p className="text-slate-300">{suggestions.overall_assessment}</p>
              </CardContent>
            </Card>
          )}

          <div className="space-y-4">
            {suggestions.suggestions?.map((suggestion, idx) => {
              const Icon = categoryIcons[suggestion.category];
              return (
                <Card key={idx} className="bg-slate-900 border-slate-800">
                  <CardHeader>
                    <div className="flex items-start justify-between">
                      <div className="flex items-start gap-3">
                        <Icon className="w-5 h-5 text-purple-400 flex-shrink-0 mt-0.5" />
                        <div>
                          <h3 className="text-white font-semibold">{suggestion.title}</h3>
                          <p className="text-xs text-slate-400 mt-1 capitalize">{suggestion.category}</p>
                        </div>
                      </div>
                      <Badge variant="outline" className={priorityColors[suggestion.priority]}>
                        {suggestion.priority}
                      </Badge>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <p className="text-sm text-slate-300">{suggestion.description}</p>
                    
                    <div className="p-3 bg-green-500/10 rounded border border-green-500/30">
                      <p className="text-xs font-semibold text-green-400 mb-1">Expected Impact</p>
                      <p className="text-sm text-slate-300">{suggestion.expected_impact}</p>
                    </div>

                    <div className="p-3 bg-slate-950 rounded border border-slate-800">
                      <p className="text-xs font-semibold text-slate-400 mb-2">Implementation</p>
                      <pre className="text-xs text-slate-300 whitespace-pre-wrap">
                        {suggestion.implementation}
                      </pre>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </>
      )}
    </div>
  );
}