import { useState, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { 
  Play, 
  Save,
  Bot,
  Settings,
  GitBranch,
  Database,
  Mail,
  Webhook,
  Trash2,
  Users,
  Brain
} from 'lucide-react';
import { toast } from 'sonner';
import WorkflowNodePanel from './WorkflowNodePanel';
import AgentCollaborationNode from './AgentCollaborationNode';
import MemoryNode from './MemoryNode';
import AIWorkflowGenerator from './AIWorkflowGenerator';

const nodeTypes = {
  agent: { icon: Bot, color: 'bg-blue-500', label: 'AI Agent' },
  tool: { icon: Settings, color: 'bg-green-500', label: 'Tool' },
  condition: { icon: GitBranch, color: 'bg-yellow-500', label: 'Condition' },
  data: { icon: Database, color: 'bg-purple-500', label: 'Data' },
  email: { icon: Mail, color: 'bg-red-500', label: 'Email' },
  webhook: { icon: Webhook, color: 'bg-orange-500', label: 'Webhook' },
  agent_collaboration: { icon: Users, color: 'bg-purple-600', label: 'Agent Collaboration' },
  memory_read: { icon: Brain, color: 'bg-indigo-500', label: 'Memory Read' },
  memory_write: { icon: Brain, color: 'bg-blue-600', label: 'Memory Write' }
};

const WorkflowNode = ({ node, selected, onClick, onDelete }) => {
  const nodeType = nodeTypes[node.data.type] || nodeTypes.agent;
  const Icon = nodeType.icon;
  
  return (
    <div 
      className={`relative bg-slate-800 border-2 rounded-lg p-4 min-w-[200px] cursor-pointer transition-all ${
        selected ? 'border-blue-500 shadow-lg' : 'border-slate-600 hover:border-slate-500'
      }`}
      onClick={() => onClick(node)}
    >
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-3">
          <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${nodeType.color}`}>
            <Icon className="w-4 h-4 text-white" />
          </div>
          <div>
            <div className="font-medium text-white text-sm">{node.data.label}</div>
            <div className="text-xs text-slate-400">{nodeType.label}</div>
          </div>
        </div>
        <Button
          size="icon"
          variant="ghost"
          onClick={(e) => {
            e.stopPropagation();
            onDelete(node.id);
          }}
          className="h-6 w-6 text-slate-400 hover:text-red-400"
        >
          <Trash2 className="w-3 h-3" />
        </Button>
      </div>
      {node.data.description && (
        <div className="text-xs text-slate-300 mt-2 line-clamp-2">
          {node.data.description}
        </div>
      )}
    </div>
  );
};

const initialNodes = [
  {
    id: '1',
    data: { 
      label: 'Start Trigger', 
      type: 'webhook',
      description: 'Receives incoming webhook requests',
      config: {}
    }
  }
];

export default function VisualWorkflowDesigner({ workflow, agents, tools, onSave }) {
  const [nodes, setNodes] = useState(workflow?.spec?.nodes || initialNodes);
  const [selectedNode, setSelectedNode] = useState(null);
  const [isPanelOpen, setIsPanelOpen] = useState(false);
  const [editingCollabNode, setEditingCollabNode] = useState(null);
  const [editingMemoryNode, setEditingMemoryNode] = useState(null);
  const [showAIGenerator, setShowAIGenerator] = useState(false);

  const onNodeClick = useCallback((node) => {
    if (node.data.type === 'agent_collaboration') {
      setEditingCollabNode(node);
    } else if (node.data.type === 'memory_read' || node.data.type === 'memory_write') {
      setEditingMemoryNode(node);
    } else {
      setSelectedNode(node);
      setIsPanelOpen(true);
    }
  }, []);

  const addNode = (type) => {
    const nodeConfig = nodeTypes[type];
    const newNode = {
      id: `${type}_${Date.now()}`,
      data: {
        label: `New ${nodeConfig.label}`,
        type: type,
        description: `Configure this ${nodeConfig.label.toLowerCase()}`,
        config: {}
      }
    };
    setNodes((nds) => [...nds, newNode]);
  };

  const updateNode = (nodeId, updates) => {
    setNodes((nds) => 
      nds.map((node) => 
        node.id === nodeId ? { ...node, ...updates } : node
      )
    );
  };

  const deleteNode = (nodeId) => {
    setNodes((nds) => nds.filter((node) => node.id !== nodeId));
    setSelectedNode(null);
    setIsPanelOpen(false);
  };

  const handleSave = () => {
    const workflowData = {
      ...workflow,
      spec: {
        nodes: nodes,
        edges: []
      }
    };
    onSave?.(workflowData);
  };

  const handleAIGenerated = (generatedWorkflow) => {
    if (generatedWorkflow?.nodes) {
      setNodes(generatedWorkflow.nodes);
      toast.success('AI-generated workflow applied!');
    }
  };

  return (
    <div className="h-full w-full relative bg-slate-950 overflow-hidden">
      <div className="h-full flex flex-col">
        {/* Top Toolbar */}
        <div className="bg-slate-800 p-4 border-b border-slate-700">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Button size="sm" onClick={handleSave} className="bg-blue-600 hover:bg-blue-700">
                <Save className="w-4 h-4 mr-2" />
                Save
              </Button>
              <Button size="sm" variant="outline" className="bg-slate-700 border-slate-600">
                <Play className="w-4 h-4 mr-2" />
                Test Run
              </Button>
              <Button 
                size="sm" 
                onClick={() => setShowAIGenerator(true)}
                className="bg-purple-600 hover:bg-purple-700"
              >
                <Bot className="w-4 h-4 mr-2" />
                AI Generate
              </Button>
              <div className="h-4 w-px bg-slate-600" />
              <div className="text-sm text-slate-300 flex items-center gap-2">
                Nodes: <Badge variant="secondary">{nodes.length}</Badge>
              </div>
            </div>
            
            <div className="flex items-center gap-2">
              <span className="text-sm text-slate-400 mr-2">Add Node:</span>
              {Object.entries(nodeTypes).map(([type, config]) => {
                const Icon = config.icon;
                return (
                  <Button
                    key={type}
                    size="sm"
                    variant="outline"
                    onClick={() => addNode(type)}
                    className="flex items-center gap-2 bg-slate-700 border-slate-600 hover:bg-slate-600 text-white text-xs"
                  >
                    <div className={`w-4 h-4 rounded flex items-center justify-center ${config.color}`}>
                      <Icon className="w-3 h-3 text-white" />
                    </div>
                    {config.label}
                  </Button>
                );
              })}
            </div>
          </div>
        </div>

        {/* Main Content */}
        <div className="flex-1 flex overflow-hidden">
          {/* Nodes List */}
          <div className={`transition-all duration-300 overflow-y-auto p-6 ${isPanelOpen ? 'w-1/2' : 'w-full'}`}>
            <div className="space-y-4">
              {nodes.length === 0 ? (
                <Card className="bg-slate-900 border-slate-800">
                  <CardContent className="p-8 text-center">
                    <div className="text-slate-400">No nodes yet. Add nodes using the buttons above.</div>
                  </CardContent>
                </Card>
              ) : (
                nodes.map((node) => (
                  <WorkflowNode
                    key={node.id}
                    node={node}
                    selected={selectedNode?.id === node.id}
                    onClick={onNodeClick}
                    onDelete={deleteNode}
                  />
                ))
              )}
            </div>
          </div>

          {/* Configuration Panel */}
          {isPanelOpen && selectedNode && (
            <div className="w-1/2 bg-slate-900 border-l border-slate-800 flex flex-col overflow-y-auto">
              <WorkflowNodePanel
                selectedNode={selectedNode}
                agents={agents}
                tools={tools}
                onUpdateNode={updateNode}
                onDeleteNode={deleteNode}
                onClose={() => {
                  setIsPanelOpen(false);
                  setSelectedNode(null);
                }}
              />
            </div>
          )}
        </div>
      </div>

      {editingCollabNode && (
        <AgentCollaborationNode
          node={editingCollabNode}
          agents={agents || []}
          open={!!editingCollabNode}
          onOpenChange={(open) => !open && setEditingCollabNode(null)}
          onUpdate={(updatedNode) => {
            updateNode(updatedNode.id, updatedNode);
            setEditingCollabNode(null);
          }}
        />
      )}

      {editingMemoryNode && (
        <MemoryNode
          node={editingMemoryNode}
          agents={agents || []}
          open={!!editingMemoryNode}
          onOpenChange={(open) => !open && setEditingMemoryNode(null)}
          onUpdate={(updatedNode) => {
            updateNode(updatedNode.id, updatedNode);
            setEditingMemoryNode(null);
          }}
        />
      )}

      <AIWorkflowGenerator
        open={showAIGenerator}
        onOpenChange={setShowAIGenerator}
        onWorkflowGenerated={handleAIGenerated}
        onSaveAsTemplate={() => toast.success('Template saved!')}
      />
    </div>
  );
}