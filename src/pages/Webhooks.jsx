import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Plug, Zap, Activity } from 'lucide-react';
import WebhookManager from '../components/webhooks/WebhookManager';
import ExternalConnectionManager from '../components/integrations/ExternalConnectionManager';
import WebhookEventLog from '../components/webhooks/WebhookEventLog';

export default function Webhooks() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-white mb-2">Webhooks & Integrations</h1>
        <p className="text-slate-400">
          Connect external services and trigger workflows from external events
        </p>
      </div>

      <Tabs defaultValue="webhooks" className="w-full">
        <TabsList className="grid w-full grid-cols-3 bg-slate-800">
          <TabsTrigger value="webhooks">
            <Plug className="w-4 h-4 mr-2" />
            Webhook Endpoints
          </TabsTrigger>
          <TabsTrigger value="connections">
            <Zap className="w-4 h-4 mr-2" />
            External Connections
          </TabsTrigger>
          <TabsTrigger value="events">
            <Activity className="w-4 h-4 mr-2" />
            Event Log
          </TabsTrigger>
        </TabsList>

        <TabsContent value="webhooks" className="mt-6">
          <WebhookManager />
        </TabsContent>

        <TabsContent value="connections" className="mt-6">
          <ExternalConnectionManager />
        </TabsContent>

        <TabsContent value="events" className="mt-6">
          <WebhookEventLog />
        </TabsContent>
      </Tabs>
    </div>
  );
}