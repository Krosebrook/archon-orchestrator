import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Network } from 'lucide-react';

export default function WorkflowAssignment({ agents, workflows }) {
  return (
    <Card className="bg-slate-900 border-slate-800">
      <CardHeader>
        <CardTitle className="text-white flex items-center gap-2">
          <Network className="w-5 h-5" />
          Workflow Assignments
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {workflows.slice(0, 10).map((workflow) => (
            <div key={workflow.id} className="p-3 bg-slate-950 rounded-lg border border-slate-800">
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-white font-medium mb-1">{workflow.name}</div>
                  <div className="text-xs text-slate-400">v{workflow.version}</div>
                </div>
                <Badge variant="outline" className="bg-slate-800 border-slate-700">
                  Auto-assigned
                </Badge>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}