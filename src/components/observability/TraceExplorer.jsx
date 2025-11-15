import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Activity, Clock } from 'lucide-react';
import { format } from 'date-fns';

export default function TraceExplorer({ runs }) {
  return (
    <Card className="bg-slate-900 border-slate-800">
      <CardHeader>
        <CardTitle className="text-white">Execution Traces</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-2">
          {runs.map((run) => {
            const duration = run.started_at && run.finished_at
              ? Math.round((new Date(run.finished_at) - new Date(run.started_at)) / 1000)
              : 0;

            return (
              <div key={run.id} className="p-3 bg-slate-950 rounded-lg border border-slate-800 hover:border-slate-700 transition-colors">
                <div className="flex items-start justify-between mb-2">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <Activity className="w-4 h-4 text-blue-400" />
                      <code className="text-xs text-slate-300">{run.id.slice(0, 12)}</code>
                      <Badge variant="outline" className={
                        run.state === 'completed' ? 'bg-green-500/20 text-green-400 border-green-500/30' :
                        run.state === 'failed' ? 'bg-red-500/20 text-red-400 border-red-500/30' :
                        'bg-blue-500/20 text-blue-400 border-blue-500/30'
                      }>
                        {run.state}
                      </Badge>
                    </div>
                    <div className="text-xs text-slate-500">
                      {run.started_at && format(new Date(run.started_at), 'MMM d, h:mm:ss a')}
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="flex items-center gap-1 text-xs text-slate-400">
                      <Clock className="w-3 h-3" />
                      {duration}s
                    </div>
                    <div className="text-xs text-slate-500">${(run.cost_cents / 100).toFixed(2)}</div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}