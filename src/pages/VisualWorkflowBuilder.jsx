import React, { useState, useEffect, useCallback, useRef } from 'react';
import { base44 } from '@/api/base44Client';
import { useNavigate } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import {
  Save,
  Play,
  FolderOpen,
  Plus,
  Undo,
  Redo,
  ZoomIn,
  ZoomOut,
  Maximize2,
  GitBranch,
  History,
  Settings,
  Trash2,
  Copy,
  Download,
  Upload,
  Eye,
  Activity,
  Sparkles,
  TrendingUp,
  FlaskConical
} from 'lucide-react';
import { toast } from 'sonner';
import WorkflowCanvas from '../components/workflow-builder/WorkflowCanvas';
import NodeLibrary from '../components/workflow-builder/NodeLibrary';
import WorkflowProperties from '../components/workflow-builder/WorkflowProperties';
import ExecutionMonitor from '../components/workflow-builder/ExecutionMonitor';
import VersionHistory from '../components/workflow-builder/VersionHistory';
import AIWorkflowAssistant from '../components/workflow-builder/AIWorkflowAssistant';
import OptimizationSuggestions from '../components/workflow-builder/OptimizationSuggestions';
import ABTestManager from '../components/workflow-builder/ABTestManager';
import AdvancedVersioning from '../components/workflow-builder/AdvancedVersioning';

