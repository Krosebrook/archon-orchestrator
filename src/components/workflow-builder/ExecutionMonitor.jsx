import { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  Play,
  Pause,
  RefreshCw,
  CheckCircle2,
  AlertCircle,
  Clock,
  Loader2,
  Terminal,
  DollarSign,
  Zap
} from 'lucide-react';
import { format } from 'date-fns';

const STATUS_CONFIG = {
  pending: { icon: Clock, color: 'text-slate-400', bg: 'bg-slate-500/20', label: 'Pending' },
  running: { icon: Loader2, color: 'text-blue-400', bg: 'bg-blue-500/20', label: 'Running', spin: true },
  completed: { icon: CheckCircle2, color: 'text-green-400', bg: 'bg-green-500/20', label: 'Completed' },
  failed: { icon: AlertCircle, color: 'text-red-400', bg: 'bg-red-500/20', label: 'Failed' },
  paused: { icon: Pause, color: 'text-yellow-400', bg: 'bg-yellow-500/20', label: 'Paused' }
};

function NodeExecutionCard({ node, index, isActive }) {
  const status = node.executionStatus || 'pending';
  const config = STATUS_CONFIG[status];
  const StatusIcon = config.icon;

  return (
    <div className={`
      p-4 rounded-lg border transition-all
      ${isActive ? 'bg-blue-500/10 border-blue-500/50' : 'bg-slate-800/50 border-slate-700'}
    `}>
      <div className="flex items-start gap-3">
        <div className="flex-shrink-0 flex items-center justify-center w-8 h-8 rounded-full bg-slate-700 text-white font-medium">
          {index + 1}
        </div>
        
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <span className="font-medium text-white">{node.label}</span>
            <Badge className={`${config.bg} ${config.color} text-xs`}>
              {config.label}
            </Badge>
          </div>
          
          {node.config?.agent_name && (
            <div className="text-xs text-slate-400 mt-1">
              Agent: {node.config.agent_name}
            </div>
          )}
          
          {node.executionResult && (
            <div className="mt-2 p-2 bg-slate-950 rounded text-xs text-slate-300 font-mono">
              {typeof node.executionResult === 'string' 
                ? node.executionResult.slice(0, 200) 
                : JSON.stringify(node.executionResult).slice(0, 200)}
              {(node.executionResult?.length || JSON.stringify(node.executionResult).length) > 200 && '...'}
            </div>
          )}
          
          {node.executionError && (
            <div className="mt-2 p-2 bg-red-950/50 border border-red-900 rounded text-xs text-red-300">
              {node.executionError}
            </div>
          )}
        </div>

        <StatusIcon className={`w-5 h-5 ${config.color} ${config.spin ? 'animate-spin' : ''}`} />
      </div>
    </div>
  );
}

