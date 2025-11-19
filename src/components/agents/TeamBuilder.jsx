import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Users, Plus, Trash2, Crown, User } from 'lucide-react';
import { base44 } from '@/api/base44Client';
import { toast } from 'sonner';

export default function TeamBuilder({ agentId }) {
  const [teams, setTeams] = useState([]);
  const [agents, setAgents] = useState([]);
  const [isCreating, setIsCreating] = useState(false);
  const [newTeam, setNewTeam] = useState({
    name: '',
    description: '',
    leader_agent_id: agentId || '',
    member_agent_ids: [],
    collaboration_mode: 'hierarchical'
  });

  useEffect(() => {
    loadData();
  }, [agentId]);

  const loadData = async () => {
    try {
      const [agentData, teamData] = await Promise.all([
        base44.entities.Agent.list(),
        base44.entities.AgentTeam.filter(
          { $or: [{ leader_agent_id: agentId }, { member_agent_ids: { $contains: agentId } }] }
        )
      ]);
      setAgents(agentData);
      setTeams(teamData);
    } catch (error) {
      console.error('Failed to load data:', error);
    }
  };

  const createTeam = async () => {
    if (!newTeam.name || newTeam.member_agent_ids.length === 0) {
      toast.error('Team name and at least one member required');
      return;
    }

    try {
      const user = await base44.auth.me();
      await base44.entities.AgentTeam.create({
        ...newTeam,
        org_id: user.organization?.id || 'org_default'
      });

      toast.success('Team created');
      setIsCreating(false);
      setNewTeam({
        name: '',
        description: '',
        leader_agent_id: agentId || '',
        member_agent_ids: [],
        collaboration_mode: 'hierarchical'
      });
      loadData();
    } catch (error) {
      console.error('Failed to create team:', error);
      toast.error('Failed to create team');
    }
  };

  const deleteTeam = async (teamId) => {
    try {
      await base44.entities.AgentTeam.delete(teamId);
      toast.success('Team disbanded');
      loadData();
    } catch (error) {
      console.error('Failed to delete team:', error);
      toast.error('Failed to disband team');
    }
  };

  const toggleMember = (agentId) => {
    const members = new Set(newTeam.member_agent_ids);
    if (members.has(agentId)) {
      members.delete(agentId);
    } else {
      members.add(agentId);
    }
    setNewTeam({ ...newTeam, member_agent_ids: Array.from(members) });
  };

  return (
    <Card className="bg-slate-900 border-slate-800">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="text-white flex items-center gap-2">
            <Users className="w-5 h-5" />
            Agent Teams
          </CardTitle>
          <Button onClick={() => setIsCreating(!isCreating)} size="sm" className="bg-blue-600 hover:bg-blue-700">
            <Plus className="w-4 h-4 mr-2" />
            Create Team
          </Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {isCreating && (
          <div className="p-4 bg-slate-950 rounded-lg border border-slate-800 space-y-3">
            <Input
              value={newTeam.name}
              onChange={(e) => setNewTeam({ ...newTeam, name: e.target.value })}
              placeholder="Team name"
              className="bg-slate-800 border-slate-700"
            />
            <Textarea
              value={newTeam.description}
              onChange={(e) => setNewTeam({ ...newTeam, description: e.target.value })}
              placeholder="Team description"
              className="bg-slate-800 border-slate-700 resize-none"
              rows={2}
            />
            <Select
              value={newTeam.collaboration_mode}
              onValueChange={(v) => setNewTeam({ ...newTeam, collaboration_mode: v })}
            >
              <SelectTrigger className="bg-slate-800 border-slate-700">
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="bg-slate-800 border-slate-700">
                <SelectItem value="hierarchical">Hierarchical</SelectItem>
                <SelectItem value="consensus">Consensus</SelectItem>
                <SelectItem value="sequential">Sequential</SelectItem>
                <SelectItem value="parallel">Parallel</SelectItem>
              </SelectContent>
            </Select>

            <div className="space-y-2">
              <div className="text-sm text-slate-400">Select team members:</div>
              {agents.filter(a => a.id !== newTeam.leader_agent_id).map((agent) => (
                <div
                  key={agent.id}
                  onClick={() => toggleMember(agent.id)}
                  className={`p-2 rounded-lg border cursor-pointer transition-all ${
                    newTeam.member_agent_ids.includes(agent.id)
                      ? 'bg-blue-900/20 border-blue-500/50'
                      : 'bg-slate-800 border-slate-700 hover:border-slate-600'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-white">{agent.name}</span>
                    <Badge variant="outline" className="text-xs">
                      {agent.config?.provider}
                    </Badge>
                  </div>
                </div>
              ))}
            </div>

            <div className="flex gap-2">
              <Button onClick={createTeam} className="bg-green-600 hover:bg-green-700">
                Create Team
              </Button>
              <Button onClick={() => setIsCreating(false)} variant="outline" className="border-slate-700">
                Cancel
              </Button>
            </div>
          </div>
        )}

        <div className="space-y-3">
          {teams.map((team) => {
            const leader = agents.find(a => a.id === team.leader_agent_id);
            const members = agents.filter(a => team.member_agent_ids?.includes(a.id));

            return (
              <div key={team.id} className="p-4 bg-slate-950 rounded-lg border border-slate-800">
                <div className="flex items-start justify-between mb-2">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-white font-medium">{team.name}</span>
                      <Badge variant="outline" className={
                        team.status === 'active'
                          ? 'bg-green-500/20 text-green-400 border-green-500/30'
                          : 'bg-slate-800 border-slate-700'
                      }>
                        {team.status}
                      </Badge>
                      <Badge variant="outline" className="bg-slate-800 border-slate-700 text-xs">
                        {team.collaboration_mode}
                      </Badge>
                    </div>
                    <p className="text-xs text-slate-400 mb-3">{team.description}</p>
                  </div>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => deleteTeam(team.id)}
                    className="text-red-400 hover:text-red-300"
                  >
                    <Trash2 className="w-3 h-3" />
                  </Button>
                </div>

                <div className="space-y-2">
                  {leader && (
                    <div className="flex items-center gap-2 text-xs">
                      <Crown className="w-3 h-3 text-yellow-400" />
                      <span className="text-slate-400">Leader:</span>
                      <span className="text-white">{leader.name}</span>
                    </div>
                  )}
                  <div className="flex items-center gap-2 text-xs">
                    <User className="w-3 h-3 text-blue-400" />
                    <span className="text-slate-400">Members:</span>
                    <div className="flex flex-wrap gap-1">
                      {members.map(m => (
                        <span key={m.id} className="text-white">{m.name}</span>
                      )).reduce((prev, curr) => [prev, ', ', curr])}
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}