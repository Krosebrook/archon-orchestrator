import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Network, Clock, GitBranch, Zap, Eye } from 'lucide-react';
import { base44 } from '@/api/base44Client';
import { format, parseISO } from 'date-fns';

export default function MemoryVisualization({ agentId }) {
  const [memories, setMemories] = useState([]);
  const [selectedMemory, setSelectedMemory] = useState(null);

  useEffect(() => {
    loadMemories();
  }, [agentId]);

  const loadMemories = async () => {
    try {
      const data = await base44.entities.AgentMemory.filter(
        { agent_id: agentId },
        '-created_date',
        100
      );
      setMemories(data);
    } catch (error) {
      console.error('Failed to load memories:', error);
    }
  };

  const getMemoryConnections = (memory) => {
    return memories.filter(m => 
      m.id !== memory.id &&
      (m.tags?.some(tag => memory.tags?.includes(tag)) ||
       m.context?.toLowerCase().includes(memory.context?.toLowerCase().split(' ')[0] || ''))
    );
  };

  const timelineGroups = memories.reduce((acc, memory) => {
    const date = format(parseISO(memory.created_date), 'yyyy-MM-dd');
    if (!acc[date]) acc[date] = [];
    acc[date].push(memory);
    return acc;
  }, {});

  return (
    <Card className="bg-slate-900 border-slate-800">
      <CardHeader>
        <CardTitle className="text-white flex items-center gap-2">
          <Network className="w-5 h-5" />
          Memory Visualization
        </CardTitle>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="network" className="w-full">
          <TabsList className="grid w-full grid-cols-3 bg-slate-800">
            <TabsTrigger value="network">
              <Network className="w-4 h-4 mr-2" />
              Network
            </TabsTrigger>
            <TabsTrigger value="timeline">
              <Clock className="w-4 h-4 mr-2" />
              Timeline
            </TabsTrigger>
            <TabsTrigger value="paths">
              <GitBranch className="w-4 h-4 mr-2" />
              Retrieval Paths
            </TabsTrigger>
          </TabsList>

          <TabsContent value="network" className="mt-4">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
              <div className="lg:col-span-2 p-4 bg-slate-950 rounded-lg border border-slate-800 min-h-[500px] relative overflow-auto">
                <div className="absolute inset-0 flex items-center justify-center">
                  <svg className="w-full h-full">
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
                            fill={
                              memory.memory_type === 'short_term' ? '#3b82f6' :
                              memory.memory_type === 'long_term' ? '#8b5cf6' :
                              memory.memory_type === 'episodic' ? '#10b981' :
                              '#f59e0b'
                            }
                            opacity="0.7"
                            className="cursor-pointer hover:opacity-100 transition-opacity"
                            onClick={() => setSelectedMemory(memory)}
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
          </TabsContent>

          <TabsContent value="timeline" className="mt-4">
            <div className="space-y-4 max-h-[600px] overflow-y-auto">
              {Object.entries(timelineGroups).sort((a, b) => b[0].localeCompare(a[0])).map(([date, dayMemories]) => (
                <div key={date} className="relative pl-8 pb-4">
                  <div className="absolute left-0 top-0 bottom-0 w-0.5 bg-slate-800"></div>
                  <div className="absolute left-[-4px] top-2 w-3 h-3 rounded-full bg-blue-500 border-2 border-slate-900"></div>
                  
                  <div className="mb-2">
                    <span className="text-sm font-medium text-white">{format(parseISO(date), 'MMM d, yyyy')}</span>
                  </div>
                  
                  <div className="space-y-2">
                    {dayMemories.map((memory) => (
                      <div key={memory.id} className="p-3 bg-slate-950 rounded-lg border border-slate-800 hover:border-slate-700 transition-colors">
                        <div className="flex items-start justify-between mb-2">
                          <Badge variant="outline" className="bg-blue-500/20 text-blue-400 border-blue-500/30 text-xs">
                            {memory.memory_type}
                          </Badge>
                          <span className="text-xs text-slate-500">
                            {format(parseISO(memory.created_date), 'h:mm a')}
                          </span>
                        </div>
                        <p className="text-sm text-slate-300 mb-2">{memory.content?.text}</p>
                        {memory.tags && memory.tags.length > 0 && (
                          <div className="flex flex-wrap gap-1">
                            {memory.tags.map((tag, idx) => (
                              <span key={idx} className="text-xs px-2 py-0.5 bg-slate-800 text-slate-400 rounded">
                                {tag}
                              </span>
                            ))}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </TabsContent>

          <TabsContent value="paths" className="mt-4">
            <div className="space-y-4">
              {memories.filter(m => m.access_count > 0).sort((a, b) => b.access_count - a.access_count).slice(0, 10).map((memory, idx) => {
                const connections = getMemoryConnections(memory);
                return (
                  <div key={memory.id} className="p-4 bg-slate-950 rounded-lg border border-slate-800">
                    <div className="flex items-start gap-3">
                      <div className="flex-shrink-0">
                        <div className="w-8 h-8 rounded-full bg-purple-500/20 flex items-center justify-center">
                          <span className="text-sm font-medium text-purple-400">#{idx + 1}</span>
                        </div>
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <Badge variant="outline" className="text-xs">
                            {memory.memory_type}
                          </Badge>
                          <Badge variant="outline" className="bg-green-500/20 text-green-400 border-green-500/30 text-xs">
                            <Zap className="w-3 h-3 mr-1" />
                            {memory.access_count} accesses
                          </Badge>
                        </div>
                        <p className="text-sm text-slate-300 mb-2">{memory.content?.text}</p>
                        
                        {connections.length > 0 && (
                          <div className="mt-3 pl-4 border-l-2 border-slate-800">
                            <div className="text-xs text-slate-400 mb-2">Connected to {connections.length} memories:</div>
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
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
}