export default function ExecutionMonitor({ run, nodes, workflow }) {
  const [_logs, _setLogs] = useState([]);
  const [metrics, setMetrics] = useState(null);

  useEffect(() => {
    if (run?.id) {
      loadMetrics();
    }
  }, [run?.id]);

  const loadMetrics = async () => {
    if (!run?.id) return;
    
    try {
      const metricsData = await base44.entities.AgentMetric.filter(
        { run_id: run.id },
        '-timestamp',
        50
      );
      setMetrics(metricsData);
    } catch (error) {
      console.error('Failed to load metrics:', error);
    }
  };

  const completedNodes = nodes.filter(n => n.executionStatus === 'completed').length;
  const progress = nodes.length > 0 ? (completedNodes / nodes.length) * 100 : 0;

  const totalCost = metrics?.reduce((sum, m) => sum + (m.cost_cents || 0), 0) || 0;
  const _totalLatency = metrics?.reduce((sum, m) => sum + (m.latency_ms || 0), 0) || 0;
  const totalTokens = metrics?.reduce((sum, m) => sum + (m.prompt_tokens || 0) + (m.completion_tokens || 0), 0) || 0;

  if (!run) {
    return (
      <div className="flex flex-col items-center justify-center h-full text-center p-8">
        <Play className="w-16 h-16 text-slate-700 mb-4" />
        <h3 className="text-xl font-medium text-slate-400 mb-2">No Active Execution</h3>
        <p className="text-slate-500">Click "Execute" to run your workflow and monitor progress here</p>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-white">{workflow?.name || 'Workflow Execution'}</h2>
          <div className="flex items-center gap-3 mt-1 text-sm text-slate-400">
            <span>Run ID: {run.id.slice(0, 8)}...</span>
            <span>Started: {run.started_at ? format(new Date(run.started_at), 'HH:mm:ss') : 'N/A'}</span>
          </div>
        </div>
        
        <div className="flex items-center gap-2">
          <Badge className={`${STATUS_CONFIG[run.state]?.bg} ${STATUS_CONFIG[run.state]?.color}`}>
            {STATUS_CONFIG[run.state]?.label || run.state}
          </Badge>
          <Button variant="outline" size="sm" onClick={loadMetrics} className="border-slate-700">
            <RefreshCw className="w-4 h-4" />
          </Button>
        </div>
      </div>

      {/* Progress */}
      <Card className="bg-slate-800/50 border-slate-700">
        <CardContent className="pt-6">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm text-slate-400">Progress</span>
            <span className="text-sm font-medium text-white">{completedNodes}/{nodes.length} nodes</span>
          </div>
          <Progress value={progress} className="h-2" />
        </CardContent>
      </Card>

      {/* Metrics */}
      <div className="grid grid-cols-4 gap-4">
        <Card className="bg-slate-800/50 border-slate-700">
          <CardContent className="pt-4">
            <div className="flex items-center gap-2 text-slate-400 text-sm">
              <Clock className="w-4 h-4" />
              Duration
            </div>
            <div className="text-2xl font-bold text-white mt-1">
              {run.duration_ms ? `${(run.duration_ms / 1000).toFixed(1)}s` : 
               run.started_at ? `${((Date.now() - new Date(run.started_at).getTime()) / 1000).toFixed(0)}s` : '--'}
            </div>
          </CardContent>
        </Card>

        <Card className="bg-slate-800/50 border-slate-700">
          <CardContent className="pt-4">
            <div className="flex items-center gap-2 text-slate-400 text-sm">
              <DollarSign className="w-4 h-4" />
              Cost
            </div>
            <div className="text-2xl font-bold text-white mt-1">
              ${(totalCost / 100).toFixed(3)}
            </div>
          </CardContent>
        </Card>

        <Card className="bg-slate-800/50 border-slate-700">
          <CardContent className="pt-4">
            <div className="flex items-center gap-2 text-slate-400 text-sm">
              <Zap className="w-4 h-4" />
              Tokens
            </div>
            <div className="text-2xl font-bold text-white mt-1">
              {totalTokens.toLocaleString()}
            </div>
          </CardContent>
        </Card>

        <Card className="bg-slate-800/50 border-slate-700">
          <CardContent className="pt-4">
            <div className="flex items-center gap-2 text-slate-400 text-sm">
              <Terminal className="w-4 h-4" />
              API Calls
            </div>
            <div className="text-2xl font-bold text-white mt-1">
              {metrics?.length || 0}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Node Execution Timeline */}
      <Card className="bg-slate-800/50 border-slate-700">
        <CardHeader>
          <CardTitle className="text-white text-lg">Execution Timeline</CardTitle>
        </CardHeader>
        <CardContent>
          <ScrollArea className="h-[400px]">
            <div className="space-y-3">
              {nodes.map((node, index) => (
                <NodeExecutionCard
                  key={node.id}
                  node={node}
                  index={index}
                  isActive={node.executionStatus === 'running'}
                />
              ))}
            </div>
          </ScrollArea>
        </CardContent>
      </Card>

      {/* Output */}
      {run.state === 'completed' && run.output && (
        <Card className="bg-slate-800/50 border-slate-700">
          <CardHeader>
            <CardTitle className="text-white text-lg flex items-center gap-2">
              <CheckCircle2 className="w-5 h-5 text-green-400" />
              Workflow Output
            </CardTitle>
          </CardHeader>
          <CardContent>
            <pre className="bg-slate-950 rounded-lg p-4 text-sm text-slate-300 font-mono overflow-auto max-h-64">
              {JSON.stringify(run.output, null, 2)}
            </pre>
          </CardContent>
        </Card>
      )}

      {/* Error */}
      {run.state === 'failed' && run.error_message && (
        <Card className="bg-red-950/30 border-red-900">
          <CardHeader>
            <CardTitle className="text-red-400 text-lg flex items-center gap-2">
              <AlertCircle className="w-5 h-5" />
              Execution Error
            </CardTitle>
          </CardHeader>
          <CardContent>
            <pre className="bg-red-950/50 rounded-lg p-4 text-sm text-red-300 font-mono">
              {run.error_message}
            </pre>
          </CardContent>
        </Card>
      )}
    </div>
  );
}