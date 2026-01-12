import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { CheckCircle2, Star, Download } from 'lucide-react';

export default function ConnectorCard({ connector, isInstalled, onInstall, onRefresh }) {
  return (
    <Card className="bg-slate-900 border-slate-800 hover:border-blue-600 transition-colors">
      <CardHeader>
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-3">
            {connector.icon_url && (
              <img src={connector.icon_url} alt={connector.name} className="w-12 h-12 object-contain" />
            )}
            <div>
              <h3 className="font-semibold text-white flex items-center gap-2">
                {connector.name}
                {connector.is_official && (
                  <Badge className="bg-blue-900/30 text-blue-300 text-xs">
                    Official
                  </Badge>
                )}
              </h3>
              <Badge variant="outline" className="text-xs mt-1">
                {connector.category.replace('_', ' ')}
              </Badge>
            </div>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <p className="text-sm text-slate-400 mb-4 line-clamp-2">
          {connector.description}
        </p>

        <div className="flex items-center justify-between text-xs text-slate-500 mb-4">
          <div className="flex items-center gap-1">
            <Download className="w-3 h-3" />
            {connector.installation_count || 0} installs
          </div>
          {connector.rating && (
            <div className="flex items-center gap-1">
              <Star className="w-3 h-3 text-yellow-400 fill-yellow-400" />
              {connector.rating.toFixed(1)}
            </div>
          )}
        </div>

        <div className="flex items-center gap-2 text-xs text-slate-500 mb-4">
          {connector.operations?.slice(0, 3).map((op, i) => (
            <Badge key={i} variant="outline" className="text-xs">
              {op.name}
            </Badge>
          ))}
          {connector.operations?.length > 3 && (
            <span className="text-slate-500">+{connector.operations.length - 3} more</span>
          )}
        </div>

        {isInstalled ? (
          <Button disabled className="w-full bg-green-900/30 text-green-300">
            <CheckCircle2 className="w-4 h-4 mr-2" />
            Installed
          </Button>
        ) : (
          <Button onClick={onInstall} className="w-full bg-blue-600 hover:bg-blue-700">
            Install Connector
          </Button>
        )}
      </CardContent>
    </Card>
  );
}