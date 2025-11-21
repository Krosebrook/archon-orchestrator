import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Upload, CheckCircle, AlertTriangle, XCircle } from 'lucide-react';
import { base44 } from '@/api/base44Client';
import { toast } from 'sonner';
import { format } from 'date-fns';

export default function EnvironmentManager({ environments, agents, onRefresh }) {
  const [deploying, setDeploying] = useState(null);

  const deploy = async (env) => {
    setDeploying(env.id);
    try {
      const user = await base44.auth.me();
      await base44.entities.DeploymentEnvironment.update(env.id, {
        deployed_at: new Date().toISOString(),
        deployed_by: user.email,
        status: 'healthy'
      });
      toast.success(`Deployed to ${env.name}`);
      onRefresh();
    } catch (error) {
      toast.error('Deployment failed');
    } finally {
      setDeploying(null);
    }
  };

  const statusConfig = {
    healthy: { icon: CheckCircle, color: 'text-green-400', bg: 'bg-green-500/20' },
    degraded: { icon: AlertTriangle, color: 'text-yellow-400', bg: 'bg-yellow-500/20' },
    down: { icon: XCircle, color: 'text-red-400', bg: 'bg-red-500/20' }
  };

  const typeColors = {
    development: 'bg-blue-500/20 text-blue-400',
    staging: 'bg-yellow-500/20 text-yellow-400',
    production: 'bg-red-500/20 text-red-400'
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
      {environments.map(env => {
        const agent = agents.find(a => a.id === env.agent_id);
        const config = statusConfig[env.status] || statusConfig.healthy;
        const Icon = config.icon;

        return (
          <Card key={env.id} className="bg-slate-900 border-slate-800">
            <CardHeader>
              <div className="flex items-start justify-between">
                <CardTitle className="text-white">{env.name}</CardTitle>
                <Badge variant="outline" className={typeColors[env.type]}>
                  {env.type}
                </Badge>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className={`p-3 rounded-lg ${config.bg} flex items-center gap-3`}>
                <Icon className={`w-5 h-5 ${config.color}`} />
                <div>
                  <p className={`text-sm font-medium ${config.color}`}>
                    {env.status}
                  </p>
                  {env.deployed_at && (
                    <p className="text-xs text-slate-400">
                      {format(new Date(env.deployed_at), 'MMM d, HH:mm')}
                    </p>
                  )}
                </div>
              </div>

              {agent && (
                <div className="text-sm text-slate-400">
                  <p>Agent: {agent.name}</p>
                  <p className="text-xs mt-1">Version: {env.version || 'N/A'}</p>
                </div>
              )}

              <Button
                onClick={() => deploy(env)}
                disabled={deploying === env.id}
                className="w-full bg-blue-600 hover:bg-blue-700"
                size="sm"
              >
                <Upload className="w-4 h-4 mr-2" />
                {deploying === env.id ? 'Deploying...' : 'Deploy'}
              </Button>

              {env.requires_approval && (
                <p className="text-xs text-yellow-400">⚠️ Requires approval</p>
              )}
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}