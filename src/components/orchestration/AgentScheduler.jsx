/**
 * @fileoverview Agent Scheduler
 * @description Priority-based scheduling and queue management for agents
 * @version 1.0.0
 */

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Clock, PlayCircle, PauseCircle, AlertTriangle, ArrowUp, ArrowDown, Zap } from 'lucide-react';
import { base44 } from '@/api/base44Client';
import { toast } from 'sonner';
import { format } from 'date-fns';

const PRIORITY_LEVELS = {
  critical: { value: 1, label: 'Critical', color: 'bg-red-600', icon: AlertTriangle },
  high: { value: 2, label: 'High', color: 'bg-orange-600', icon: ArrowUp },
  normal: { value: 3, label: 'Normal', color: 'bg-blue-600', icon: Zap },
  low: { value: 4, label: 'Low', color: 'bg-slate-600', icon: ArrowDown },
};

export default function AgentScheduler({ agents, onScheduleUpdate }) {
  const [scheduledTasks, setScheduledTasks] = useState([]);
  const [_isLoading, _setIsLoading] = useState(true);

  useEffect(() => {
    loadScheduledTasks();
  }, []);

  const loadScheduledTasks = async () => {
    setIsLoading(true);
    try {
      const scheduled = await base44.entities.ScheduledRun.list('-priority');
      setScheduledTasks(scheduled || []);
    } catch (error) {
      console.error('Failed to load scheduled tasks:', error);
      toast.error('Failed to load scheduled tasks');
    } finally {
      setIsLoading(false);
    }
  };

  const updatePriority = async (taskId, newPriority) => {
    try {
      await base44.entities.ScheduledRun.update(taskId, {
        priority: PRIORITY_LEVELS[newPriority].value,
      });
      toast.success('Priority updated');
      loadScheduledTasks();
      onScheduleUpdate?.();
    } catch (error) {
      console.error('Failed to update priority:', error);
      toast.error('Failed to update priority');
    }
  };

  const pauseTask = async (taskId) => {
    try {
      await base44.entities.ScheduledRun.update(taskId, { is_active: false });
      toast.success('Task paused');
      loadScheduledTasks();
    } catch (error) {
      console.error('Failed to pause task:', error);
      toast.error('Failed to pause task');
    }
  };

  const resumeTask = async (taskId) => {
    try {
      await base44.entities.ScheduledRun.update(taskId, { is_active: true });
      toast.success('Task resumed');
      loadScheduledTasks();
    } catch (error) {
      console.error('Failed to resume task:', error);
      toast.error('Failed to resume task');
    }
  };

  const getPriorityKey = (priorityValue) => {
    return Object.keys(PRIORITY_LEVELS).find(
      key => PRIORITY_LEVELS[key].value === priorityValue
    ) || 'normal';
  };

  return (
    <Card className="bg-slate-900 border-slate-800">
      <CardHeader>
        <CardTitle className="text-white flex items-center gap-2">
          <Clock className="w-5 h-5 text-blue-400" />
          Agent Task Scheduler
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {scheduledTasks.map((task) => {
            const priorityKey = getPriorityKey(task.priority);
            const priority = PRIORITY_LEVELS[priorityKey];
            const PriorityIcon = priority.icon;
            const agent = agents.find(a => a.id === task.agent_id);

            return (
              <div key={task.id} className="p-4 bg-slate-950 rounded-lg border border-slate-800">
                <div className="flex items-start justify-between mb-3">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <Badge className={priority.color}>
                        <PriorityIcon className="w-3 h-3 mr-1" />
                        {priority.label}
                      </Badge>
                      <Badge variant="outline" className="text-slate-400">
                        {agent?.name || 'Unknown Agent'}
                      </Badge>
                      {!task.is_active && (
                        <Badge variant="outline" className="text-yellow-400 border-yellow-400">
                          Paused
                        </Badge>
                      )}
                    </div>
                    <p className="text-sm text-slate-300 mb-1">
                      Workflow: {task.workflow_id}
                    </p>
                    {task.next_run && (
                      <p className="text-xs text-slate-500">
                        Next run: {format(new Date(task.next_run), 'MMM dd, HH:mm')}
                      </p>
                    )}
                  </div>
                  
                  <div className="flex items-center gap-2">
                    <Select
                      value={priorityKey}
                      onValueChange={(val) => updatePriority(task.id, val)}
                    >
                      <SelectTrigger className="w-32 h-8 text-xs bg-slate-900 border-slate-700">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent className="bg-slate-900 border-slate-800">
                        {Object.entries(PRIORITY_LEVELS).map(([key, config]) => (
                          <SelectItem key={key} value={key}>
                            {config.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>

                    {task.is_active ? (
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => pauseTask(task.id)}
                        className="border-slate-700"
                      >
                        <PauseCircle className="w-4 h-4" />
                      </Button>
                    ) : (
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => resumeTask(task.id)}
                        className="border-green-700 text-green-400"
                      >
                        <PlayCircle className="w-4 h-4" />
                      </Button>
                    )}
                  </div>
                </div>

                {task.schedule && (
                  <div className="text-xs text-slate-400 mt-2 flex items-center gap-2">
                    <Clock className="w-3 h-3" />
                    Schedule: {task.schedule}
                  </div>
                )}
              </div>
            );
          })}

          {scheduledTasks.length === 0 && (
            <div className="text-center py-8 text-slate-500">
              No scheduled tasks
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}