
import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { ScheduledRun, Workflow, Agent } from '@/entities/all';
import { Play, Pause, Trash2, Calendar, Plus } from 'lucide-react';
import { format } from 'date-fns';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';

const cronPresets = [
  { label: 'Every minute', value: '* * * * *' },
  { label: 'Every 5 minutes', value: '*/5 * * * *' },
  { label: 'Every hour', value: '0 * * * *' },
  { label: 'Every day at 9 AM', value: '0 9 * * *' },
  { label: 'Every Monday at 9 AM', value: '0 9 * * 1' },
  { label: 'First day of month', value: '0 9 1 * *' },
];

export default function ScheduleManager() {
  const [schedules, setSchedules] = useState([]);
  const [workflows, setWorkflows] = useState([]);
  const [agents, setAgents] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [newSchedule, setNewSchedule] = useState({
    name: '',
    workflow_id: '',
    agent_id: '',
    cron_expression: '',
    enabled: true,
    org_id: 'org_acme'
  });

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setIsLoading(true);
    try {
      const [schedulesData, workflowsData, agentsData] = await Promise.all([
        ScheduledRun.list('-created_date'),
        Workflow.list(),
        Agent.list()
      ]);
      setSchedules(schedulesData);
      setWorkflows(workflowsData);
      setAgents(agentsData);
    } catch (error) {
      console.error('Failed to load scheduling data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleCreate = async (e) => {
    e.preventDefault();
    try {
      await ScheduledRun.create({
        ...newSchedule,
        next_run: calculateNextRun(newSchedule.cron_expression)
      });
      setShowCreateDialog(false);
      setNewSchedule({ name: '', workflow_id: '', agent_id: '', cron_expression: '', enabled: true, org_id: 'org_acme' });
      loadData();
    } catch (error) {
      console.error('Failed to create schedule:', error);
    }
  };

  const toggleSchedule = async (scheduleId, enabled) => {
    try {
      await ScheduledRun.update(scheduleId, { enabled });
      loadData();
    } catch (error) {
      console.error('Failed to update schedule:', error);
    }
  };

  const deleteSchedule = async (scheduleId) => {
    if (confirm('Are you sure you want to delete this schedule?')) {
      try {
        await ScheduledRun.delete(scheduleId);
        loadData();
      } catch (error) {
        console.error('Failed to delete schedule:', error);
      }
    }
  };

  const calculateNextRun = (cronExpression) => {
    // Simple implementation - in real app would use a proper cron library
    const now = new Date();
    now.setMinutes(now.getMinutes() + 5); // Next run in 5 minutes for demo
    return now.toISOString();
  };

  const getWorkflowName = (id) => workflows.find(w => w.id === id)?.name || 'Unknown';
  const getAgentName = (id) => agents.find(a => a.id === id)?.name || 'Unknown';

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-white">Scheduled Runs</h2>
          <p className="text-slate-400">Automate workflow execution with cron schedules</p>
        </div>
        <Button onClick={() => setShowCreateDialog(true)} className="bg-blue-600 hover:bg-blue-700">
          <Plus className="w-4 h-4 mr-2" />
          New Schedule
        </Button>
      </div>

      <Card className="bg-slate-900 border-slate-800">
        <CardHeader>
          <CardTitle className="text-white flex items-center gap-2">
            <Calendar className="w-5 h-5" />
            Active Schedules ({schedules.filter(s => s.enabled).length})
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="rounded-lg border border-slate-700 bg-slate-800">
            <Table>
              <TableHeader>
                <TableRow className="border-b-slate-700">
                  <TableHead className="text-slate-400">Schedule</TableHead>
                  <TableHead className="text-slate-400">Workflow</TableHead>
                  <TableHead className="text-slate-400">Agent</TableHead>
                  <TableHead className="text-slate-400">Cron Expression</TableHead>
                  <TableHead className="text-slate-400">Next Run</TableHead>
                  <TableHead className="text-slate-400">Status</TableHead>
                  <TableHead><span className="sr-only">Actions</span></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {schedules.map((schedule) => (
                  <TableRow key={schedule.id} className="border-b-slate-700">
                    <TableCell>
                      <div>
                        <div className="font-medium text-white">{schedule.name}</div>
                        <div className="text-sm text-slate-400">
                          Runs: {schedule.run_count} | Failures: {schedule.failure_count}
                        </div>
                      </div>
                    </TableCell>
                    <TableCell className="text-slate-300">{getWorkflowName(schedule.workflow_id)}</TableCell>
                    <TableCell className="text-slate-300">{getAgentName(schedule.agent_id)}</TableCell>
                    <TableCell className="font-mono text-sm text-slate-400">{schedule.cron_expression}</TableCell>
                    <TableCell className="text-slate-300">
                      {schedule.next_run ? format(new Date(schedule.next_run), 'MMM d, h:mm a') : 'Not scheduled'}
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline" className={schedule.enabled ? 
                        'bg-green-500/20 text-green-400 border-green-500/30' : 
                        'bg-slate-500/20 text-slate-400 border-slate-500/30'
                      }>
                        {schedule.enabled ? 'Active' : 'Paused'}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => toggleSchedule(schedule.id, !schedule.enabled)}
                          className="text-slate-400 hover:text-white"
                        >
                          {schedule.enabled ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => deleteSchedule(schedule.id)}
                          className="text-red-400 hover:text-red-300"
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
        <DialogContent className="sm:max-w-[525px] bg-slate-900 border-slate-800 text-white">
          <DialogHeader>
            <DialogTitle>Create New Schedule</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleCreate} className="space-y-4">
            <div>
              <Label className="text-slate-400">Schedule Name</Label>
              <Input
                value={newSchedule.name}
                onChange={(e) => setNewSchedule({...newSchedule, name: e.target.value})}
                className="bg-slate-800 border-slate-700 text-white"
                placeholder="Daily report generation"
                required
              />
            </div>
            <div>
              <Label className="text-slate-400">Workflow</Label>
              <Select
                value={newSchedule.workflow_id}
                onValueChange={(value) => setNewSchedule({...newSchedule, workflow_id: value})}
              >
                <SelectTrigger className="bg-slate-800 border-slate-700 text-white">
                  <SelectValue placeholder="Select workflow" />
                </SelectTrigger>
                <SelectContent className="bg-slate-800 border-slate-700">
                  {workflows.map(workflow => (
                    <SelectItem key={workflow.id} value={workflow.id}>{workflow.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label className="text-slate-400">Agent</Label>
              <Select
                value={newSchedule.agent_id}
                onValueChange={(value) => setNewSchedule({...newSchedule, agent_id: value})}
              >
                <SelectTrigger className="bg-slate-800 border-slate-700 text-white">
                  <SelectValue placeholder="Select agent" />
                </SelectTrigger>
                <SelectContent className="bg-slate-800 border-slate-700">
                  {agents.map(agent => (
                    <SelectItem key={agent.id} value={agent.id}>{agent.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label className="text-slate-400">Schedule</Label>
              <Select
                value={newSchedule.cron_expression}
                onValueChange={(value) => setNewSchedule({...newSchedule, cron_expression: value})}
              >
                <SelectTrigger className="bg-slate-800 border-slate-700 text-white">
                  <SelectValue placeholder="Select schedule" />
                </SelectTrigger>
                <SelectContent className="bg-slate-800 border-slate-700">
                  {cronPresets.map(preset => (
                    <SelectItem key={preset.value} value={preset.value}>{preset.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="flex items-center gap-2">
              <Switch
                checked={newSchedule.enabled}
                onCheckedChange={(checked) => setNewSchedule({...newSchedule, enabled: checked})}
              />
              <Label className="text-slate-400">Enabled</Label>
            </div>
            <div className="flex justify-end gap-2">
              <Button type="button" variant="outline" onClick={() => setShowCreateDialog(false)}>
                Cancel
              </Button>
              <Button type="submit">Create Schedule</Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
