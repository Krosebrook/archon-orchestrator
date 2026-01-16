import { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Plus, Plug, Copy, Trash2, Activity, Clock } from 'lucide-react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Switch } from '@/components/ui/switch';
import { toast } from 'sonner';
import { format } from 'date-fns';
import WebhookForm from './WebhookForm';

export default function WebhookManager() {
  const [webhooks, setWebhooks] = useState([]);
  const [workflows, setWorkflows] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingWebhook, setEditingWebhook] = useState(null);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setIsLoading(true);
    try {
      const [webhookData, workflowData] = await Promise.all([
        base44.entities.WebhookEndpoint.list('-updated_date'),
        base44.entities.Workflow.list()
      ]);
      setWebhooks(webhookData);
      setWorkflows(workflowData);
    } catch (error) {
      console.error("Failed to load data:", error);
      toast.error('Failed to load webhooks');
    } finally {
      setIsLoading(false);
    }
  };

  const copyToClipboard = (text) => {
    navigator.clipboard.writeText(text);
    toast.success('Copied to clipboard');
  };

  const handleToggle = async (webhook) => {
    try {
      await base44.entities.WebhookEndpoint.update(webhook.id, {
        enabled: !webhook.enabled
      });
      toast.success(`Webhook ${!webhook.enabled ? 'enabled' : 'disabled'}`);
      loadData();
    } catch (_error) {
      toast.error('Failed to update webhook');
    }
  };

  const handleDelete = async (webhook) => {
    if (!confirm(`Delete webhook "${webhook.name}"?`)) return;
    
    try {
      await base44.entities.WebhookEndpoint.delete(webhook.id);
      toast.success('Webhook deleted');
      loadData();
    } catch (_error) {
      toast.error('Failed to delete webhook');
    }
  };

  const handleEdit = (webhook) => {
    setEditingWebhook(webhook);
    setShowForm(true);
  };

  const getWorkflowName = (workflowId) => {
    const workflow = workflows.find(w => w.id === workflowId);
    return workflow?.name || 'Unknown Workflow';
  };

  return (
    <>
      <Card className="bg-slate-900 border-slate-800">
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="text-white flex items-center gap-2">
            <Plug className="w-5 h-5"/> Webhook Endpoints
          </CardTitle>
          <Button 
            onClick={() => {
              setEditingWebhook(null);
              setShowForm(true);
            }}
            className="bg-blue-600 hover:bg-blue-700"
          >
            <Plus className="w-4 h-4 mr-2" />
            Create Webhook
          </Button>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="text-center py-8 text-slate-400">Loading webhooks...</div>
          ) : webhooks.length === 0 ? (
            <div className="text-center py-12">
              <Plug className="w-12 h-12 text-slate-600 mx-auto mb-4" />
              <p className="text-slate-400 mb-4">No webhook endpoints configured</p>
              <Button 
                onClick={() => setShowForm(true)} 
                variant="outline"
                className="border-slate-700"
              >
                <Plus className="w-4 h-4 mr-2" />
                Create Your First Webhook
              </Button>
            </div>
          ) : (
            <div className="rounded-lg border border-slate-700">
              <Table>
                <TableHeader>
                  <TableRow className="border-b-slate-700 hover:bg-slate-900">
                    <TableHead className="text-slate-400">Name</TableHead>
                    <TableHead className="text-slate-400">Workflow</TableHead>
                    <TableHead className="text-slate-400">Triggers</TableHead>
                    <TableHead className="text-slate-400">Last Triggered</TableHead>
                    <TableHead className="text-slate-400">Status</TableHead>
                    <TableHead><span className="sr-only">Actions</span></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {webhooks.map(hook => (
                    <TableRow key={hook.id} className="border-b-slate-700">
                      <TableCell>
                        <div>
                          <div className="font-medium text-white">{hook.name}</div>
                          <div className="flex items-center gap-2 mt-1">
                            <code className="text-xs bg-slate-950 px-2 py-0.5 rounded text-slate-400">
                              {hook.endpoint_url.split('/').pop()}
                            </code>
                            <Button 
                              variant="ghost" 
                              size="icon" 
                              onClick={() => copyToClipboard(hook.endpoint_url)} 
                              className="h-6 w-6"
                            >
                              <Copy className="w-3 h-3" />
                            </Button>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell className="text-slate-300">{getWorkflowName(hook.workflow_id)}</TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1 text-slate-400">
                          <Activity className="w-4 h-4" />
                          <span className="text-sm">{hook.trigger_count || 0}</span>
                        </div>
                      </TableCell>
                      <TableCell className="text-slate-400 text-sm">
                        {hook.last_triggered ? (
                          <div className="flex items-center gap-1">
                            <Clock className="w-3 h-3" />
                            {format(new Date(hook.last_triggered), 'MMM d, h:mm a')}
                          </div>
                        ) : (
                          'Never'
                        )}
                      </TableCell>
                      <TableCell>
                        <Switch 
                          checked={hook.enabled} 
                          onCheckedChange={() => handleToggle(hook)}
                        />
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex gap-1 justify-end">
                          <Button 
                            variant="ghost" 
                            size="icon"
                            onClick={() => handleEdit(hook)}
                            className="text-slate-400 hover:text-white"
                          >
                            <Plug className="w-4 h-4" />
                          </Button>
                          <Button 
                            variant="ghost" 
                            size="icon" 
                            onClick={() => handleDelete(hook)}
                            className="text-red-500 hover:text-red-400"
                          >
                            <Trash2 className="w-4 h-4"/>
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      <WebhookForm
        open={showForm}
        onOpenChange={setShowForm}
        webhook={editingWebhook}
        onSuccess={loadData}
      />
    </>
  );
}