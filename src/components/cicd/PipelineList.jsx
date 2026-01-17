import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Play, Settings, Trash2, Clock, CheckCircle, XCircle } from 'lucide-react';
import { base44 } from '@/api/base44Client';
import { toast } from 'sonner';
import { format } from 'date-fns';

export default function PipelineList({ pipelines, agents, isLoading, onEdit, onRefresh }) {
  const [runningPipeline, setRunningPipeline] = useState(null);

  const runPipeline = async (pipeline) => {
    setRunningPipeline(pipeline.id);
    try {
      // Simulate pipeline run
      await new Promise(resolve => setTimeout(resolve, 3000));
      
      await base44.entities.CIPipeline.update(pipeline.id, {
        last_run: {
          status: 'success',
          started_at: new Date().toISOString(),
          finished_at: new Date().toISOString(),
          duration_ms: 3000
        }
      });
      
      toast.success('Pipeline completed successfully');
      onRefresh();
    } catch (_error) {
      toast.error('Pipeline failed');
    } finally {
      setRunningPipeline(null);
    }
  };

  const deletePipeline = async (id) => {
    if (!confirm('Delete this pipeline?')) return;
    try {
      await base44.entities.CIPipeline.delete(id);
      toast.success('Pipeline deleted');
      onRefresh();
    } catch (_error) {
      toast.error('Failed to delete pipeline');
    }
  };

  const statusConfig = {
    success: { icon: CheckCircle, color: 'text-green-400', bg: 'bg-green-500/20' },
    failed: { icon: XCircle, color: 'text-red-400', bg: 'bg-red-500/20' },
    running: { icon: Clock, color: 'text-blue-400', bg: 'bg-blue-500/20' }
  };

  if (isLoading) {
    return <div className="text-slate-400 text-center py-12">Loading pipelines...</div>;
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {pipelines.map(pipeline => {
        const agent = agents.find(a => a.id === pipeline.agent_id);
        const status = pipeline.last_run?.status;
        const config = statusConfig[status] || statusConfig.success;
        const Icon = config.icon;

        return (
          <Card key={pipeline.id} className="bg-slate-900 border-slate-800">
            <CardHeader>
              <div className="flex items-start justify-between">
                <div>
                  <CardTitle className="text-white text-lg">{pipeline.name}</CardTitle>
                  <p className="text-sm text-slate-400 mt-1">
                    {agent?.name || 'No agent'}
                  </p>
                </div>
                <Badge variant="outline" className="capitalize">
                  {pipeline.trigger}
                </Badge>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              {pipeline.last_run && (
                <div className={`p-3 rounded-lg ${config.bg} flex items-center gap-3`}>
                  <Icon className={`w-5 h-5 ${config.color}`} />
                  <div className="flex-1">
                    <p className={`text-sm font-medium ${config.color}`}>
                      Last run: {status}
                    </p>
                    <p className="text-xs text-slate-400">
                      {format(new Date(pipeline.last_run.started_at), 'MMM d, HH:mm')}
                    </p>
                  </div>
                </div>
              )}

              <div className="flex gap-2">
                <Button
                  onClick={() => runPipeline(pipeline)}
                  disabled={runningPipeline === pipeline.id}
                  className="flex-1 bg-blue-600 hover:bg-blue-700"
                  size="sm"
                >
                  <Play className="w-4 h-4 mr-1" />
                  {runningPipeline === pipeline.id ? 'Running...' : 'Run'}
                </Button>
                <Button
                  onClick={() => onEdit(pipeline)}
                  variant="outline"
                  size="sm"
                  className="border-slate-700"
                >
                  <Settings className="w-4 h-4" />
                </Button>
                <Button
                  onClick={() => deletePipeline(pipeline.id)}
                  variant="outline"
                  size="sm"
                  className="border-slate-700 text-red-400"
                >
                  <Trash2 className="w-4 h-4" />
                </Button>
              </div>

              <div className="text-xs text-slate-500">
                {pipeline.stages?.length || 0} stages configured
              </div>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}