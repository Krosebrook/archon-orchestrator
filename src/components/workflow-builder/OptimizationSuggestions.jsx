/**
 * @fileoverview Workflow Optimization Suggestions
 * @description AI-driven recommendations for optimizing workflows based on
 * historical performance metrics, cost analysis, and best practices.
 * 
 * @module workflow-builder/OptimizationSuggestions
 * @version 1.0.0
 */

import { useState, useEffect } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { 
  TrendingUp, Loader2, Zap, DollarSign, Clock, 
  CheckCircle, Lightbulb 
} from 'lucide-react';
import { base44 } from '@/api/base44Client';
import { toast } from 'sonner';
import { handleError } from '../utils/api-client';

export default function OptimizationSuggestions({ workflow, nodes, edges, onApplyOptimization }) {
  const [suggestions, setSuggestions] = useState([]);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [metrics, setMetrics] = useState(null);

  useEffect(() => {
    if (workflow?.id) {
      loadMetrics();
    }
  }, [workflow?.id]);

  const loadMetrics = async () => {
    try {
      const runs = await base44.entities.Run.filter(
        { workflow_id: workflow.id },
        '-finished_at',
        50
      );

      if (runs.length === 0) return;

      const agentMetrics = await Promise.all(
        runs.map(r => base44.entities.AgentMetric.filter({ run_id: r.id }))
      );

      const flatMetrics = agentMetrics.flat();

      const analysis = {
        total_runs: runs.length,
        success_rate: runs.filter(r => r.state === 'completed').length / runs.length,
        avg_duration_ms: runs.reduce((s, r) => s + (r.duration_ms || 0), 0) / runs.length,
        avg_cost_cents: flatMetrics.reduce((s, m) => s + (m.cost_cents || 0), 0) / runs.length,
        avg_tokens: flatMetrics.reduce((s, m) => s + (m.prompt_tokens || 0) + (m.completion_tokens || 0), 0) / Math.max(flatMetrics.length, 1),
        error_rate: flatMetrics.filter(m => m.status === 'error').length / Math.max(flatMetrics.length, 1),
        bottleneck_nodes: identifyBottlenecks(runs, flatMetrics)
      };

      setMetrics(analysis);
    } catch (error) {
      handleError(error);
    }
  };

  const identifyBottlenecks = (runs, metrics) => {
    const nodeLatencies = {};
    
    metrics.forEach(m => {
      if (m.agent_id) {
        nodeLatencies[m.agent_id] = nodeLatencies[m.agent_id] || [];
        nodeLatencies[m.agent_id].push(m.latency_ms || 0);
      }
    });

    return Object.entries(nodeLatencies)
      .map(([nodeId, latencies]) => ({
        nodeId,
        avgLatency: latencies.reduce((a, b) => a + b, 0) / latencies.length,
        p95Latency: latencies.sort((a, b) => b - a)[Math.floor(latencies.length * 0.05)]
      }))
      .filter(n => n.p95Latency > 2000)
      .sort((a, b) => b.p95Latency - a.p95Latency);
  };

  const analyzeAndSuggest = async () => {
    if (!workflow || nodes.length === 0) {
      toast.error('No workflow to optimize');
      return;
    }

    setIsAnalyzing(true);
    try {
      const user = await base44.auth.me();

      const workflowContext = {
        name: workflow.name,
        nodes: nodes.map(n => ({
          id: n.id,
          type: n.type,
          label: n.label,
          config: n.config
        })),
        edges: edges.map(e => ({ from: e.from, to: e.to })),
        strategy: workflow.spec?.collaboration_strategy,
        metrics: metrics || { note: 'No historical data yet' }
      };

      const result = await base44.integrations.Core.InvokeLLM({
        prompt: `You are an expert workflow optimizer. Analyze this workflow and provide optimization suggestions:

${JSON.stringify(workflowContext, null, 2)}

Consider:
1. **Parallelization**: Can any nodes run in parallel?
2. **Caching**: Can memory nodes reduce redundant API calls?
3. **Cost**: Can cheaper models handle certain tasks?
4. **Latency**: Can we reduce wait times?
5. **Reliability**: Are there single points of failure?
6. **Complexity**: Can we simplify the flow?

For each suggestion:
- Explain the current issue
- Propose specific changes (add/remove/modify nodes)
- Quantify expected impact (%, $, ms)
- Provide implementation details`,
        response_json_schema: {
          type: "object",
          properties: {
            overall_score: { 
              type: "number",
              description: "Optimization score 0-100"
            },
            suggestions: {
              type: "array",
              items: {
                type: "object",
                properties: {
                  category: { 
                    type: "string",
                    enum: ["parallelization", "caching", "cost", "latency", "reliability", "simplification"]
                  },
                  priority: { 
                    type: "string",
                    enum: ["critical", "high", "medium", "low"]
                  },
                  title: { type: "string" },
                  problem: { type: "string" },
                  solution: { type: "string" },
                  implementation: { type: "string" },
                  expected_impact: {
                    type: "object",
                    properties: {
                      cost_reduction_pct: { type: "number" },
                      latency_reduction_pct: { type: "number" },
                      reliability_increase_pct: { type: "number" }
                    }
                  },
                  changes: {
                    type: "object",
                    properties: {
                      nodes_to_add: { type: "array", items: { type: "object" } },
                      nodes_to_remove: { type: "array", items: { type: "string" } },
                      nodes_to_modify: { type: "array", items: { type: "object" } },
                      edges_to_add: { type: "array", items: { type: "object" } },
                      edges_to_remove: { type: "array", items: { type: "string" } }
                    }
                  }
                }
              }
            }
          }
        }
      });

      setSuggestions(result.suggestions || []);

      const assistantMessage = {
        role: 'assistant',
        content: `I've analyzed your workflow (score: ${result.overall_score}/100). Found ${result.suggestions?.length || 0} optimization opportunities.`,
        suggestions: result.suggestions,
        timestamp: new Date().toISOString()
      };
      
      setMessages(prev => [...prev, assistantMessage]);

      // Audit analysis
      await auditCreate(AuditEntities.WORKFLOW, workflow.id, {
        action: 'ai_optimization_analysis',
        score: result.overall_score,
        suggestion_count: result.suggestions?.length || 0
      });

      toast.success('Analysis complete');
    } catch (error) {
      handleError(error);
    } finally {
      setIsAnalyzing(false);
    }
  };

  const applySuggestion = (suggestion) => {
    if (onApplyOptimization) {
      onApplyOptimization(suggestion.changes);
      toast.success('Optimization applied');
    }
  };

  const priorityColors = {
    critical: 'bg-red-500/20 text-red-400 border-red-500/30',
    high: 'bg-orange-500/20 text-orange-400 border-orange-500/30',
    medium: 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30',
    low: 'bg-blue-500/20 text-blue-400 border-blue-500/30'
  };

  const categoryIcons = {
    parallelization: Zap,
    caching: Database,
    cost: DollarSign,
    latency: Clock,
    reliability: CheckCircle,
    simplification: TrendingUp
  };

  return (
    <div className="flex flex-col h-full">
      {/* Quick Actions */}
      <div className="mb-4 flex gap-2">
        <Button
          onClick={analyzeAndSuggest}
          disabled={isAnalyzing || !workflow}
          className="bg-purple-600 hover:bg-purple-700 flex-1"
        >
          {isAnalyzing ? (
            <>
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              Analyzing...
            </>
          ) : (
            <>
              <TrendingUp className="w-4 h-4 mr-2" />
              Optimize Workflow
            </>
          )}
        </Button>
      </div>

      {/* Metrics Summary */}
      {metrics && (
        <Card className="bg-slate-950 border-slate-800 mb-4">
          <CardContent className="pt-4">
            <div className="grid grid-cols-3 gap-3 text-xs">
              <div>
                <div className="text-slate-500">Success Rate</div>
                <div className="text-white font-semibold">{(metrics.success_rate * 100).toFixed(1)}%</div>
              </div>
              <div>
                <div className="text-slate-500">Avg Duration</div>
                <div className="text-white font-semibold">{(metrics.avg_duration_ms / 1000).toFixed(1)}s</div>
              </div>
              <div>
                <div className="text-slate-500">Avg Cost</div>
                <div className="text-white font-semibold">${(metrics.avg_cost_cents / 100).toFixed(3)}</div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Suggestions List */}
      <ScrollArea className="flex-1">
        <div className="space-y-3">
          {suggestions.length === 0 ? (
            <div className="text-center py-8 text-slate-400 text-sm">
              <Lightbulb className="w-8 h-8 mx-auto mb-2 opacity-50" />
              Click "Optimize Workflow" to get AI suggestions
            </div>
          ) : (
            suggestions.map((suggestion, idx) => {
              const Icon = categoryIcons[suggestion.category];
              return (
                <Card key={idx} className="bg-slate-950 border-slate-800">
                  <CardContent className="pt-4 space-y-3">
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex items-start gap-2">
                        {Icon && <Icon className="w-4 h-4 text-purple-400 flex-shrink-0 mt-0.5" />}
                        <div className="flex-1">
                          <h4 className="text-sm font-semibold text-white">{suggestion.title}</h4>
                          <p className="text-xs text-slate-400 mt-0.5 capitalize">{suggestion.category}</p>
                        </div>
                      </div>
                      <Badge variant="outline" className={priorityColors[suggestion.priority]}>
                        {suggestion.priority}
                      </Badge>
                    </div>

                    <div className="text-xs text-slate-300">
                      <div className="text-slate-500 font-semibold mb-1">Problem:</div>
                      {suggestion.problem}
                    </div>

                    <div className="text-xs text-slate-300">
                      <div className="text-slate-500 font-semibold mb-1">Solution:</div>
                      {suggestion.solution}
                    </div>

                    {suggestion.expected_impact && (
                      <div className="flex gap-2 text-xs">
                        {suggestion.expected_impact.cost_reduction_pct > 0 && (
                          <Badge className="bg-green-500/20 text-green-400">
                            <DollarSign className="w-3 h-3 mr-1" />
                            -{suggestion.expected_impact.cost_reduction_pct}% cost
                          </Badge>
                        )}
                        {suggestion.expected_impact.latency_reduction_pct > 0 && (
                          <Badge className="bg-blue-500/20 text-blue-400">
                            <Clock className="w-3 h-3 mr-1" />
                            -{suggestion.expected_impact.latency_reduction_pct}% latency
                          </Badge>
                        )}
                      </div>
                    )}

                    <Button
                      onClick={() => applySuggestion(suggestion)}
                      size="sm"
                      variant="outline"
                      className="w-full border-slate-700"
                    >
                      <CheckCircle className="w-3 h-3 mr-2" />
                      Apply Optimization
                    </Button>
                  </CardContent>
                </Card>
              );
            })
          )}
        </div>
      </ScrollArea>
    </div>
  );
}