
import React, { useState, useEffect, useCallback } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { Workflow, WorkflowVersion, Agent, Tool } from '@/entities/all';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { 
  Play, 
  Save, 
  GitBranch, 
  Settings, 
  ArrowLeft, 
  Plus,
  Trash2,
  Copy,
  Eye,
  Code,
  Zap,
  Database,
  Mail,
  Globe,
  FileText,
  Brain,
  MessageSquare
} from 'lucide-react';
import { createPageUrl } from '@/utils';
import VisualWorkflowDesigner from '../components/workflows/VisualWorkflowDesigner';
import WorkflowSpecEditor from '../components/workflows/WorkflowSpecEditor';
import VersionHistory from '../components/workflows/VersionHistory';
import { toast } from 'sonner';
import RunMonitor from '../components/runs/RunMonitor'; // New component for live run feedback
import CollaborationPanel from '../components/agents/CollaborationPanel';
import OptimizationInsights from '../components/workflows/OptimizationInsights';

const NODE_TYPES = {
  trigger: { icon: Zap, color: 'from-green-500 to-emerald-600', label: 'Trigger' },
  agent: { icon: Brain, color: 'from-blue-500 to-cyan-600', label: 'AI Agent' },
  tool: { icon: Settings, color: 'from-purple-500 to-violet-600', label: 'Tool' },
  condition: { icon: GitBranch, color: 'from-yellow-500 to-orange-600', label: 'Condition' },
  data: { icon: Database, color: 'from-indigo-500 to-blue-600', label: 'Data' },
  notification: { icon: MessageSquare, color: 'from-pink-500 to-rose-600', label: 'Notify' },
  webhook: { icon: Globe, color: 'from-teal-500 to-cyan-600', label: 'Webhook' },
  email: { icon: Mail, color: 'from-red-500 to-pink-600', label: 'Email' },
  output: { icon: FileText, color: 'from-slate-500 to-gray-600', label: 'Output' }
};

