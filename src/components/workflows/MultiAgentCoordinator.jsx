import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Users, Play, Pause, CheckCircle, AlertCircle, Activity } from 'lucide-react';
import { AgentCollaboration } from '@/entities/all';
import { base44 } from '@/api/base44Client';
import { toast } from 'sonner';

export default function MultiAgentCoordinator({ workflowId, agents, onRefresh }) {
  const [collaborations, setCollaborations] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (workflowId) {
      loadCollaborations();
    }
  }, [workflowId]);

  const loadCollaborations = async () => {
    try {
      const data = await AgentCollaboration.filter({ workflow_id: workflowId }, '-created_date');
      setCollaborations(data);
    } catch (error) {
      console.error('Failed to load collaborations:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const createCollaboration = async () => {
    try {
      const user = await base44.auth.me();
      const participantAgentIds = agents.slice(0, 2).map(a => a.id);
      
      if (participantAgentIds.length < 2) {
        toast.error('At least 2 agents are required for collaboration');
        return;
      }

      await AgentCollaboration.create({
        name: `Multi-Agent Task ${collaborations.length + 1}`,
        workflow_id: workflowId,
        participant_agents: participantAgentIds,
        coordinator_agent: participantAgentIds[0],
        strategy: 'sequential',
        state: 'active',
        shared_context: {},
        decisions: [],
        total_cost_cents: 0,
        org_id: user.organization.id
      });

      toast.success('Collaboration session created');
      loadCollaborations();
      onRefresh?.();
    } catch (error) {
      console.error('Failed to create collaboration:', error);
      toast.error('Failed to create collaboration');
    }
  };

  const updateCollaborationState = async (collabId, newState) => {
    try {
      await AgentCollaboration.update(collabId, { state: newState });
      toast.success(`Collaboration ${newState}`);
      loadCollaborations();
    } catch (error) {
      console.error('Failed to update collaboration:', error);
      toast.error('Failed to update collaboration');
    }
  };

  const getStateIcon = (state) => {
    switch (state) {
      case 'active': return <Activity className="w-4 h-4 text-green-400" />;
      case 'paused': return <Pause className="w-4 h-4 text-yellow-400" />;
      case 'completed': return <CheckCircle className="w-4 h-4 text-blue-400" />;
      case 'failed': return <AlertCircle className="w-4 h-4 text-red-400" />;
      default: return null;
    }
  };

  const getStateColor = (state) => {
    switch (state) {
      case 'active': return 'bg-green-500/20 text-green-400 border-green-500/30';
      case 'paused': return 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30';
      case 'completed': return 'bg-blue-500/20 text-blue-400 border-blue-500/30';
      case 'failed': return 'bg-red-500/20 text-red-400 border-red-500/30';
      default: return 'bg-slate-500/20 text-slate-400 border-slate-500/30';
    }
  };

  if (isLoading) {
    return (
      <Card className="bg-slate-900 border-slate-800">
        <CardContent className="py-8 text-center text-slate-400">
          Loading collaborations...
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="bg-slate-900 border-slate-800">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="text-white flex items-center gap-2">
            <Users className="w-5 h-5 text-purple-400" />
            Multi-Agent Coordination
          </CardTitle>
          <Button onClick={createCollaboration} size="sm" className="bg-purple-600 hover:bg-purple-700">
            <Play className="w-3 h-3 mr-2" />
            New Session
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        {collaborations.length === 0 ? (
          <div className="text-center py-8 text-slate-400">
            No active collaborations. Create a session to coordinate multiple agents.
          </div>
        ) : (
          <div className="space-y-3">
            {collaborations.map(collab => {
              const agentNames = collab.participant_agents
                .map(id => agents.find(a => a.id === id)?.name)
                .filter(Boolean)
                .join(', ');

              return (
                <div key={collab.id} className="p-3 bg-slate-950 rounded-lg border border-slate-800">
                  <div className="flex items-start justify-between mb-2">
                    <div>
                      <div className="text-sm font-medium text-white">{collab.name}</div>
                      <div className="text-xs text-slate-400">{agentNames}</div>
                    </div>
                    <Badge variant="outline" className={getStateColor(collab.state)}>
                      {getStateIcon(collab.state)}
                      <span className="ml-1">{collab.state}</span>
                    </Badge>
                  </div>

                  <div className="flex items-center gap-2 text-xs text-slate-500 mb-2">
                    <Badge variant="outline" className="bg-slate-800 text-slate-400 border-slate-700 capitalize">
                      {collab.strategy}
                    </Badge>
                    {collab.decisions && collab.decisions.length > 0 && (
                      <span>{collab.decisions.length} decisions</span>
                    )}
                    {collab.total_cost_cents > 0 && (
                      <span>${(collab.total_cost_cents / 100).toFixed(2)}</span>
                    )}
                  </div>

                  <div className="flex gap-2">
                    {collab.state === 'active' && (
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => updateCollaborationState(collab.id, 'paused')}
                        className="text-xs border-slate-700"
                      >
                        <Pause className="w-3 h-3 mr-1" />
                        Pause
                      </Button>
                    )}
                    {collab.state === 'paused' && (
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => updateCollaborationState(collab.id, 'active')}
                        className="text-xs border-slate-700"
                      >
                        <Play className="w-3 h-3 mr-1" />
                        Resume
                      </Button>
                    )}
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