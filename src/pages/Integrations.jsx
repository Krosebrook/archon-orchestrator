import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Zap, Wrench, Plug } from 'lucide-react';
import WebhookManager from '../components/webhooks/WebhookManager';
import ToolManager from '../components/tools/ToolManager';

export default function Integrations() {
  return (
    <div>
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-white">Integrations</h1>
        <p className="text-slate-400">Connect Archon to your other tools and services.</p>
      </div>

      <Tabs defaultValue="tools" className="w-full">
        <TabsList className="grid w-full grid-cols-3 bg-slate-800 text-slate-400">
          <TabsTrigger value="tools"><Wrench className="w-4 h-4 mr-2" />Tools</TabsTrigger>
          <TabsTrigger value="webhooks"><Plug className="w-4 h-4 mr-2" />Webhooks</TabsTrigger>
          <TabsTrigger value="marketplace"><Zap className="w-4 h-4 mr-2" />Marketplace</TabsTrigger>
        </TabsList>
        <TabsContent value="tools" className="mt-6">
          <ToolManager />
        </TabsContent>
        <TabsContent value="webhooks" className="mt-6">
          <WebhookManager />
        </TabsContent>
        <TabsContent value="marketplace" className="mt-6">
          {/* Marketplace component will go here */}
          <p className="text-center text-slate-400">Marketplace coming soon.</p>
        </TabsContent>
      </Tabs>
    </div>
  );
}