import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { CheckCircle2, Circle, Loader2, XCircle, Clock } from 'lucide-react';
import { base44 } from '@/api/base44Client';
import { format } from 'date-fns';

const STEP_STATUS_CONFIG = {
  pending: { icon: Circle, color: 'text-slate-500', badge: 'bg-slate-500/20 text-slate-400 border-slate-500/30' },
  running: { icon: Loader2, color: 'text-blue-500', badge: 'bg-blue-500/20 text-blue-400 border-blue-500/30', spin: true },
  completed: { icon: CheckCircle2, color: 'text-green-500', badge: 'bg-green-500/20 text-green-400 border-green-500/30' },
  failed: { icon: XCircle, color: 'text-red-500', badge: 'bg-red-500/20 text-red-400 border-red-500/30' }
};

export default function ExecutionTracker({ runId }) {
  const [execution, setExecution] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadExecution();
    
    // Subscribe to real-time updates
    const unsubscribe = base44.agents.subscribeToConversation(runId, (data) => {
      if (data.execution) {
        setExecution(data.execution);
      }
    });

    return () => unsubscribe();
  }, [runId]);

  const loadExecution = async () => {
    setIsLoading(true);
    try {
      const executions = await base44.entities.WorkflowExecution.filter({ run_id: runId });
      if (executions.length > 0) {
        setExecution(executions[0]);
      }
    } catch (error) {
      console.error('Failed to load execution:', error);
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading) {
    return (
      <Card className="bg-slate-900 border-slate-800">
        <CardContent className="p-8 text-center">
          <Loader2 className="w-8 h-8 text-slate-500 animate-spin mx-auto" />
        </CardContent>
      </Card>
    );
  }

  if (!execution) {
    return (
      <Card className="bg-slate-900 border-slate-800">
        <CardContent className="p-8 text-center text-slate-400">
          No execution data available
        </CardContent>
      </Card>
    );
  }

  const progress = execution.total_steps > 0 
    ? Math.round((execution.completed_steps / execution.total_steps) * 100)
    : 0;

  return (
    <Card className="bg-slate-900 border-slate-800">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="text-white">Execution Progress</CardTitle>
          <Badge variant="outline" className="bg-slate-800 border-slate-700">
            {execution.completed_steps}/{execution.total_steps} steps
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <div>
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm text-slate-400">Overall Progress</span>
            <span className="text-sm font-medium text-white">{progress}%</span>
          </div>
          <Progress value={progress} className="h-2" />
        </div>

        {execution.trace_id && (
          <div className="text-xs text-slate-500">
            Trace ID: <code className="bg-slate-950 px-2 py-1 rounded">{execution.trace_id}</code>
          </div>
        )}

        {execution.retry_count > 0 && (
          <div className="flex items-center gap-2 text-xs text-yellow-400">
            <Clock className="w-3 h-3" />
            Retried {execution.retry_count} time{execution.retry_count !== 1 ? 's' : ''}
          </div>
        )}

        <div className="space-y-2">
          <div className="text-sm font-medium text-slate-300 mb-2">Execution Steps</div>
          {execution.execution_log?.map((step, idx) => {
            const config = STEP_STATUS_CONFIG[step.status] || STEP_STATUS_CONFIG.pending;
            const Icon = config.icon;
            
            return (
              <div key={idx} className="p-3 bg-slate-950 rounded-lg border border-slate-800">
                <div className="flex items-start gap-3">
                  <Icon className={`w-5 h-5 mt-0.5 ${config.color} ${config.spin ? 'animate-spin' : ''}`} />
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-white font-medium">{step.step}</span>
                      <Badge variant="outline" className={config.badge}>
                        {step.status}
                      </Badge>
                    </div>
                    {step.started_at && (
                      <div className="text-xs text-slate-500">
                        Started: {format(new Date(step.started_at), 'h:mm:ss a')}
                        {step.finished_at && (
                          <> • Duration: {Math.round((new Date(step.finished_at) - new Date(step.started_at)) / 1000)}s</>
                        )}
                      </div>
                    )}
                    {step.error && (
                      <div className="text-xs text-red-400 bg-red-500/10 p-2 rounded mt-2">
                        {step.error}
                      </div>
                    )}
                    {step.output && Object.keys(step.output).length > 0 && (
                      <details className="mt-2">
                        <summary className="text-xs text-slate-400 cursor-pointer">View output</summary>
                        <pre className="text-xs text-slate-300 bg-slate-900 p-2 rounded mt-1 overflow-x-auto">
                          {JSON.stringify(step.output, null, 2)}
                        </pre>
                      </details>
                    )}
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