import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Zap, Loader2, CheckCircle2, TrendingUp, Eye, Sparkles, AlertTriangle } from 'lucide-react';
import { base44 } from '@/api/base44Client';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

const SEVERITY_CONFIG = {
  high: { badge: 'bg-red-500/20 text-red-400 border-red-500/30', icon: AlertTriangle },
  medium: { badge: 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30', icon: Zap },
  low: { badge: 'bg-blue-500/20 text-blue-400 border-blue-500/30', icon: TrendingUp }
};

export default function WorkflowOptimizer({ workflow, onOptimize }) {
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysis, setAnalysis] = useState(null);
  const [selectedOptimizations, setSelectedOptimizations] = useState(new Set());
  const [isApplying, setIsApplying] = useState(false);

  const analyzeWorkflow = async () => {
    setIsAnalyzing(true);
    try {
      const response = await base44.functions.invoke('analyzeWorkflowPerformance', {
        workflow_id: workflow.id
      });

      if (response.data.success) {
        setAnalysis(response.data);
        toast.success('Analysis complete');
      }
    } catch (error) {
      console.error('Analysis error:', error);
      toast.error('Failed to analyze workflow');
    } finally {
      setIsAnalyzing(false);
    }
  };

  const toggleOptimization = (idx) => {
    const newSet = new Set(selectedOptimizations);
    if (newSet.has(idx)) {
      newSet.delete(idx);
    } else {
      newSet.add(idx);
    }
    setSelectedOptimizations(newSet);
  };

  const applyOptimizations = async () => {
    if (selectedOptimizations.size === 0) {
      toast.error('Select at least one optimization');
      return;
    }

    setIsApplying(true);
    try {
      // Merge all selected optimization changes
      const optimizations = analysis.analysis.optimizations.filter((_, idx) => 
        selectedOptimizations.has(idx)
      );

      let updatedSpec = { ...workflow.spec };
      
      optimizations.forEach(opt => {
        if (opt.changes?.nodes) {
          opt.changes.nodes.forEach(nodeChange => {
            const nodeIdx = updatedSpec.nodes.findIndex(n => n.id === nodeChange.id);
            if (nodeIdx >= 0) {
              updatedSpec.nodes[nodeIdx] = { ...updatedSpec.nodes[nodeIdx], ...nodeChange.updates };
            }
          });
        }
        if (opt.changes?.edges) {
          updatedSpec.edges = [...(updatedSpec.edges || []), ...opt.changes.edges];
        }
      });

      await base44.entities.Workflow.update(workflow.id, {
        spec: updatedSpec,
        version: incrementVersion(workflow.version)
      });

      toast.success(`Applied ${selectedOptimizations.size} optimizations`);
      setAnalysis(null);
      setSelectedOptimizations(new Set());
      onOptimize?.();
    } catch (error) {
      console.error('Failed to apply optimizations:', error);
      toast.error('Failed to apply optimizations');
    } finally {
      setIsApplying(false);
    }
  };

  const incrementVersion = (version) => {
    const parts = version.split('.');
    parts[2] = String(Number(parts[2]) + 1);
    return parts.join('.');
  };

  const totalImprovement = analysis?.analysis.optimizations
    .filter((_, idx) => selectedOptimizations.has(idx))
    .reduce((acc, opt) => ({
      cost: acc.cost + (opt.estimated_improvement?.cost_reduction_percent || 0),
      speed: acc.speed + (opt.estimated_improvement?.speed_improvement_percent || 0)
    }), { cost: 0, speed: 0 });

  return (
    <Card className="bg-slate-900 border-slate-800">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="text-white flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-purple-400" />
            Workflow Optimizer
          </CardTitle>
          {!analysis && (
            <Button
              onClick={analyzeWorkflow}
              disabled={isAnalyzing}
              className="bg-purple-600 hover:bg-purple-700"
            >
              {isAnalyzing ? (
                <><Loader2 className="w-4 h-4 mr-2 animate-spin" />Analyzing...</>
              ) : (
                <><Zap className="w-4 h-4 mr-2" />Analyze</>
              )}
            </Button>
          )}
        </div>
      </CardHeader>
      <CardContent>
        {!analysis ? (
          <div className="text-center py-8">
            <Sparkles className="w-12 h-12 text-slate-600 mx-auto mb-3" />
            <p className="text-slate-400 text-sm">
              Analyze workflow performance to discover optimization opportunities
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {/* Overall Score */}
            <div className="p-4 bg-slate-950 rounded-lg border border-slate-800">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm text-slate-300">Workflow Health Score</span>
                <span className="text-2xl font-bold text-white">{analysis.analysis.overall_score}/100</span>
              </div>
              <Progress value={analysis.analysis.overall_score} className="h-2" />
            </div>

            {/* Current Stats */}
            <div className="grid grid-cols-2 gap-3">
              <div className="p-3 bg-slate-950 rounded-lg border border-slate-800">
                <div className="text-xs text-slate-400 mb-1">Avg Cost</div>
                <div className="text-lg font-bold text-white">
                  ${(analysis.current_stats.avg_cost_cents / 100).toFixed(2)}
                </div>
              </div>
              <div className="p-3 bg-slate-950 rounded-lg border border-slate-800">
                <div className="text-xs text-slate-400 mb-1">Success Rate</div>
                <div className="text-lg font-bold text-white">
                  {(analysis.current_stats.success_rate * 100).toFixed(1)}%
                </div>
              </div>
            </div>

            {/* Analysis Summary */}
            {analysis.analysis.reasoning && (
              <div className="p-3 bg-purple-900/20 rounded-lg border border-purple-800/30">
                <div className="text-xs text-purple-400 font-medium mb-1">Analysis Summary</div>
                <p className="text-xs text-purple-300">{analysis.analysis.reasoning}</p>
              </div>
            )}

            {/* Estimated Improvements (if any selected) */}
            {selectedOptimizations.size > 0 && (
              <div className="p-3 bg-green-900/20 rounded-lg border border-green-800/30">
                <div className="text-xs text-green-400 font-medium mb-2">Estimated Improvements</div>
                <div className="grid grid-cols-2 gap-2 text-xs">
                  <div className="text-green-300">Cost: ↓{totalImprovement.cost.toFixed(0)}%</div>
                  <div className="text-green-300">Speed: ↑{totalImprovement.speed.toFixed(0)}%</div>
                </div>
              </div>
            )}

            {/* Optimizations */}
            <div className="space-y-3">
              <div className="text-sm font-medium text-slate-300">
                Optimization Opportunities ({analysis.analysis.optimizations.length})
              </div>
              {analysis.analysis.optimizations.map((opt, idx) => {
                const config = SEVERITY_CONFIG[opt.severity] || SEVERITY_CONFIG.medium;
                const Icon = config.icon;
                const isSelected = selectedOptimizations.has(idx);

                return (
                  <div
                    key={idx}
                    className={cn(
                      'p-4 rounded-lg border transition-all cursor-pointer',
                      isSelected 
                        ? 'bg-blue-900/20 border-blue-500/50 ring-1 ring-blue-500/30' 
                        : 'bg-slate-950 border-slate-800 hover:border-slate-700'
                    )}
                    onClick={() => toggleOptimization(idx)}
                  >
                    <div className="flex items-start gap-3">
                      <div className={cn(
                        'p-2 rounded-lg flex-shrink-0',
                        isSelected ? 'bg-blue-500/20' : 'bg-slate-800'
                      )}>
                        <Icon className={cn('w-4 h-4', isSelected ? 'text-blue-400' : 'text-slate-400')} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="text-sm font-medium text-white">{opt.title}</span>
                          <Badge variant="outline" className={cn('text-xs', config.badge)}>
                            {opt.severity}
                          </Badge>
                          <Badge variant="outline" className="bg-slate-800 border-slate-700 text-xs capitalize">
                            {opt.type}
                          </Badge>
                        </div>
                        <p className="text-xs text-slate-400 mb-2">{opt.description}</p>
                        <div className="text-xs text-slate-300 bg-slate-900 px-2 py-1 rounded">
                          💡 {opt.recommendation}
                        </div>
                        {opt.estimated_improvement && (
                          <div className="flex gap-3 mt-2 text-xs">
                            {opt.estimated_improvement.cost_reduction_percent > 0 && (
                              <span className="text-green-400">
                                Cost: ↓{opt.estimated_improvement.cost_reduction_percent}%
                              </span>
                            )}
                            {opt.estimated_improvement.speed_improvement_percent > 0 && (
                              <span className="text-blue-400">
                                Speed: ↑{opt.estimated_improvement.speed_improvement_percent}%
                              </span>
                            )}
                          </div>
                        )}
                      </div>
                      {isSelected && (
                        <CheckCircle2 className="w-5 h-5 text-blue-400 flex-shrink-0" />
                      )}
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Actions */}
            <div className="flex gap-2 pt-2">
              <Button
                onClick={applyOptimizations}
                disabled={selectedOptimizations.size === 0 || isApplying}
                className="flex-1 bg-green-600 hover:bg-green-700"
              >
                {isApplying ? (
                  <><Loader2 className="w-4 h-4 mr-2 animate-spin" />Applying...</>
                ) : (
                  <><CheckCircle2 className="w-4 h-4 mr-2" />Apply Selected ({selectedOptimizations.size})</>
                )}
              </Button>
              <Button
                onClick={() => {
                  setAnalysis(null);
                  setSelectedOptimizations(new Set());
                }}
                variant="outline"
                className="border-slate-700"
              >
                Reset
              </Button>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}