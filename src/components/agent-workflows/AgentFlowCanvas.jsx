import { useRef, useState } from 'react';
import FlowNode from './FlowNode';
import NodeConfigPanel from './NodeConfigPanel';
import ConnectionLine from './ConnectionLine';

export default function AgentFlowCanvas({ 
  nodes, 
  connections, 
  agents, 
  skills, 
  selectedNode,
  onNodesChange, 
  onConnectionsChange,
  onNodeSelect 
}) {
  const canvasRef = useRef(null);
  const [connectingFrom, setConnectingFrom] = useState(null);
  const [tempConnection, setTempConnection] = useState(null);
  const [isDraggingCanvas, setIsDraggingCanvas] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const [offset, setOffset] = useState({ x: 0, y: 0 });

  const handleDrop = (e) => {
    e.preventDefault();
    const nodeTypeData = JSON.parse(e.dataTransfer.getData('nodeType'));
    const rect = canvasRef.current.getBoundingClientRect();
    
    const newNode = {
      id: `node_${Date.now()}`,
      type: nodeTypeData.type,
      label: nodeTypeData.label,
      position: {
        x: e.clientX - rect.left - offset.x,
        y: e.clientY - rect.top - offset.y
      },
      config: {}
    };
    
    onNodesChange([...nodes, newNode]);
  };

  const handleDragOver = (e) => {
    e.preventDefault();
  };

  const handleNodeDelete = (nodeId) => {
    onNodesChange(nodes.filter(n => n.id !== nodeId));
    onConnectionsChange(connections.filter(c => c.from !== nodeId && c.to !== nodeId));
    if (selectedNode?.id === nodeId) onNodeSelect(null);
  };

  const handleNodeUpdate = (nodeId, updates) => {
    onNodesChange(nodes.map(n => n.id === nodeId ? { ...n, ...updates } : n));
  };

  const handleConnectionStart = (nodeId) => {
    setConnectingFrom(nodeId);
  };

  const handleConnectionMove = (e) => {
    if (connectingFrom) {
      const rect = canvasRef.current.getBoundingClientRect();
      setTempConnection({
        from: connectingFrom,
        toX: e.clientX - rect.left - offset.x,
        toY: e.clientY - rect.top - offset.y
      });
    }
  };

  const handleConnectionEnd = (nodeId) => {
    if (connectingFrom && nodeId !== connectingFrom) {
      const newConnection = {
        id: `conn_${Date.now()}`,
        from: connectingFrom,
        to: nodeId
      };
      onConnectionsChange([...connections, newConnection]);
    }
    setConnectingFrom(null);
    setTempConnection(null);
  };

  const handleCanvasMouseDown = (e) => {
    if (e.target === canvasRef.current) {
      setIsDraggingCanvas(true);
      setDragStart({ x: e.clientX - offset.x, y: e.clientY - offset.y });
    }
  };

  const handleCanvasMouseMove = (e) => {
    if (isDraggingCanvas) {
      setOffset({
        x: e.clientX - dragStart.x,
        y: e.clientY - dragStart.y
      });
    }
    handleConnectionMove(e);
  };

  const handleCanvasMouseUp = () => {
    setIsDraggingCanvas(false);
  };

  const getNodePosition = (nodeId) => {
    const node = nodes.find(n => n.id === nodeId);
    return node ? node.position : { x: 0, y: 0 };
  };

  return (
    <div className="flex-1 flex relative">
      <div
        ref={canvasRef}
        onDrop={handleDrop}
        onDragOver={handleDragOver}
        onMouseDown={handleCanvasMouseDown}
        onMouseMove={handleCanvasMouseMove}
        onMouseUp={handleCanvasMouseUp}
        className="flex-1 relative bg-slate-950 overflow-hidden cursor-move"
        style={{
          backgroundImage: 'radial-gradient(circle, #334155 1px, transparent 1px)',
          backgroundSize: '20px 20px'
        }}
      >
        <svg className="absolute inset-0 pointer-events-none" style={{ width: '100%', height: '100%' }}>
          {connections.map(conn => {
            const fromPos = getNodePosition(conn.from);
            const toPos = getNodePosition(conn.to);
            return (
              <ConnectionLine
                key={conn.id}
                from={{ x: fromPos.x + offset.x + 100, y: fromPos.y + offset.y + 40 }}
                to={{ x: toPos.x + offset.x, y: toPos.y + offset.y + 40 }}
              />
            );
          })}
          {tempConnection && (
            <ConnectionLine
              from={{ 
                x: getNodePosition(tempConnection.from).x + offset.x + 100, 
                y: getNodePosition(tempConnection.from).y + offset.y + 40 
              }}
              to={{ x: tempConnection.toX, y: tempConnection.toY }}
              isDashed
            />
          )}
        </svg>

        <div style={{ transform: `translate(${offset.x}px, ${offset.y}px)` }}>
          {nodes.map(node => (
            <FlowNode
              key={node.id}
              node={node}
              isSelected={selectedNode?.id === node.id}
              onClick={() => onNodeSelect(node)}
              onDelete={() => handleNodeDelete(node.id)}
              onConnectionStart={() => handleConnectionStart(node.id)}
              onConnectionEnd={() => handleConnectionEnd(node.id)}
            />
          ))}
        </div>
      </div>

      {selectedNode && (
        <NodeConfigPanel
          node={selectedNode}
          agents={agents}
          skills={skills}
          onUpdate={(updates) => handleNodeUpdate(selectedNode.id, updates)}
          onClose={() => onNodeSelect(null)}
        />
      )}
    </div>
  );
}