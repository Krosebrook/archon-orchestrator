import React from 'react';
import { Badge } from '@/components/ui/badge';
import { Zap } from 'lucide-react';

export default function RetrievalPaths({ memories }) {
  const getMemoryConnections = (memory) => {
    return memories.filter(m => 
      m.id !== memory.id &&
      (m.tags?.some(tag => memory.tags?.includes(tag)) ||
       m.context?.toLowerCase().includes(memory.context?.toLowerCase().split(' ')[0] || ''))
    );
  };

  const topMemories = memories
    .filter(m => m.access_count > 0)
    .sort((a, b) => b.access_count - a.access_count)
    .slice(0, 10);

  return (
    <div className="space-y-4">
      {topMemories.map((memory, idx) => {
        const connections = getMemoryConnections(memory);
        return (
          <div
            key={memory.id}
            className="p-4 bg-slate-950 rounded-lg border border-slate-800"
          >
            <div className="flex items-start gap-3">
              <div className="flex-shrink-0">
                <div className="w-8 h-8 rounded-full bg-purple-500/20 flex items-center justify-center">
                  <span className="text-sm font-medium text-purple-400">
                    #{idx + 1}
                  </span>
                </div>
              </div>
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-2">
                  <Badge variant="outline" className="text-xs">
                    {memory.memory_type}
                  </Badge>
                  <Badge
                    variant="outline"
                    className="bg-green-500/20 text-green-400 border-green-500/30 text-xs"
                  >
                    <Zap className="w-3 h-3 mr-1" />
                    {memory.access_count} accesses
                  </Badge>
                </div>
                <p className="text-sm text-slate-300 mb-2">{memory.content?.text}</p>
                
                {connections.length > 0 && (
                  <div className="mt-3 pl-4 border-l-2 border-slate-800">
                    <div className="text-xs text-slate-400 mb-2">
                      Connected to {connections.length} memories:
                    </div>
                    <div className="space-y-1">
                      {connections.slice(0, 3).map((conn) => (
                        <div key={conn.id} className="text-xs text-slate-500">
                          → {conn.content?.text?.substring(0, 50)}...
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}