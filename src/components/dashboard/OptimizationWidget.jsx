import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Sparkles, TrendingDown, AlertCircle } from 'lucide-react';
import { base44 } from '@/api/base44Client';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';

export default function OptimizationWidget() {
  const [optimizations, setOptimizations] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadOptimizations();
    const interval = setInterval(loadOptimizations, 15000);
    return () => clearInterval(interval);
  }, []);

  const loadOptimizations = async () => {
    try {
      const data = await base44.entities.WorkflowOptimization.filter(
        { status: { $in: ['ready', 'analyzing'] } },
        '-created_date',
        5
      );
      setOptimizations(data);
    } catch (error) {
      console.error('Failed to load optimizations:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const totalSavings = optimizations.reduce((sum, opt) => {
    const savings = opt.recommendations?.reduce((recSum, rec) => {
      return recSum + (rec.estimated_savings?.cost_reduction_percent || 0);
    }, 0) || 0;
    return sum + savings;
  }, 0);

  if (isLoading) {
    return (
      <Card className="bg-slate-900 border-slate-800">
        <CardContent className="p-8 text-center">
          <div className="h-20 bg-slate-800 rounded animate-pulse" />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="bg-slate-900 border-slate-800">
      <CardHeader>
        <CardTitle className="text-white flex items-center gap-2">
          <Sparkles className="w-5 h-5 text-purple-400" />
          Optimization Overview
        </CardTitle>
      </CardHeader>
      <CardContent>
        {optimizations.length === 0 ? (
          <div className="text-center py-8 text-slate-400">
            <Sparkles className="w-12 h-12 mx-auto mb-3 text-slate-600" />
            <p className="text-sm">No pending optimizations</p>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <div className="p-3 bg-slate-950 rounded-lg border border-slate-800">
                <div className="text-xs text-slate-400">Pending</div>
                <div className="text-2xl font-bold text-purple-400">{optimizations.length}</div>
              </div>
              <div className="p-3 bg-slate-950 rounded-lg border border-slate-800">
                <div className="text-xs text-slate-400">Est. Savings</div>
                <div className="text-2xl font-bold text-green-400">{totalSavings}%</div>
              </div>
            </div>

            <div className="space-y-2">
              {optimizations.map((opt) => (
                <Link key={opt.id} to={createPageUrl(`WorkflowDetail?id=${opt.workflow_id}`)}>
                  <div className="p-3 bg-slate-950 rounded-lg border border-slate-800 hover:border-slate-700 transition-colors">
                    <div className="flex items-center justify-between mb-1">
                      <div className="flex items-center gap-2">
                        {opt.status === 'analyzing' ? (
                          <AlertCircle className="w-4 h-4 text-blue-400 animate-pulse" />
                        ) : (
                          <TrendingDown className="w-4 h-4 text-green-400" />
                        )}
                        <span className="text-sm text-white">Workflow</span>
                      </div>
                      <Badge variant="outline" className="bg-slate-800 border-slate-700 text-xs">
                        {opt.recommendations?.length || 0} recommendations
                      </Badge>
                    </div>
                    <div className="text-xs text-slate-400 capitalize">{opt.analysis_type} optimization</div>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}