import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Network, Clock, GitBranch } from 'lucide-react';
import { base44 } from '@/api/base44Client';
import NetworkGraph from './memory-viz/NetworkGraph';
import TimelineView from './memory-viz/TimelineView';
import RetrievalPaths from './memory-viz/RetrievalPaths';

export default function MemoryVisualization({ agentId }) {
  const [memories, setMemories] = useState([]);

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
            <NetworkGraph memories={memories} />
          </TabsContent>

          <TabsContent value="timeline" className="mt-4">
            <TimelineView memories={memories} />
          </TabsContent>

          <TabsContent value="paths" className="mt-4">
            <RetrievalPaths memories={memories} />
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
}