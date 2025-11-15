import { useState, useEffect } from 'react';
import { WebhookEndpoint } from '@/entities/WebhookEndpoint';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Plus, Plug, Copy, Trash2 } from 'lucide-react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Switch } from '@/components/ui/switch';
import { toast } from 'sonner';

export default function WebhookManager() {
  const [webhooks, setWebhooks] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const loadWebhooks = async () => {
      setIsLoading(true);
      try {
        const data = await WebhookEndpoint.list();
        setWebhooks(data);
      } catch (error) {
        console.error("Failed to load webhooks:", error);
      } finally {
        setIsLoading(false);
      }
    };
    loadWebhooks();
  }, []);

  const copyToClipboard = (text) => {
    navigator.clipboard.writeText(text);
    toast.success('Webhook URL copied to clipboard!');
  };

  return (
    <Card className="bg-slate-900 border-slate-800">
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle className="text-white flex items-center gap-2"><Plug className="w-5 h-5"/> Manage Webhooks</CardTitle>
        <Button className="bg-blue-600 hover:bg-blue-700"><Plus className="w-4 h-4 mr-2" />Create Webhook</Button>
      </CardHeader>
      <CardContent>
        <div className="rounded-lg border border-slate-700">
          <Table>
            <TableHeader>
              <TableRow className="border-b-slate-700 hover:bg-slate-900">
                <TableHead className="text-slate-400">Name</TableHead>
                <TableHead className="text-slate-400">URL</TableHead>
                <TableHead className="text-slate-400">Workflow</TableHead>
                <TableHead className="text-slate-400">Status</TableHead>
                <TableHead><span className="sr-only">Actions</span></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {webhooks.map(hook => (
                <TableRow key={hook.id} className="border-b-slate-700">
                  <TableCell className="font-medium text-white">{hook.name}</TableCell>
                  <TableCell className="font-mono text-sm text-slate-400 flex items-center gap-2">
                    {`${hook.endpoint_url.substring(0, 30)}...`}
                    <Button variant="ghost" size="icon" onClick={() => copyToClipboard(hook.endpoint_url)} className="h-6 w-6">
                      <Copy className="w-3 h-3" />
                    </Button>
                  </TableCell>
                  <TableCell className="text-slate-300">{hook.workflow_id}</TableCell>
                  <TableCell><Switch checked={hook.enabled} /></TableCell>
                  <TableCell className="text-right">
                    <Button variant="ghost" size="icon" className="text-red-500 hover:text-red-400">
                        <Trash2 className="w-4 h-4"/>
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </CardContent>
    </Card>
  );
}