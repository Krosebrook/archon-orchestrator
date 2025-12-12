import React, { useState, useEffect, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Search, Clock, AlertCircle, RefreshCw } from 'lucide-react';
import { toast } from 'sonner';
import { traceService } from '../services/TraceService';
import { useAsync } from '../hooks/useAsync';

export default function TraceViewer() {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedTrace, setSelectedTrace] = useState(null);

  const { data: rawTraces, loading, error, execute: loadTraces } = useAsync(
    () => traceService.listTraces({ limit: 100 }),
    { executeOnMount: true }
  );

  useEffect(() => {
    if (error) {
      toast.error('Failed to load traces');
    }
  }, [error]);

  const traces = useMemo(() => {
    if (!rawTraces?.ok) return [];
    
    const grouped = traceService.groupTraces(rawTraces.value);
    return Array.from(grouped.entries()).map(([trace_id, spans]) => ({
      trace_id,
      spans,
      root_span: spans.find(s => !s.parent_span_id) || spans[0],
      ...traceService.calculateStats(spans)
    }));
  }, [rawTraces]);

  const filteredTraces = traces.filter(trace => 
    trace.trace_id.toLowerCase().includes(searchQuery.toLowerCase()) ||
    trace.root_span?.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const renderSpan = (span, depth = 0) => {
    const hasError = span.status === 'error';
    
    return (
      <div key={span.span_id} style={{ marginLeft: `${depth * 24}px` }} className="mb-2">
        <div className={`p-3 rounded-lg border ${
          hasError ? 'border-red-500/30 bg-red-500/5' : 'border-slate-700 bg-slate-800'
        }`}>
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              {hasError && <AlertCircle className="w-4 h-4 text-red-500" />}
              <span className="font-medium text-sm">{span.name}</span>
              <Badge variant={span.kind === 'server' ? 'default' : 'outline'} className="text-xs">
                {span.kind}
              </Badge>
            </div>
            <div className="flex items-center gap-2 text-xs text-slate-400">
              <Clock className="w-3 h-3" />
              {span.duration_ms ? `${span.duration_ms}ms` : 'in progress'}
            </div>
          </div>
          
          {span.attributes && Object.keys(span.attributes).length > 0 && (
            <div className="text-xs text-slate-400 space-y-1">
              {Object.entries(span.attributes).slice(0, 3).map(([key, value]) => (
                <div key={key}>
                  <span className="text-slate-500">{key}:</span> {String(value)}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
          <Input
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search traces by ID or operation..."
            className="pl-9 border-slate-700"
          />
        </div>
        <Button onClick={loadTraces} variant="outline" className="border-slate-700">
          Refresh
        </Button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Trace List */}
        <Card className="bg-slate-900 border-slate-800">
          <CardHeader>
            <CardTitle>Recent Traces</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {loading ? (
              <div className="text-center py-8 text-slate-400">Loading traces...</div>
            ) : filteredTraces.length === 0 ? (
              <div className="text-center py-8 text-slate-400">No traces found</div>
            ) : (
              filteredTraces.map(trace => (
                <button
                  key={trace.trace_id}
                  onClick={() => setSelectedTrace(trace)}
                  className={`w-full p-3 rounded-lg border text-left transition-all ${
                    selectedTrace?.trace_id === trace.trace_id
                      ? 'border-blue-500 bg-blue-500/10'
                      : 'border-slate-700 hover:border-slate-600 bg-slate-800'
                  }`}
                >
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-medium">{trace.root_span.name}</span>
                    <Badge variant={trace.status === 'error' ? 'destructive' : 'default'}>
                      {trace.status}
                    </Badge>
                  </div>
                  <div className="flex items-center gap-3 text-xs text-slate-400">
                    <span className="font-mono">{trace.trace_id.slice(0, 16)}...</span>
                    <span>•</span>
                    <span>{trace.spans.length} spans</span>
                    <span>•</span>
                    <span>{trace.total_duration}ms</span>
                  </div>
                </button>
              ))
            )}
          </CardContent>
        </Card>

        {/* Trace Details */}
        <Card className="bg-slate-900 border-slate-800">
          <CardHeader>
            <CardTitle>Trace Details</CardTitle>
          </CardHeader>
          <CardContent>
            {selectedTrace ? (
              <div className="space-y-4">
                <div className="p-3 bg-slate-800 rounded-lg">
                  <div className="text-xs text-slate-400 mb-1">Trace ID</div>
                  <div className="font-mono text-sm">{selectedTrace.trace_id}</div>
                </div>
                
                <div className="space-y-2">
                  <div className="text-sm font-medium">Span Waterfall</div>
                  {selectedTrace.spans
                    .sort((a, b) => new Date(a.start_time) - new Date(b.start_time))
                    .map(span => renderSpan(span))}
                </div>
              </div>
            ) : (
              <div className="text-center py-12 text-slate-400">
                Select a trace to view details
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}