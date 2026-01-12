import { Brain, Zap, Database, GitBranch, MessageSquare, RotateCw } from 'lucide-react';

const NODE_TYPES = [
  { type: 'agent_action', label: 'Agent Action', icon: Brain, color: 'bg-blue-500', description: 'Execute an AI agent task' },
  { type: 'skill_execution', label: 'Run Skill', icon: Zap, color: 'bg-purple-500', description: 'Execute a skill from marketplace' },
  { type: 'memory_read', label: 'Read Memory', icon: Database, color: 'bg-green-500', description: 'Retrieve from agent memory' },
  { type: 'memory_write', label: 'Write Memory', icon: Database, color: 'bg-teal-500', description: 'Store to agent memory' },
  { type: 'condition', label: 'Conditional', icon: GitBranch, color: 'bg-yellow-500', description: 'Branch based on condition' },
  { type: 'loop', label: 'Loop', icon: RotateCw, color: 'bg-orange-500', description: 'Repeat actions' },
  { type: 'human_input', label: 'Human Input', icon: MessageSquare, color: 'bg-pink-500', description: 'Wait for human approval' }
];

export default function NodePalette({ agents, skills, installations }) {
  const handleDragStart = (e, nodeType) => {
    e.dataTransfer.setData('nodeType', JSON.stringify(nodeType));
  };

  return (
    <div className="w-64 bg-slate-900 border-r border-slate-800 overflow-y-auto">
      <div className="p-4">
        <h3 className="text-sm font-semibold text-slate-400 mb-3">Node Palette</h3>
        <div className="space-y-2">
          {NODE_TYPES.map((nodeType) => {
            const Icon = nodeType.icon;
            return (
              <div
                key={nodeType.type}
                draggable
                onDragStart={(e) => handleDragStart(e, nodeType)}
                className="p-3 bg-slate-950 rounded-lg border border-slate-800 cursor-grab active:cursor-grabbing hover:border-slate-700 transition-colors"
              >
                <div className="flex items-center gap-3 mb-2">
                  <div className={`w-8 h-8 rounded-lg ${nodeType.color} flex items-center justify-center`}>
                    <Icon className="w-4 h-4 text-white" />
                  </div>
                  <span className="text-sm font-medium text-white">{nodeType.label}</span>
                </div>
                <p className="text-xs text-slate-500">{nodeType.description}</p>
              </div>
            );
          })}
        </div>
      </div>

      <div className="p-4 border-t border-slate-800">
        <h3 className="text-sm font-semibold text-slate-400 mb-3">Available Resources</h3>
        <div className="space-y-3">
          <div>
            <div className="text-xs text-slate-500 mb-1">Agents</div>
            <div className="text-sm text-white">{agents.length} available</div>
          </div>
          <div>
            <div className="text-xs text-slate-500 mb-1">Skills</div>
            <div className="text-sm text-white">{skills.length} available</div>
          </div>
          <div>
            <div className="text-xs text-slate-500 mb-1">Installed</div>
            <div className="text-sm text-white">{installations.length} skills</div>
          </div>
        </div>
      </div>
    </div>
  );
}