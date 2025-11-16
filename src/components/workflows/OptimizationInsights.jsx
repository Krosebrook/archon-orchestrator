import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Sparkles, TrendingDown, Zap, CheckCircle2, Loader2, Clock, AlertCircle } from 'lucide-react';
import { base44 } from '@/api/base44Client';
import { toast } from 'sonner';

export default function OptimizationInsights({ workflow, onRefresh }) {
  const [optimization, setOptimization] = useState(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [isApplying, setIsApplying] = useState(false);

  useEffect(() => {
    if (workflow?.id) {
      loadOptimization();
      const interval = setInterval(loadOptimization, 10000);
      return () => clearInterval(interval);
    }
  }, [workflow?.id]);

  const loadOptimization = async () => {
    try {
      const optimizations = await base44.entities.WorkflowOptimization.filter(
        { workflow_id: workflow.id },
        '-created_date',
        1
      );
      if (optimizations.length > 0) {
        setOptimization(optimizations[0]);
      }
    } catch (error) {
      console.error('Failed to load optimization:', error);
    }
  };

  const analyzeWorkflow = async (type = 'performance') => {
    setIsAnalyzing(true);
    toast.info('Analyzing workflow...');

    try {
      const response = await base44.functions.invoke('analyzeWorkflowOptimization', {
        workflow_id: workflow.id,
        analysis_type: type
      });

      if (response.data.success) {
        await loadOptimization();
        toast.success('Analysis complete!');
        onRefresh?.();
      }
    } catch (error) {
      console.error('Analysis error:', error);
      toast.error('Failed to analyze workflow');
    } finally {
      setIsAnalyzing(false);
    }
  };

  const applyOptimization = async () => {
    setIsApplying(true);
    try {
      await base44.entities.WorkflowOptimization.update(optimization.id, {
        status: 'applied',
        auto_applied: true
      });
      toast.success('Optimization applied');
      loadOptimization();
    } catch (error) {
      console.error('Failed to apply optimization:', error);
      toast.error('Failed to apply optimization');
    } finally {
      setIsApplying(false);
    }
  };

  const getStatusBadge = (status) => {
    const configs = {
      analyzing: { label: 'Analyzing...', icon: Loader2, className: 'bg-blue-500/20 text-blue-400 border-blue-500/30 animate-pulse' },
      ready: { label: 'Recommendations Ready', icon: AlertCircle, className: 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30' },
      applied: { label: 'Optimization Complete', icon: CheckCircle2, className: 'bg-green-500/20 text-green-400 border-green-500/30' },
      reverted: { label: 'Reverted', icon: Clock, className: 'bg-slate-500/20 text-slate-400 border-slate-500/30' }
    };
    const config = configs[status] || configs.ready;
    const Icon = config.icon;
    
    return (
      <Badge variant="outline" className={config.className}>
        <Icon className="w-3 h-3 mr-1" />
        {config.label}
      </Badge>
    );
  };

  if (!workflow) {
    return null;
  }

  return (
    <Card className="bg-slate-900 border-slate-800">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="text-white flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-purple-400" />
            AI Optimization
          </CardTitle>
          <Button
            size="sm"
            onClick={() => analyzeWorkflow('performance')}
            disabled={isAnalyzing}
            className="bg-purple-600 hover:bg-purple-700"
          >
            {isAnalyzing ? (
              <><Loader2 className="w-4 h-4 mr-2 animate-spin" />Analyzing...</>
            ) : (
              <><Zap className="w-4 h-4 mr-2" />Analyze</>
            )}
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        {!optimization ? (
          <div className="text-center py-8">
            <Sparkles className="w-12 h-12 text-slate-600 mx-auto mb-3" />
            <p className="text-slate-400 text-sm">Run AI analysis to get optimization insights</p>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              {getStatusBadge(optimization.status)}
              {optimization.status === 'ready' && (
                <Button
                  size="sm"
                  onClick={applyOptimization}
                  disabled={isApplying}
                  className="bg-green-600 hover:bg-green-700"
                >
                  {isApplying ? <Loader2 className="w-3 h-3 mr-1 animate-spin" /> : <CheckCircle2 className="w-3 h-3 mr-1" />}
                  Apply
                </Button>
              )}
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="p-3 bg-slate-950 rounded-lg border border-slate-800">
                <div className="text-xs text-slate-400">Avg Cost</div>
                <div className="text-lg font-bold text-white">
                  ${(optimization.current_metrics?.avg_cost_cents / 100 || 0).toFixed(2)}
                </div>
              </div>
              <div className="p-3 bg-slate-950 rounded-lg border border-slate-800">
                <div className="text-xs text-slate-400">Success Rate</div>
                <div className="text-lg font-bold text-white">
                  {((optimization.current_metrics?.success_rate || 0) * 100).toFixed(1)}%
                </div>
              </div>
            </div>

            <div className="space-y-2">
              <div className="text-sm font-medium text-slate-300">Recommendations</div>
              {optimization.recommendations?.map((rec, idx) => (
                <div key={idx} className="p-3 bg-slate-950 rounded-lg border border-slate-800">
                  <div className="flex items-start gap-3">
                    <TrendingDown className="w-4 h-4 text-green-400 mt-0.5" />
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-white font-medium text-sm">{rec.title}</span>
                        <Badge variant="outline" className="bg-slate-800 border-slate-700 text-xs">
                          {rec.effort} effort
                        </Badge>
                      </div>
                      <p className="text-xs text-slate-400 mb-2">{rec.description}</p>
                      <div className="text-xs text-green-400 bg-green-500/10 px-2 py-1 rounded inline-block">
                        💡 {rec.impact}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {optimization.priority_recommendation && (
              <div className="p-3 bg-purple-900/20 rounded-lg border border-purple-800/30">
                <div className="text-sm text-purple-400 font-medium mb-1">Priority Action</div>
                <div className="text-xs text-purple-300">{optimization.priority_recommendation}</div>
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}