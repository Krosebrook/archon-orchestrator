import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { CheckCircle, XCircle, Clock, AlertCircle } from 'lucide-react';
import { format } from 'date-fns';

export default function TestResults({ testRuns, pipelines, isLoading }) {
  const statusConfig = {
    passed: { icon: CheckCircle, color: 'text-green-400', bg: 'bg-green-500/20' },
    failed: { icon: XCircle, color: 'text-red-400', bg: 'bg-red-500/20' },
    running: { icon: Clock, color: 'text-blue-400', bg: 'bg-blue-500/20' },
    skipped: { icon: AlertCircle, color: 'text-yellow-400', bg: 'bg-yellow-500/20' }
  };

  if (isLoading) {
    return <div className="text-slate-400 text-center py-12">Loading test results...</div>;
  }

  return (
    <div className="space-y-4">
      {testRuns.map(test => {
        const pipeline = pipelines.find(p => p.id === test.pipeline_id);
        const config = statusConfig[test.status];
        const Icon = config.icon;

        return (
          <Card key={test.id} className="bg-slate-900 border-slate-800">
            <CardContent className="pt-6">
              <div className="flex items-start justify-between">
                <div className="flex items-start gap-4 flex-1">
                  <div className={`w-12 h-12 rounded-lg ${config.bg} flex items-center justify-center`}>
                    <Icon className={`w-6 h-6 ${config.color}`} />
                  </div>
                  <div className="flex-1">
                    <h3 className="text-white font-semibold">{test.test_suite}</h3>
                    <p className="text-sm text-slate-400">{pipeline?.name || 'Unknown pipeline'}</p>
                    <div className="flex gap-4 mt-2 text-sm">
                      <span className="text-green-400">{test.passed} passed</span>
                      <span className="text-red-400">{test.failed} failed</span>
                      <span className="text-slate-400">{test.skipped} skipped</span>
                    </div>
                  </div>
                </div>
                <div className="text-right">
                  <Badge variant="outline" className={config.color}>
                    {test.status}
                  </Badge>
                  {test.coverage && (
                    <p className="text-xs text-slate-400 mt-2">
                      Coverage: {test.coverage.toFixed(1)}%
                    </p>
                  )}
                  <p className="text-xs text-slate-500 mt-1">
                    {format(new Date(test.started_at), 'MMM d, HH:mm')}
                  </p>
                </div>
              </div>

              {test.failures?.length > 0 && (
                <div className="mt-4 p-3 bg-slate-950 rounded-lg border border-red-500/30">
                  <p className="text-sm font-medium text-red-400 mb-2">Failures:</p>
                  {test.failures.map((failure, idx) => (
                    <div key={idx} className="text-xs text-slate-400 mb-2">
                      <p className="font-mono text-red-400">{failure.test_name}</p>
                      <p className="mt-1">{failure.error}</p>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}