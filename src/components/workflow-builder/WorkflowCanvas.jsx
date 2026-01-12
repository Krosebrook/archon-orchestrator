import { useRef, useState, useCallback, useEffect } from 'react';
import { 
  Bot, 
  Zap, 
  GitBranch, 
  Database, 
  MessageSquare, 
  RotateCw,
  Play,
  Pause,
  Circle,
  CheckCircle2,
  AlertCircle,
  Loader2
} from 'lucide-react';

const NODE_ICONS = {
  agent: Bot,
  skill: Zap,
  condition: GitBranch,
  memory: Database,
  human_input: MessageSquare,
  loop: RotateCw,
  trigger: Play,
  pause: Pause
};

const NODE_COLORS = {
  agent: { bg: 'bg-blue-500', border: 'border-blue-400', shadow: 'shadow-blue-500/20' },
  skill: { bg: 'bg-purple-500', border: 'border-purple-400', shadow: 'shadow-purple-500/20' },
  condition: { bg: 'bg-yellow-500', border: 'border-yellow-400', shadow: 'shadow-yellow-500/20' },
  memory: { bg: 'bg-green-500', border: 'border-green-400', shadow: 'shadow-green-500/20' },
  human_input: { bg: 'bg-pink-500', border: 'border-pink-400', shadow: 'shadow-pink-500/20' },
  loop: { bg: 'bg-orange-500', border: 'border-orange-400', shadow: 'shadow-orange-500/20' },
  trigger: { bg: 'bg-emerald-500', border: 'border-emerald-400', shadow: 'shadow-emerald-500/20' },
  pause: { bg: 'bg-slate-500', border: 'border-slate-400', shadow: 'shadow-slate-500/20' }
};

const EXECUTION_STATUS = {
  pending: { icon: Circle, color: 'text-slate-400' },
  running: { icon: Loader2, color: 'text-blue-400', spin: true },
  completed: { icon: CheckCircle2, color: 'text-green-400' },
  failed: { icon: AlertCircle, color: 'text-red-400' }
};

function WorkflowNode({ 
  node, 
  isSelected, 
  zoom,
  onSelect, 
  onDragStart,
  onConnectionStart,
  onConnectionEnd
}) {
  const Icon = NODE_ICONS[node.type] || Bot;
  const colors = NODE_COLORS[node.type] || NODE_COLORS.agent;
  const statusInfo = node.executionStatus ? EXECUTION_STATUS[node.executionStatus] : null;
  const StatusIcon = statusInfo?.icon;

  return (
    <div
      style={{
        position: 'absolute',
        left: node.position.x,
        top: node.position.y,
        transform: `scale(${zoom})`,
        transformOrigin: 'top left'
      }}
      className={`
        w-56 bg-slate-900 rounded-xl border-2 transition-all cursor-pointer select-none
        ${isSelected ? `${colors.border} shadow-lg ${colors.shadow}` : 'border-slate-700 hover:border-slate-600'}
        ${node.executionStatus === 'running' ? 'ring-2 ring-blue-500 ring-opacity-50 animate-pulse' : ''}
      `}
      onClick={() => onSelect(node)}
      onMouseDown={(e) => {
        if (e.target.closest('.no-drag')) return;
        onDragStart(e, node);
      }}
    >
      {/* Header */}
      <div className={`px-3 py-2 rounded-t-lg ${colors.bg} bg-opacity-20 flex items-center justify-between`}>
        <div className="flex items-center gap-2">
          <div className={`w-7 h-7 rounded-lg ${colors.bg} flex items-center justify-center`}>
            <Icon className="w-4 h-4 text-white" />
          </div>
          <span className="text-sm font-semibold text-white truncate max-w-28">{node.label}</span>
        </div>
        {statusInfo && (
          <StatusIcon className={`w-4 h-4 ${statusInfo.color} ${statusInfo.spin ? 'animate-spin' : ''}`} />
        )}
      </div>

      {/* Body */}
      <div className="px-3 py-2">
        {node.config?.description && (
          <p className="text-xs text-slate-400 line-clamp-2 mb-2">{node.config.description}</p>
        )}
        {node.config?.agent_name && (
          <div className="text-xs text-slate-500">
            Agent: <span className="text-slate-300">{node.config.agent_name}</span>
          </div>
        )}
        {node.config?.skill_name && (
          <div className="text-xs text-slate-500">
            Skill: <span className="text-slate-300">{node.config.skill_name}</span>
          </div>
        )}
      </div>

      {/* Connection Points */}
      <div className="px-3 pb-2 flex items-center justify-between no-drag">
        {/* Input connector */}
        <button
          onMouseUp={(e) => {
            e.stopPropagation();
            onConnectionEnd(node.id);
          }}
          className="w-4 h-4 rounded-full bg-slate-700 border-2 border-slate-600 hover:bg-green-500 hover:border-green-400 transition-colors"
          title="Connect input"
        />
        
        {/* Output connector */}
        <button
          onMouseDown={(e) => {
            e.stopPropagation();
            onConnectionStart(e, node.id);
          }}
          className="w-4 h-4 rounded-full bg-slate-700 border-2 border-slate-600 hover:bg-blue-500 hover:border-blue-400 transition-colors cursor-crosshair"
          title="Connect output"
        />
      </div>
    </div>
  );
}

