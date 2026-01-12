import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { CheckSquare, Clock, AlertCircle, Play, Loader2 } from 'lucide-react';
import { base44 } from '@/api/base44Client';
import { toast } from 'sonner';

export default function TaskQueue({ agents, workflows, onRefresh }) {
  const [tasks, setTasks] = useState([]);
  const [selectedAgent, setSelectedAgent] = useState('');
  const [executing, setExecuting] = useState(null);

  useEffect(() => {
    loadTasks();
  }, [agents]);

  const loadTasks = async () => {
    try {
      const teams = await base44.entities.AgentTeam.list();
      const allTasks = teams.flatMap(team => 
        (team.task_queue || []).map(task => ({
          ...task,
          team_id: team.id,
          team_name: team.name
        }))
      );
      setTasks(allTasks);
    } catch (error) {
      console.error('Failed to load tasks:', error);
    }
  };

  const executeTask = async (task) => {
    setExecuting(task.id);
    try {
      // Call delegation function
      const result = await base44.functions.invoke('delegateTasks', {
        workflow_id: task.workflow_id,
        agent_id: selectedAgent,
        task_description: task.description
      });

      toast.success('Task executed successfully');
      loadTasks();
      onRefresh();
    } catch (error) {
      toast.error('Task execution failed');
    } finally {
      setExecuting(null);
    }
  };

  const statusConfig = {
    pending: { icon: Clock, color: 'text-yellow-400', bg: 'bg-yellow-500/20' },
    assigned: { icon: Play, color: 'text-blue-400', bg: 'bg-blue-500/20' },
    completed: { icon: CheckSquare, color: 'text-green-400', bg: 'bg-green-500/20' },
    failed: { icon: AlertCircle, color: 'text-red-400', bg: 'bg-red-500/20' }
  };

  return (
    <div className="space-y-6">
      <Card className="bg-slate-900 border-slate-800">
        <CardHeader>
          <CardTitle className="text-white">Task Assignment</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex gap-4">
            <Select value={selectedAgent} onValueChange={setSelectedAgent}>
              <SelectTrigger className="bg-slate-800 border-slate-700 flex-1">
                <SelectValue placeholder="Select agent to assign tasks" />
              </SelectTrigger>
              <SelectContent className="bg-slate-900 border-slate-800">
                {agents.map(agent => (
                  <SelectItem key={agent.id} value={agent.id}>{agent.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {tasks.map(task => {
          const config = statusConfig[task.status || 'pending'];
          const Icon = config.icon;
          const workflow = workflows.find(w => w.id === task.workflow_id);

          return (
            <Card key={task.id} className="bg-slate-900 border-slate-800">
              <CardContent className="pt-6">
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <h3 className="text-white font-semibold">{task.name || 'Unnamed Task'}</h3>
                    <p className="text-sm text-slate-400 mt-1">{task.team_name}</p>
                  </div>
                  <Badge variant="outline" className={config.color}>
                    <Icon className="w-3 h-3 mr-1" />
                    {task.status || 'pending'}
                  </Badge>
                </div>

                <p className="text-sm text-slate-300 mb-4">{task.description}</p>

                {workflow && (
                  <p className="text-xs text-slate-400 mb-4">Workflow: {workflow.name}</p>
                )}

                <Button
                  onClick={() => executeTask(task)}
                  disabled={!selectedAgent || executing === task.id}
                  className="w-full bg-blue-600 hover:bg-blue-700"
                  size="sm"
                >
                  {executing === task.id ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Executing...
                    </>
                  ) : (
                    <>
                      <Play className="w-4 h-4 mr-2" />
                      Execute
                    </>
                  )}
                </Button>
              </CardContent>
            </Card>
          );
        })}

        {tasks.length === 0 && (
          <div className="col-span-2 text-center py-12 text-slate-400">
            No tasks in queue
          </div>
        )}
      </div>
    </div>
  );
}