import { useState, useCallback, useRef } from 'react';
import ReactFlow, { 
  addEdge, 
  useNodesState, 
  useEdgesState, 
  Controls, 
  Background, 
  MiniMap,
  Panel,
  useReactFlow
} from 'reactflow';
import 'reactflow/dist/style.css';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  Play, 
  Save,
  Bot,
  Settings,
  GitBranch,
  Database,
  Mail,
  Webhook
} from 'lucide-react';
import WorkflowNodePanel from './WorkflowNodePanel';

const nodeTypes = {
  agent: { icon: Bot, color: 'bg-blue-500', label: 'AI Agent' },
  tool: { icon: Settings, color: 'bg-green-500', label: 'Tool' },
  condition: { icon: GitBranch, color: 'bg-yellow-500', label: 'Condition' },
  data: { icon: Database, color: 'bg-purple-500', label: 'Data' },
  email: { icon: Mail, color: 'bg-red-500', label: 'Email' },
  webhook: { icon: Webhook, color: 'bg-orange-500', label: 'Webhook' }
};

const CustomNode = ({ data, selected }) => {
  const nodeType = nodeTypes[data.type] || nodeTypes.agent;
  const Icon = nodeType.icon;
  
  return (
    <div className={`relative bg-slate-800 border-2 rounded-lg p-4 min-w-[200px] ${
      selected ? 'border-blue-500 shadow-lg' : 'border-slate-600 hover:border-slate-500'
    }`}>
      <div className="flex items-center gap-3 mb-2">
        <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${nodeType.color}`}>
          <Icon className="w-4 h-4 text-white" />
        </div>
        <div>
          <div className="font-medium text-white text-sm">{data.label}</div>
          <div className="text-xs text-slate-400">{nodeType.label}</div>
        </div>
      </div>
      {data.description && (
        <div className="text-xs text-slate-300 mt-2 truncate">
          {data.description}
        </div>
      )}
    </div>
  );
};

const initialNodes = [
  {
    id: '1',
    type: 'custom',
    position: { x: 250, y: 100 },
    data: { 
      label: 'Start Trigger', 
      type: 'webhook',
      description: 'Receives incoming webhook requests',
      config: {}
    }
  }
];

const initialEdges = [];

export default function VisualWorkflowDesigner({ workflow, agents, tools, onSave }) {
  const [nodes, setNodes, onNodesChange] = useNodesState(initialNodes);
  const [edges, setEdges, onEdgesChange] = useEdgesState(initialEdges);
  const [selectedNode, setSelectedNode] = useState(null);
  const [isPanelOpen, setIsPanelOpen] = useState(false);
  const reactFlowWrapper = useRef(null);
  const { project } = useReactFlow();

  const onConnect = useCallback((params) => {
    setEdges((eds) => addEdge(params, eds));
  }, [setEdges]);

  const onNodeClick = useCallback((event, node) => {
    setSelectedNode(node);
    setIsPanelOpen(true);
  }, []);

  const onPaneClick = useCallback(() => {
    setSelectedNode(null);
    setIsPanelOpen(false);
  }, []);

  const addNode = (type) => {
    const nodeConfig = nodeTypes[type];
    const newNode = {
      id: `${type}_${Date.now()}`,
      type: 'custom',
      position: { x: Math.random() * 300 + 100, y: Math.random() * 300 + 100 },
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
    setEdges((eds) => eds.filter((edge) => edge.source !== nodeId && edge.target !== nodeId));
    setSelectedNode(null);
    setIsPanelOpen(false);
  };

  const handleSave = () => {
    const workflowData = {
      ...workflow,
      spec: {
        nodes: nodes.map(node => ({
          id: node.id,
          type: node.data.type,
          position: node.position,
          data: node.data
        })),
        edges: edges.map(edge => ({
          source: edge.source,
          target: edge.target,
          type: edge.type || 'default'
        }))
      }
    };
    onSave?.(workflowData);
  };

  return (
    <div className="h-full w-full relative bg-slate-950 overflow-hidden">
      <div className="h-full flex">
        {/* Main Canvas */}
        <div className={`transition-all duration-300 ${isPanelOpen ? 'w-2/3' : 'w-full'}`}>
          <div className="h-full" ref={reactFlowWrapper}>
            <ReactFlow
              nodes={nodes}
              edges={edges}
              onNodesChange={onNodesChange}
              onEdgesChange={onEdgesChange}
              onConnect={onConnect}
              onNodeClick={onNodeClick}
              onPaneClick={onPaneClick}
              nodeTypes={{ custom: CustomNode }}
              className="bg-slate-900"
              defaultViewport={{ x: 0, y: 0, zoom: 1 }}
              minZoom={0.2}
              maxZoom={2}
              attributionPosition="bottom-left"
            >
              <Background color="#374151" gap={20} />
              <Controls className="bg-slate-800 border-slate-700" />
              <MiniMap 
                className="bg-slate-800 border border-slate-700" 
                nodeColor="#64748b"
                maskColor="rgba(0, 0, 0, 0.2)"
              />
              
              {/* Top Panel */}
              <Panel position="top-left" className="bg-slate-800 p-4 rounded-lg border border-slate-700">
                <div className="flex items-center gap-4">
                  <div className="flex items-center gap-2">
                    <Button size="sm" onClick={handleSave} className="bg-blue-600 hover:bg-blue-700">
                      <Save className="w-4 h-4 mr-2" />
                      Save
                    </Button>
                    <Button size="sm" variant="outline" className="bg-slate-700 border-slate-600">
                      <Play className="w-4 h-4 mr-2" />
                      Test Run
                    </Button>
                  </div>
                  
                  <div className="h-4 w-px bg-slate-600" />
                  
                  <div className="text-sm text-slate-300">
                    Nodes: <Badge variant="secondary">{nodes.length}</Badge>
                    Edges: <Badge variant="secondary">{edges.length}</Badge>
                  </div>
                </div>
              </Panel>

              {/* Node Palette */}
              <Panel position="top-right" className="bg-slate-800 p-4 rounded-lg border border-slate-700">
                <div className="space-y-2">
                  <div className="text-sm font-medium text-white mb-3">Add Nodes</div>
                  <div className="grid grid-cols-2 gap-2">
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
              </Panel>
            </ReactFlow>
          </div>
        </div>

        {/* Configuration Panel */}
        {isPanelOpen && (
          <div className="w-1/3 bg-slate-900 border-l border-slate-800 flex flex-col">
            <WorkflowNodePanel
              selectedNode={selectedNode}
              agents={agents}
              tools={tools}
              onUpdateNode={updateNode}
              onDeleteNode={deleteNode}
              onClose={() => setIsPanelOpen(false)}
            />
          </div>
        )}
      </div>
    </div>
  );
}