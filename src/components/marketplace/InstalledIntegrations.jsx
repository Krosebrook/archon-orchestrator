import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Settings, Trash2, AlertCircle } from 'lucide-react';
import { ToolIntegration } from '@/entities/all';
import ConfigurationModal from './ConfigurationModal';
import { toast } from 'sonner';

export default function InstalledIntegrations({ integrations, onRefresh }) {
  const [editingIntegration, setEditingIntegration] = useState(null);

  const handleUninstall = async (integration) => {
    if (!confirm(`Uninstall ${integration.name}? This will remove it from all workflows.`)) {
      return;
    }

    try {
      await ToolIntegration.update(integration.id, {
        is_installed: false,
        status: 'inactive',
        config_values: {}
      });
      toast.success('Integration uninstalled');
      onRefresh?.();
    } catch (error) {
      console.error('Uninstall failed:', error);
      toast.error('Failed to uninstall integration');
    }
  };

  const handleUpdateConfig = async (configValues) => {
    try {
      await ToolIntegration.update(editingIntegration.id, {
        config_values: configValues
      });
      toast.success('Configuration updated');
      setEditingIntegration(null);
      onRefresh?.();
    } catch (error) {
      console.error('Update failed:', error);
      toast.error('Failed to update configuration');
    }
  };

  if (integrations.length === 0) {
    return (
      <div className="text-center py-12 text-slate-400">
        No integrations installed yet. Browse the marketplace to get started.
      </div>
    );
  }

  return (
    <>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {integrations.map(integration => (
          <Card key={integration.id} className="bg-slate-900 border-slate-800">
            <CardHeader>
              <div className="flex items-start gap-3 mb-2">
                {integration.icon_url ? (
                  <img src={integration.icon_url} alt={integration.name} className="w-10 h-10 rounded" />
                ) : (
                  <div className="w-10 h-10 rounded bg-slate-800 flex items-center justify-center text-slate-400 text-sm font-medium">
                    {integration.provider[0]}
                  </div>
                )}
                <div className="flex-1">
                  <CardTitle className="text-white text-base">{integration.name}</CardTitle>
                  <p className="text-xs text-slate-400 mt-1">{integration.provider}</p>
                </div>
              </div>
              <Badge variant="outline" className={
                integration.status === 'active' 
                  ? 'bg-green-500/20 text-green-400 border-green-500/30'
                  : integration.status === 'error'
                  ? 'bg-red-500/20 text-red-400 border-red-500/30'
                  : 'bg-slate-500/20 text-slate-400 border-slate-500/30'
              }>
                {integration.status}
              </Badge>
            </CardHeader>
            <CardContent className="space-y-3">
              <p className="text-sm text-slate-400 line-clamp-2">{integration.description}</p>

              {integration.status === 'error' && (
                <div className="flex items-start gap-2 p-2 bg-red-500/10 rounded border border-red-500/30">
                  <AlertCircle className="w-4 h-4 text-red-400 flex-shrink-0 mt-0.5" />
                  <p className="text-xs text-red-400">Integration error. Check configuration.</p>
                </div>
              )}

              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setEditingIntegration(integration)}
                  className="flex-1 border-slate-700"
                >
                  <Settings className="w-3 h-3 mr-2" />
                  Configure
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleUninstall(integration)}
                  className="border-slate-700 text-red-400 hover:text-red-300"
                >
                  <Trash2 className="w-3 h-3" />
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {editingIntegration && (
        <ConfigurationModal
          open={!!editingIntegration}
          onOpenChange={(open) => !open && setEditingIntegration(null)}
          integration={editingIntegration}
          onSave={handleUpdateConfig}
        />
      )}
    </>
  );
}