import React, { useState, useEffect, useCallback } from 'react';
import { Agent } from '@/entities/Agent';
import { Button } from '@/components/ui/button';
import { PlusCircle, Bot, Search } from 'lucide-react';
import { useAuth } from '@/components/contexts/AuthContext';
import { RBACGuard } from '../components/shared/RBACGuard';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import AgentForm from '../components/agents/AgentForm';
import { EmptyState } from '../components/shared/EmptyState';

const statusColors = {
  active: 'bg-green-500/20 text-green-400 border-green-500/30',
  inactive: 'bg-slate-500/20 text-slate-400 border-slate-500/30',
  deprecated: 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30',
  error: 'bg-red-500/20 text-red-400 border-red-500/30',
};

export default function Agents() {
  const [agents, setAgents] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [selectedAgent, setSelectedAgent] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');

  const { hasPermission } = useAuth();

  const loadAgents = useCallback(async () => {
    setIsLoading(true);
    try {
      const agentData = await Agent.list('-updated_date');
      setAgents(agentData);
    } catch (error) {
      console.error("Failed to load agents:", error);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadAgents();
  }, [loadAgents]);

  const handleCreate = () => {
    setSelectedAgent(null);
    setIsFormOpen(true);
  };

  const handleEdit = (agent) => {
    setSelectedAgent(agent);
    setIsFormOpen(true);
  };
  
  const handleDelete = async (agentId) => {
    if (confirm('Are you sure you want to delete this agent?')) {
        try {
            await Agent.delete(agentId);
            loadAgents();
        } catch(error) {
            console.error("Failed to delete agent:", error);
        }
    }
  };

  const handleSave = () => {
    setIsFormOpen(false);
    loadAgents();
  };

  const filteredAgents = agents.filter(agent => 
    agent.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div>
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold text-white">Agent Management</h1>
          <p className="text-slate-400">Create, configure, and monitor your AI agents.</p>
        </div>
        <RBACGuard permission="agent.create">
          <Button onClick={handleCreate} className="bg-blue-600 hover:bg-blue-700 text-white">
            <PlusCircle className="mr-2 h-4 w-4" />
            Create Agent
          </Button>
        </RBACGuard>
      </div>
      
      <div className="mb-6">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500" />
          <Input 
            placeholder="Search agents..."
            className="bg-slate-800 border-slate-700 pl-9 w-full md:w-1/3"
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
          />
        </div>
      </div>

      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {Array(3).fill(0).map((_, i) => <Skeleton key={i} className="h-48 w-full bg-slate-800" />)}
        </div>
      ) : filteredAgents.length === 0 ? (
        <EmptyState 
          icon={Bot}
          title="No Agents Found"
          description="Get started by creating your first AI agent. Agents can be configured to use different models and tools."
          actionText="Create Agent"
          onAction={handleCreate}
        />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredAgents.map(agent => (
            <Link to={createPageUrl(`AgentDetail?id=${agent.id}`)} key={agent.id}>
              <Card className="bg-slate-900 border-slate-800 hover:border-blue-600/50 transition-all duration-300 transform hover:-translate-y-1">
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-slate-800 rounded-lg flex items-center justify-center">
                          <Bot className="w-5 h-5 text-blue-400" />
                      </div>
                      <div>
                          <CardTitle className="text-white text-lg">{agent.name}</CardTitle>
                          <p className="text-sm text-slate-500 font-mono">v{agent.version}</p>
                      </div>
                    </div>
                    <Badge variant="outline" className={`capitalize ${statusColors[agent.status]}`}>{agent.status}</Badge>
                  </div>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-slate-400">
                    Provider: <span className="font-semibold text-slate-300">{agent.config.provider}</span>
                  </p>
                  <p className="text-sm text-slate-400">
                    Model: <span className="font-semibold text-slate-300">{agent.config.model}</span>
                  </p>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      )}

      <AgentForm
        open={isFormOpen}
        onOpenChange={setIsFormOpen}
        agent={selectedAgent}
        onSave={handleSave}
      />
    </div>
  );
}