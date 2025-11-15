import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Sparkles, TrendingDown, Zap, CheckCircle2, Loader2 } from 'lucide-react';
import { base44 } from '@/api/base44Client';
import { toast } from 'sonner';

export default function OptimizationInsights({ workflow }) {
  const [optimization, setOptimization] = useState(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);

  const analyzeWorkflow = async (type = 'performance') => {
    setIsAnalyzing(true);
    toast.info('Analyzing workflow...');

    try {
      const response = await base44.functions.invoke('analyzeWorkflowOptimization', {
        workflow_id: workflow.id,
        analysis_type: type
      });

      if (response.data.success) {
        setOptimization(response.data);
        toast.success('Analysis complete!');
      }
    } catch (error) {
      console.error('Analysis error:', error);
      toast.error('Failed to analyze workflow');
    } finally {
      setIsAnalyzing(false);
    }
  };

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
            <div className="grid grid-cols-2 gap-3">
              <div className="p-3 bg-slate-950 rounded-lg border border-slate-800">
                <div className="text-xs text-slate-400">Avg Cost</div>
                <div className="text-lg font-bold text-white">
                  ${(optimization.current_metrics.avg_cost_cents / 100).toFixed(2)}
                </div>
              </div>
              <div className="p-3 bg-slate-950 rounded-lg border border-slate-800">
                <div className="text-xs text-slate-400">Success Rate</div>
                <div className="text-lg font-bold text-white">
                  {(optimization.current_metrics.success_rate * 100).toFixed(1)}%
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

            {optimization.priority && (
              <div className="p-3 bg-purple-900/20 rounded-lg border border-purple-800/30">
                <div className="text-sm text-purple-400 font-medium mb-1">Priority Action</div>
                <div className="text-xs text-purple-300">{optimization.priority}</div>
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}