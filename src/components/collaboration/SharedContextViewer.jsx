import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Database, Brain, MessageSquare } from 'lucide-react';

export default function SharedContextViewer({ collaborations, agents }) {
  const [selectedCollab, setSelectedCollab] = useState(collaborations[0]?.id);
  
  const collab = collaborations.find(c => c.id === selectedCollab);
  const participantAgents = collab?.participant_agents?.map(id => 
    agents.find(a => a.id === id)
  ).filter(Boolean) || [];

  return (
    <div className="space-y-6">
      <Card className="bg-slate-900 border-slate-800">
        <CardHeader>
          <CardTitle className="text-white">Select Collaboration Session</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex gap-2 flex-wrap">
            {collaborations.map(c => (
              <Badge
                key={c.id}
                variant={selectedCollab === c.id ? "default" : "outline"}
                className={`cursor-pointer ${selectedCollab === c.id ? 'bg-blue-600' : ''}`}
                onClick={() => setSelectedCollab(c.id)}
              >
                {c.name}
              </Badge>
            ))}
          </div>
        </CardContent>
      </Card>

      {collab && (
        <Card className="bg-slate-900 border-slate-800">
          <CardHeader>
            <CardTitle className="text-white">Shared Context: {collab.name}</CardTitle>
          </CardHeader>
          <CardContent>
            <Tabs defaultValue="context" className="w-full">
              <TabsList className="grid w-full grid-cols-3 bg-slate-800">
                <TabsTrigger value="context">
                  <Database className="w-4 h-4 mr-2" />
                  Context
                </TabsTrigger>
                <TabsTrigger value="decisions">
                  <Brain className="w-4 h-4 mr-2" />
                  Decisions
                </TabsTrigger>
                <TabsTrigger value="participants">
                  <MessageSquare className="w-4 h-4 mr-2" />
                  Participants
                </TabsTrigger>
              </TabsList>

              <TabsContent value="context" className="mt-4">
                <div className="p-4 bg-slate-950 rounded-lg">
                  <pre className="text-sm text-slate-300 whitespace-pre-wrap">
                    {JSON.stringify(collab.shared_context, null, 2)}
                  </pre>
                </div>
              </TabsContent>

              <TabsContent value="decisions" className="mt-4 space-y-2">
                {collab.decisions?.map((decision, idx) => (
                  <div key={idx} className="p-4 bg-slate-950 rounded-lg border border-slate-800">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm text-slate-400">
                        Agent: {agents.find(a => a.id === decision.agent_id)?.name || 'Unknown'}
                      </span>
                      <Badge variant="outline" className="bg-green-500/20 text-green-400">
                        Confidence: {(decision.confidence * 100).toFixed(0)}%
                      </Badge>
                    </div>
                    <p className="text-sm text-white">{decision.decision}</p>
                    <p className="text-xs text-slate-500 mt-2">
                      {new Date(decision.timestamp).toLocaleString()}
                    </p>
                  </div>
                ))}
              </TabsContent>

              <TabsContent value="participants" className="mt-4 space-y-2">
                {participantAgents.map(agent => (
                  <div key={agent.id} className="p-4 bg-slate-950 rounded-lg border border-slate-800">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-white">{agent.name}</p>
                        <p className="text-xs text-slate-400">
                          {agent.config?.provider} - {agent.config?.model}
                        </p>
                      </div>
                      <Badge variant="outline" className="capitalize">
                        {agent.status}
                      </Badge>
                    </div>
                  </div>
                ))}
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>
      )}
    </div>
  );
}