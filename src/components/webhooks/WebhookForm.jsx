import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { base44 } from '@/api/base44Client';
import { useAuth } from '@/components/contexts/AuthContext';
import { toast } from 'sonner';
import { Copy, Key, RefreshCw } from 'lucide-react';

export default function WebhookForm({ open, onOpenChange, webhook, onSuccess }) {
  const { organization } = useAuth();
  const [workflows, setWorkflows] = useState([]);
  const [formData, setFormData] = useState({
    name: '',
    workflow_id: '',
    events: [],
    enabled: true
  });
  const [generatedUrl, setGeneratedUrl] = useState('');
  const [secretKey, setSecretKey] = useState('');

  useEffect(() => {
    loadWorkflows();
    if (webhook) {
      setFormData({
        name: webhook.name,
        workflow_id: webhook.workflow_id,
        events: webhook.events || [],
        enabled: webhook.enabled
      });
      setGeneratedUrl(webhook.endpoint_url);
      setSecretKey(webhook.secret_key);
    } else {
      generateSecretKey();
    }
  }, [webhook]);

  const loadWorkflows = async () => {
    try {
      const data = await base44.entities.Workflow.list('-updated_date', 50);
      setWorkflows(data);
    } catch (error) {
      console.error('Failed to load workflows:', error);
    }
  };

  const generateSecretKey = () => {
    const key = crypto.randomUUID().replace(/-/g, '');
    setSecretKey(key);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!organization?.id) {
      toast.error('Organization not found');
      return;
    }

    try {
      const webhookId = webhook?.id || crypto.randomUUID();
      const endpointUrl = webhook?.endpoint_url || 
        `${window.location.origin}/api/webhooks/${webhookId}`;

      const data = {
        ...formData,
        endpoint_url: endpointUrl,
        secret_key: secretKey,
        org_id: organization.id
      };

      if (webhook) {
        await base44.entities.WebhookEndpoint.update(webhook.id, data);
        toast.success('Webhook updated');
      } else {
        await base44.entities.WebhookEndpoint.create({ ...data, id: webhookId });
        toast.success('Webhook created');
        setGeneratedUrl(endpointUrl);
      }

      onSuccess?.();
      onOpenChange(false);
    } catch (error) {
      console.error('Failed to save webhook:', error);
      toast.error('Failed to save webhook');
    }
  };

  const copyToClipboard = (text) => {
    navigator.clipboard.writeText(text);
    toast.success('Copied to clipboard');
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="bg-slate-900 border-slate-800 max-w-2xl">
        <DialogHeader>
          <DialogTitle className="text-white">
            {webhook ? 'Edit Webhook' : 'Create Webhook Endpoint'}
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label className="text-slate-400">Webhook Name</Label>
            <Input
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              placeholder="e.g., GitHub Push Events"
              className="bg-slate-800 border-slate-700 text-white"
              required
            />
          </div>

          <div>
            <Label className="text-slate-400">Trigger Workflow</Label>
            <Select
              value={formData.workflow_id}
              onValueChange={(value) => setFormData({ ...formData, workflow_id: value })}
            >
              <SelectTrigger className="bg-slate-800 border-slate-700 text-white">
                <SelectValue placeholder="Select workflow to trigger" />
              </SelectTrigger>
              <SelectContent className="bg-slate-800 border-slate-700">
                {workflows.map(wf => (
                  <SelectItem key={wf.id} value={wf.id}>
                    {wf.name} <span className="text-slate-500">v{wf.version}</span>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label className="text-slate-400">Event Types (optional)</Label>
            <Input
              value={formData.events.join(', ')}
              onChange={(e) => setFormData({ 
                ...formData, 
                events: e.target.value.split(',').map(s => s.trim()).filter(Boolean)
              })}
              placeholder="e.g., push, pull_request, deployment"
              className="bg-slate-800 border-slate-700 text-white"
            />
            <p className="text-xs text-slate-500 mt-1">
              Comma-separated list of events to filter. Leave empty to accept all events.
            </p>
          </div>

          {(generatedUrl || webhook) && (
            <div>
              <Label className="text-slate-400">Webhook URL</Label>
              <div className="flex gap-2">
                <Input
                  value={generatedUrl}
                  readOnly
                  className="bg-slate-950 border-slate-700 text-white font-mono text-sm"
                />
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => copyToClipboard(generatedUrl)}
                  className="border-slate-700"
                >
                  <Copy className="w-4 h-4" />
                </Button>
              </div>
              <p className="text-xs text-slate-500 mt-1">
                Use this URL in your external service to send webhook events
              </p>
            </div>
          )}

          <div>
            <div className="flex items-center justify-between mb-2">
              <Label className="text-slate-400">Secret Key</Label>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={generateSecretKey}
                className="text-slate-500 hover:text-white"
              >
                <RefreshCw className="w-3 h-3 mr-1" />
                Regenerate
              </Button>
            </div>
            <div className="flex gap-2">
              <Input
                value={secretKey}
                readOnly
                className="bg-slate-950 border-slate-700 text-white font-mono text-sm"
              />
              <Button
                type="button"
                variant="outline"
                onClick={() => copyToClipboard(secretKey)}
                className="border-slate-700"
              >
                <Copy className="w-4 h-4" />
              </Button>
            </div>
            <p className="text-xs text-slate-500 mt-1">
              Use this secret to verify webhook signatures (x-webhook-signature header)
            </p>
          </div>

          <div className="p-3 bg-blue-500/10 rounded border border-blue-500/30">
            <p className="text-sm text-blue-400 flex items-start gap-2">
              <Key className="w-4 h-4 mt-0.5 flex-shrink-0" />
              <span>
                Configure your external service to send POST requests to the webhook URL with the 
                signature in the <code className="bg-slate-950 px-1 rounded">x-webhook-signature</code> header.
                Signature format: <code className="bg-slate-950 px-1 rounded">sha256=&lt;hmac_sha256(body, secret)&gt;</code>
              </span>
            </p>
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" className="bg-blue-600 hover:bg-blue-700">
              {webhook ? 'Update' : 'Create'} Webhook
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}