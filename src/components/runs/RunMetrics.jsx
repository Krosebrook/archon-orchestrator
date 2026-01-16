import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Clock, DollarSign, Cpu } from 'lucide-react';
import { formatDistanceToNow, formatDistance } from 'date-fns';

const statusStyles = {
    running: "bg-blue-500/20 text-blue-400 border-blue-500/30",
    completed: "bg-green-500/20 text-green-400 border-green-500/30",
    failed: "bg-red-500/20 text-red-400 border-red-500/30",
    pending: "bg-yellow-500/20 text-yellow-400 border-yellow-500/30",
    cancelled: "bg-slate-500/20 text-slate-400 border-slate-500/30"
};

export default function RunMetrics({ run, _workflow, _agent }) {
  const duration = run.finished_at 
    ? formatDistance(new Date(run.finished_at), new Date(run.started_at))
    : formatDistanceToNow(new Date(run.started_at), { addSuffix: true });

  const efficiency = run.tokens_out && run.tokens_in 
    ? ((run.tokens_out / run.tokens_in) * 100).toFixed(1)
    : '0';

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
      <Card className="bg-slate-900 border-slate-800">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium text-slate-400">Status</CardTitle>
          <Badge variant="outline" className={`capitalize ${statusStyles[run.state]}`}>
            {run.state}
          </Badge>
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-white">{run.state}</div>
          <p className="text-xs text-slate-500">
            Started {formatDistanceToNow(new Date(run.started_at), { addSuffix: true })}
          </p>
        </CardContent>
      </Card>

      <Card className="bg-slate-900 border-slate-800">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium text-slate-400">Duration</CardTitle>
          <Clock className="h-4 w-4 text-slate-500" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-white">{duration}</div>
          <p className="text-xs text-slate-500">
            {run.state === 'running' ? 'In progress' : 'Total execution time'}
          </p>
        </CardContent>
      </Card>

      <Card className="bg-slate-900 border-slate-800">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium text-slate-400">Cost</CardTitle>
          <DollarSign className="h-4 w-4 text-slate-500" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-white">${(run.cost_cents / 100).toFixed(2)}</div>
          <p className="text-xs text-slate-500">
            {run.tokens_in + run.tokens_out} tokens total
          </p>
        </CardContent>
      </Card>

      <Card className="bg-slate-900 border-slate-800">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium text-slate-400">Efficiency</CardTitle>
          <Cpu className="h-4 w-4 text-slate-500" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-white">{efficiency}%</div>
          <p className="text-xs text-slate-500">
            Output/Input ratio
          </p>
        </CardContent>
      </Card>
    </div>
  );
}