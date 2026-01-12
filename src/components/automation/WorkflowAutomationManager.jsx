import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Plus, Play, Trash2, Settings, Zap, Calendar, Webhook } from 'lucide-react';
import { base44 } from '@/api/base44Client';
import { toast } from 'sonner';
import { format } from 'date-fns';

const TRIGGER_ICONS = {
  schedule: Calendar,
  event: Zap,
  webhook: Webhook,
  manual: Play
};

export default function WorkflowAutomationManager() {
  const [automations, setAutomations] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadAutomations();
  }, []);

  const loadAutomations = async () => {
    setIsLoading(true);
    try {
      const data = await base44.entities.WorkflowAutomation.list('-created_date');
      setAutomations(data);
    } catch (error) {
      console.error('Failed to load automations:', error);
      toast.error('Failed to load automations');
    } finally {
      setIsLoading(false);
    }
  };

  const toggleAutomation = async (automation) => {
    try {
      await base44.entities.WorkflowAutomation.update(automation.id, {
        enabled: !automation.enabled
      });
      toast.success(`Automation ${automation.enabled ? 'disabled' : 'enabled'}`);
      loadAutomations();
    } catch (error) {
      console.error('Failed to toggle automation:', error);
      toast.error('Failed to update automation');
    }
  };

  const deleteAutomation = async (id) => {
    if (!confirm('Are you sure you want to delete this automation?')) return;
    
    try {
      await base44.entities.WorkflowAutomation.delete(id);
      toast.success('Automation deleted');
      loadAutomations();
    } catch (error) {
      console.error('Failed to delete automation:', error);
      toast.error('Failed to delete automation');
    }
  };

  return (
    <Card className="bg-slate-900 border-slate-800">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="text-white">Workflow Automations</CardTitle>
          <Button className="bg-blue-600 hover:bg-blue-700">
            <Plus className="w-4 h-4 mr-2" />
            New Automation
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="text-center py-8 text-slate-400">Loading...</div>
        ) : automations.length === 0 ? (
          <div className="text-center py-12">
            <Zap className="w-12 h-12 text-slate-600 mx-auto mb-3" />
            <div className="text-slate-400 mb-2">No automations configured</div>
            <p className="text-sm text-slate-500">Create automation rules to streamline your workflows</p>
          </div>
        ) : (
          <div className="space-y-3">
            {automations.map((automation) => {
              const TriggerIcon = TRIGGER_ICONS[automation.trigger?.type] || Zap;
              const successRate = automation.execution_count > 0
                ? Math.round((automation.success_count / automation.execution_count) * 100)
                : 0;

              return (
                <div
                  key={automation.id}
                  className="flex items-center justify-between p-4 bg-slate-950 rounded-lg border border-slate-800"
                >
                  <div className="flex items-center gap-4 flex-1">
                    <div className={`p-2 rounded-lg ${automation.enabled ? 'bg-blue-900/30' : 'bg-slate-800'}`}>
                      <TriggerIcon className={`w-5 h-5 ${automation.enabled ? 'text-blue-400' : 'text-slate-500'}`} />
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-white font-medium">{automation.name}</span>
                        <Badge variant="outline" className="bg-slate-800 border-slate-700 text-xs">
                          {automation.trigger?.type}
                        </Badge>
                      </div>
                      <div className="text-sm text-slate-400">{automation.description}</div>
                      <div className="flex items-center gap-4 mt-2 text-xs text-slate-500">
                        <span>Executions: {automation.execution_count}</span>
                        <span>Success Rate: {successRate}%</span>
                        {automation.last_triggered && (
                          <span>Last: {format(new Date(automation.last_triggered), 'MMM d, h:mm a')}</span>
                        )}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <Switch
                      checked={automation.enabled}
                      onCheckedChange={() => toggleAutomation(automation)}
                    />
                    <Button
                      size="icon"
                      variant="ghost"
                      className="text-slate-400 hover:text-white"
                    >
                      <Settings className="w-4 h-4" />
                    </Button>
                    <Button
                      size="icon"
                      variant="ghost"
                      onClick={() => deleteAutomation(automation.id)}
                      className="text-slate-400 hover:text-red-400"
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </CardContent>
    </Card>
  );
}