export default function VisualWorkflowBuilder() {
  const navigate = useNavigate();
  const [workflow, setWorkflow] = useState(null);
  const [nodes, setNodes] = useState([]);
  const [edges, setEdges] = useState([]);
  const [agents, setAgents] = useState([]);
  const [skills, setSkills] = useState([]);
  const [savedWorkflows, setSavedWorkflows] = useState([]);
  const [selectedNode, setSelectedNode] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [isExecuting, setIsExecuting] = useState(false);
  const [activeTab, setActiveTab] = useState('design');
  const [zoom, setZoom] = useState(1);
  const [showLoadDialog, setShowLoadDialog] = useState(false);
  const [showVersionDialog, setShowVersionDialog] = useState(false);
  const [activeRun, setActiveRun] = useState(null);
  const [showAIAssistant, setShowAIAssistant] = useState(false);
  const [showOptimizations, setShowOptimizations] = useState(false);
  const [showABTests, setShowABTests] = useState(false);
  
  // Undo/Redo history
  const [history, setHistory] = useState([]);
  const [historyIndex, setHistoryIndex] = useState(-1);
  const maxHistory = 50;

  useEffect(() => {
    loadInitialData();
  }, []);

  const loadInitialData = async () => {
    setIsLoading(true);
    try {
      const [agentData, skillData, workflowData] = await Promise.all([
        base44.entities.Agent.list(),
        base44.entities.Skill.list(),
        base44.entities.Workflow.list('-updated_date', 20)
      ]);
      setAgents(agentData);
      setSkills(skillData);
      setSavedWorkflows(workflowData);
      
      // Start with empty workflow
      initNewWorkflow();
    } catch (error) {
      console.error('Failed to load data:', error);
      toast.error('Failed to load resources');
    } finally {
      setIsLoading(false);
    }
  };

  const initNewWorkflow = () => {
    const newWorkflow = {
      id: null,
      name: 'Untitled Workflow',
      description: '',
      version: '1.0.0',
      status: 'draft',
      tags: [],
      spec: { nodes: [], edges: [], collaboration_strategy: 'sequential' }
    };
    setWorkflow(newWorkflow);
    setNodes([]);
    setEdges([]);
    setSelectedNode(null);
    setHistory([]);
    setHistoryIndex(-1);
  };

  const pushToHistory = useCallback((newNodes, newEdges) => {
    const newState = { nodes: [...newNodes], edges: [...newEdges] };
    const newHistory = history.slice(0, historyIndex + 1);
    newHistory.push(newState);
    if (newHistory.length > maxHistory) {
      newHistory.shift();
    }
    setHistory(newHistory);
    setHistoryIndex(newHistory.length - 1);
  }, [history, historyIndex]);

  const undo = () => {
    if (historyIndex > 0) {
      const prevState = history[historyIndex - 1];
      setNodes(prevState.nodes);
      setEdges(prevState.edges);
      setHistoryIndex(historyIndex - 1);
    }
  };

  const redo = () => {
    if (historyIndex < history.length - 1) {
      const nextState = history[historyIndex + 1];
      setNodes(nextState.nodes);
      setEdges(nextState.edges);
      setHistoryIndex(historyIndex + 1);
    }
  };

  const handleNodesChange = (newNodes) => {
    setNodes(newNodes);
    pushToHistory(newNodes, edges);
  };

  const handleEdgesChange = (newEdges) => {
    setEdges(newEdges);
    pushToHistory(nodes, newEdges);
  };

  const handleSave = async () => {
    if (!workflow.name.trim()) {
      toast.error('Please enter a workflow name');
      return;
    }

    setIsSaving(true);
    try {
      const spec = {
        nodes: nodes.map(n => ({
          id: n.id,
          type: n.type,
          label: n.label,
          config: n.config,
          position: n.position,
          dependencies: edges.filter(e => e.to === n.id).map(e => e.from)
        })),
        edges: edges.map(e => ({ from: e.from, to: e.to, label: e.label })),
        collaboration_strategy: workflow.spec?.collaboration_strategy || 'sequential',
        estimated_cost_cents: nodes.filter(n => n.type === 'agent').length * 15
      };

      const workflowData = {
        name: workflow.name,
        description: workflow.description,
        version: workflow.version,
        status: workflow.status || 'active',
        tags: workflow.tags,
        spec
      };

      let savedWorkflow;
      if (workflow.id) {
        savedWorkflow = await base44.entities.Workflow.update(workflow.id, workflowData);
        
        // Create version record
        await base44.entities.WorkflowVersion.create({
          workflow_id: workflow.id,
          version: workflow.version,
          spec,
          change_summary: 'Updated via Visual Builder',
          org_id: workflow.org_id
        });
      } else {
        // Get org_id from auth context
        const user = await base44.auth.me();
        if (!user?.organization?.id) {
          throw new Error('Organization not found');
        }
        savedWorkflow = await base44.entities.Workflow.create({
          ...workflowData,
          org_id: user.organization.id
        });
        setWorkflow({ ...workflow, id: savedWorkflow.id, org_id: user.organization.id });
      }

      toast.success('Workflow saved successfully');
      loadInitialData();
    } catch (error) {
      console.error('Save failed:', error);
      toast.error('Failed to save workflow');
    } finally {
      setIsSaving(false);
    }
  };

  const handleLoad = async (workflowToLoad) => {
    setWorkflow({
      id: workflowToLoad.id,
      name: workflowToLoad.name,
      description: workflowToLoad.description,
      version: workflowToLoad.version,
      status: workflowToLoad.status,
      tags: workflowToLoad.tags || [],
      spec: workflowToLoad.spec,
      org_id: workflowToLoad.org_id
    });
    
    const spec = workflowToLoad.spec || {};
    setNodes(spec.nodes || []);
    setEdges(spec.edges || []);
    setSelectedNode(null);
    setShowLoadDialog(false);
    setHistory([{ nodes: spec.nodes || [], edges: spec.edges || [] }]);
    setHistoryIndex(0);
    toast.success('Workflow loaded');
  };

  const handleExecute = async () => {
    if (!workflow.id) {
      toast.error('Please save the workflow first');
      return;
    }

    if (nodes.length === 0) {
      toast.error('Workflow has no nodes');
      return;
    }

    setIsExecuting(true);
    setActiveTab('monitor');

    try {
      const user = await base44.auth.me();
      if (!user?.organization?.id) {
        throw new Error('Organization not found');
      }
      
      // Get agent for run
      const agentList = await base44.entities.Agent.list('-updated_date', 1);
      if (agentList.length === 0) {
        throw new Error('No agents available');
      }

      const run = await base44.entities.Run.create({
        workflow_id: workflow.id,
        agent_id: agentList[0].id,
        state: 'running',
        started_at: new Date().toISOString(),
        org_id: user.organization.id,
        cost_cents: 0,
        tokens_in: 0,
        tokens_out: 0
      });

      setActiveRun(run);
      toast.success('Workflow execution started');

      // Simulate execution for demo
      simulateExecution(run.id);
    } catch (error) {
      console.error('Execution failed:', error);
      toast.error('Failed to start execution');
      setIsExecuting(false);
    }
  };

  const simulateExecution = async (runId) => {
    // Simulate node execution
    for (let i = 0; i < nodes.length; i++) {
      await new Promise(resolve => setTimeout(resolve, 1500));
      setNodes(prev => prev.map((n, idx) => 
        idx === i ? { ...n, executionStatus: 'completed' } : 
        idx === i + 1 ? { ...n, executionStatus: 'running' } : n
      ));
    }

    // Mark run complete
    await base44.entities.Run.update(runId, {
      state: 'completed',
      finished_at: new Date().toISOString(),
      duration_ms: nodes.length * 1500
    });

    setActiveRun(prev => ({ ...prev, state: 'completed' }));
    setIsExecuting(false);
    toast.success('Workflow execution completed');
  };

  const handleDuplicate = async () => {
    if (!workflow.id) return;
    
    const duplicated = {
      ...workflow,
      id: null,
      name: `${workflow.name} (Copy)`,
      version: '1.0.0'
    };
    setWorkflow(duplicated);
    toast.info('Workflow duplicated - save to create a new copy');
  };

  const handleExport = () => {
    const exportData = {
      name: workflow.name,
      description: workflow.description,
      version: workflow.version,
      spec: { nodes, edges }
    };
    
    const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${workflow.name.replace(/\s+/g, '_')}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleImport = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const data = JSON.parse(event.target.result);
        setWorkflow({
          id: null,
          name: data.name || 'Imported Workflow',
          description: data.description || '',
          version: data.version || '1.0.0',
          status: 'draft',
          tags: [],
          spec: data.spec
        });
        setNodes(data.spec?.nodes || []);
        setEdges(data.spec?.edges || []);
        toast.success('Workflow imported');
      } catch (error) {
        toast.error('Invalid workflow file');
      }
    };
    reader.readAsText(file);
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-slate-400">Loading Visual Workflow Builder...</div>
      </div>
    );
  }

  return (
    <div className="h-[calc(100vh-10rem)] flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-4">
          <Input
            value={workflow?.name || ''}
            onChange={(e) => setWorkflow({ ...workflow, name: e.target.value })}
            className="text-xl font-bold bg-transparent border-none text-white w-64 focus:bg-slate-800"
            placeholder="Workflow Name"
          />
          <Badge variant="outline" className="text-slate-400">
            v{workflow?.version || '1.0.0'}
          </Badge>
          {workflow?.id && (
            <Badge className="bg-green-500/20 text-green-400">Saved</Badge>
          )}
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="icon"
            onClick={undo}
            disabled={historyIndex <= 0}
            className="text-slate-400"
          >
            <Undo className="w-4 h-4" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            onClick={redo}
            disabled={historyIndex >= history.length - 1}
            className="text-slate-400"
          >
            <Redo className="w-4 h-4" />
          </Button>
          
          <div className="w-px h-6 bg-slate-700 mx-2" />
          
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setZoom(Math.max(0.5, zoom - 0.1))}
            className="text-slate-400"
          >
            <ZoomOut className="w-4 h-4" />
          </Button>
          <span className="text-sm text-slate-400 w-12 text-center">{Math.round(zoom * 100)}%</span>
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setZoom(Math.min(2, zoom + 0.1))}
            className="text-slate-400"
          >
            <ZoomIn className="w-4 h-4" />
          </Button>
          
          <div className="w-px h-6 bg-slate-700 mx-2" />
          
          <Button variant="outline" size="sm" onClick={initNewWorkflow} className="border-slate-700">
            <Plus className="w-4 h-4 mr-2" />
            New
          </Button>
          <Button variant="outline" size="sm" onClick={() => setShowLoadDialog(true)} className="border-slate-700">
            <FolderOpen className="w-4 h-4 mr-2" />
            Open
          </Button>
          <Button variant="outline" size="sm" onClick={handleSave} disabled={isSaving} className="border-slate-700">
            <Save className="w-4 h-4 mr-2" />
            {isSaving ? 'Saving...' : 'Save'}
          </Button>
          <Button onClick={handleExecute} disabled={isExecuting || nodes.length === 0} className="bg-green-600 hover:bg-green-700">
            <Play className="w-4 h-4 mr-2" />
            {isExecuting ? 'Running...' : 'Execute'}
          </Button>
          
          <div className="w-px h-6 bg-slate-700 mx-2" />
          
          <Button 
            variant="outline" 
            size="sm" 
            onClick={() => setShowAIAssistant(!showAIAssistant)}
            className={`border-slate-700 ${showAIAssistant ? 'bg-purple-500/20 border-purple-500' : ''}`}
          >
            <Sparkles className="w-4 h-4 mr-2" />
            AI Assistant
          </Button>
          <Button 
            variant="outline" 
            size="sm" 
            onClick={() => setShowOptimizations(!showOptimizations)}
            className={`border-slate-700 ${showOptimizations ? 'bg-blue-500/20 border-blue-500' : ''}`}
          >
            <TrendingUp className="w-4 h-4 mr-2" />
            Optimize
          </Button>
          <Button 
            variant="outline" 
            size="sm" 
            onClick={() => setShowABTests(!showABTests)}
            className={`border-slate-700 ${showABTests ? 'bg-green-500/20 border-green-500' : ''}`}
          >
            <FlaskConical className="w-4 h-4 mr-2" />
            A/B Test
          </Button>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex gap-4 overflow-hidden">
        {/* Left Panel - Dynamic */}
        {showAIAssistant && (
          <div className="w-96">
            <AIWorkflowAssistant
              agents={agents}
              skills={skills}
              currentWorkflow={workflow}
              onWorkflowGenerated={(generatedWorkflow) => {
                setWorkflow({
                  ...workflow,
                  name: generatedWorkflow.name || workflow.name,
                  description: generatedWorkflow.description || workflow.description,
                  spec: {
                    ...workflow.spec,
                    collaboration_strategy: generatedWorkflow.collaboration_strategy || 'sequential'
                  }
                });
                setNodes(generatedWorkflow.nodes || []);
                setEdges(generatedWorkflow.edges || []);
                pushToHistory(generatedWorkflow.nodes || [], generatedWorkflow.edges || []);
              }}
            />
          </div>
        )}
        
        {showOptimizations && (
          <div className="w-96">
            <OptimizationSuggestions
              workflow={workflow}
              nodes={nodes}
              edges={edges}
              onApplyOptimization={(changes) => {
                let newNodes = [...nodes];
                let newEdges = [...edges];

                if (changes.nodes_to_add) {
                  newNodes = [...newNodes, ...changes.nodes_to_add];
                }
                if (changes.nodes_to_remove) {
                  newNodes = newNodes.filter(n => !changes.nodes_to_remove.includes(n.id));
                }
                if (changes.edges_to_add) {
                  newEdges = [...newEdges, ...changes.edges_to_add];
                }

                handleNodesChange(newNodes);
                handleEdgesChange(newEdges);
              }}
            />
          </div>
        )}
        
        {showABTests && (
          <div className="w-96">
            <ABTestManager
              workflow={workflow}
              onCreateVariant={(variantWorkflow) => {
                toast.info('Switch to variant workflow to edit it');
              }}
              onSelectWinner={(winnerId) => {
                toast.success('Winner promoted to production');
              }}
            />
          </div>
        )}
        
        {!showAIAssistant && !showOptimizations && !showABTests && (
          <NodeLibrary 
            agents={agents} 
            skills={skills}
            onNodeAdd={(nodeType) => {
              const newNode = {
                id: `node_${Date.now()}`,
                type: nodeType.type,
                label: nodeType.label,
                position: { x: 200 + nodes.length * 50, y: 150 + nodes.length * 30 },
                config: {}
              };
              handleNodesChange([...nodes, newNode]);
            }}
          />
        )}

        {/* Center - Canvas & Tabs */}
        <div className="flex-1 flex flex-col bg-slate-900 rounded-lg border border-slate-800 overflow-hidden">
          <Tabs value={activeTab} onValueChange={setActiveTab} className="flex-1 flex flex-col">
            <TabsList className="bg-slate-800 rounded-none border-b border-slate-700 justify-start px-4">
              <TabsTrigger value="design" className="data-[state=active]:bg-slate-700">
                <GitBranch className="w-4 h-4 mr-2" />
                Design
              </TabsTrigger>
              <TabsTrigger value="monitor" className="data-[state=active]:bg-slate-700">
                <Activity className="w-4 h-4 mr-2" />
                Monitor
                {isExecuting && <span className="ml-2 w-2 h-2 rounded-full bg-green-500 animate-pulse" />}
              </TabsTrigger>
              <TabsTrigger value="versions" className="data-[state=active]:bg-slate-700">
                <History className="w-4 h-4 mr-2" />
                Versions
              </TabsTrigger>
            </TabsList>

            <TabsContent value="design" className="flex-1 m-0">
              <WorkflowCanvas
                nodes={nodes}
                edges={edges}
                agents={agents}
                skills={skills}
                zoom={zoom}
                selectedNode={selectedNode}
                onNodesChange={handleNodesChange}
                onEdgesChange={handleEdgesChange}
                onNodeSelect={setSelectedNode}
              />
            </TabsContent>

            <TabsContent value="monitor" className="flex-1 m-0 overflow-auto">
              <ExecutionMonitor
                run={activeRun}
                nodes={nodes}
                workflow={workflow}
              />
            </TabsContent>

            <TabsContent value="versions" className="flex-1 m-0 overflow-auto p-4">
              <AdvancedVersioning
                workflow={workflow}
                onLoadVersion={(version) => {
                  setNodes(version.spec?.nodes || []);
                  setEdges(version.spec?.edges || []);
                  setWorkflow({ ...workflow, version: version.version });
                  toast.success(`Loaded version ${version.version}`);
                }}
                onCreateBranch={(branchName) => {
                  toast.info('Branch created');
                }}
              />
            </TabsContent>
          </Tabs>
        </div>

        {/* Right Panel - Properties */}
        <WorkflowProperties
          workflow={workflow}
          selectedNode={selectedNode}
          agents={agents}
          skills={skills}
          onWorkflowChange={setWorkflow}
          onNodeChange={(updates) => {
            setNodes(nodes.map(n => n.id === selectedNode.id ? { ...n, ...updates } : n));
            setSelectedNode({ ...selectedNode, ...updates });
          }}
          onNodeDelete={() => {
            setNodes(nodes.filter(n => n.id !== selectedNode.id));
            setEdges(edges.filter(e => e.from !== selectedNode.id && e.to !== selectedNode.id));
            setSelectedNode(null);
          }}
          onDuplicate={handleDuplicate}
          onExport={handleExport}
        />
      </div>

      {/* Load Workflow Dialog */}
      <Dialog open={showLoadDialog} onOpenChange={setShowLoadDialog}>
        <DialogContent className="bg-slate-900 border-slate-800 max-w-2xl">
          <DialogHeader>
            <DialogTitle className="text-white">Load Workflow</DialogTitle>
          </DialogHeader>
          <div className="space-y-2 max-h-96 overflow-y-auto">
            {savedWorkflows.length === 0 ? (
              <p className="text-slate-400 text-center py-8">No saved workflows</p>
            ) : (
              savedWorkflows.map(wf => (
                <div
                  key={wf.id}
                  onClick={() => handleLoad(wf)}
                  className="p-4 bg-slate-800 rounded-lg cursor-pointer hover:bg-slate-750 transition-colors"
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="font-medium text-white">{wf.name}</h4>
                      <p className="text-sm text-slate-400">{wf.description || 'No description'}</p>
                    </div>
                    <div className="text-right">
                      <Badge variant="outline" className="text-slate-400">v{wf.version}</Badge>
                      <p className="text-xs text-slate-500 mt-1">
                        {wf.spec?.nodes?.length || 0} nodes
                      </p>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
          <DialogFooter>
            <label className="cursor-pointer">
              <Button variant="outline" className="border-slate-700" asChild>
                <span>
                  <Upload className="w-4 h-4 mr-2" />
                  Import from File
                </span>
              </Button>
              <input type="file" accept=".json" onChange={handleImport} className="hidden" />
            </label>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}