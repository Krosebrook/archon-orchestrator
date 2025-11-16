import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { GitBranch, CheckCircle2, Loader2, Clock, XCircle } from 'lucide-react';
import { cn } from '@/lib/utils';

const STATUS_CONFIG = {
  pending: { icon: Clock, color: 'text-slate-400', bg: 'bg-slate-500/10', border: 'border-slate-500/30' },
  running: { icon: Loader2, color: 'text-blue-400', bg: 'bg-blue-500/10', border: 'border-blue-500/30', animate: 'animate-spin' },
  completed: { icon: CheckCircle2, color: 'text-green-400', bg: 'bg-green-500/10', border: 'border-green-500/30' },
  failed: { icon: XCircle, color: 'text-red-400', bg: 'bg-red-500/10', border: 'border-red-500/30' }
};

export default function WorkflowDAG({ tasks = [], agents = [] }) {
  const getAgentName = (agentId) => agents.find(a => a.id === agentId)?.name || agentId;

  // Build dependency map
  const taskMap = new Map(tasks.map(t => [t.id, t]));
  const levels = new Map();
  
  const calculateLevel = (taskId, visited = new Set()) => {
    if (visited.has(taskId)) return 0;
    if (levels.has(taskId)) return levels.get(taskId);
    
    visited.add(taskId);
    const task = taskMap.get(taskId);
    if (!task?.dependencies?.length) {
      levels.set(taskId, 0);
      return 0;
    }
    
    const maxDepLevel = Math.max(...task.dependencies.map(dep => calculateLevel(dep, visited)));
    const level = maxDepLevel + 1;
    levels.set(taskId, level);
    return level;
  };

  tasks.forEach(t => calculateLevel(t.id));
  const maxLevel = Math.max(...Array.from(levels.values()), 0);
  
  // Group by level
  const tasksByLevel = Array.from({ length: maxLevel + 1 }, () => []);
  tasks.forEach(task => {
    const level = levels.get(task.id) || 0;
    tasksByLevel[level].push(task);
  });

  return (
    <Card className="bg-slate-900 border-slate-800">
      <CardHeader>
        <CardTitle className="text-white flex items-center gap-2">
          <GitBranch className="w-5 h-5" />
          Workflow DAG
        </CardTitle>
      </CardHeader>
      <CardContent>
        {tasks.length === 0 ? (
          <div className="text-center py-12 text-slate-400">
            <GitBranch className="w-12 h-12 mx-auto mb-3 text-slate-600" />
            No task graph available
          </div>
        ) : (
          <div className="relative overflow-x-auto">
            <div className="flex gap-8 min-w-max py-4">
              {tasksByLevel.map((levelTasks, levelIdx) => (
                <div key={levelIdx} className="flex flex-col gap-4 min-w-[200px]">
                  <div className="text-xs text-slate-500 font-medium mb-2">Level {levelIdx}</div>
                  {levelTasks.map((task) => {
                    const config = STATUS_CONFIG[task.status] || STATUS_CONFIG.pending;
                    const Icon = config.icon;
                    
                    return (
                      <div
                        key={task.id}
                        className={cn(
                          'p-3 rounded-lg border-2 transition-all',
                          config.bg,
                          config.border
                        )}
                      >
                        <div className="flex items-start gap-2 mb-2">
                          <Icon className={cn('w-4 h-4 mt-0.5', config.color, config.animate)} />
                          <div className="flex-1 min-w-0">
                            <div className="text-sm font-medium text-white truncate">
                              {task.title}
                            </div>
                            <div className="text-xs text-slate-400 mt-1">
                              {getAgentName(task.assigned_agent_id)}
                            </div>
                          </div>
                        </div>
                        
                        <div className="flex items-center gap-2">
                          <Badge variant="outline" className={cn('text-xs', config.border, config.color)}>
                            {task.status}
                          </Badge>
                          <Badge variant="outline" className="text-xs bg-slate-800 border-slate-700">
                            {task.priority}
                          </Badge>
                        </div>

                        {task.progress > 0 && task.status === 'running' && (
                          <div className="mt-2 w-full bg-slate-800 rounded-full h-1.5">
                            <div 
                              className="bg-blue-500 h-1.5 rounded-full transition-all"
                              style={{ width: `${task.progress}%` }}
                            />
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              ))}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}