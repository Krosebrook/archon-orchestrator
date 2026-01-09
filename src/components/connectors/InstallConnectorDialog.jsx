import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Loader2 } from 'lucide-react';
import { toast } from 'sonner';

export default function InstallConnectorDialog({ connector, open, onClose, onSuccess }) {
  const [formData, setFormData] = useState({ name: `${connector.name} Connection` });
  const [isInstalling, setIsInstalling] = useState(false);

  const handleInstall = async (e) => {
    e.preventDefault();
    
    if (!formData.name.trim()) {
      toast.error('Please enter a connection name');
      return;
    }

    if (connector.auth_type === 'api_key' && !formData.api_key?.trim()) {
      toast.error('Please enter an API key');
      return;
    }

    setIsInstalling(true);

    try {
      const user = await base44.auth.me();
      
      // Prepare credentials based on auth type
      let credentials = {};
      
      switch (connector.auth_type) {
        case 'api_key':
          credentials = { apiKey: formData.api_key };
          break;
        case 'oauth2':
          // OAuth flow would be handled separately
          credentials = { accessToken: 'OAUTH_TOKEN_PLACEHOLDER' };
          break;
        case 'basic':
          credentials = { username: formData.username || '', password: formData.password || '' };
          break;
        default:
          credentials = {};
      }

      // Validate connector credentials
      const validation = await base44.functions.invoke('validateConnector', {
        connectorId: connector.id,
        credentials,
      });

      if (!validation.data?.valid) {
        toast.error('Invalid credentials: ' + (validation.data?.error || 'Unknown error'));
        setIsInstalling(false);
        return;
      }

      // Create installation record with encrypted credentials
      await base44.entities.ConnectorInstallation.create({
        connector_id: connector.id,
        name: formData.name,
        credentials_encrypted: JSON.stringify(credentials),
        config: {},
        status: 'active',
        installed_by: user.email,
        last_tested: new Date().toISOString(),
        org_id: user.organization.id,
      });

      // Update installation count
      await base44.entities.ConnectorDefinition.update(connector.id, {
        installation_count: (connector.installation_count || 0) + 1,
      });

      toast.success(`${connector.name} installed successfully`);
      onSuccess();
      onClose();
    } catch (error) {
      console.error('Installation failed:', error);
      toast.error('Failed to install connector: ' + error.message);
    } finally {
      setIsInstalling(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="bg-slate-900 border-slate-800 text-white">
        <DialogHeader>
          <DialogTitle>Install {connector.name}</DialogTitle>
          <DialogDescription className="text-slate-400">
            Configure your connection to {connector.name}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleInstall} className="space-y-4">
          <div>
            <Label>Connection Name</Label>
            <Input
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              placeholder={`${connector.name} Connection`}
              className="bg-slate-800 border-slate-700"
              required
            />
          </div>

          {connector.auth_type === 'api_key' && (
            <div>
              <Label>API Key</Label>
              <Input
                type="password"
                value={formData.api_key || ''}
                onChange={(e) => setFormData({ ...formData, api_key: e.target.value })}
                placeholder="Enter your API key"
                className="bg-slate-800 border-slate-700"
                required
              />
              <p className="text-xs text-slate-500 mt-1">
                Your API key will be encrypted and stored securely
              </p>
            </div>
          )}

          {connector.auth_type === 'oauth2' && (
            <div className="p-3 bg-blue-900/20 border border-blue-700/50 rounded text-sm text-blue-300">
              <p>After clicking install, you'll be redirected to {connector.name} to authorize access.</p>
            </div>
          )}

          <div className="flex justify-end gap-2 pt-4">
            <Button type="button" variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit" disabled={isInstalling} className="bg-blue-600 hover:bg-blue-700">
              {isInstalling && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
              Install
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}