import { useState } from 'react';
import { Badge } from '@/components/ui/badge';
import { Eye } from 'lucide-react';

export default function NetworkGraph({ memories, onMemorySelect }) {
  const [selectedMemory, setSelectedMemory] = useState(null);

  const getMemoryConnections = (memory) => {
    return memories.filter(m => 
      m.id !== memory.id &&
      (m.tags?.some(tag => memory.tags?.includes(tag)) ||
       m.context?.toLowerCase().includes(memory.context?.toLowerCase().split(' ')[0] || ''))
    );
  };

  const handleMemoryClick = (memory) => {
    setSelectedMemory(memory);
    onMemorySelect?.(memory);
  };

  const getMemoryColor = (memoryType) => {
    const colors = {
      short_term: '#3b82f6',
      long_term: '#8b5cf6',
      episodic: '#10b981',
      semantic: '#f59e0b'
    };
    return colors[memoryType] || '#64748b';
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
      <div className="lg:col-span-2 p-4 bg-slate-950 rounded-lg border border-slate-800 min-h-[500px] relative overflow-auto">
        <div className="absolute inset-0 flex items-center justify-center">
          <svg className="w-full h-full" viewBox="0 0 500 500">
            {memories.map((memory, idx) => {
              const angle = (idx / memories.length) * 2 * Math.PI;
              const radius = 180;
              const x = 250 + radius * Math.cos(angle);
              const y = 250 + radius * Math.sin(angle);
              
              return (
                <g key={memory.id}>
                  {getMemoryConnections(memory).slice(0, 3).map((connected) => {
                    const connIdx = memories.findIndex(m => m.id === connected.id);
                    const connAngle = (connIdx / memories.length) * 2 * Math.PI;
                    const connX = 250 + radius * Math.cos(connAngle);
                    const connY = 250 + radius * Math.sin(connAngle);
                    return (
                      <line
                        key={`${memory.id}-${connected.id}`}
                        x1={x}
                        y1={y}
                        x2={connX}
                        y2={connY}
                        stroke="#334155"
                        strokeWidth="1"
                        opacity="0.3"
                      />
                    );
                  })}
                  <circle
                    cx={x}
                    cy={y}
                    r={memory.importance / 5}
                    fill={getMemoryColor(memory.memory_type)}
                    opacity="0.7"
                    className="cursor-pointer hover:opacity-100 transition-opacity"
                    onClick={() => handleMemoryClick(memory)}
                  />
                  <text
                    x={x}
                    y={y - (memory.importance / 5) - 5}
                    textAnchor="middle"
                    fill="#94a3b8"
                    fontSize="10"
                    className="pointer-events-none"
                  >
                    {memory.content?.text?.substring(0, 15)}...
                  </text>
                </g>
              );
            })}
          </svg>
        </div>
      </div>

      <div className="space-y-3">
        <div className="p-3 bg-slate-950 rounded-lg border border-slate-800">
          <div className="text-xs text-slate-400 mb-2">Legend</div>
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-blue-500"></div>
              <span className="text-xs text-slate-300">Short-term</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-purple-500"></div>
              <span className="text-xs text-slate-300">Long-term</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-green-500"></div>
              <span className="text-xs text-slate-300">Episodic</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-amber-500"></div>
              <span className="text-xs text-slate-300">Semantic</span>
            </div>
          </div>
        </div>

        {selectedMemory && (
          <div className="p-3 bg-slate-950 rounded-lg border border-slate-800">
            <div className="flex items-center gap-2 mb-2">
              <Eye className="w-4 h-4 text-blue-400" />
              <span className="text-sm font-medium text-white">Selected</span>
            </div>
            <Badge variant="outline" className="mb-2 text-xs">
              {selectedMemory.memory_type}
            </Badge>
            <p className="text-xs text-slate-300 mb-2">{selectedMemory.content?.text}</p>
            <div className="text-xs text-slate-500">
              Connections: {getMemoryConnections(selectedMemory).length}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}