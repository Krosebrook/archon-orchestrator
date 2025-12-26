/**
 * @fileoverview Sub-Task Manager
 * @description Dynamic sub-task creation and management for agents
 * @version 1.0.0
 */

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { GitBranch, Plus, CheckCircle2, Circle, Loader2 } from 'lucide-react';
import { base44 } from '@/api/base44Client';
import { toast } from 'sonner';

export default function SubTaskManager({ parentRunId, agentId, onSubTaskCreated }) {
  const [subTasks, setSubTasks] = useState([]);
  const [isCreating, setIsCreating] = useState(false);
  const [newTask, setNewTask] = useState({ title: '', description: '', agent_id: '' });
  const [agents, setAgents] = useState([]);

  useEffect(() => {
    loadSubTasks();
    loadAgents();
  }, [parentRunId]);

  const loadAgents = async () => {
    try {
      const agentData = await base44.entities.Agent.list();
      setAgents(agentData || []);
    } catch (error) {
      console.error('Failed to load agents:', error);
    }
  };

  const loadSubTasks = async () => {
    try {
      const runs = await base44.entities.Run.filter({
        parent_run_id: parentRunId,
      });
      setSubTasks(runs || []);
    } catch (error) {
      console.error('Failed to load sub-tasks:', error);
    }
  };

  const createSubTask = async () => {
    if (!newTask.title.trim() || !newTask.agent_id) {
      toast.error('Please provide title and select an agent');
      return;
    }

    setIsCreating(true);
    try {
      const user = await base44.auth.me();
      
      await base44.entities.Run.create({
        workflow_id: `sub_task_${Date.now()}`,
        agent_id: newTask.agent_id,
        parent_run_id: parentRunId,
        status: 'pending',
        input: {
          title: newTask.title,
          description: newTask.description,
          created_by_agent: agentId,
          type: 'sub_task',
        },
        org_id: user.organization?.id || 'org_acme',
      });

      toast.success('Sub-task created successfully');
      setNewTask({ title: '', description: '', agent_id: '' });
      loadSubTasks();
      onSubTaskCreated?.();
    } catch (error) {
      console.error('Failed to create sub-task:', error);
      toast.error('Failed to create sub-task');
    } finally {
      setIsCreating(false);
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'completed':
        return <CheckCircle2 className="w-4 h-4 text-green-400" />;
      case 'running':
        return <Loader2 className="w-4 h-4 text-blue-400 animate-spin" />;
      case 'failed':
        return <Circle className="w-4 h-4 text-red-400" />;
      default:
        return <Circle className="w-4 h-4 text-slate-400" />;
    }
  };

  return (
    <Card className="bg-slate-900 border-slate-800">
      <CardHeader>
        <CardTitle className="text-white flex items-center gap-2">
          <GitBranch className="w-5 h-5 text-purple-400" />
          Sub-Tasks ({subTasks.length})
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="p-4 bg-slate-950 rounded-lg border border-slate-800 space-y-3">
          <h4 className="text-sm font-medium text-white">Create New Sub-Task</h4>
          
          <Input
            value={newTask.title}
            onChange={(e) => setNewTask({ ...newTask, title: e.target.value })}
            placeholder="Sub-task title"
            className="bg-slate-900 border-slate-700 text-white"
          />
          
          <Textarea
            value={newTask.description}
            onChange={(e) => setNewTask({ ...newTask, description: e.target.value })}
            placeholder="Description (optional)"
            className="bg-slate-900 border-slate-700 text-white resize-none h-20"
          />

          <select
            value={newTask.agent_id}
            onChange={(e) => setNewTask({ ...newTask, agent_id: e.target.value })}
            className="w-full bg-slate-900 border border-slate-700 rounded-md px-3 py-2 text-white text-sm"
          >
            <option value="">Select agent for this task</option>
            {agents.map(agent => (
              <option key={agent.id} value={agent.id}>
                {agent.name}
              </option>
            ))}
          </select>

          <Button
            onClick={createSubTask}
            disabled={isCreating}
            className="w-full bg-purple-600 hover:bg-purple-700"
          >
            <Plus className="w-4 h-4 mr-2" />
            {isCreating ? 'Creating...' : 'Create Sub-Task'}
          </Button>
        </div>

        <div className="space-y-2">
          {subTasks.map((task) => {
            const agent = agents.find(a => a.id === task.agent_id);
            return (
              <div key={task.id} className="p-3 bg-slate-950 rounded border border-slate-800">
                <div className="flex items-start justify-between mb-2">
                  <div className="flex items-center gap-2">
                    {getStatusIcon(task.status)}
                    <span className="text-sm font-medium text-white">
                      {task.input?.title || 'Sub-task'}
                    </span>
                  </div>
                  <Badge className="bg-slate-700 text-xs">
                    {agent?.name || 'Unknown'}
                  </Badge>
                </div>
                {task.input?.description && (
                  <p className="text-xs text-slate-400 mt-1">
                    {task.input.description}
                  </p>
                )}
              </div>
            );
          })}

          {subTasks.length === 0 && (
            <div className="text-center py-6 text-slate-500 text-sm">
              No sub-tasks yet
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}