function ConnectionPath({ from, to, isTemp = false }) {
  if (!from || !to) return null;

  // Calculate bezier curve control points
  const dx = to.x - from.x;
  const dy = to.y - from.y;
  const controlOffset = Math.min(Math.abs(dx) * 0.5, 100);

  const path = `
    M ${from.x} ${from.y}
    C ${from.x + controlOffset} ${from.y},
      ${to.x - controlOffset} ${to.y},
      ${to.x} ${to.y}
  `;

  return (
    <g>
      {/* Shadow/glow */}
      <path
        d={path}
        stroke={isTemp ? '#3b82f6' : '#475569'}
        strokeWidth="4"
        fill="none"
        opacity="0.3"
      />
      {/* Main line */}
      <path
        d={path}
        stroke={isTemp ? '#3b82f6' : '#64748b'}
        strokeWidth="2"
        fill="none"
        strokeDasharray={isTemp ? '8,4' : 'none'}
        className="transition-all"
      />
      {/* Arrow head */}
      {!isTemp && (
        <circle
          cx={to.x}
          cy={to.y}
          r="5"
          fill="#3b82f6"
        />
      )}
    </g>
  );
}

export default function WorkflowCanvas({
  nodes,
  edges,
  agents,
  skills,
  zoom,
  selectedNode,
  onNodesChange,
  onEdgesChange,
  onNodeSelect
}) {
  const canvasRef = useRef(null);
  const [offset, setOffset] = useState({ x: 0, y: 0 });
  const [isDraggingCanvas, setIsDraggingCanvas] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const [draggingNode, setDraggingNode] = useState(null);
  const [nodeDragStart, setNodeDragStart] = useState({ x: 0, y: 0 });
  const [connectingFrom, setConnectingFrom] = useState(null);
  const [tempConnection, setTempConnection] = useState(null);

  // Handle node dragging
  const handleNodeDragStart = (e, node) => {
    e.stopPropagation();
    setDraggingNode(node);
    setNodeDragStart({
      x: e.clientX - node.position.x * zoom,
      y: e.clientY - node.position.y * zoom
    });
  };

  // Handle connection start
  const handleConnectionStart = (e, nodeId) => {
    setConnectingFrom(nodeId);
    const rect = canvasRef.current.getBoundingClientRect();
    setTempConnection({
      from: nodeId,
      toX: (e.clientX - rect.left - offset.x) / zoom,
      toY: (e.clientY - rect.top - offset.y) / zoom
    });
  };

  // Handle connection end
  const handleConnectionEnd = (nodeId) => {
    if (connectingFrom && nodeId !== connectingFrom) {
      // Check for duplicate connection
      const exists = edges.some(e => e.from === connectingFrom && e.to === nodeId);
      if (!exists) {
        const newEdge = {
          id: `edge_${Date.now()}`,
          from: connectingFrom,
          to: nodeId
        };
        onEdgesChange([...edges, newEdge]);
      }
    }
    setConnectingFrom(null);
    setTempConnection(null);
  };

  // Mouse move handler
  const handleMouseMove = useCallback((e) => {
    if (isDraggingCanvas) {
      setOffset({
        x: e.clientX - dragStart.x,
        y: e.clientY - dragStart.y
      });
    } else if (draggingNode) {
      const newX = (e.clientX - nodeDragStart.x) / zoom;
      const newY = (e.clientY - nodeDragStart.y) / zoom;
      onNodesChange(nodes.map(n => 
        n.id === draggingNode.id 
          ? { ...n, position: { x: Math.max(0, newX), y: Math.max(0, newY) } }
          : n
      ));
    } else if (connectingFrom) {
      const rect = canvasRef.current.getBoundingClientRect();
      setTempConnection({
        from: connectingFrom,
        toX: (e.clientX - rect.left - offset.x) / zoom,
        toY: (e.clientY - rect.top - offset.y) / zoom
      });
    }
  }, [isDraggingCanvas, draggingNode, connectingFrom, dragStart, nodeDragStart, zoom, nodes, offset, onNodesChange]);

  // Mouse up handler
  const handleMouseUp = useCallback(() => {
    setIsDraggingCanvas(false);
    setDraggingNode(null);
    if (connectingFrom) {
      setConnectingFrom(null);
      setTempConnection(null);
    }
  }, [connectingFrom]);

  // Canvas mouse down
  const handleCanvasMouseDown = (e) => {
    if (e.target === canvasRef.current || e.target.tagName === 'svg') {
      setIsDraggingCanvas(true);
      setDragStart({ x: e.clientX - offset.x, y: e.clientY - offset.y });
      onNodeSelect(null);
    }
  };

  // Handle drop from palette
  const handleDrop = (e) => {
    e.preventDefault();
    try {
      const nodeData = JSON.parse(e.dataTransfer.getData('nodeType'));
      const rect = canvasRef.current.getBoundingClientRect();
      
      const newNode = {
        id: `node_${Date.now()}`,
        type: nodeData.type,
        label: nodeData.label,
        position: {
          x: (e.clientX - rect.left - offset.x) / zoom,
          y: (e.clientY - rect.top - offset.y) / zoom
        },
        config: {}
      };
      
      onNodesChange([...nodes, newNode]);
    } catch (error) {
      console.error('Drop failed:', error);
    }
  };

  // Get node center position for edge rendering
  const getNodeEdgePoint = (nodeId, isOutput = true) => {
    const node = nodes.find(n => n.id === nodeId);
    if (!node) return { x: 0, y: 0 };
    
    const nodeWidth = 224; // w-56 = 14rem = 224px
    const nodeHeight = 100;
    
    return {
      x: (node.position.x + (isOutput ? nodeWidth : 0)) * zoom + offset.x,
      y: (node.position.y + nodeHeight / 2) * zoom + offset.y
    };
  };

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Delete' && selectedNode) {
        onNodesChange(nodes.filter(n => n.id !== selectedNode.id));
        onEdgesChange(edges.filter(e => e.from !== selectedNode.id && e.to !== selectedNode.id));
        onNodeSelect(null);
      }
      if (e.key === 'Escape') {
        onNodeSelect(null);
        setConnectingFrom(null);
        setTempConnection(null);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [selectedNode, nodes, edges, onNodesChange, onEdgesChange, onNodeSelect]);

  return (
    <div
      ref={canvasRef}
      className="relative w-full h-full overflow-hidden cursor-grab active:cursor-grabbing"
      style={{
        backgroundImage: `
          radial-gradient(circle, #334155 1px, transparent 1px),
          linear-gradient(to right, #1e293b 1px, transparent 1px),
          linear-gradient(to bottom, #1e293b 1px, transparent 1px)
        `,
        backgroundSize: `${20 * zoom}px ${20 * zoom}px, ${100 * zoom}px ${100 * zoom}px, ${100 * zoom}px ${100 * zoom}px`,
        backgroundPosition: `${offset.x}px ${offset.y}px`
      }}
      onMouseDown={handleCanvasMouseDown}
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
      onMouseLeave={handleMouseUp}
      onDrop={handleDrop}
      onDragOver={(e) => e.preventDefault()}
    >
      {/* Edges SVG Layer */}
      <svg 
        className="absolute inset-0 pointer-events-none" 
        style={{ width: '100%', height: '100%', overflow: 'visible' }}
      >
        {edges.map(edge => (
          <ConnectionPath
            key={edge.id}
            from={getNodeEdgePoint(edge.from, true)}
            to={getNodeEdgePoint(edge.to, false)}
          />
        ))}
        {tempConnection && (
          <ConnectionPath
            from={getNodeEdgePoint(tempConnection.from, true)}
            to={{ 
              x: tempConnection.toX * zoom + offset.x, 
              y: tempConnection.toY * zoom + offset.y 
            }}
            isTemp
          />
        )}
      </svg>

      {/* Nodes Layer */}
      <div 
        className="absolute inset-0" 
        style={{ transform: `translate(${offset.x}px, ${offset.y}px)` }}
      >
        {nodes.map(node => (
          <WorkflowNode
            key={node.id}
            node={node}
            isSelected={selectedNode?.id === node.id}
            zoom={zoom}
            onSelect={onNodeSelect}
            onDragStart={handleNodeDragStart}
            onConnectionStart={handleConnectionStart}
            onConnectionEnd={handleConnectionEnd}
          />
        ))}
      </div>

      {/* Empty state */}
      {nodes.length === 0 && (
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
          <div className="text-center">
            <GitBranch className="w-16 h-16 text-slate-700 mx-auto mb-4" />
            <h3 className="text-xl font-medium text-slate-500 mb-2">Start Building Your Workflow</h3>
            <p className="text-slate-600">Drag nodes from the left panel or click Add to begin</p>
          </div>
        </div>
      )}

      {/* Mini map / zoom info */}
      <div className="absolute bottom-4 left-4 bg-slate-800/90 backdrop-blur rounded-lg px-3 py-2 text-xs text-slate-400">
        {nodes.length} nodes • {edges.length} connections • {Math.round(zoom * 100)}% zoom
      </div>
    </div>
  );
}