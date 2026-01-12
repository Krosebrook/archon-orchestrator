import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { CheckCircle2, Circle, Loader2 } from 'lucide-react';

export default function RefactorProgress({ recommendations }) {
  const total = recommendations.length;
  const completed = recommendations.filter(r => r.status === 'completed').length;
  const inProgress = recommendations.filter(r => r.status === 'in_progress').length;
  const pending = recommendations.filter(r => r.status === 'pending').length;
  
  const progressPercent = total > 0 ? Math.round((completed / total) * 100) : 0;

  const byStage = {
    0: recommendations.filter(r => r.stage === 0),
    1: recommendations.filter(r => r.stage === 1),
    2: recommendations.filter(r => r.stage === 2),
    3: recommendations.filter(r => r.stage === 3)
  };

  const stageProgress = Object.entries(byStage).map(([stage, recs]) => {
    const stageCompleted = recs.filter(r => r.status === 'completed').length;
    return {
      stage: parseInt(stage),
      total: recs.length,
      completed: stageCompleted,
      percent: recs.length > 0 ? Math.round((stageCompleted / recs.length) * 100) : 0
    };
  });

  return (
    <Card className="bg-slate-900 border-slate-800">
      <CardHeader>
        <CardTitle className="text-white text-lg">Refactoring Progress</CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        <div>
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm text-slate-400">Overall Progress</span>
            <span className="text-sm font-medium text-white">{completed}/{total} completed</span>
          </div>
          <Progress value={progressPercent} className="h-3" />
          <div className="flex items-center gap-4 mt-3 text-xs">
            <div className="flex items-center gap-1">
              <CheckCircle2 className="w-3 h-3 text-green-400" />
              <span className="text-slate-400">{completed} Completed</span>
            </div>
            <div className="flex items-center gap-1">
              <Loader2 className="w-3 h-3 text-blue-400" />
              <span className="text-slate-400">{inProgress} In Progress</span>
            </div>
            <div className="flex items-center gap-1">
              <Circle className="w-3 h-3 text-slate-500" />
              <span className="text-slate-400">{pending} Pending</span>
            </div>
          </div>
        </div>

        <div className="space-y-3">
          <div className="text-sm font-medium text-slate-300 mb-2">Stage Breakdown</div>
          {stageProgress.map(({ stage, total: stageTotal, completed: stageCompleted, percent }) => (
            <div key={stage} className="space-y-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Badge variant="outline" className="bg-slate-800 border-slate-700">
                    Stage {stage}
                  </Badge>
                  <span className="text-xs text-slate-400">
                    {stageCompleted}/{stageTotal}
                  </span>
                </div>
                <span className="text-xs text-slate-400">{percent}%</span>
              </div>
              <Progress value={percent} className="h-2" />
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}