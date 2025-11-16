import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Users, Brain } from 'lucide-react';
import { base44 } from '@/api/base44Client';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';

export default function CollaborationWidget() {
  const [collaborations, setCollaborations] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadCollaborations();
    const interval = setInterval(loadCollaborations, 10000);
    return () => clearInterval(interval);
  }, []);

  const loadCollaborations = async () => {
    try {
      const data = await base44.entities.AgentCollaboration.filter(
        { state: 'active' },
        '-created_date',
        5
      );
      setCollaborations(data);
    } catch (error) {
      console.error('Failed to load collaborations:', error);
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading) {
    return (
      <Card className="bg-slate-900 border-slate-800">
        <CardContent className="p-8 text-center">
          <div className="h-20 bg-slate-800 rounded animate-pulse" />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="bg-slate-900 border-slate-800">
      <CardHeader>
        <CardTitle className="text-white flex items-center gap-2">
          <Users className="w-5 h-5 text-blue-400" />
          Active Collaborations
        </CardTitle>
      </CardHeader>
      <CardContent>
        {collaborations.length === 0 ? (
          <div className="text-center py-8 text-slate-400">
            <Brain className="w-12 h-12 mx-auto mb-3 text-slate-600" />
            <p className="text-sm">No active collaborations</p>
          </div>
        ) : (
          <div className="space-y-2">
            {collaborations.map((collab) => (
              <Link key={collab.id} to={createPageUrl('OrchestrationHub')}>
                <div className="p-3 bg-slate-950 rounded-lg border border-slate-800 hover:border-slate-700 transition-colors">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-sm text-white">{collab.name}</span>
                    <Badge variant="outline" className="bg-blue-500/20 text-blue-400 border-blue-500/30 text-xs">
                      {collab.strategy}
                    </Badge>
                  </div>
                  <div className="flex items-center gap-3 text-xs text-slate-400">
                    <span>{collab.participant_agents?.length || 0} agents</span>
                    <span>•</span>
                    <span>{collab.decisions?.length || 0} decisions</span>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}