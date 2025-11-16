import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Users, Brain, Eye } from 'lucide-react';

export default function CollaborationControl({ agents, workflows, collaborations, onSelect }) {
  return (
    <Card className="bg-slate-900 border-slate-800">
      <CardHeader>
        <CardTitle className="text-white flex items-center gap-2">
          <Users className="w-5 h-5" />
          Active Collaborations
        </CardTitle>
      </CardHeader>
      <CardContent>
        {collaborations.length === 0 ? (
          <div className="text-center py-12 text-slate-400">
            <Brain className="w-12 h-12 mx-auto mb-3 text-slate-600" />
            No active collaborations
          </div>
        ) : (
          <div className="space-y-3">
            {collaborations.map((collab) => (
              <div key={collab.id} className="p-3 bg-slate-950 rounded-lg border border-slate-800">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="flex items-center gap-2 mb-2">
                      <span className="text-white font-medium">{collab.name}</span>
                      <Badge variant="outline" className="bg-blue-500/20 text-blue-400 border-blue-500/30">
                        {collab.strategy}
                      </Badge>
                    </div>
                    <div className="text-xs text-slate-400">
                      {collab.participant_agents?.length || 0} agents participating
                    </div>
                  </div>
                  <Button
                    size="sm"
                    onClick={() => onSelect?.(collab)}
                    className="bg-blue-600 hover:bg-blue-700"
                  >
                    <Eye className="w-4 h-4 mr-1" />
                    View
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}