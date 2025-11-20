import React, { useState, useEffect, useCallback } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { Workflow, WorkflowVersion, Agent, Tool, Audit } from '@/entities/all'; // Added Audit entity
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
import VersionManager from '../components/workflows/VersionManager'; // Replaced VersionHistory with VersionManager
import { toast } from 'sonner';
import RunMonitor from '../components/runs/RunMonitor'; // New component for live run feedback
import CollaborationPanel from '../components/agents/CollaborationPanel';
import OptimizationInsights from '../components/workflows/OptimizationInsights';
import OptimizationSettings from '../components/workflows/OptimizationSettings';
import SaveAsTemplate from '../components/workflows/SaveAsTemplate';
import MultiAgentCoordinator from '../components/workflows/MultiAgentCoordinator';

const NODE_TYPES = {
  trigger: { icon: Zap, color: 'from-green-500 to-emerald-600', label: 'Trigger' },
  agent: { icon: Brain, color: 'from-blue-500 to-cyan-600', label: 'AI Agent' },
  tool: { icon: Settings, color: 'from-purple-500 to-violet-600', label: 'Tool' },
  condition: { icon: GitBranch, color: 'from-yellow-500 to-orange-600', label: 'Condition' },
  data: { icon: Database, color: 'from-indigo-500 to-blue-600', label: 'Data' },
  notification: { icon: MessageSquare, color: 'from-pink-500 to-rose-600', label: 'Notify' },
  webhook: { icon: Globe, color: 'from-teal-500 to-cyan-600', label: 'Webhook' },
  email: { icon: Mail, color: 'from-red-500 to-pink-600', label: 'Email' },
  output: { icon: FileText, color: 'from-slate-500 to-gray-600', label: 'Output' },
  agent_collaboration: { icon: MessageSquare, color: 'from-purple-500 to-fuchsia-600', label: 'Agent Collaboration' }
};

// Mock base44 for auth, as it's not imported. In a real app, this would be from a context or a global object.
// Assuming base44.auth.me() exists and returns user object with email and organization.id
const base44 = {
  auth: {
    me: async () => ({
      email: 'mock_user@example.com',
      organization: { id: 'org_acme' },
    }),
  },
};

