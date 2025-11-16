import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Settings, Save, DollarSign, Zap, AlertTriangle } from 'lucide-react';
import { base44 } from '@/api/base44Client';
import { toast } from 'sonner';

export default function ResourceManager({ collaboration, onUpdate }) {
  const [settings, setSettings] = useState({
    cost_limit_cents: collaboration?.shared_context?.resource_limits?.cost_limit_cents || 1000,
    rate_limit_per_minute: collaboration?.shared_context?.resource_limits?.rate_limit_per_minute || 60,
    enable_cost_alerts: collaboration?.shared_context?.resource_limits?.enable_cost_alerts !== false,
    enable_rate_limiting: collaboration?.shared_context?.resource_limits?.enable_rate_limiting !== false,
    auto_pause_on_limit: collaboration?.shared_context?.resource_limits?.auto_pause_on_limit || false
  });
  const [isSaving, setIsSaving] = useState(false);

  const saveSettings = async () => {
    setIsSaving(true);
    try {
      await base44.entities.AgentCollaboration.update(collaboration.id, {
        shared_context: {
          ...collaboration.shared_context,
          resource_limits: settings
        }
      });
      toast.success('Resource limits updated');
      onUpdate?.();
    } catch (error) {
      console.error('Failed to update settings:', error);
      toast.error('Failed to update settings');
    } finally {
      setIsSaving(false);
    }
  };

  const currentCost = collaboration?.total_cost_cents || 0;
  const costPercentage = settings.cost_limit_cents > 0 
    ? Math.min((currentCost / settings.cost_limit_cents) * 100, 100) 
    : 0;
  const isNearLimit = costPercentage > 80;

  return (
    <Card className="bg-slate-900 border-slate-800">
      <CardHeader>
        <CardTitle className="text-white flex items-center gap-2">
          <Settings className="w-5 h-5" />
          Resource Management
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="p-3 bg-slate-950 rounded-lg border border-slate-800">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              <DollarSign className="w-4 h-4 text-slate-400" />
              <span className="text-sm text-slate-300">Current Spend</span>
            </div>
            <span className="text-lg font-bold text-white">
              ${(currentCost / 100).toFixed(2)}
            </span>
          </div>
          <div className="w-full bg-slate-800 rounded-full h-2">
            <div 
              className={`h-2 rounded-full transition-all ${isNearLimit ? 'bg-red-500' : 'bg-blue-500'}`}
              style={{ width: `${costPercentage}%` }}
            />
          </div>
          <div className="text-xs text-slate-500 mt-1">
            {costPercentage.toFixed(0)}% of limit (${(settings.cost_limit_cents / 100).toFixed(2)})
          </div>
        </div>

        {isNearLimit && (
          <div className="p-3 bg-yellow-900/20 rounded-lg border border-yellow-800/30 flex items-start gap-2">
            <AlertTriangle className="w-4 h-4 text-yellow-400 mt-0.5" />
            <div>
              <div className="text-sm text-yellow-400 font-medium">Cost Limit Warning</div>
              <div className="text-xs text-yellow-300">Approaching configured cost limit</div>
            </div>
          </div>
        )}

        <div className="space-y-3">
          <div className="space-y-2">
            <Label className="text-slate-300">Cost Limit (USD)</Label>
            <Input
              type="number"
              step="0.01"
              value={(settings.cost_limit_cents / 100).toFixed(2)}
              onChange={(e) => setSettings({
                ...settings,
                cost_limit_cents: Math.round(parseFloat(e.target.value) * 100)
              })}
              className="bg-slate-800 border-slate-700"
            />
          </div>

          <div className="space-y-2">
            <Label className="text-slate-300">Rate Limit (requests/min)</Label>
            <Input
              type="number"
              value={settings.rate_limit_per_minute}
              onChange={(e) => setSettings({
                ...settings,
                rate_limit_per_minute: parseInt(e.target.value)
              })}
              className="bg-slate-800 border-slate-700"
            />
          </div>

          <div className="flex items-center justify-between p-3 bg-slate-950 rounded-lg">
            <Label className="text-slate-300">Enable Cost Alerts</Label>
            <Switch
              checked={settings.enable_cost_alerts}
              onCheckedChange={(checked) => setSettings({...settings, enable_cost_alerts: checked})}
            />
          </div>

          <div className="flex items-center justify-between p-3 bg-slate-950 rounded-lg">
            <Label className="text-slate-300">Enable Rate Limiting</Label>
            <Switch
              checked={settings.enable_rate_limiting}
              onCheckedChange={(checked) => setSettings({...settings, enable_rate_limiting: checked})}
            />
          </div>

          <div className="flex items-center justify-between p-3 bg-slate-950 rounded-lg">
            <Label className="text-slate-300">Auto-Pause on Limit</Label>
            <Switch
              checked={settings.auto_pause_on_limit}
              onCheckedChange={(checked) => setSettings({...settings, auto_pause_on_limit: checked})}
            />
          </div>
        </div>

        <Button
          onClick={saveSettings}
          disabled={isSaving}
          className="w-full bg-blue-600 hover:bg-blue-700"
        >
          <Save className="w-4 h-4 mr-2" />
          {isSaving ? 'Saving...' : 'Save Settings'}
        </Button>
      </CardContent>
    </Card>
  );
}