import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { GitFork, Bot, Calendar, User } from 'lucide-react';
import { format } from 'date-fns';

const providerColors = {
  openai: 'bg-sky-500/20 text-sky-400 border-sky-500/30',
  anthropic: 'bg-amber-500/20 text-amber-400 border-amber-500/30',
};

export default function RunHeader({ run, workflow, agent }) {
  return (
    <Card className="bg-slate-900 border-slate-800 mb-8">
      <CardContent className="p-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-4">
            <div>
              <h3 className="text-lg font-semibold text-white mb-2 flex items-center gap-2">
                <GitFork className="w-5 h-5 text-blue-400" />
                Workflow Details
              </h3>
              <div className="space-y-2">
                <p className="text-white font-medium">{workflow?.name || 'Unknown Workflow'}</p>
                <p className="text-slate-400 text-sm">{workflow?.description || 'No description available'}</p>
                <div className="flex items-center gap-2">
                  <span className="text-slate-500 text-xs">Version:</span>
                  <Badge variant="outline" className="text-xs">v{workflow?.version}</Badge>
                </div>
              </div>
            </div>
          </div>

          <div className="space-y-4">
            <div>
              <h3 className="text-lg font-semibold text-white mb-2 flex items-center gap-2">
                <Bot className="w-5 h-5 text-green-400" />
                Agent Details
              </h3>
              <div className="space-y-2">
                <p className="text-white font-medium">{agent?.name || 'Unknown Agent'}</p>
                <div className="flex items-center gap-2">
                  <Badge variant="outline" className={`${providerColors[agent?.config?.provider] || 'bg-slate-500/20 text-slate-400'}`}>
                    {agent?.config?.provider || 'Unknown'}
                  </Badge>
                  <span className="text-slate-400 text-sm font-mono">{agent?.config?.model}</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-slate-500 text-xs">Version:</span>
                  <Badge variant="outline" className="text-xs">v{agent?.version}</Badge>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="border-t border-slate-800 mt-6 pt-4">
          <div className="flex items-center justify-between text-sm">
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2 text-slate-400">
                <Calendar className="w-4 h-4" />
                <span>Started: {format(new Date(run.started_at), 'MMM d, yyyy h:mm a')}</span>
              </div>
              {run.finished_at && (
                <div className="flex items-center gap-2 text-slate-400">
                  <Calendar className="w-4 h-4" />
                  <span>Finished: {format(new Date(run.finished_at), 'MMM d, yyyy h:mm a')}</span>
                </div>
              )}
            </div>
            <div className="flex items-center gap-2 text-slate-400">
              <User className="w-4 h-4" />
              <span>Run ID: {run.id.substring(0, 8)}...</span>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}