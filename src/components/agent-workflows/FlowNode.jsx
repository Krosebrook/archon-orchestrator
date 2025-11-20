import React from 'react';
import { Brain, Zap, Database, GitBranch, MessageSquare, RotateCw, Trash2, Circle } from 'lucide-react';
import { Button } from '@/components/ui/button';

const NODE_ICONS = {
  agent_action: Brain,
  skill_execution: Zap,
  memory_read: Database,
  memory_write: Database,
  condition: GitBranch,
  loop: RotateCw,
  human_input: MessageSquare
};

const NODE_COLORS = {
  agent_action: 'bg-blue-500',
  skill_execution: 'bg-purple-500',
  memory_read: 'bg-green-500',
  memory_write: 'bg-teal-500',
  condition: 'bg-yellow-500',
  loop: 'bg-orange-500',
  human_input: 'bg-pink-500'
};

export default function FlowNode({ 
  node, 
  isSelected, 
  onClick, 
  onDelete, 
  onConnectionStart, 
  onConnectionEnd 
}) {
  const Icon = NODE_ICONS[node.type] || Brain;
  const color = NODE_COLORS[node.type] || 'bg-slate-500';

  return (
    <div
      style={{
        position: 'absolute',
        left: node.position.x,
        top: node.position.y
      }}
      className={`w-48 bg-slate-900 rounded-lg border-2 transition-all cursor-pointer ${
        isSelected ? 'border-blue-500 shadow-lg shadow-blue-500/20' : 'border-slate-700'
      }`}
      onClick={onClick}
    >
      <div className="p-3">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2">
            <div className={`w-8 h-8 rounded-lg ${color} flex items-center justify-center`}>
              <Icon className="w-4 h-4 text-white" />
            </div>
            <span className="text-sm font-medium text-white">{node.label}</span>
          </div>
          <Button
            size="icon"
            variant="ghost"
            onClick={(e) => {
              e.stopPropagation();
              onDelete();
            }}
            className="h-6 w-6 text-slate-400 hover:text-red-400"
          >
            <Trash2 className="w-3 h-3" />
          </Button>
        </div>
        {node.config?.description && (
          <p className="text-xs text-slate-400 line-clamp-2">{node.config.description}</p>
        )}
      </div>

      <div className="flex items-center justify-between px-3 pb-2">
        <button
          onMouseDown={(e) => {
            e.stopPropagation();
            onConnectionStart();
          }}
          className="w-3 h-3 rounded-full bg-slate-700 hover:bg-blue-500 transition-colors"
          title="Start connection"
        />
        <button
          onMouseUp={(e) => {
            e.stopPropagation();
            onConnectionEnd();
          }}
          className="w-3 h-3 rounded-full bg-slate-700 hover:bg-green-500 transition-colors"
          title="End connection"
        />
      </div>
    </div>
  );
}