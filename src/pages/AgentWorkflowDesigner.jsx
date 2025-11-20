import React, { useState, useEffect } from 'react';
import { Agent, Skill, SkillInstallation } from '@/entities/all';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Save, Play, ArrowLeft } from 'lucide-react';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import AgentFlowCanvas from '../components/agent-workflows/AgentFlowCanvas';
import NodePalette from '../components/agent-workflows/NodePalette';
import { toast } from 'sonner';

export default function AgentWorkflowDesigner() {
  const [agents, setAgents] = useState([]);
  const [skills, setSkills] = useState([]);
  const [installations, setInstallations] = useState([]);
  const [workflowName, setWorkflowName] = useState('Untitled Agent Workflow');
  const [nodes, setNodes] = useState([]);
  const [connections, setConnections] = useState([]);
  const [selectedNode, setSelectedNode] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const [agentData, skillData, installData] = await Promise.all([
        Agent.list(),
        Skill.list(),
        SkillInstallation.list()
      ]);
      setAgents(agentData);
      setSkills(skillData);
      setInstallations(installData);
    } catch (error) {
      console.error('Failed to load data:', error);
      toast.error('Failed to load resources');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSave = () => {
    const workflow = {
      name: workflowName,
      nodes,
      connections,
      created_at: new Date().toISOString()
    };
    
    localStorage.setItem('agent_workflow', JSON.stringify(workflow));
    toast.success('Workflow saved');
  };

  const handleRun = async () => {
    toast.info('Simulating workflow execution...');
    // Workflow execution logic would go here
    setTimeout(() => {
      toast.success('Workflow completed successfully');
    }, 2000);
  };

  if (isLoading) {
    return <div className="text-center py-12 text-slate-400">Loading designer...</div>;
  }

  return (
    <div className="h-screen flex flex-col bg-slate-950">
      <div className="bg-slate-900 border-b border-slate-800 p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link to={createPageUrl('Agents')} className="text-slate-400 hover:text-white">
              <ArrowLeft className="w-5 h-5" />
            </Link>
            <Input
              value={workflowName}
              onChange={(e) => setWorkflowName(e.target.value)}
              className="text-lg font-semibold bg-transparent border-0 text-white w-64"
            />
          </div>
          <div className="flex gap-2">
            <Button variant="outline" onClick={handleSave} className="border-slate-700">
              <Save className="w-4 h-4 mr-2" />
              Save
            </Button>
            <Button onClick={handleRun} className="bg-blue-600 hover:bg-blue-700">
              <Play className="w-4 h-4 mr-2" />
              Run
            </Button>
          </div>
        </div>
      </div>

      <div className="flex-1 flex overflow-hidden">
        <NodePalette 
          agents={agents}
          skills={skills}
          installations={installations}
        />
        
        <AgentFlowCanvas
          nodes={nodes}
          connections={connections}
          agents={agents}
          skills={skills}
          selectedNode={selectedNode}
          onNodesChange={setNodes}
          onConnectionsChange={setConnections}
          onNodeSelect={setSelectedNode}
        />
      </div>
    </div>
  );
}