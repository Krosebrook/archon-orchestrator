import { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Plus, Shield, CheckCircle2, XCircle, Loader2 } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { toast } from 'sonner';

export default function PrivacyPolicyManager({ policies, onRefresh }) {
  const [createDialogOpen, setCreateDialogOpen] = useState(false);

  return (
    <div className="space-y-4">
      <Card className="bg-slate-900 border-slate-800">
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="text-white">Privacy Policies</CardTitle>
            <Dialog open={createDialogOpen} onOpenChange={setCreateDialogOpen}>
              <DialogTrigger asChild>
                <Button className="bg-blue-600 hover:bg-blue-700">
                  <Plus className="w-4 h-4 mr-2" />
                  Create Policy
                </Button>
              </DialogTrigger>
              <DialogContent className="bg-slate-900 border-slate-800 text-white max-w-2xl">
                <DialogHeader>
                  <DialogTitle>Create Privacy Policy</DialogTitle>
                  <DialogDescription className="text-slate-400">
                    Configure data redaction and privacy rules
                  </DialogDescription>
                </DialogHeader>
                <CreatePolicyForm
                  onSuccess={() => {
                    setCreateDialogOpen(false);
                    onRefresh();
                  }}
                />
              </DialogContent>
            </Dialog>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {policies.map((policy) => (
              <PolicyCard key={policy.id} policy={policy} onRefresh={onRefresh} />
            ))}
            {policies.length === 0 && (
              <div className="text-center py-8 text-slate-400">
                No privacy policies configured yet
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

function PolicyCard({ policy, _onRefresh }) {
  const statusConfig = {
    active: { color: 'text-green-400', icon: CheckCircle2, bg: 'bg-green-900/20' },
    draft: { color: 'text-slate-400', icon: XCircle, bg: 'bg-slate-800' },
    archived: { color: 'text-slate-500', icon: XCircle, bg: 'bg-slate-800' },
  };

  const config = statusConfig[policy.status];
  const StatusIcon = config.icon;

  return (
    <div className={`p-4 rounded-lg ${config.bg} border border-slate-700`}>
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-2">
            <Shield className="w-4 h-4 text-blue-400" />
            <h3 className="font-medium text-white">{policy.name}</h3>
            <Badge variant="outline" className="text-xs">
              {policy.scope}
            </Badge>
          </div>
          
          <p className="text-sm text-slate-300 mb-3">{policy.description}</p>

          <div className="flex flex-wrap gap-2 mb-3">
            {policy.data_categories.map((cat) => (
              <Badge key={cat} className="bg-purple-900/30 text-purple-300">
                {cat}
              </Badge>
            ))}
          </div>

          <div className="grid grid-cols-2 gap-4 text-xs text-slate-400">
            <div>
              <span className="text-slate-500">Redaction Rules:</span> {policy.redaction_rules?.length || 0}
            </div>
            <div>
              <span className="text-slate-500">Retention:</span> {policy.retention_period_days || 'N/A'} days
            </div>
            <div>
              <span className="text-slate-500">Anonymization:</span> {policy.anonymization_enabled ? 'Yes' : 'No'}
            </div>
            <div>
              <span className="text-slate-500">Audit:</span> {policy.audit_enabled ? 'Enabled' : 'Disabled'}
            </div>
          </div>
        </div>

        <StatusIcon className={`w-5 h-5 ${config.color}`} />
      </div>
    </div>
  );
}

function CreatePolicyForm({ onSuccess }) {
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    scope: 'organization',
    data_categories: ['pii'],
    retention_period_days: 365,
    anonymization_enabled: false,
    consent_required: true,
    audit_enabled: true,
  });
  const [isCreating, setIsCreating] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsCreating(true);

    try {
      const user = await base44.auth.me();
      
      const defaultRules = [
        { pattern_type: 'email', replacement: 'mask' },
        { pattern_type: 'phone', replacement: 'mask' },
        { pattern_type: 'ssn', replacement: 'remove' },
        { pattern_type: 'credit_card', replacement: 'remove' },
      ];

      await base44.entities.DataPrivacyPolicy.create({
        ...formData,
        redaction_rules: defaultRules,
        status: 'active',
        org_id: user.organization.id,
      });

      toast.success('Privacy policy created successfully');
      onSuccess();
    } catch (error) {
      console.error('Failed to create policy:', error);
      toast.error('Failed to create policy');
    } finally {
      setIsCreating(false);
    }
  };

  const dataCategories = ['pii', 'financial', 'health', 'biometric', 'location', 'credentials'];

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <Label>Policy Name</Label>
        <Input
          value={formData.name}
          onChange={(e) => setFormData({ ...formData, name: e.target.value })}
          placeholder="GDPR PII Protection Policy"
          className="bg-slate-800 border-slate-700"
          required
        />
      </div>

      <div>
        <Label>Description</Label>
        <Textarea
          value={formData.description}
          onChange={(e) => setFormData({ ...formData, description: e.target.value })}
          placeholder="Automatically redact PII from agent interactions"
          className="bg-slate-800 border-slate-700"
        />
      </div>

      <div>
        <Label>Scope</Label>
        <Select
          value={formData.scope}
          onValueChange={(value) => setFormData({ ...formData, scope: value })}
        >
          <SelectTrigger className="bg-slate-800 border-slate-700">
            <SelectValue />
          </SelectTrigger>
          <SelectContent className="bg-slate-800 border-slate-700">
            <SelectItem value="organization">Organization-wide</SelectItem>
            <SelectItem value="agent">Per Agent</SelectItem>
            <SelectItem value="workflow">Per Workflow</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div>
        <Label>Data Categories (select multiple)</Label>
        <div className="grid grid-cols-3 gap-2 mt-2">
          {dataCategories.map((cat) => (
            <label key={cat} className="flex items-center gap-2 text-sm text-slate-300">
              <input
                type="checkbox"
                checked={formData.data_categories.includes(cat)}
                onChange={(e) => {
                  const newCategories = e.target.checked
                    ? [...formData.data_categories, cat]
                    : formData.data_categories.filter(c => c !== cat);
                  setFormData({ ...formData, data_categories: newCategories });
                }}
                className="w-4 h-4"
              />
              {cat}
            </label>
          ))}
        </div>
      </div>

      <div>
        <Label>Retention Period (days)</Label>
        <Input
          type="number"
          value={formData.retention_period_days}
          onChange={(e) => setFormData({ ...formData, retention_period_days: parseInt(e.target.value) })}
          className="bg-slate-800 border-slate-700"
        />
      </div>

      <div className="space-y-2">
        <label className="flex items-center gap-2 text-sm text-slate-300">
          <input
            type="checkbox"
            checked={formData.anonymization_enabled}
            onChange={(e) => setFormData({ ...formData, anonymization_enabled: e.target.checked })}
            className="w-4 h-4"
          />
          Enable data anonymization
        </label>
        <label className="flex items-center gap-2 text-sm text-slate-300">
          <input
            type="checkbox"
            checked={formData.consent_required}
            onChange={(e) => setFormData({ ...formData, consent_required: e.target.checked })}
            className="w-4 h-4"
          />
          Require user consent
        </label>
        <label className="flex items-center gap-2 text-sm text-slate-300">
          <input
            type="checkbox"
            checked={formData.audit_enabled}
            onChange={(e) => setFormData({ ...formData, audit_enabled: e.target.checked })}
            className="w-4 h-4"
          />
          Enable audit logging
        </label>
      </div>

      <div className="flex justify-end gap-2 pt-4">
        <Button type="submit" disabled={isCreating} className="bg-blue-600 hover:bg-blue-700">
          {isCreating && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
          Create Policy
        </Button>
      </div>
    </form>
  );
}