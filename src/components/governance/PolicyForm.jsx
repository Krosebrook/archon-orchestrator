import { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Policy } from '@/entities/Policy';
import { Loader2 } from 'lucide-react';

const emptyPolicy = {
  key: '',
  description: '',
  rule: {},
  enabled: true,
  org_id: 'org_acme',
};

export default function PolicyForm({ open, onOpenChange, policy, onSave }) {
  const [formData, setFormData] = useState(emptyPolicy);
  const [ruleText, setRuleText] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (policy) {
      setFormData(policy);
      setRuleText(JSON.stringify(policy.rule, null, 2));
    } else {
      setFormData(emptyPolicy);
      setRuleText('{}');
    }
  }, [policy, open]);

  const handleInputChange = (field, value) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    try {
      const parsedRule = JSON.parse(ruleText);
      setError('');
      
      const dataToSave = { ...formData, rule: parsedRule };
      
      setIsSaving(true);
      if (formData.id) {
        await Policy.update(formData.id, dataToSave);
      } else {
        await Policy.create(dataToSave);
      }
      onSave();
    } catch (error) {
      if (error instanceof SyntaxError) {
        setError('Invalid JSON format in rule field');
      } else {
        setError('Failed to save policy');
      }
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[525px] bg-slate-900 border-slate-800 text-white">
        <DialogHeader>
          <DialogTitle>{policy ? 'Edit Policy' : 'Create New Policy'}</DialogTitle>
          <DialogDescription className="text-slate-400">
            Configure security and governance rules for your organization.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit}>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="key" className="text-right text-slate-400">Key</Label>
              <Input
                id="key"
                value={formData.key}
                onChange={(e) => handleInputChange('key', e.target.value)}
                className="col-span-3 bg-slate-800 border-slate-700"
                placeholder="e.g., max_spend_per_run"
                required
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="description" className="text-right text-slate-400">Description</Label>
              <Input
                id="description"
                value={formData.description}
                onChange={(e) => handleInputChange('description', e.target.value)}
                className="col-span-3 bg-slate-800 border-slate-700"
                placeholder="Brief description of the policy"
              />
            </div>
            <div className="grid grid-cols-4 items-start gap-4">
              <Label htmlFor="rule" className="text-right text-slate-400 pt-2">Rule (JSON)</Label>
              <div className="col-span-3 space-y-2">
                <Textarea
                  id="rule"
                  value={ruleText}
                  onChange={(e) => setRuleText(e.target.value)}
                  className="bg-slate-800 border-slate-700 font-mono text-sm"
                  rows={6}
                  placeholder='{"limit_cents": 500}'
                />
                {error && <p className="text-red-400 text-sm">{error}</p>}
              </div>
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="enabled" className="text-right text-slate-400">Enabled</Label>
              <Switch
                id="enabled"
                checked={formData.enabled}
                onCheckedChange={(checked) => handleInputChange('enabled', checked)}
                className="data-[state=checked]:bg-blue-600"
              />
            </div>
          </div>
          <DialogFooter className="border-t border-slate-800 pt-4 mt-4">
            <Button
              type="submit"
              className="bg-blue-600 hover:bg-blue-700 text-white"
              disabled={isSaving}
            >
              {isSaving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
              {isSaving ? 'Saving...' : 'Save Policy'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}