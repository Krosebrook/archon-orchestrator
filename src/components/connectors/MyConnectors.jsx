import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { CheckCircle2, XCircle, AlertTriangle, Settings, Trash2 } from 'lucide-react';
import { base44 } from '@/api/base44Client';
import { toast } from 'sonner';

export default function MyConnectors({ installations, connectors, onRefresh }) {
  const handleDelete = async (installationId) => {
    if (!confirm('Are you sure you want to remove this connector?')) return;

    try {
      await base44.entities.ConnectorInstallation.delete(installationId);
      toast.success('Connector removed');
      onRefresh();
    } catch (error) {
      console.error('Failed to delete connector:', error);
      toast.error('Failed to remove connector');
    }
  };

  if (installations.length === 0) {
    return (
      <Card className="bg-slate-900 border-slate-800">
        <CardContent className="flex flex-col items-center justify-center h-64 text-slate-400">
          <Settings className="w-16 h-16 mb-4 opacity-50" />
          <p>No connectors installed yet</p>
          <p className="text-sm mt-2">Browse the marketplace to get started</p>
        </CardContent>
      </Card>
    );
  }

  const statusConfig = {
    active: { icon: CheckCircle2, color: 'text-green-400', bg: 'bg-green-900/20' },
    error: { icon: XCircle, color: 'text-red-400', bg: 'bg-red-900/20' },
    expired: { icon: AlertTriangle, color: 'text-yellow-400', bg: 'bg-yellow-900/20' },
    revoked: { icon: XCircle, color: 'text-slate-400', bg: 'bg-slate-800' },
  };

  return (
    <div className="space-y-4">
      {installations.map((installation) => {
        const connector = connectors.find(c => c.id === installation.connector_id);
        if (!connector) return null;

        const config = statusConfig[installation.status];
        const StatusIcon = config.icon;

        return (
          <Card key={installation.id} className={`bg-slate-900 border-slate-800`}>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  {connector.icon_url && (
                    <img src={connector.icon_url} alt={connector.name} className="w-10 h-10 object-contain" />
                  )}
                  <div>
                    <CardTitle className="text-white flex items-center gap-2">
                      {installation.name}
                      <StatusIcon className={`w-4 h-4 ${config.color}`} />
                    </CardTitle>
                    <p className="text-sm text-slate-400">{connector.name}</p>
                  </div>
                </div>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => handleDelete(installation.id)}
                  className="text-red-400 hover:text-red-300"
                >
                  <Trash2 className="w-4 h-4" />
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-3 gap-4 text-sm">
                <div>
                  <p className="text-slate-500">Status</p>
                  <p className={`font-medium ${config.color} capitalize`}>{installation.status}</p>
                </div>
                <div>
                  <p className="text-slate-500">Usage</p>
                  <p className="text-white">{installation.usage_count || 0} calls</p>
                </div>
                <div>
                  <p className="text-slate-500">Last Used</p>
                  <p className="text-white">
                    {installation.last_used 
                      ? new Date(installation.last_used).toLocaleDateString()
                      : 'Never'}
                  </p>
                </div>
              </div>

              {installation.error_message && (
                <div className="mt-3 p-2 bg-red-900/20 border border-red-700/50 rounded text-xs text-red-300">
                  {installation.error_message}
                </div>
              )}
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}