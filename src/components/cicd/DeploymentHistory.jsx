import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Upload, User, Clock } from 'lucide-react';
import { format } from 'date-fns';

export default function DeploymentHistory({ environments, pipelines, agents }) {
  const sortedEnvs = [...environments].sort((a, b) => 
    new Date(b.deployed_at || 0) - new Date(a.deployed_at || 0)
  );

  const typeColors = {
    development: 'bg-blue-500/20 text-blue-400',
    staging: 'bg-yellow-500/20 text-yellow-400',
    production: 'bg-red-500/20 text-red-400'
  };

  return (
    <div className="space-y-4">
      {sortedEnvs.map(env => {
        const agent = agents.find(a => a.id === env.agent_id);
        
        return (
          <Card key={env.id} className="bg-slate-900 border-slate-800">
            <CardContent className="pt-6">
              <div className="flex items-start justify-between">
                <div className="flex items-start gap-4">
                  <div className="w-10 h-10 rounded-lg bg-blue-500/20 flex items-center justify-center">
                    <Upload className="w-5 h-5 text-blue-400" />
                  </div>
                  <div>
                    <h3 className="text-white font-semibold">{env.name}</h3>
                    <p className="text-sm text-slate-400 mt-1">
                      {agent?.name || 'No agent'} - {env.version || 'Unknown version'}
                    </p>
                    <div className="flex items-center gap-4 mt-2 text-xs text-slate-500">
                      {env.deployed_by && (
                        <span className="flex items-center gap-1">
                          <User className="w-3 h-3" />
                          {env.deployed_by}
                        </span>
                      )}
                      {env.deployed_at && (
                        <span className="flex items-center gap-1">
                          <Clock className="w-3 h-3" />
                          {format(new Date(env.deployed_at), 'MMM d, yyyy HH:mm')}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
                <Badge variant="outline" className={typeColors[env.type]}>
                  {env.type}
                </Badge>
              </div>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}