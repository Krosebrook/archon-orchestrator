import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { AlertTriangle, DollarSign, Clock, TrendingUp, Settings } from 'lucide-react';
import { format } from 'date-fns';

const ALERT_TYPE_CONFIG = {
  cost_threshold: {
    icon: DollarSign,
    label: 'Cost Threshold',
    color: 'text-red-400'
  },
  failure_rate: {
    icon: AlertTriangle,
    label: 'Failure Rate',
    color: 'text-orange-400'
  },
  token_usage: {
    icon: TrendingUp,
    label: 'Token Usage',
    color: 'text-blue-400'
  },
  run_duration: {
    icon: Clock,
    label: 'Run Duration',
    color: 'text-purple-400'
  }
};

export default function AlertsTable({ alerts }) {
  if (!alerts || alerts.length === 0) {
    return (
      <Card className="bg-slate-900 border-slate-800">
        <CardContent className="p-8 text-center">
          <div className="text-slate-400">No alerts configured</div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="bg-slate-900 border-slate-800">
      <CardHeader>
        <CardTitle className="text-white">Alert Configuration</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {alerts.map((alert) => {
            const config = ALERT_TYPE_CONFIG[alert.type] || {
              icon: Settings,
              label: alert.type,
              color: 'text-slate-400'
            };
            const Icon = config.icon;

            return (
              <div
                key={alert.id}
                className="flex items-center justify-between p-4 rounded-lg bg-slate-950 border border-slate-800"
              >
                <div className="flex items-center gap-4">
                  <div className={`p-2 rounded-lg bg-slate-800 ${config.color}`}>
                    <Icon className="w-5 h-5" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-white font-medium">{alert.name}</span>
                      <Badge
                        variant="outline"
                        className={alert.enabled ? 'bg-green-500/20 text-green-400 border-green-500/30' : 'bg-slate-700 text-slate-400 border-slate-600'}
                      >
                        {alert.enabled ? 'Enabled' : 'Disabled'}
                      </Badge>
                    </div>
                    <div className="text-sm text-slate-400">
                      <span className="text-slate-500">{config.label}</span>
                      {' • '}
                      {alert.condition?.threshold && (
                        <span>Threshold: {alert.condition.threshold}</span>
                      )}
                      {alert.targets && (
                        <span> • {alert.targets.length} recipient{alert.targets.length !== 1 ? 's' : ''}</span>
                      )}
                    </div>
                    {alert.last_triggered && (
                      <div className="text-xs text-slate-500 mt-1">
                        Last triggered: {format(new Date(alert.last_triggered), 'MMM d, yyyy h:mm a')}
                      </div>
                    )}
                  </div>
                </div>
                <Button variant="ghost" size="sm" className="text-slate-400 hover:text-white">
                  Configure
                </Button>
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}