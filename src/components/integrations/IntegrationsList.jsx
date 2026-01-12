import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Settings, Trash2, AlertCircle, CheckCircle, XCircle, Key } from 'lucide-react';
import { ToolIntegration } from '@/entities/all';
import ConfigurationModal from '../marketplace/ConfigurationModal';
import OperationPermissions from './OperationPermissions';
import { toast } from 'sonner';

export default function IntegrationsList({ integrations, onRefresh }) {
  const [editingIntegration, setEditingIntegration] = useState(null);
  const [permissionsIntegration, setPermissionsIntegration] = useState(null);

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
        config_values: configValues,
        status: 'active'
      });
      toast.success('Configuration updated');
      setEditingIntegration(null);
      onRefresh?.();
    } catch (error) {
      console.error('Update failed:', error);
      toast.error('Failed to update configuration');
    }
  };

  const handleToggleStatus = async (integration) => {
    try {
      const newStatus = integration.status === 'active' ? 'inactive' : 'active';
      await ToolIntegration.update(integration.id, { status: newStatus });
      toast.success(`Integration ${newStatus === 'active' ? 'activated' : 'deactivated'}`);
      onRefresh?.();
    } catch (error) {
      console.error('Status toggle failed:', error);
      toast.error('Failed to update status');
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'active': return <CheckCircle className="w-4 h-4 text-green-400" />;
      case 'error': return <AlertCircle className="w-4 h-4 text-red-400" />;
      case 'inactive': return <XCircle className="w-4 h-4 text-slate-400" />;
      default: return null;
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'active': return 'bg-green-500/20 text-green-400 border-green-500/30';
      case 'error': return 'bg-red-500/20 text-red-400 border-red-500/30';
      case 'inactive': return 'bg-slate-500/20 text-slate-400 border-slate-500/30';
      default: return 'bg-slate-500/20 text-slate-400 border-slate-500/30';
    }
  };

  return (
    <>
      <div className="grid grid-cols-1 gap-4">
        {integrations.map(integration => (
          <Card key={integration.id} className="bg-slate-900 border-slate-800">
            <CardHeader>
              <div className="flex items-start justify-between">
                <div className="flex items-start gap-3">
                  {integration.icon_url ? (
                    <img src={integration.icon_url} alt={integration.name} className="w-12 h-12 rounded" />
                  ) : (
                    <div className="w-12 h-12 rounded bg-slate-800 flex items-center justify-center text-slate-400 font-medium">
                      {integration.provider[0]}
                    </div>
                  )}
                  <div>
                    <CardTitle className="text-white text-lg">{integration.name}</CardTitle>
                    <p className="text-sm text-slate-400">{integration.provider}</p>
                    <div className="flex items-center gap-2 mt-2">
                      <Badge variant="outline" className={getStatusColor(integration.status)}>
                        {getStatusIcon(integration.status)}
                        <span className="ml-1">{integration.status}</span>
                      </Badge>
                      <Badge variant="outline" className="bg-slate-800 text-slate-400 border-slate-700 capitalize">
                        {integration.category}
                      </Badge>
                    </div>
                  </div>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-sm text-slate-400">{integration.description}</p>

              {integration.supported_operations && integration.supported_operations.length > 0 && (
                <div>
                  <div className="text-xs text-slate-500 mb-2">
                    {integration.supported_operations.length} supported operations
                  </div>
                  <div className="flex flex-wrap gap-1">
                    {integration.supported_operations.slice(0, 5).map((op, idx) => (
                      <span key={idx} className="text-xs px-2 py-1 bg-slate-800 text-slate-400 rounded">
                        {op.label || op.operation}
                      </span>
                    ))}
                    {integration.supported_operations.length > 5 && (
                      <span className="text-xs px-2 py-1 bg-slate-800 text-slate-400 rounded">
                        +{integration.supported_operations.length - 5} more
                      </span>
                    )}
                  </div>
                </div>
              )}

              {integration.status === 'error' && (
                <div className="flex items-start gap-2 p-3 bg-red-500/10 rounded border border-red-500/30">
                  <AlertCircle className="w-4 h-4 text-red-400 flex-shrink-0 mt-0.5" />
                  <p className="text-xs text-red-400">
                    Integration error detected. Check configuration or contact support.
                  </p>
                </div>
              )}

              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleToggleStatus(integration)}
                  className="border-slate-700"
                >
                  {integration.status === 'active' ? 'Deactivate' : 'Activate'}
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setEditingIntegration(integration)}
                  className="border-slate-700"
                >
                  <Settings className="w-3 h-3 mr-2" />
                  Configure
                </Button>
                {integration.supported_operations && integration.supported_operations.length > 1 && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setPermissionsIntegration(integration)}
                    className="border-slate-700"
                  >
                    <Key className="w-3 h-3 mr-2" />
                    Permissions
                  </Button>
                )}
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleUninstall(integration)}
                  className="border-slate-700 text-red-400 hover:text-red-300 ml-auto"
                >
                  <Trash2 className="w-3 h-3 mr-2" />
                  Uninstall
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

      {permissionsIntegration && (
        <OperationPermissions
          integration={permissionsIntegration}
          open={!!permissionsIntegration}
          onOpenChange={(open) => !open && setPermissionsIntegration(null)}
        />
      )}
    </>
  );
}