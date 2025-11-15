import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { GitFork, Bot, ArrowRight } from 'lucide-react';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { formatDistanceToNow } from 'date-fns';


const statusStyles = {
    running: "bg-blue-500/20 text-blue-400 border-blue-500/30",
    completed: "bg-green-500/20 text-green-400 border-green-500/30",
    failed: "bg-red-500/20 text-red-400 border-red-500/30",
    pending: "bg-yellow-500/20 text-yellow-400 border-yellow-500/30",
    cancelled: "bg-slate-500/20 text-slate-400 border-slate-500/30"
};

export default function ActiveRuns({ runs, workflows, agents, isLoading }) {
  const getWorkflowName = (id) => workflows.find(w => w.id === id)?.name || 'Unknown';
  const getAgentName = (id) => agents.find(a => a.id === id)?.name || 'Unknown';

  return (
    <Card className="bg-slate-900 border-slate-800 col-span-1 lg:col-span-3">
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle className="text-lg font-semibold text-white">Recent Runs</CardTitle>
        <Link to={createPageUrl('Runs')} className="text-sm text-blue-400 hover:underline flex items-center gap-1">
          View All <ArrowRight className="w-4 h-4" />
        </Link>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow className="border-slate-800 hover:bg-slate-900">
              <TableHead className="text-slate-400">Workflow</TableHead>
              <TableHead className="text-slate-400">Agent</TableHead>
              <TableHead className="text-slate-400">Status</TableHead>
              <TableHead className="text-slate-400">Started</TableHead>
              <TableHead className="text-slate-400 text-right">Cost</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              Array(5).fill(0).map((_, i) => (
                <TableRow key={i} className="border-slate-800">
                  <TableCell><Skeleton className="h-4 w-32" /></TableCell>
                  <TableCell><Skeleton className="h-4 w-24" /></TableCell>
                  <TableCell><Skeleton className="h-6 w-20 rounded-md" /></TableCell>
                  <TableCell><Skeleton className="h-4 w-28" /></TableCell>
                  <TableCell className="text-right"><Skeleton className="h-4 w-16 ml-auto" /></TableCell>
                </TableRow>
              ))
            ) : (
              runs.map(run => (
                <TableRow key={run.id} className="border-slate-800 hover:bg-slate-800/50">
                  <TableCell className="font-medium text-white flex items-center gap-2">
                    <GitFork className="w-4 h-4 text-slate-500"/> {getWorkflowName(run.workflow_id)}
                  </TableCell>
                  <TableCell className="text-slate-300 flex items-center gap-2">
                    <Bot className="w-4 h-4 text-slate-500"/> {getAgentName(run.agent_id)}
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline" className={`capitalize ${statusStyles[run.state]}`}>
                        {run.state}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-slate-400">
                    {formatDistanceToNow(new Date(run.started_at), { addSuffix: true })}
                  </TableCell>
                  <TableCell className="text-right font-mono text-slate-300">
                    ${(run.cost_cents / 100).toFixed(2)}
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}