export default function WorkflowDetail() {
  const [searchParams] = useSearchParams();
  const workflowId = searchParams.get('id');
  const isNew = workflowId === 'new';

  const [workflow, setWorkflow] = useState(null); // Full workflow object (from DB)
  const [agents, setAgents] = useState([]);
  const [tools, setTools] = useState([]);
  const [versions, setVersions] = useState([]); // List of workflow versions
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('designer'); // For controlling active tab
  const [isSaving, setIsSaving] = useState(false);
  const [isRunning, setIsRunning] = useState(false);
  const [activeRun, setActiveRun] = useState(null); // State to hold the current run simulation
  const [isRunMonitorOpen, setIsRunMonitorOpen] = useState(false);
  const [saveAsTemplateOpen, setSaveAsTemplateOpen] = useState(false);

  // Workflow editor state (what's currently being edited)
  const [workflowData, setWorkflowData] = useState({
    name: '',
    description: '',
    version: '1.0.0', // Initial version for new workflows
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

  // Callback to load workflow and its versions
  const loadWorkflowAndVersions = useCallback(async (currentWorkflowId = workflowId) => {
    if (currentWorkflowId && currentWorkflowId !== 'new') {
      try {
        const [workflowDataResponse, versionDataResponse] = await Promise.all([
          Workflow.get(currentWorkflowId),
          WorkflowVersion.filter({ workflow_id: currentWorkflowId }, '-created_date')
        ]);

        setWorkflow(workflowDataResponse);
        setVersions(versionDataResponse);
        setWorkflowData({
          name: workflowDataResponse.name,
          description: workflowDataResponse.description,
          version: workflowDataResponse.version,
          spec: workflowDataResponse.spec
        });
      } catch (error) {
        console.error('Failed to load specific workflow or versions:', error);
        toast.error('Failed to load workflow details or versions.');
      }
    } else {
      // Reset workflow data for a 'new' workflow
      setWorkflow(null);
      setVersions([]);
      setWorkflowData({
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
    }
  }, [workflowId]);

  // Initial data loading (agents, tools, and then the specific workflow)
  useEffect(() => {
    const loadInitialData = async () => {
      setIsLoading(true);
      try {
        const [agentData, toolData] = await Promise.all([
          Agent.list(),
          Tool.list()
        ]);

        setAgents(agentData);
        setTools(toolData);
        await loadWorkflowAndVersions(); // Load specific workflow after basic data
      } catch (error) {
        console.error('Failed to load initial data (agents/tools/workflow):', error);
        toast.error('Failed to load initial data');
      } finally {
        setIsLoading(false);
      }
    };

    loadInitialData();
  }, [workflowId, isNew, loadWorkflowAndVersions]);

  const saveWorkflow = async () => {
    if (!workflowData.name.trim()) {
      toast.error('Please enter a workflow name');
      return;
    }

    setIsSaving(true);
    try {
      let userDetails = null;
      try {
        userDetails = await base44.auth.me(); // Get user details for audit and versioning
      } catch (authError) {
        console.warn('Could not retrieve user details for audit/versioning, using default:', authError);
        userDetails = { email: 'system@example.com', organization: { id: 'org_acme' } }; // Fallback user
      }
      const userEmail = userDetails?.email || 'unknown@example.com';
      const userOrgId = userDetails?.organization?.id || 'org_acme'; // Default org_acme as in existing code

      const saveData = {
        name: workflowData.name,
        description: workflowData.description,
        spec: workflowData.spec,
        org_id: userOrgId
      };

      let currentWorkflowState = workflow; // Use current workflow state for versioning/audit

      if (isNew || !currentWorkflowState) {
        // Logic for creating a brand new workflow
        const createdWorkflow = await Workflow.create({
          ...saveData,
          version: '1.0.0' // Initial version for a new workflow
        });
        // Update URL to reflect the new workflow's ID
        window.history.replaceState(null, '', createPageUrl(`WorkflowDetail?id=${createdWorkflow.id}`));
        setWorkflow(createdWorkflow); // Update local workflow state
        toast.success('Workflow created successfully');
        await loadWorkflowAndVersions(createdWorkflow.id); // Re-fetch all data with the new workflow ID
      } else {
        // Logic for updating an existing workflow
        if (!currentWorkflowState.id) {
          toast.error('Workflow ID missing for update operation.');
          setIsSaving(false);
          return;
        }

        // Create version snapshot before saving the main workflow
        await WorkflowVersion.create({
          workflow_id: currentWorkflowState.id,
          version: currentWorkflowState.version, // Use the current workflow's version
          spec: currentWorkflowState.spec,     // Use the current workflow's spec
          changelog: 'Manual save',
          created_by: userEmail,
          org_id: userOrgId,
          is_active: true // Mark as active version
        });

        // Increment workflow's patch version (e.g., 1.0.0 -> 1.0.1)
        const parts = currentWorkflowState.version.split('.');
        parts[2] = String(Number(parts[2]) + 1);
        const newVersion = parts.join('.');

        const updateData = {
          ...saveData,
          version: newVersion // Apply the new version
        };

        const updatedWorkflow = await Workflow.update(currentWorkflowState.id, updateData);

        // Create audit record for the workflow update
        await Audit.create({
          actor: userEmail,
          action: 'workflow.update',
          entity: 'Workflow',
          entity_id: currentWorkflowState.id,
          before: { version: currentWorkflowState.version, name: currentWorkflowState.name, description: currentWorkflowState.description },
          after: { version: newVersion, name: updatedWorkflow.name, description: updatedWorkflow.description },
          org_id: userOrgId
        });

        setWorkflow(updatedWorkflow); // Update local workflow state with the new version
        setWorkflowData(prev => ({
          ...prev,
          version: newVersion // Also update the editor's version state
        }));
        toast.success('Workflow saved successfully');
        await loadWorkflowAndVersions(currentWorkflowState.id); // Reload versions to reflect the new snapshot
      }
    } catch (error) {
      console.error('Failed to save workflow:', error);
      toast.error('Failed to save workflow');
    } finally {
      setIsSaving(false);
    }
  };

  const handleRun = async () => {
    // Workflow must be saved (have an ID) to be run
    if (!workflow?.id) {
      toast.error('Please save the workflow first before running it.');
      return;
    }

    toast.info('Starting workflow execution...');
    setIsRunning(true);
    setIsRunMonitorOpen(true); // Open the run monitor overlay

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
      if (!isRunMonitorOpen) break; // Allow early exit if monitor is closed prematurely

      await new Promise(resolve => setTimeout(resolve, 750)); // Simulate network/processing time

      setActiveRun(prev => {
        if (!prev) return prev;
        const newSteps = [...prev.steps];
        newSteps[i] = { ...newSteps[i], status: 'running' };
        return { ...prev, steps: newSteps };
      });

      await new Promise(resolve => setTimeout(resolve, 1500)); // Simulate work being done

      setActiveRun(prev => {
        if (!prev) return prev;
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

    setActiveRun(prev => {
      if (prev) {
        return { ...prev, status: 'completed' };
      }
      return null;
    });
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
      case 'agent_collaboration':
        return { 
          collaboration_type: 'trigger', 
          target_agent_id: agents[0]?.id || '', 
          context_mapping: {},
          security_level: 'encrypted',
          coordination_strategy: 'sequential'
        };
      default:
        return {};
    }
  };

  const onUpdateSpec = useCallback((newSpec) => {
    setWorkflowData(prev => ({ ...prev, spec: newSpec }));
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
              onChange={(e) => setWorkflowData(prev => ({ ...prev, name: e.target.value }))}
              placeholder="Untitled Workflow"
              className="text-2xl font-bold bg-transparent border-0 ring-0 focus:ring-0 p-0 h-auto text-white placeholder:text-slate-500"
            />
            <Textarea
              value={workflowData.description}
              onChange={(e) => setWorkflowData(prev => ({ ...prev, description: e.target.value }))}
              placeholder="Add a description..."
              className="text-slate-400 bg-transparent border-0 ring-0 focus:ring-0 p-0 mt-1 resize-none h-auto min-h-[20px]"
              rows={1}
            />
            {workflow && <Badge variant="secondary" className="mt-2 text-xs">Version: {workflow.version}</Badge>}
          </div>
          <div className="flex items-center gap-2 flex-shrink-0 mt-4 sm:mt-0">
            <Button variant="outline" className="text-white border-slate-700 hover:bg-slate-800" onClick={saveWorkflow} disabled={isSaving}>
              <Save className="w-4 h-4 mr-2" /> {isSaving ? 'Saving...' : 'Save'}
            </Button>
            {workflow && (
              <Button variant="outline" className="text-white border-slate-700 hover:bg-slate-800" onClick={() => setSaveAsTemplateOpen(true)}>
                <Copy className="w-4 h-4 mr-2" /> Save as Template
              </Button>
            )}
            <Button className="bg-blue-600 hover:bg-blue-700" onClick={handleRun} disabled={isRunning || !workflow?.id}>
              <Play className="w-4 h-4 mr-2" /> {isRunning ? 'Running...' : 'Run'}
            </Button>
          </div>
        </div>
      </div>

      <Tabs defaultValue="designer" className="w-full" value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-5 bg-slate-800">
          <TabsTrigger value="designer">Visual Designer</TabsTrigger>
          <TabsTrigger value="spec">Specification</TabsTrigger>
          <TabsTrigger value="versions">Version History</TabsTrigger>
          <TabsTrigger value="runs">Runs</TabsTrigger>
          <TabsTrigger value="optimization">Optimization</TabsTrigger>
        </TabsList>

        <TabsContent value="designer" className="mt-6">
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
                onNodeAdd={handleNodeAdd}
              />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="spec" className="mt-6">
          <Card className="min-h-[70vh]">
            <CardHeader>
              <CardTitle>Workflow Specification (JSON/YAML)</CardTitle>
            </CardHeader>
            <CardContent>
              <WorkflowSpecEditor
                spec={workflowData.spec}
                onSpecChange={onUpdateSpec}
              />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="versions" className="mt-6">
          <VersionManager
            workflow={workflow} // Pass the full workflow object
            versions={versions} // Pass the fetched versions list
            onRestore={async (restoredSpec, restoredVersion) => {
              // Update the workflowData (editor state) with the restored spec and version
              setWorkflowData(prev => ({ ...prev, spec: restoredSpec, version: restoredVersion }));
              // Also update the main workflow state if it exists, to reflect the change
              setWorkflow(prev => prev ? { ...prev, spec: restoredSpec, version: restoredVersion } : null);
              toast.info(`Workflow restored to version ${restoredVersion}`);
              setActiveTab('designer'); // Switch back to designer tab after restore
              await loadWorkflowAndVersions(); // Reload versions to get an updated list (e.g., if restore creates a new version)
            }}
            onRefresh={loadWorkflowAndVersions} // Allow VersionManager to trigger a refresh of its data
          />
        </TabsContent>

        <TabsContent value="runs" className="mt-6">
          <Card className="min-h-[70vh]">
            <CardHeader>
              <CardTitle>Workflow Runs</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-slate-400">Past workflow runs will be displayed here.</p>
              {/* Future: Integrate a component to display a list of past workflow runs */}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="optimization" className="mt-6">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6"> {/* Layout for optimization components */}
            <div className="lg:col-span-2">
              <OptimizationInsights workflow={workflow} onRefresh={() => { }} />
            </div>
            <div className="space-y-6">
              <CollaborationPanel workflowId={workflowId} agents={agents} />
              <MultiAgentCoordinator workflowId={workflowId} agents={agents} onRefresh={loadWorkflowAndVersions} />
              <OptimizationSettings workflow={workflow} />
            </div>
          </div>
        </TabsContent>
      </Tabs>

      <RunMonitor
        isOpen={isRunMonitorOpen}
        onClose={() => {
          setIsRunMonitorOpen(false);
          setActiveRun(null); // Clear active run when closing monitor
        }}
        run={activeRun}
      />
      <SaveAsTemplate
        workflow={workflow}
        open={saveAsTemplateOpen}
        onOpenChange={setSaveAsTemplateOpen}
      />
    </div>
  );
}