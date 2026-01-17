import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Download, Check, Star } from 'lucide-react';
import { ToolIntegration } from '@/entities/all';
import ConfigurationModal from './ConfigurationModal';
import { toast } from 'sonner';

export default function IntegrationCard({ integration, onRefresh }) {
  const [showConfig, setShowConfig] = useState(false);

  const categoryColors = {
    storage: 'bg-blue-500/20 text-blue-400',
    database: 'bg-purple-500/20 text-purple-400',
    communication: 'bg-green-500/20 text-green-400',
    analytics: 'bg-yellow-500/20 text-yellow-400',
    crm: 'bg-pink-500/20 text-pink-400',
    payment: 'bg-orange-500/20 text-orange-400',
    ai: 'bg-indigo-500/20 text-indigo-400',
    productivity: 'bg-cyan-500/20 text-cyan-400'
  };

  const handleInstall = () => {
    if (integration.config_schema && Object.keys(integration.config_schema).length > 0) {
      setShowConfig(true);
    } else {
      completeInstallation({});
    }
  };

  const completeInstallation = async (configValues) => {
    try {
      await ToolIntegration.update(integration.id, {
        is_installed: true,
        config_values: configValues,
        status: 'active',
        installation_count: (integration.installation_count || 0) + 1
      });

      toast.success(`${integration.name} installed successfully`);
      setShowConfig(false);
      onRefresh?.();
    } catch (error) {
      console.error('Installation failed:', error);
      toast.error('Failed to install integration');
    }
  };

  return (
    <>
      <Card className="bg-slate-900 border-slate-800 hover:border-slate-700 transition-all">
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
          <div className="flex items-center gap-2">
            <Badge variant="outline" className={categoryColors[integration.category]}>
              {integration.category}
            </Badge>
            {integration.rating && (
              <div className="flex items-center gap-1 text-xs text-slate-400">
                <Star className="w-3 h-3 fill-yellow-400 text-yellow-400" />
                {integration.rating.toFixed(1)}
              </div>
            )}
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-sm text-slate-400 line-clamp-3">{integration.description}</p>

          {integration.supported_operations && integration.supported_operations.length > 0 && (
            <div>
              <div className="text-xs text-slate-500 mb-2">Supported Operations:</div>
              <div className="flex flex-wrap gap-1">
                {integration.supported_operations.slice(0, 3).map((op, idx) => (
                  <span key={idx} className="text-xs px-2 py-0.5 bg-slate-800 text-slate-400 rounded">
                    {op.label || op.operation}
                  </span>
                ))}
                {integration.supported_operations.length > 3 && (
                  <span className="text-xs px-2 py-0.5 bg-slate-800 text-slate-400 rounded">
                    +{integration.supported_operations.length - 3}
                  </span>
                )}
              </div>
            </div>
          )}

          {integration.installation_count > 0 && (
            <div className="text-xs text-slate-500">
              {integration.installation_count} {integration.installation_count === 1 ? 'installation' : 'installations'}
            </div>
          )}

          <Button
            onClick={handleInstall}
            disabled={integration.is_installed}
            className="w-full bg-blue-600 hover:bg-blue-700"
          >
            {integration.is_installed ? (
              <>
                <Check className="w-4 h-4 mr-2" />
                Installed
              </>
            ) : (
              <>
                <Download className="w-4 h-4 mr-2" />
                Install
              </>
            )}
          </Button>
        </CardContent>
      </Card>

      <ConfigurationModal
        open={showConfig}
        onOpenChange={setShowConfig}
        integration={integration}
        onSave={completeInstallation}
      />
    </>
  );
}