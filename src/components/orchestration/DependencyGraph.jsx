/**
 * @fileoverview Dependency Graph Manager
 * @description Agent dependency management and parallel execution controls
 * @version 1.0.0
 */

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Network, PlayCircle, Layers, AlertCircle } from 'lucide-react';
import { base44 } from '@/api/base44Client';
import { toast } from 'sonner';

export default function DependencyGraph({ workflowId, agents, onExecutionModeChange }) {
  const [dependencies, setDependencies] = useState([]);
  const [executionMode, setExecutionMode] = useState('sequential');
  const [maxParallel, setMaxParallel] = useState(3);
  const [workflow, setWorkflow] = useState(null);

  useEffect(() => {
    loadWorkflow();
  }, [workflowId]);

  const loadWorkflow = async () => {
    try {
      const workflows = await base44.entities.Workflow.filter({ id: workflowId });
      if (workflows.length > 0) {
        const wf = workflows[0];
        setWorkflow(wf);
        
        const deps = wf.spec?.dependencies || [];
        setDependencies(deps);
        
        setExecutionMode(wf.spec?.execution_mode || 'sequential');
        setMaxParallel(wf.spec?.max_parallel || 3);
      }
    } catch (error) {
      console.error('Failed to load workflow:', error);
    }
  };

  const updateExecutionMode = async (mode) => {
    try {
      await base44.entities.Workflow.update(workflowId, {
        spec: {
          ...workflow.spec,
          execution_mode: mode,
          max_parallel: mode === 'parallel' ? maxParallel : 1,
        },
      });
      
      setExecutionMode(mode);
      toast.success(`Execution mode set to ${mode}`);
      onExecutionModeChange?.(mode);
    } catch (error) {
      console.error('Failed to update execution mode:', error);
      toast.error('Failed to update execution mode');
    }
  };

  const updateMaxParallel = async (value) => {
    try {
      await base44.entities.Workflow.update(workflowId, {
        spec: {
          ...workflow.spec,
          max_parallel: value,
        },
      });
      
      setMaxParallel(value);
      toast.success(`Max parallel agents set to ${value}`);
    } catch (error) {
      console.error('Failed to update max parallel:', error);
      toast.error('Failed to update settings');
    }
  };

  const _addDependency = async (agentId, dependsOn) => {
    try {
      const newDeps = [
        ...dependencies,
        { agent_id: agentId, depends_on: dependsOn },
      ];

      await base44.entities.Workflow.update(workflowId, {
        spec: {
          ...workflow.spec,
          dependencies: newDeps,
        },
      });

      setDependencies(newDeps);
      toast.success('Dependency added');
    } catch (error) {
      console.error('Failed to add dependency:', error);
      toast.error('Failed to add dependency');
    }
  };

  const canRunInParallel = (agentId) => {
    return !dependencies.some(dep => dep.agent_id === agentId);
  };

  return (
    <Card className="bg-slate-900 border-slate-800">
      <CardHeader>
        <CardTitle className="text-white flex items-center gap-2">
          <Network className="w-5 h-5 text-green-400" />
          Dependency & Execution Control
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="p-4 bg-slate-950 rounded-lg border border-slate-800">
          <h4 className="text-sm font-medium text-white mb-4">Execution Mode</h4>
          
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-white">Sequential Execution</p>
                <p className="text-xs text-slate-400">Run agents one after another</p>
              </div>
              <Switch
                checked={executionMode === 'sequential'}
                onCheckedChange={() => updateExecutionMode('sequential')}
              />
            </div>

            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-white">Parallel Execution</p>
                <p className="text-xs text-slate-400">Run multiple agents simultaneously</p>
              </div>
              <Switch
                checked={executionMode === 'parallel'}
                onCheckedChange={() => updateExecutionMode('parallel')}
              />
            </div>

            {executionMode === 'parallel' && (
              <div className="pt-2 border-t border-slate-800">
                <label className="text-sm text-slate-400 mb-2 block">
                  Max Parallel Agents: {maxParallel}
                </label>
                <input
                  type="range"
                  min="1"
                  max="10"
                  value={maxParallel}
                  onChange={(e) => updateMaxParallel(parseInt(e.target.value))}
                  className="w-full"
                />
                <div className="flex justify-between text-xs text-slate-500 mt-1">
                  <span>1</span>
                  <span>10</span>
                </div>
              </div>
            )}
          </div>
        </div>

        <div>
          <h4 className="text-sm font-medium text-white mb-3 flex items-center gap-2">
            <Layers className="w-4 h-4 text-blue-400" />
            Dependency Map
          </h4>
          
          <div className="space-y-2">
            {agents.map((agent) => {
              const deps = dependencies.filter(d => d.agent_id === agent.id);
              const canParallel = canRunInParallel(agent.id);
              
              return (
                <div key={agent.id} className="p-3 bg-slate-950 rounded border border-slate-800">
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-sm font-medium text-white">{agent.name}</span>
                        {canParallel && executionMode === 'parallel' && (
                          <Badge className="bg-green-600 text-xs">
                            <PlayCircle className="w-3 h-3 mr-1" />
                            Can run parallel
                          </Badge>
                        )}
                      </div>
                      
                      {deps.length > 0 && (
                        <div className="text-xs text-slate-400">
                          Depends on: {deps.map(d => {
                            const depAgent = agents.find(a => a.id === d.depends_on);
                            return depAgent?.name || 'Unknown';
                          }).join(', ')}
                        </div>
                      )}
                      
                      {deps.length === 0 && (
                        <div className="text-xs text-slate-500">
                          No dependencies
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}

            {agents.length === 0 && (
              <div className="text-center py-6 text-slate-500 text-sm">
                No agents in workflow
              </div>
            )}
          </div>
        </div>

        {executionMode === 'parallel' && dependencies.length > 0 && (
          <div className="p-3 bg-yellow-500/10 border border-yellow-500/20 rounded-lg flex items-start gap-2">
            <AlertCircle className="w-4 h-4 text-yellow-400 mt-0.5" />
            <div className="text-xs text-yellow-400">
              Agents with dependencies will wait for their prerequisites to complete before running
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}