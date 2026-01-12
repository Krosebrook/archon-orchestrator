import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Brain, CheckCircle2, Clock, AlertCircle, Loader2, Sparkles, GitBranch } from 'lucide-react';
import { base44 } from '@/api/base44Client';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

const PRIORITY_CONFIG = {
  low: { badge: 'bg-blue-500/20 text-blue-400 border-blue-500/30', icon: Clock },
  medium: { badge: 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30', icon: AlertCircle },
  high: { badge: 'bg-red-500/20 text-red-400 border-red-500/30', icon: AlertCircle }
};

const STATUS_CONFIG = {
  pending: { badge: 'bg-slate-500/20 text-slate-400 border-slate-500/30', icon: Clock },
  in_progress: { badge: 'bg-blue-500/20 text-blue-400 border-blue-500/30', icon: Loader2, animate: 'animate-spin' },
  completed: { badge: 'bg-green-500/20 text-green-400 border-green-500/30', icon: CheckCircle2 },
  blocked: { badge: 'bg-red-500/20 text-red-400 border-red-500/30', icon: AlertCircle }
};

export default function TaskDelegationPanel({ collaboration, agents, onUpdate }) {
  const [isDelegating, setIsDelegating] = useState(false);
  const [isReassigning, setIsReassigning] = useState(null);

  const taskDelegation = collaboration?.shared_context?.task_delegation;
  const tasks = taskDelegation?.tasks || [];

  const delegateTasks = async () => {
    setIsDelegating(true);
    try {
      const response = await base44.functions.invoke('delegateTasks', {
        collaboration_id: collaboration.id,
        goal: collaboration.shared_context?.goal,
        context: collaboration.shared_context
      });

      if (response.data.success) {
        toast.success(`Delegated ${response.data.tasks.length} tasks`);
        onUpdate?.();
      }
    } catch (error) {
      console.error('Delegation error:', error);
      toast.error('Failed to delegate tasks');
    } finally {
      setIsDelegating(false);
    }
  };

  const reassignTask = async (taskId, newAgentId) => {
    setIsReassigning(taskId);
    try {
      const updatedTasks = tasks.map(t => 
        t.id === taskId ? { ...t, assigned_agent_id: newAgentId } : t
      );

      await base44.entities.AgentCollaboration.update(collaboration.id, {
        shared_context: {
          ...collaboration.shared_context,
          task_delegation: {
            ...taskDelegation,
            tasks: updatedTasks
          }
        }
      });

      toast.success('Task reassigned');
      onUpdate?.();
    } catch (error) {
      console.error('Reassignment error:', error);
      toast.error('Failed to reassign task');
    } finally {
      setIsReassigning(null);
    }
  };

  const updateTaskStatus = async (taskId, newStatus, progress = null) => {
    try {
      const updatedTasks = tasks.map(t => 
        t.id === taskId ? { ...t, status: newStatus, progress: progress !== null ? progress : t.progress } : t
      );

      await base44.entities.AgentCollaboration.update(collaboration.id, {
        shared_context: {
          ...collaboration.shared_context,
          task_delegation: {
            ...taskDelegation,
            tasks: updatedTasks
          }
        }
      });

      onUpdate?.();
    } catch (error) {
      console.error('Status update error:', error);
      toast.error('Failed to update task');
    }
  };

  const getAgentName = (agentId) => {
    const agent = agents.find(a => a.id === agentId);
    return agent?.name || agentId;
  };

  const completedTasks = tasks.filter(t => t.status === 'completed').length;
  const totalTasks = tasks.length;
  const overallProgress = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;

  return (
    <Card className="bg-slate-900 border-slate-800">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="text-white flex items-center gap-2">
            <GitBranch className="w-5 h-5 text-purple-400" />
            Task Delegation
          </CardTitle>
          {!taskDelegation ? (
            <Button
              size="sm"
              onClick={delegateTasks}
              disabled={isDelegating}
              className="bg-purple-600 hover:bg-purple-700"
            >
              {isDelegating ? (
                <><Loader2 className="w-4 h-4 mr-2 animate-spin" />Delegating...</>
              ) : (
                <><Sparkles className="w-4 h-4 mr-2" />Delegate Tasks</>
              )}
            </Button>
          ) : (
            <Button
              size="sm"
              onClick={delegateTasks}
              disabled={isDelegating}
              variant="outline"
              className="border-slate-700"
            >
              {isDelegating ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Re-delegate'}
            </Button>
          )}
        </div>
      </CardHeader>
      
      <CardContent>
        {!taskDelegation ? (
          <div className="text-center py-8">
            <Brain className="w-12 h-12 text-slate-600 mx-auto mb-3" />
            <p className="text-slate-400 text-sm">Click "Delegate Tasks" to let AI break down and assign work</p>
          </div>
        ) : (
          <div className="space-y-4">
            {taskDelegation.reasoning && (
              <div className="p-3 bg-purple-900/20 rounded-lg border border-purple-800/30">
                <div className="text-xs text-purple-400 font-medium mb-1">Delegation Strategy</div>
                <p className="text-xs text-purple-300">{taskDelegation.reasoning}</p>
              </div>
            )}

            <div className="p-3 bg-slate-950 rounded-lg border border-slate-800">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm text-slate-300">Overall Progress</span>
                <span className="text-sm font-medium text-white">{completedTasks}/{totalTasks} completed</span>
              </div>
              <Progress value={overallProgress} className="h-2" />
            </div>

            <div className="space-y-3">
              {tasks.map((task) => {
                const priorityConfig = PRIORITY_CONFIG[task.priority] || PRIORITY_CONFIG.medium;
                const statusConfig = STATUS_CONFIG[task.status] || STATUS_CONFIG.pending;
                const StatusIcon = statusConfig.icon;
                const hasDependencies = task.dependencies?.length > 0;

                return (
                  <div key={task.id} className="p-3 bg-slate-950 rounded-lg border border-slate-800">
                    <div className="flex items-start justify-between mb-2">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="text-sm font-medium text-white">{task.title}</span>
                          <Badge variant="outline" className={statusConfig.badge}>
                            <StatusIcon className={cn('w-3 h-3 mr-1', statusConfig.animate)} />
                            {task.status}
                          </Badge>
                          <Badge variant="outline" className={priorityConfig.badge}>
                            {task.priority}
                          </Badge>
                        </div>
                        <p className="text-xs text-slate-400 mb-2">{task.description}</p>
                      </div>
                    </div>

                    <div className="space-y-2">
                      <div className="flex items-center gap-2 text-xs">
                        <Brain className="w-3 h-3 text-slate-500" />
                        <span className="text-slate-400">Assigned to:</span>
                        <Select
                          value={task.assigned_agent_id}
                          onValueChange={(value) => reassignTask(task.id, value)}
                          disabled={isReassigning === task.id}
                        >
                          <SelectTrigger className="h-7 w-40 bg-slate-800 border-slate-700 text-xs">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent className="bg-slate-800 border-slate-700">
                            {agents.map(agent => (
                              <SelectItem key={agent.id} value={agent.id}>{agent.name}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>

                      {hasDependencies && (
                        <div className="flex items-start gap-2 text-xs">
                          <GitBranch className="w-3 h-3 text-slate-500 mt-0.5" />
                          <div>
                            <span className="text-slate-400">Depends on: </span>
                            <span className="text-slate-300">{task.dependencies.join(', ')}</span>
                          </div>
                        </div>
                      )}

                      {task.progress > 0 && task.status === 'in_progress' && (
                        <div>
                          <div className="flex items-center justify-between mb-1">
                            <span className="text-xs text-slate-400">Progress</span>
                            <span className="text-xs text-slate-300">{task.progress}%</span>
                          </div>
                          <Progress value={task.progress} className="h-1.5" />
                        </div>
                      )}

                      {task.status === 'pending' && (
                        <Button
                          size="sm"
                          onClick={() => updateTaskStatus(task.id, 'in_progress', 0)}
                          className="w-full bg-blue-600 hover:bg-blue-700 h-7 text-xs"
                        >
                          Start Task
                        </Button>
                      )}

                      {task.status === 'in_progress' && (
                        <div className="flex gap-2">
                          <Button
                            size="sm"
                            onClick={() => updateTaskStatus(task.id, 'completed', 100)}
                            className="flex-1 bg-green-600 hover:bg-green-700 h-7 text-xs"
                          >
                            <CheckCircle2 className="w-3 h-3 mr-1" />
                            Complete
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => updateTaskStatus(task.id, 'blocked')}
                            className="flex-1 border-red-700 text-red-400 hover:bg-red-900/20 h-7 text-xs"
                          >
                            Block
                          </Button>
                        </div>
                      )}

                      {task.success_criteria && (
                        <details className="text-xs">
                          <summary className="text-slate-400 cursor-pointer hover:text-slate-300">Success Criteria</summary>
                          <p className="text-slate-300 mt-1 ml-4">{task.success_criteria}</p>
                        </details>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}