export default function WorkflowDetail() {
  const [searchParams] = useSearchParams();
  const workflowId = searchParams.get('id');
  const isNew = workflowId === 'new';
  
  const [workflow, setWorkflow] = useState(null);
  const [agents, setAgents] = useState([]);
  const [tools, setTools] = useState([]);
  const [versions, setVersions] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('designer');
  const [isSaving, setIsSaving] = useState(false);
  const [isRunning, setIsRunning] = useState(false);
  const [activeRun, setActiveRun] = useState(null); // State to hold the current run simulation
  const [isRunMonitorOpen, setIsRunMonitorOpen] = useState(false);
  
  // Workflow editor state
  const [workflowData, setWorkflowData] = useState({
    name: '',
    description: '',
    version: '1.0.0',
    spec: {
      nodes: [
        {
          id: 'trigger_1',
          type: 'trigger',
          position: { x: 100, y: 100 },
          data: { label: 'Workflow Start', config: { trigger_type: 'manual' } }
        }
      ],
      edges: []
    }
  });

  useEffect(() => {
    const loadData = async () => {
      setIsLoading(true);
      try {
        const [agentData, toolData] = await Promise.all([
          Agent.list(),
          Tool.list()
        ]);
        
        setAgents(agentData);
        setTools(toolData);
        
        if (!isNew && workflowId) {
          const [workflowData, versionData] = await Promise.all([
            Workflow.get(workflowId),
            WorkflowVersion.filter({ workflow_id: workflowId }, '-created_date')
          ]);
          
          setWorkflow(workflowData);
          setVersions(versionData);
          setWorkflowData({
            name: workflowData.name,
            description: workflowData.description,
            version: workflowData.version,
            spec: workflowData.spec
          });
        }
      } catch (error) {
        console.error('Failed to load workflow data:', error);
        toast.error('Failed to load workflow');
      } finally {
        setIsLoading(false);
      }
    };
    
    loadData();
  }, [workflowId, isNew]);

  const handleSave = async () => {
    if (!workflowData.name.trim()) {
      toast.error('Please enter a workflow name');
      return;
    }

    setIsSaving(true);
    try {
      const saveData = {
        name: workflowData.name,
        description: workflowData.description,
        version: workflowData.version,
        spec: workflowData.spec,
        org_id: 'org_acme'
      };

      let savedWorkflow;
      if (isNew) {
        savedWorkflow = await Workflow.create(saveData);
        // Redirect to edit mode
        window.history.replaceState(null, '', createPageUrl(`WorkflowDetail?id=${savedWorkflow.id}`));
      } else {
        savedWorkflow = await Workflow.update(workflowId, saveData);
        
        // Create version history entry
        await WorkflowVersion.create({
          workflow_id: workflowId,
          version: workflowData.version,
          spec: workflowData.spec,
          changelog: `Updated workflow configuration`,
          is_active: true,
          org_id: 'org_acme'
        });
      }
      
      setWorkflow(savedWorkflow);
      toast.success('Workflow saved successfully');
    } catch (error) {
      console.error('Failed to save workflow:', error);
      toast.error('Failed to save workflow');
    } finally {
      setIsSaving(false);
    }
  };

  const handleRun = async () => {
    if (!workflow?.id) {
      toast.error('Please save the workflow first');
      return;
    }

    toast.info('Starting workflow execution...');
    setIsRunning(true);
    setIsRunMonitorOpen(true);

    // --- Start of Simulated Run ---
    const runSteps = workflowData.spec.nodes.map(node => ({
      id: node.id,
      label: node.data.label,
      type: node.type,
      status: 'pending',
      output: null,
    }));

    setActiveRun({ status: 'running', steps: runSteps });

    for (let i = 0; i < runSteps.length; i++) {
      await new Promise(resolve => setTimeout(resolve, 750)); // Simulate network/processing time
      
      setActiveRun(prev => {
        if (!prev) return prev; // Guard against null if run is closed prematurely
        const newSteps = [...prev.steps];
        newSteps[i] = { ...newSteps[i], status: 'running' };
        return { ...prev, steps: newSteps };
      });

      await new Promise(resolve => setTimeout(resolve, 1500)); // Simulate work being done

      setActiveRun(prev => {
        if (!prev) return prev; // Guard against null if run is closed prematurely
        const newSteps = [...prev.steps];
        const success = Math.random() > 0.1; // 90% success rate
        newSteps[i] = {
          ...newSteps[i],
          status: success ? 'completed' : 'failed',
          output: success ? `Processed data for ${newSteps[i].label}` : 'An unexpected error occurred.',
        };
        return { ...prev, steps: newSteps };
      });
    }

    setActiveRun(prev => prev ? { ...prev, status: 'completed' } : null);
    // --- End of Simulated Run ---
    
    setIsRunning(false);
    toast.success('Workflow execution finished.');
  };

  const handleNodeAdd = (nodeType, position) => {
    const nodeId = `${nodeType}_${Date.now()}`;
    const newNode = {
      id: nodeId,
      type: nodeType,
      position,
      data: { 
        label: NODE_TYPES[nodeType].label,
        config: getDefaultNodeConfig(nodeType)
      }
    };
    
    setWorkflowData(prev => ({
      ...prev,
      spec: {
        ...prev.spec,
        nodes: [...prev.spec.nodes, newNode]
      }
    }));
  };

  const getDefaultNodeConfig = (nodeType) => {
    switch (nodeType) {
      case 'agent':
        return { agent_id: agents[0]?.id || '', temperature: 0.7, max_tokens: 1000 };
      case 'tool':
        return { tool_id: tools[0]?.id || '', timeout: 30 };
      case 'condition':
        return { expression: 'true', true_path: null, false_path: null };
      case 'webhook':
        return { url: '', method: 'POST', headers: {} };
      case 'email':
        return { to: '', subject: 'Workflow Notification', template: '' };
      default:
        return {};
    }
  };

  const onUpdateSpec = useCallback((newSpec) => {
    setWorkflowData(prev => ({...prev, spec: newSpec}));
  }, []);

  if (isLoading) {
    return (
      <div className="space-y-8 p-4 lg:p-6 bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 min-h-screen">
        <div className="h-8 bg-slate-800 rounded animate-pulse"></div>
        <div className="h-96 bg-slate-800 rounded animate-pulse"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6 p-4 lg:p-6 bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 min-h-screen">
      {/* Header Section */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <Link to={createPageUrl('Workflows')} className="inline-flex items-center gap-2 text-slate-400 hover:text-white">
          <ArrowLeft className="w-4 h-4" />
          Back to Workflows
        </Link>
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 w-full mt-4 sm:mt-0">
          <div>
            <Input 
              value={workflowData.name}
              onChange={(e) => setWorkflowData(prev => ({...prev, name: e.target.value}))}
              placeholder="Untitled Workflow"
              className="text-2xl font-bold bg-transparent border-0 ring-0 focus:ring-0 p-0 h-auto text-white placeholder:text-slate-500"
            />
            <Textarea
              value={workflowData.description}
              onChange={(e) => setWorkflowData(prev => ({...prev, description: e.target.value}))}
              placeholder="Add a description..."
              className="text-slate-400 bg-transparent border-0 ring-0 focus:ring-0 p-0 mt-1 resize-none h-auto min-h-[20px]"
              rows={1}
            />
          </div>
          <div className="flex items-center gap-2 flex-shrink-0 mt-4 sm:mt-0">
            <Button variant="outline" className="text-white border-slate-700 hover:bg-slate-800" onClick={handleSave} disabled={isSaving}>
              <Save className="w-4 h-4 mr-2" /> {isSaving ? 'Saving...' : 'Save'}
            </Button>
            <Button className="bg-blue-600 hover:bg-blue-700" onClick={handleRun} disabled={isRunning || !workflow?.id}>
              <Play className="w-4 h-4 mr-2" /> {isRunning ? 'Running...' : 'Run'}
            </Button>
          </div>
        </div>
      </div>
      
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          {/* Workflow Designer */}
          <Card className="h-[70vh] flex flex-col">
            <CardHeader>
              <CardTitle>Workflow Design</CardTitle>
            </CardHeader>
            <CardContent className="flex-grow p-0">
              <VisualWorkflowDesigner
                spec={workflowData.spec}
                onSpecChange={onUpdateSpec}
                className="h-full"
                nodeTypes={NODE_TYPES}
                agents={agents}
                tools={tools}
              />
            </CardContent>
          </Card>
        </div>
        
        <div className="space-y-6">
          <OptimizationInsights workflow={workflow} />
          <CollaborationPanel workflowId={workflowId} agents={agents} />
        </div>
      </div>

      <RunMonitor 
        isOpen={isRunMonitorOpen}
        onClose={() => {
          setIsRunMonitorOpen(false);
          setActiveRun(null); // Clear active run when closing monitor
        }}
        run={activeRun}
      />
    </div>
  );
}
