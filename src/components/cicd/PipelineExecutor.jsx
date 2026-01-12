import { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { 
  PlayCircle, 
  CheckCircle2, 
  XCircle, 
  Clock,
  Loader2,
  AlertCircle
} from 'lucide-react';
import { toast } from 'sonner';

const STAGE_ICONS = {
  lint: '🔍',
  test: '🧪',
  build: '🔨',
  deploy: '🚀'
};

export default function PipelineExecutor({ pipeline, workflow, onComplete }) {
  const [isExecuting, setIsExecuting] = useState(false);
  const [execution, setExecution] = useState(null);
  const [currentStage, setCurrentStage] = useState(0);

  const handleExecute = async () => {
    setIsExecuting(true);
    setExecution(null);
    setCurrentStage(0);

    try {
      toast.info('Starting pipeline execution...');

      const { data } = await base44.functions.invoke('executePipeline', {
        pipeline_id: pipeline.id,
        workflow_id: workflow.id,
        trigger: 'manual',
        config: {
          environment: 'staging'
        }
      });

      setExecution(data);
      
      if (data.status === 'success') {
        toast.success('Pipeline completed successfully!');
      } else {
        toast.error('Pipeline failed');
      }

      if (onComplete) {
        onComplete(data);
      }
    } catch (error) {
      console.error('Pipeline execution failed:', error);
      toast.error(error.message || 'Pipeline execution failed');
    } finally {
      setIsExecuting(false);
    }
  };

  const getStageStatus = (stage) => {
    if (!execution) return 'pending';
    const result = execution.stages?.find(s => s.stage === stage.name);
    return result?.status || 'pending';
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'passed':
        return <CheckCircle2 className="w-5 h-5 text-green-500" />;
      case 'failed':
        return <XCircle className="w-5 h-5 text-red-500" />;
      case 'running':
        return <Loader2 className="w-5 h-5 text-blue-500 animate-spin" />;
      default:
        return <Clock className="w-5 h-5 text-slate-500" />;
    }
  };

  const stages = pipeline.stages || [
    { name: 'lint', type: 'lint', order: 1 },
    { name: 'test', type: 'test', order: 2 },
    { name: 'build', type: 'build', order: 3 },
    { name: 'deploy', type: 'deploy', order: 4 }
  ];

  const sortedStages = [...stages].sort((a, b) => a.order - b.order);
  const completedStages = execution?.stages?.filter(s => s.status !== 'pending').length || 0;
  const progress = execution ? (completedStages / sortedStages.length) * 100 : 0;

  return (
    <Card className="bg-slate-900 border-slate-800">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <PlayCircle className="w-5 h-5" />
            Pipeline Execution
          </CardTitle>
          <Button
            onClick={handleExecute}
            disabled={isExecuting}
            className="bg-green-600 hover:bg-green-700"
          >
            {isExecuting ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Executing...
              </>
            ) : (
              <>
                <PlayCircle className="w-4 h-4 mr-2" />
                Run Pipeline
              </>
            )}
          </Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {execution && (
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-slate-400">Progress</span>
              <span className="text-white">{Math.round(progress)}%</span>
            </div>
            <Progress value={progress} className="h-2" />
          </div>
        )}

        <div className="space-y-3">
          {sortedStages.map((stage, idx) => {
            const status = getStageStatus(stage);
            const result = execution?.stages?.find(s => s.stage === stage.name);

            return (
              <div
                key={stage.name}
                className={`p-4 rounded-lg border transition-all ${
                  status === 'passed'
                    ? 'border-green-500/30 bg-green-500/5'
                    : status === 'failed'
                    ? 'border-red-500/30 bg-red-500/5'
                    : 'border-slate-700 bg-slate-800/50'
                }`}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <span className="text-2xl">{STAGE_ICONS[stage.type] || '⚙️'}</span>
                    <div>
                      <div className="font-medium capitalize">{stage.name}</div>
                      {result?.summary && (
                        <div className="text-sm text-slate-400">{result.summary}</div>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    {result?.duration_ms && (
                      <span className="text-xs text-slate-500">
                        {(result.duration_ms / 1000).toFixed(2)}s
                      </span>
                    )}
                    {getStatusIcon(status)}
                  </div>
                </div>

                {result?.issues && result.issues.length > 0 && (
                  <div className="mt-3 space-y-1">
                    {result.issues.map((issue, i) => (
                      <div
                        key={i}
                        className="flex items-start gap-2 text-sm p-2 bg-slate-950 rounded"
                      >
                        <AlertCircle className={`w-4 h-4 flex-shrink-0 mt-0.5 ${
                          issue.severity === 'error' ? 'text-red-500' : 'text-yellow-500'
                        }`} />
                        <span className="text-slate-300">{issue.message}</span>
                      </div>
                    ))}
                  </div>
                )}

                {result?.tests && (
                  <div className="mt-3 space-y-1">
                    {result.tests.map((test, i) => (
                      <div key={i} className="flex items-center justify-between text-sm">
                        <span className="text-slate-400">{test.name}</span>
                        <Badge variant={test.status === 'passed' ? 'default' : 'destructive'}>
                          {test.status}
                        </Badge>
                      </div>
                    ))}
                  </div>
                )}

                {result?.url && (
                  <div className="mt-3 text-sm">
                    <span className="text-slate-400">Deployed to: </span>
                    <a
                      href={result.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-blue-400 hover:underline"
                    >
                      {result.url}
                    </a>
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {execution && (
          <div className="pt-4 border-t border-slate-800 flex items-center justify-between">
            <div className="text-sm text-slate-400">
              Total Duration: {(execution.duration_ms / 1000).toFixed(2)}s
            </div>
            <Badge
              variant={execution.status === 'success' ? 'default' : 'destructive'}
              className="text-sm"
            >
              {execution.status}
            </Badge>
          </div>
        )}
      </CardContent>
    </Card>
  );
}