import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { base44 } from '@/api/base44Client';
import { useAuth } from '@/components/contexts/AuthContext';
import { toast } from 'sonner';
import { Eye, EyeOff } from 'lucide-react';

const SERVICE_CONFIGS = {
  slack: {
    fields: [
      { name: 'bot_token', label: 'Bot Token', type: 'password', required: true },
      { name: 'channel', label: 'Default Channel', type: 'text' }
    ]
  },
  github: {
    fields: [
      { name: 'personal_access_token', label: 'Personal Access Token', type: 'password', required: true },
      { name: 'owner', label: 'Repository Owner', type: 'text' },
      { name: 'repo', label: 'Default Repository', type: 'text' }
    ]
  },
  aws_s3: {
    fields: [
      { name: 'access_key_id', label: 'Access Key ID', type: 'password', required: true },
      { name: 'secret_access_key', label: 'Secret Access Key', type: 'password', required: true },
      { name: 'region', label: 'Region', type: 'text', required: true },
      { name: 'bucket', label: 'Default Bucket', type: 'text' }
    ]
  },
  google_drive: {
    fields: [
      { name: 'access_token', label: 'Access Token', type: 'password', required: true },
      { name: 'refresh_token', label: 'Refresh Token', type: 'password' }
    ]
  },
  dropbox: {
    fields: [
      { name: 'access_token', label: 'Access Token', type: 'password', required: true }
    ]
  },
  stripe: {
    fields: [
      { name: 'secret_key', label: 'Secret Key', type: 'password', required: true },
      { name: 'webhook_secret', label: 'Webhook Secret', type: 'password' }
    ]
  },
  sendgrid: {
    fields: [
      { name: 'api_key', label: 'API Key', type: 'password', required: true },
      { name: 'from_email', label: 'Default From Email', type: 'email' }
    ]
  },
  twilio: {
    fields: [
      { name: 'account_sid', label: 'Account SID', type: 'text', required: true },
      { name: 'auth_token', label: 'Auth Token', type: 'password', required: true },
      { name: 'phone_number', label: 'Phone Number', type: 'text' }
    ]
  },
  custom: {
    fields: [
      { name: 'base_url', label: 'Base URL', type: 'text', required: true },
      { name: 'api_key', label: 'API Key', type: 'password' },
      { name: 'auth_header', label: 'Auth Header Name', type: 'text', placeholder: 'Authorization' },
      { name: 'auth_prefix', label: 'Auth Prefix', type: 'text', placeholder: 'Bearer' }
    ]
  }
};

export default function ExternalConnectionForm({ open, onOpenChange, connection, onSuccess }) {
  const { organization } = useAuth();
  const [formData, setFormData] = useState({
    name: '',
    service: 'slack',
    credentials: {},
    config: {}
  });
  const [showPasswords, setShowPasswords] = useState({});

  useEffect(() => {
    if (connection) {
      setFormData({
        name: connection.name,
        service: connection.service,
        credentials: connection.credentials || {},
        config: connection.config || {}
      });
    } else {
      setFormData({
        name: '',
        service: 'slack',
        credentials: {},
        config: {}
      });
    }
  }, [connection]);

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!organization?.id) {
      toast.error('Organization not found');
      return;
    }

    try {
      const data = {
        ...formData,
        status: 'active',
        org_id: organization.id
      };

      if (connection) {
        await base44.entities.ExternalConnection.update(connection.id, data);
        toast.success('Connection updated');
      } else {
        await base44.entities.ExternalConnection.create(data);
        toast.success('Connection created');
      }

      onSuccess?.();
      onOpenChange(false);
    } catch (error) {
      console.error('Failed to save connection:', error);
      toast.error('Failed to save connection');
    }
  };

  const serviceConfig = SERVICE_CONFIGS[formData.service];

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="bg-slate-900 border-slate-800 max-w-2xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-white">
            {connection ? 'Edit Connection' : 'New External Connection'}
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label className="text-slate-400">Connection Name</Label>
            <Input
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              placeholder="e.g., Production Slack Bot"
              className="bg-slate-800 border-slate-700 text-white"
              required
            />
          </div>

          <div>
            <Label className="text-slate-400">Service</Label>
            <Select
              value={formData.service}
              onValueChange={(value) => setFormData({ ...formData, service: value, credentials: {}, config: {} })}
            >
              <SelectTrigger className="bg-slate-800 border-slate-700 text-white">
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="bg-slate-800 border-slate-700">
                <SelectItem value="slack">Slack</SelectItem>
                <SelectItem value="github">GitHub</SelectItem>
                <SelectItem value="aws_s3">AWS S3</SelectItem>
                <SelectItem value="google_drive">Google Drive</SelectItem>
                <SelectItem value="dropbox">Dropbox</SelectItem>
                <SelectItem value="stripe">Stripe</SelectItem>
                <SelectItem value="sendgrid">SendGrid</SelectItem>
                <SelectItem value="twilio">Twilio</SelectItem>
                <SelectItem value="custom">Custom API</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-3">
            <Label className="text-slate-400">Credentials & Configuration</Label>
            {serviceConfig.fields.map(field => (
              <div key={field.name}>
                <Label className="text-slate-500 text-sm">{field.label}</Label>
                <div className="relative">
                  <Input
                    type={field.type === 'password' && !showPasswords[field.name] ? 'password' : 'text'}
                    value={
                      (field.type === 'password' ? formData.credentials : formData.config)[field.name] || ''
                    }
                    onChange={(e) => {
                      const target = field.type === 'password' ? 'credentials' : 'config';
                      setFormData({
                        ...formData,
                        [target]: {
                          ...formData[target],
                          [field.name]: e.target.value
                        }
                      });
                    }}
                    placeholder={field.placeholder}
                    className="bg-slate-800 border-slate-700 text-white"
                    required={field.required}
                  />
                  {field.type === 'password' && (
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      className="absolute right-0 top-0 h-full"
                      onClick={() => setShowPasswords({ ...showPasswords, [field.name]: !showPasswords[field.name] })}
                    >
                      {showPasswords[field.name] ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </Button>
                  )}
                </div>
              </div>
            ))}
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" className="bg-blue-600 hover:bg-blue-700">
              {connection ? 'Update' : 'Create'} Connection
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}