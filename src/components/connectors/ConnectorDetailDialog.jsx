import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Code, Shield, Zap } from 'lucide-react';

export default function ConnectorDetailDialog({ connector, open, onClose }) {
  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto bg-slate-900 border-slate-800">
        <DialogHeader>
          <DialogTitle className="text-white flex items-center gap-3">
            {connector.icon_url && (
              <img src={connector.icon_url} alt="" className="w-8 h-8 rounded" />
            )}
            {connector.name}
          </DialogTitle>
          <DialogDescription>{connector.description}</DialogDescription>
        </DialogHeader>

        <Tabs defaultValue="overview" className="mt-4">
          <TabsList className="bg-slate-800">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="operations">Operations</TabsTrigger>
            <TabsTrigger value="auth">Authentication</TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-4">
            <Card className="bg-slate-800 border-slate-700">
              <CardContent className="pt-4">
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="text-slate-400">Provider:</span>
                    <span className="ml-2 text-white">{connector.provider}</span>
                  </div>
                  <div>
                    <span className="text-slate-400">Category:</span>
                    <Badge className="ml-2">{connector.category}</Badge>
                  </div>
                  <div>
                    <span className="text-slate-400">Status:</span>
                    <Badge className="ml-2" variant="outline">
                      {connector.status}
                    </Badge>
                  </div>
                  <div>
                    <span className="text-slate-400">Installations:</span>
                    <span className="ml-2 text-white">{connector.installation_count || 0}</span>
                  </div>
                  <div>
                    <span className="text-slate-400">Published:</span>
                    <span className="ml-2 text-white">{connector.is_marketplace ? 'Yes' : 'No'}</span>
                  </div>
                  <div>
                    <span className="text-slate-400">Official:</span>
                    <span className="ml-2 text-white">{connector.is_official ? 'Yes' : 'No'}</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            {connector.webhook_support && (
              <Card className="bg-slate-800 border-slate-700">
                <CardContent className="pt-4">
                  <div className="flex items-center gap-2 mb-2">
                    <Zap className="w-4 h-4 text-yellow-400" />
                    <span className="font-semibold text-white">Webhook Support</span>
                  </div>
                  <p className="text-sm text-slate-400">
                    This connector supports webhook events for real-time notifications
                  </p>
                </CardContent>
              </Card>
            )}
          </TabsContent>

          <TabsContent value="operations" className="space-y-4">
            {connector.operations?.length === 0 ? (
              <p className="text-slate-400 text-center py-8">No operations defined</p>
            ) : (
              connector.operations?.map((op, index) => (
                <Card key={index} className="bg-slate-800 border-slate-700">
                  <CardContent className="pt-4">
                    <div className="flex items-center gap-2 mb-3">
                      <Code className="w-4 h-4 text-blue-400" />
                      <span className="font-semibold text-white">{op.name}</span>
                      <Badge>{op.method}</Badge>
                    </div>
                    {op.description && (
                      <p className="text-sm text-slate-400 mb-3">{op.description}</p>
                    )}
                    <div className="space-y-2 text-sm">
                      <div>
                        <span className="text-slate-400">Endpoint:</span>
                        <code className="ml-2 text-white font-mono">{op.endpoint}</code>
                      </div>
                      <div>
                        <span className="text-slate-400">Input Schema:</span>
                        <pre className="mt-1 text-xs bg-slate-950/50 p-2 rounded overflow-x-auto text-slate-200">
                          {JSON.stringify(op.input_schema, null, 2)}
                        </pre>
                      </div>
                      <div>
                        <span className="text-slate-400">Output Schema:</span>
                        <pre className="mt-1 text-xs bg-slate-950/50 p-2 rounded overflow-x-auto text-slate-200">
                          {JSON.stringify(op.output_schema, null, 2)}
                        </pre>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))
            )}
          </TabsContent>

          <TabsContent value="auth" className="space-y-4">
            <Card className="bg-slate-800 border-slate-700">
              <CardContent className="pt-4">
                <div className="flex items-center gap-2 mb-3">
                  <Shield className="w-4 h-4 text-green-400" />
                  <span className="font-semibold text-white">Authentication Type</span>
                </div>
                <Badge className="mb-4">{connector.auth_type}</Badge>

                {connector.auth_config && Object.keys(connector.auth_config).length > 0 && (
                  <div className="mt-4">
                    <p className="text-sm text-slate-400 mb-2">Configuration:</p>
                    <pre className="text-xs bg-slate-950/50 p-3 rounded overflow-x-auto text-slate-200">
                      {JSON.stringify(connector.auth_config, null, 2)}
                    </pre>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}