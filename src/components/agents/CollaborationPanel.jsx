import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Users, Brain } from 'lucide-react';
import { base44 } from '@/api/base44Client';
import { toast } from 'sonner';

const STRATEGY_CONFIG = {
  sequential: { label: 'Sequential', description: 'Agents execute one after another' },
  parallel: { label: 'Parallel', description: 'Agents work simultaneously' },
  consensus: { label: 'Consensus', description: 'Agents vote on decisions' },
  hierarchical: { label: 'Hierarchical', description: 'Coordinator delegates to agents' }
};

export default function CollaborationPanel({ workflowId, agents }) {
  const [collaborations, setCollaborations] = useState([]);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    loadCollaborations();
  }, [workflowId]);

  const loadCollaborations = async () => {
    try {
      const data = await base44.entities.AgentCollaboration.filter({ workflow_id: workflowId });
      setCollaborations(data);
    } catch (error) {
      console.error('Failed to load collaborations:', error);
    }
  };

  const createCollaboration = async (strategy) => {
    setIsLoading(true);
    try {
      const user = await base44.auth.me();
      const selectedAgents = agents.filter(a => a.status === 'active').slice(0, 3);
      
      await base44.entities.AgentCollaboration.create({
        name: `${strategy} Collaboration`,
        workflow_id: workflowId,
        participant_agents: selectedAgents.map(a => a.id),
        coordinator_agent: selectedAgents[0]?.id,
        strategy,
        state: 'active',
        shared_context: {},
        decisions: [],
        org_id: user.organization?.id || 'org_default'
      });

      toast.success('Collaboration session created');
      loadCollaborations();
    } catch (error) {
      console.error('Failed to create collaboration:', error);
      toast.error('Failed to create collaboration');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Card className="bg-slate-900 border-slate-800">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="text-white flex items-center gap-2">
            <Users className="w-5 h-5" />
            Agent Collaboration
          </CardTitle>
          <Select onValueChange={createCollaboration} disabled={isLoading}>
            <SelectTrigger className="w-40 bg-slate-800 border-slate-700">
              <SelectValue placeholder="New Session" />
            </SelectTrigger>
            <SelectContent className="bg-slate-800 border-slate-700">
              {Object.entries(STRATEGY_CONFIG).map(([key, config]) => (
                <SelectItem key={key} value={key}>{config.label}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </CardHeader>
      <CardContent>
        {collaborations.length === 0 ? (
          <div className="text-center py-8 text-slate-400">
            <Brain className="w-12 h-12 mx-auto mb-3 text-slate-600" />
            <p>No active collaborations</p>
          </div>
        ) : (
          <div className="space-y-3">
            {collaborations.map((collab) => (
              <div key={collab.id} className="p-3 bg-slate-950 rounded-lg border border-slate-800">
                <div className="flex items-start justify-between mb-2">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-white font-medium">{collab.name}</span>
                      <Badge variant="outline" className="bg-blue-500/20 text-blue-400 border-blue-500/30 text-xs">
                        {collab.strategy}
                      </Badge>
                      <Badge variant="outline" className={
                        collab.state === 'active' ? 'bg-green-500/20 text-green-400 border-green-500/30' :
                        collab.state === 'completed' ? 'bg-slate-500/20 text-slate-400 border-slate-500/30' :
                        'bg-red-500/20 text-red-400 border-red-500/30'
                      }>
                        {collab.state}
                      </Badge>
                    </div>
                    <div className="text-xs text-slate-400">
                      {collab.participant_agents?.length || 0} agents • ${(collab.total_cost_cents / 100).toFixed(2)} cost
                    </div>
                  </div>
                </div>
                {collab.decisions && collab.decisions.length > 0 && (
                  <div className="mt-2 text-xs text-slate-500">
                    {collab.decisions.length} decision{collab.decisions.length !== 1 ? 's' : ''} made
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}