import { useState } from 'react';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import { 
  Bot, 
  Zap, 
  GitBranch, 
  Database, 
  MessageSquare, 
  RotateCw,
  Play,
  Search,
  ChevronDown,
  ChevronRight,
  Sparkles,
  Clock,
  Filter,
  Webhook
} from 'lucide-react';

const NODE_CATEGORIES = [
  {
    name: 'AI Agents',
    icon: Bot,
    nodes: [
      { type: 'agent', label: 'Agent Action', icon: Bot, color: 'bg-blue-500', description: 'Execute an AI agent with specific instructions' },
      { type: 'skill', label: 'Run Skill', icon: Zap, color: 'bg-purple-500', description: 'Execute a skill from the marketplace' },
      { type: 'memory', label: 'Memory Access', icon: Database, color: 'bg-green-500', description: 'Read or write agent memory' }
    ]
  },
  {
    name: 'Control Flow',
    icon: GitBranch,
    nodes: [
      { type: 'condition', label: 'Conditional', icon: GitBranch, color: 'bg-yellow-500', description: 'Branch based on a condition' },
      { type: 'loop', label: 'Loop', icon: RotateCw, color: 'bg-orange-500', description: 'Repeat actions multiple times' },
      { type: 'parallel', label: 'Parallel Split', icon: Sparkles, color: 'bg-cyan-500', description: 'Execute multiple branches in parallel' }
    ]
  },
  {
    name: 'Interactions',
    icon: MessageSquare,
    nodes: [
      { type: 'human_input', label: 'Human Review', icon: MessageSquare, color: 'bg-pink-500', description: 'Wait for human approval' },
      { type: 'pause', label: 'Wait/Delay', icon: Clock, color: 'bg-slate-500', description: 'Pause execution for a duration' },
      { type: 'webhook', label: 'Webhook', icon: Webhook, color: 'bg-indigo-500', description: 'Trigger external webhook' }
    ]
  },
  {
    name: 'Triggers',
    icon: Play,
    nodes: [
      { type: 'trigger', label: 'Start', icon: Play, color: 'bg-emerald-500', description: 'Workflow entry point' },
      { type: 'filter', label: 'Filter', icon: Filter, color: 'bg-teal-500', description: 'Filter data based on criteria' }
    ]
  }
];

export default function NodeLibrary({ agents, skills, onNodeAdd }) {
  const [search, setSearch] = useState('');
  const [expandedCategories, setExpandedCategories] = useState(
    NODE_CATEGORIES.reduce((acc, cat) => ({ ...acc, [cat.name]: true }), {})
  );

  const toggleCategory = (name) => {
    setExpandedCategories(prev => ({ ...prev, [name]: !prev[name] }));
  };

  const handleDragStart = (e, nodeType) => {
    e.dataTransfer.setData('nodeType', JSON.stringify(nodeType));
    e.dataTransfer.effectAllowed = 'copy';
  };

  const filteredCategories = NODE_CATEGORIES.map(cat => ({
    ...cat,
    nodes: cat.nodes.filter(node => 
      node.label.toLowerCase().includes(search.toLowerCase()) ||
      node.description.toLowerCase().includes(search.toLowerCase())
    )
  })).filter(cat => cat.nodes.length > 0);

  return (
    <div className="w-72 bg-slate-900 rounded-lg border border-slate-800 flex flex-col overflow-hidden">
      {/* Header */}
      <div className="p-4 border-b border-slate-800">
        <h3 className="text-sm font-semibold text-white mb-3">Node Library</h3>
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search nodes..."
            className="pl-9 bg-slate-950 border-slate-700 text-sm"
          />
        </div>
      </div>

      {/* Node Categories */}
      <ScrollArea className="flex-1">
        <div className="p-3 space-y-2">
          {filteredCategories.map((category) => {
            const CategoryIcon = category.icon;
            const isExpanded = expandedCategories[category.name];

            return (
              <div key={category.name}>
                <button
                  onClick={() => toggleCategory(category.name)}
                  className="w-full flex items-center gap-2 px-2 py-1.5 text-sm font-medium text-slate-300 hover:text-white transition-colors"
                >
                  {isExpanded ? (
                    <ChevronDown className="w-4 h-4 text-slate-500" />
                  ) : (
                    <ChevronRight className="w-4 h-4 text-slate-500" />
                  )}
                  <CategoryIcon className="w-4 h-4 text-slate-400" />
                  <span>{category.name}</span>
                  <Badge variant="secondary" className="ml-auto text-xs bg-slate-800">
                    {category.nodes.length}
                  </Badge>
                </button>

                {isExpanded && (
                  <div className="mt-1 ml-6 space-y-1.5">
                    {category.nodes.map((nodeType) => {
                      const NodeIcon = nodeType.icon;
                      return (
                        <div
                          key={nodeType.type}
                          draggable
                          onDragStart={(e) => handleDragStart(e, nodeType)}
                          onClick={() => onNodeAdd(nodeType)}
                          className="p-2.5 bg-slate-950 rounded-lg border border-slate-800 cursor-grab active:cursor-grabbing hover:border-slate-700 hover:bg-slate-900 transition-all group"
                        >
                          <div className="flex items-center gap-2.5">
                            <div className={`w-8 h-8 rounded-lg ${nodeType.color} flex items-center justify-center shadow-sm`}>
                              <NodeIcon className="w-4 h-4 text-white" />
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className="text-sm font-medium text-white group-hover:text-blue-400 transition-colors">
                                {nodeType.label}
                              </div>
                              <div className="text-xs text-slate-500 truncate">
                                {nodeType.description}
                              </div>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </ScrollArea>

      {/* Resources Summary */}
      <div className="p-3 border-t border-slate-800 bg-slate-950/50">
        <div className="text-xs text-slate-500 mb-2">Available Resources</div>
        <div className="grid grid-cols-2 gap-2">
          <div className="bg-slate-800 rounded-lg p-2">
            <div className="text-lg font-bold text-white">{agents.length}</div>
            <div className="text-xs text-slate-400">Agents</div>
          </div>
          <div className="bg-slate-800 rounded-lg p-2">
            <div className="text-lg font-bold text-white">{skills.length}</div>
            <div className="text-xs text-slate-400">Skills</div>
          </div>
        </div>
      </div>
    </div>
  );
}