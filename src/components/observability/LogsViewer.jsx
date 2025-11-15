import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Terminal } from 'lucide-react';
import { format } from 'date-fns';

export default function LogsViewer({ runs }) {
  return (
    <Card className="bg-slate-900 border-slate-800">
      <CardHeader>
        <CardTitle className="text-white flex items-center gap-2">
          <Terminal className="w-5 h-5" />
          System Logs
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="bg-slate-950 rounded-lg p-4 font-mono text-xs max-h-96 overflow-y-auto">
          {runs.map((run, idx) => (
            <div key={idx} className="text-slate-300 mb-1">
              <span className="text-slate-600">[{format(new Date(run.started_at || new Date()), 'HH:mm:ss')}]</span>
              {' '}
              <span className={run.state === 'failed' ? 'text-red-400' : 'text-green-400'}>
                {run.state.toUpperCase()}
              </span>
              {' '}
              Run {run.id.slice(0, 8)} • {run.tokens_in + run.tokens_out} tokens
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}