import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Users, Play, Pause, CheckCircle, AlertCircle } from 'lucide-react';
import { format } from 'date-fns';
import { base44 } from '@/api/base44Client';
import { toast } from 'sonner';

export default function CollaborationHub({ collaborations, teams, agents, workflows, onRefresh }) {
  const statusConfig = {
    active: { icon: Play, color: 'text-green-400', bg: 'bg-green-500/20' },
    paused: { icon: Pause, color: 'text-yellow-400', bg: 'bg-yellow-500/20' },
    completed: { icon: CheckCircle, color: 'text-blue-400', bg: 'bg-blue-500/20' },
    failed: { icon: AlertCircle, color: 'text-red-400', bg: 'bg-red-500/20' }
  };

  const strategyColors = {
    sequential: 'bg-blue-500/20 text-blue-400',
    parallel: 'bg-purple-500/20 text-purple-400',
    consensus: 'bg-green-500/20 text-green-400',
    hierarchical: 'bg-yellow-500/20 text-yellow-400'
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      {collaborations.map(collab => {
        const workflow = workflows.find(w => w.id === collab.workflow_id);
        const config = statusConfig[collab.state];
        const Icon = config.icon;
        const participantCount = collab.participant_agents?.length || 0;

        return (
          <Card key={collab.id} className="bg-slate-900 border-slate-800">
            <CardHeader>
              <div className="flex items-start justify-between">
                <div>
                  <CardTitle className="text-white text-lg">{collab.name}</CardTitle>
                  <p className="text-sm text-slate-400 mt-1">{workflow?.name || 'No workflow'}</p>
                </div>
                <Badge variant="outline" className={config.color}>
                  {collab.state}
                </Badge>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center gap-2">
                <Users className="w-4 h-4 text-slate-400" />
                <span className="text-sm text-slate-300">{participantCount} agents</span>
                <Badge variant="outline" className={strategyColors[collab.strategy]}>
                  {collab.strategy}
                </Badge>
              </div>

              {collab.decisions?.length > 0 && (
                <div className="p-3 bg-slate-950 rounded-lg">
                  <p className="text-xs text-slate-400 mb-2">Recent Decisions:</p>
                  {collab.decisions.slice(-2).map((decision, idx) => (
                    <div key={idx} className="text-xs text-slate-300 mb-1">
                      • {decision.decision} ({decision.confidence?.toFixed(2)})
                    </div>
                  ))}
                </div>
              )}

              {collab.total_cost_cents > 0 && (
                <div className="text-xs text-slate-400">
                  Cost: ${(collab.total_cost_cents / 100).toFixed(2)}
                </div>
              )}
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}