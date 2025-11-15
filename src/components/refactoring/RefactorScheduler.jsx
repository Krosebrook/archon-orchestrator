import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Plus, Calendar, Trash2, Clock, Zap } from 'lucide-react';
import { base44 } from '@/api/base44Client';
import { toast } from 'sonner';
import { format } from 'date-fns';

const CRON_PRESETS = {
  '0 2 * * *': 'Daily at 2 AM',
  '0 2 * * 0': 'Weekly on Sunday at 2 AM',
  '0 2 1 * *': 'Monthly on the 1st at 2 AM',
  '0 */6 * * *': 'Every 6 hours',
  '0 0 * * 1': 'Weekly on Monday at midnight'
};

export default function RefactorScheduler() {
  const [schedules, setSchedules] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    cron_expression: '0 2 * * *',
    timezone: 'UTC',
    auto_apply: false,
    auto_apply_threshold: 'low',
    scope: {
      categories: ['redundancy', 'performance', 'security', 'maintainability']
    }
  });

  useEffect(() => {
    loadSchedules();
  }, []);

  const loadSchedules = async () => {
    setIsLoading(true);
    try {
      const data = await base44.entities.RefactorSchedule.list('-created_date');
      setSchedules(data);
    } catch (error) {
      console.error('Failed to load schedules:', error);
      toast.error('Failed to load schedules');
    } finally {
      setIsLoading(false);
    }
  };

  const createSchedule = async () => {
    try {
      const user = await base44.auth.me();
      await base44.entities.RefactorSchedule.create({
        ...formData,
        org_id: user.organization?.id || 'org_default'
      });
      toast.success('Schedule created successfully');
      setIsDialogOpen(false);
      loadSchedules();
      setFormData({
        name: '',
        cron_expression: '0 2 * * *',
        timezone: 'UTC',
        auto_apply: false,
        auto_apply_threshold: 'low',
        scope: { categories: ['redundancy', 'performance', 'security', 'maintainability'] }
      });
    } catch (error) {
      console.error('Failed to create schedule:', error);
      toast.error('Failed to create schedule');
    }
  };

  const toggleSchedule = async (schedule) => {
    try {
      await base44.entities.RefactorSchedule.update(schedule.id, {
        enabled: !schedule.enabled
      });
      toast.success(`Schedule ${schedule.enabled ? 'disabled' : 'enabled'}`);
      loadSchedules();
    } catch (error) {
      console.error('Failed to toggle schedule:', error);
      toast.error('Failed to update schedule');
    }
  };

  const deleteSchedule = async (id) => {
    if (!confirm('Are you sure you want to delete this schedule?')) return;
    
    try {
      await base44.entities.RefactorSchedule.delete(id);
      toast.success('Schedule deleted');
      loadSchedules();
    } catch (error) {
      console.error('Failed to delete schedule:', error);
      toast.error('Failed to delete schedule');
    }
  };

  return (
    <Card className="bg-slate-900 border-slate-800">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="text-white">Refactor Schedules</CardTitle>
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button className="bg-blue-600 hover:bg-blue-700">
                <Plus className="w-4 h-4 mr-2" />
                New Schedule
              </Button>
            </DialogTrigger>
            <DialogContent className="bg-slate-900 border-slate-800 text-white">
              <DialogHeader>
                <DialogTitle>Create Refactor Schedule</DialogTitle>
              </DialogHeader>
              <div className="space-y-4 py-4">
                <div>
                  <Label className="text-slate-300">Schedule Name</Label>
                  <Input
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    placeholder="Weekly code analysis"
                    className="bg-slate-800 border-slate-700"
                  />
                </div>

                <div>
                  <Label className="text-slate-300">Frequency</Label>
                  <Select
                    value={formData.cron_expression}
                    onValueChange={(value) => setFormData({ ...formData, cron_expression: value })}
                  >
                    <SelectTrigger className="bg-slate-800 border-slate-700">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="bg-slate-800 border-slate-700">
                      {Object.entries(CRON_PRESETS).map(([cron, label]) => (
                        <SelectItem key={cron} value={cron}>
                          {label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="flex items-center justify-between p-3 bg-slate-950 rounded-lg border border-slate-800">
                  <div>
                    <div className="text-sm font-medium text-white">Auto-apply Safe Fixes</div>
                    <div className="text-xs text-slate-400">Automatically apply low-risk recommendations</div>
                  </div>
                  <Switch
                    checked={formData.auto_apply}
                    onCheckedChange={(checked) => setFormData({ ...formData, auto_apply: checked })}
                  />
                </div>

                {formData.auto_apply && (
                  <div>
                    <Label className="text-slate-300">Auto-apply Threshold</Label>
                    <Select
                      value={formData.auto_apply_threshold}
                      onValueChange={(value) => setFormData({ ...formData, auto_apply_threshold: value })}
                    >
                      <SelectTrigger className="bg-slate-800 border-slate-700">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent className="bg-slate-800 border-slate-700">
                        <SelectItem value="low">Low Risk Only</SelectItem>
                        <SelectItem value="medium">Low & Medium Risk</SelectItem>
                        <SelectItem value="high">All Risks</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                )}

                <Button onClick={createSchedule} className="w-full bg-blue-600 hover:bg-blue-700">
                  Create Schedule
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="text-center py-8 text-slate-400">Loading...</div>
        ) : schedules.length === 0 ? (
          <div className="text-center py-12">
            <Calendar className="w-12 h-12 text-slate-600 mx-auto mb-3" />
            <div className="text-slate-400 mb-2">No schedules configured</div>
            <p className="text-sm text-slate-500">Create a schedule to automate code analysis</p>
          </div>
        ) : (
          <div className="space-y-3">
            {schedules.map((schedule) => (
              <div
                key={schedule.id}
                className="flex items-center justify-between p-4 bg-slate-950 rounded-lg border border-slate-800"
              >
                <div className="flex items-center gap-4 flex-1">
                  <div className={`p-2 rounded-lg ${schedule.enabled ? 'bg-blue-900/30' : 'bg-slate-800'}`}>
                    <Calendar className={`w-5 h-5 ${schedule.enabled ? 'text-blue-400' : 'text-slate-500'}`} />
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-white font-medium">{schedule.name}</span>
                      <Badge variant="outline" className="bg-slate-800 border-slate-700 text-xs">
                        {CRON_PRESETS[schedule.cron_expression] || schedule.cron_expression}
                      </Badge>
                      {schedule.auto_apply && (
                        <Badge variant="outline" className="bg-green-500/20 text-green-400 border-green-500/30 text-xs">
                          <Zap className="w-3 h-3 mr-1" />
                          Auto-apply
                        </Badge>
                      )}
                    </div>
                    <div className="flex items-center gap-4 mt-2 text-xs text-slate-500">
                      <span>Runs: {schedule.run_count || 0}</span>
                      {schedule.next_run && (
                        <span className="flex items-center gap-1">
                          <Clock className="w-3 h-3" />
                          Next: {format(new Date(schedule.next_run), 'MMM d, h:mm a')}
                        </span>
                      )}
                      {schedule.last_run && (
                        <span>Last: {format(new Date(schedule.last_run), 'MMM d, h:mm a')}</span>
                      )}
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <Switch
                    checked={schedule.enabled}
                    onCheckedChange={() => toggleSchedule(schedule)}
                  />
                  <Button
                    size="icon"
                    variant="ghost"
                    onClick={() => deleteSchedule(schedule.id)}
                    className="text-slate-400 hover:text-red-400"
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}