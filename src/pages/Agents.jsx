
import { useState, useEffect, useCallback } from 'react';
import { Agent } from '@/entities/Agent';
import AgentTable from '../components/agents/AgentTable';
import AgentForm from '../components/agents/AgentForm';
import { Button } from '@/components/ui/button';
import { PlusCircle } from 'lucide-react';
import { useAuth } from '@/components/contexts/AuthContext'; // Corrected import path
import { RBACGuard } from '../components/shared/RBACGuard';

export default function Agents() {
  const [agents, setAgents] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [selectedAgent, setSelectedAgent] = useState(null);

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
  }

  const handleSave = () => {
    setIsFormOpen(false);
    loadAgents();
  };

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

      <AgentTable
        agents={agents}
        isLoading={isLoading}
        onEdit={handleEdit}
        onDelete={handleDelete}
        canEdit={hasPermission('agent.edit')}
        canDelete={hasPermission('agent.delete')}
      />

      <AgentForm
        open={isFormOpen}
        onOpenChange={setIsFormOpen}
        agent={selectedAgent}
        onSave={handleSave}
      />
    </div>
  );
}
