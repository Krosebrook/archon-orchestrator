import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Eye, Search } from 'lucide-react';
import { createPageUrl } from '@/utils';
import { format, parseISO } from 'date-fns';

export default function RunHistoryTable({ runs, agents, workflows }) {
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState('');

  const getStatusColor = (state) => {
    switch (state) {
      case 'completed': return 'bg-green-500/20 text-green-400 border-green-500/30';
      case 'running': return 'bg-blue-500/20 text-blue-400 border-blue-500/30';
      case 'failed': return 'bg-red-500/20 text-red-400 border-red-500/30';
      case 'pending': return 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30';
      default: return 'bg-slate-500/20 text-slate-400 border-slate-500/30';
    }
  };

  const filteredRuns = runs.filter(run => {
    const workflow = workflows.find(w => w.id === run.workflow_id);
    const agent = agents.find(a => a.id === run.agent_id);
    
    return !searchQuery || 
      workflow?.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      agent?.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      run.state.toLowerCase().includes(searchQuery.toLowerCase());
  });

  return (
    <Card className="bg-slate-900 border-slate-800">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="text-white">Run History</CardTitle>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <Input
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search runs..."
              className="pl-9 bg-slate-950 border-slate-700 text-white w-64"
            />
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-slate-800">
                <th className="text-left py-3 px-4 text-sm font-medium text-slate-400">Workflow</th>
                <th className="text-left py-3 px-4 text-sm font-medium text-slate-400">Agent</th>
                <th className="text-left py-3 px-4 text-sm font-medium text-slate-400">Status</th>
                <th className="text-left py-3 px-4 text-sm font-medium text-slate-400">Started</th>
                <th className="text-right py-3 px-4 text-sm font-medium text-slate-400">Cost</th>
                <th className="text-right py-3 px-4 text-sm font-medium text-slate-400">Tokens</th>
                <th className="text-right py-3 px-4 text-sm font-medium text-slate-400">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredRuns.map(run => {
                const workflow = workflows.find(w => w.id === run.workflow_id);
                const agent = agents.find(a => a.id === run.agent_id);
                
                return (
                  <tr key={run.id} className="border-b border-slate-800 hover:bg-slate-800/50">
                    <td className="py-3 px-4 text-sm text-white">{workflow?.name || 'Unknown'}</td>
                    <td className="py-3 px-4 text-sm text-slate-400">{agent?.name || 'Unknown'}</td>
                    <td className="py-3 px-4">
                      <Badge variant="outline" className={getStatusColor(run.state)}>
                        {run.state}
                      </Badge>
                    </td>
                    <td className="py-3 px-4 text-sm text-slate-400">
                      {format(parseISO(run.started_at), 'MMM d, HH:mm:ss')}
                    </td>
                    <td className="py-3 px-4 text-sm text-right text-slate-400">
                      ${((run.cost_cents || 0) / 100).toFixed(3)}
                    </td>
                    <td className="py-3 px-4 text-sm text-right text-slate-400">
                      {(run.tokens_in || 0) + (run.tokens_out || 0)}
                    </td>
                    <td className="py-3 px-4 text-right">
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => navigate(createPageUrl(`RunDetail?id=${run.id}`))}
                        className="text-blue-400 hover:text-blue-300"
                      >
                        <Eye className="w-4 h-4" />
                      </Button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </CardContent>
    </Card>
  );
}