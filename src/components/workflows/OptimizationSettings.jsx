import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { Settings, Save, Loader2 } from 'lucide-react';
import { base44 } from '@/api/base44Client';
import { toast } from 'sonner';

export default function OptimizationSettings({ workflow }) {
  const [settings, setSettings] = useState({
    enabled: false,
    policy_id: '',
    schedule: 'weekly',
    auto_apply_threshold: 'low',
    require_approval: true
  });
  const [policies, setPolicies] = useState([]);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    loadData();
  }, [workflow?.id]);

  const loadData = async () => {
    try {
      const policyData = await base44.entities.RefactorPolicy.list();
      setPolicies(policyData);
      
      // Load existing automation if any
      const automations = await base44.entities.WorkflowAutomation.filter({ 
        trigger: { type: 'schedule' },
        actions: { $elemMatch: { type: 'optimize_workflow' } }
      });
      
      if (automations.length > 0) {
        const automation = automations[0];
        setSettings({
          enabled: automation.enabled,
          policy_id: automation.actions[0]?.config?.policy_id || '',
          schedule: automation.trigger.config.frequency || 'weekly',
          auto_apply_threshold: automation.actions[0]?.config?.threshold || 'low',
          require_approval: automation.actions[0]?.config?.require_approval !== false
        });
      }
    } catch (error) {
      console.error('Failed to load optimization settings:', error);
    }
  };

  const saveSettings = async () => {
    setIsSaving(true);
    try {
      const user = await base44.auth.me();
      
      await base44.entities.WorkflowAutomation.create({
        name: `Auto-optimize ${workflow.name}`,
        description: 'Automatically analyze and optimize workflow performance',
        trigger: {
          type: 'schedule',
          config: {
            frequency: settings.schedule,
            workflow_id: workflow.id
          }
        },
        conditions: [],
        actions: [{
          type: 'optimize_workflow',
          config: {
            workflow_id: workflow.id,
            policy_id: settings.policy_id,
            threshold: settings.auto_apply_threshold,
            require_approval: settings.require_approval
          }
        }],
        enabled: settings.enabled,
        org_id: user.organization?.id || 'org_default'
      });
      
      toast.success('Optimization settings saved');
    } catch (error) {
      console.error('Failed to save settings:', error);
      toast.error('Failed to save settings');
    } finally {
      setIsSaving(false);
    }
  };

  if (!workflow) {
    return null;
  }

  return (
    <Card className="bg-slate-900 border-slate-800">
      <CardHeader>
        <CardTitle className="text-white flex items-center gap-2">
          <Settings className="w-5 h-5" />
          Optimization Automation
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-center justify-between p-3 bg-slate-950 rounded-lg">
          <Label className="text-slate-300">Enable Auto-Optimization</Label>
          <Switch
            checked={settings.enabled}
            onCheckedChange={(checked) => setSettings({...settings, enabled: checked})}
          />
        </div>

        <div className="space-y-2">
          <Label className="text-slate-300">Optimization Policy</Label>
          <Select value={settings.policy_id} onValueChange={(value) => setSettings({...settings, policy_id: value})}>
            <SelectTrigger className="bg-slate-800 border-slate-700">
              <SelectValue placeholder="Select policy" />
            </SelectTrigger>
            <SelectContent className="bg-slate-800 border-slate-700">
              {policies.map(policy => (
                <SelectItem key={policy.id} value={policy.id}>{policy.name}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label className="text-slate-300">Analysis Schedule</Label>
          <Select value={settings.schedule} onValueChange={(value) => setSettings({...settings, schedule: value})}>
            <SelectTrigger className="bg-slate-800 border-slate-700">
              <SelectValue />
            </SelectTrigger>
            <SelectContent className="bg-slate-800 border-slate-700">
              <SelectItem value="daily">Daily</SelectItem>
              <SelectItem value="weekly">Weekly</SelectItem>
              <SelectItem value="monthly">Monthly</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label className="text-slate-300">Auto-Apply Threshold</Label>
          <Select value={settings.auto_apply_threshold} onValueChange={(value) => setSettings({...settings, auto_apply_threshold: value})}>
            <SelectTrigger className="bg-slate-800 border-slate-700">
              <SelectValue />
            </SelectTrigger>
            <SelectContent className="bg-slate-800 border-slate-700">
              <SelectItem value="low">Low Risk Only</SelectItem>
              <SelectItem value="medium">Low & Medium Risk</SelectItem>
              <SelectItem value="high">All Recommendations</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="flex items-center justify-between p-3 bg-slate-950 rounded-lg">
          <Label className="text-slate-300">Require Human Approval</Label>
          <Switch
            checked={settings.require_approval}
            onCheckedChange={(checked) => setSettings({...settings, require_approval: checked})}
          />
        </div>

        <Button 
          onClick={saveSettings} 
          disabled={isSaving}
          className="w-full bg-blue-600 hover:bg-blue-700"
        >
          {isSaving ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" />Saving...</> : <><Save className="w-4 h-4 mr-2" />Save Settings</>}
        </Button>
      </CardContent>
    </Card>
  );
}