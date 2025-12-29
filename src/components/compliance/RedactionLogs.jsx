import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Eye, Shield } from 'lucide-react';
import { Badge } from '@/components/ui/badge';

export default function RedactionLogs({ logs, onRefresh }) {
  if (logs.length === 0) {
    return (
      <Card className="bg-slate-900 border-slate-800">
        <CardContent className="flex flex-col items-center justify-center h-96 text-slate-400">
          <Eye className="w-16 h-16 mb-4 opacity-50" />
          <p>No redaction logs yet</p>
          <p className="text-sm mt-2">Logs will appear when data redaction policies are triggered</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="bg-slate-900 border-slate-800">
      <CardHeader>
        <CardTitle className="text-white flex items-center gap-2">
          <Eye className="w-5 h-5" />
          Redaction Logs ({logs.length})
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-2 max-h-[600px] overflow-y-auto">
          {logs.map((log) => (
            <div key={log.id} className="p-3 bg-slate-800 rounded-lg border border-slate-700">
              <div className="flex items-start justify-between mb-2">
                <div className="flex items-center gap-2">
                  <Shield className="w-4 h-4 text-purple-400" />
                  <span className="text-sm font-medium text-white capitalize">
                    {log.data_type.replace(/_/g, ' ')}
                  </span>
                  <Badge variant="outline" className="text-xs">
                    {log.redaction_count} redactions
                  </Badge>
                </div>
                <span className="text-xs text-slate-500">
                  {new Date(log.timestamp).toLocaleString()}
                </span>
              </div>

              <div className="flex flex-wrap gap-2 mb-2">
                {log.patterns_matched.map((pattern, i) => (
                  <Badge key={i} className="bg-blue-900/30 text-blue-300 text-xs">
                    {pattern}
                  </Badge>
                ))}
              </div>

              {log.redacted_preview && (
                <div className="text-xs text-slate-400 bg-slate-900 p-2 rounded font-mono">
                  {log.redacted_preview}...
                </div>
              )}
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}