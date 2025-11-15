import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Bot } from 'lucide-react';

const statusColors = {
  active: 'bg-green-500/20 text-green-400 border-green-500/30',
  inactive: 'bg-slate-500/20 text-slate-400 border-slate-500/30',
  error: 'bg-red-500/20 text-red-400 border-red-500/30',
  deprecated: 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30',
};

export default function AgentHealth({ agents, isLoading }) {
  return (
    <Card className="bg-slate-900 border-slate-800">
      <CardHeader>
        <CardTitle className="text-lg font-semibold text-white">Agent Status</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {isLoading
            ? Array(4).fill(0).map((_, i) => (
                <div key={i} className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <Skeleton className="h-8 w-8 rounded-full" />
                    <Skeleton className="h-4 w-24" />
                  </div>
                  <Skeleton className="h-6 w-20 rounded-md" />
                </div>
              ))
            : agents.map((agent) => (
              <div key={agent.id} className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-slate-800 flex items-center justify-center">
                    <Bot className="w-4 h-4 text-blue-400" />
                  </div>
                  <div>
                    <p className="font-medium text-white">{agent.name}</p>
                    <p className="text-xs text-slate-500">v{agent.version}</p>
                  </div>
                </div>
                <Badge variant="outline" className={`capitalize ${statusColors[agent.status]}`}>
                  {agent.status}
                </Badge>
              </div>
            ))}
        </div>
      </CardContent>
    </Card>
  );
}