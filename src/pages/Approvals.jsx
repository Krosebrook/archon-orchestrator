import { useState, useEffect } from 'react';
import { ApprovalRequest, Workflow } from '@/entities/all';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Check, X, GitFork } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { toast } from 'sonner';

export default function Approvals() {
  const [requests, setRequests] = useState([]);
  const [workflows, setWorkflows] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setIsLoading(true);
    try {
      const [reqData, wfData] = await Promise.all([
        ApprovalRequest.filter({ status: 'pending' }, '-created_date'),
        Workflow.list(),
      ]);
      setRequests(reqData);
      setWorkflows(wfData);
    } catch (error) {
      console.error("Failed to load approval requests:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const getWorkflowName = (id) => workflows.find(w => w.id === id)?.name || 'Unknown';

  const handleDecision = async (requestId, decision) => {
    const originalRequests = [...requests];
    setRequests(requests.filter(r => r.id !== requestId));

    try {
      await ApprovalRequest.update(requestId, { status: decision });
      toast.success(`Request has been ${decision}.`);
    } catch (error) {
      console.error(`Failed to ${decision} request:`, error);
      toast.error(`Failed to ${decision} request.`);
      setRequests(originalRequests); // Revert on failure
    }
  };

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-white">Pending Approvals</h1>
        <p className="text-slate-400">Review and act on workflow runs waiting for manual approval.</p>
      </div>

      <Card className="bg-slate-900 border-slate-800">
        <CardContent>
          <div className="rounded-lg border border-slate-700">
            <Table>
              <TableHeader>
                <TableRow className="border-b-slate-700 hover:bg-slate-900">
                  <TableHead className="text-slate-400">Workflow</TableHead>
                  <TableHead className="text-slate-400">Run ID</TableHead>
                  <TableHead className="text-slate-400">Step</TableHead>
                  <TableHead className="text-slate-400">Requested</TableHead>
                  <TableHead className="text-slate-400 text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {requests.map(req => (
                  <TableRow key={req.id} className="border-b-slate-700">
                    <TableCell className="font-medium text-white flex items-center gap-2">
                      <GitFork className="w-4 h-4 text-slate-500" />
                      {getWorkflowName(req.workflow_id)}
                    </TableCell>
                    <TableCell className="font-mono text-sm text-slate-400">{req.run_id}</TableCell>
                    <TableCell className="text-slate-300">{req.step_name}</TableCell>
                    <TableCell className="text-slate-400">
                      {formatDistanceToNow(new Date(req.created_date), { addSuffix: true })}
                    </TableCell>
                    <TableCell className="text-right">
                      <Button onClick={() => handleDecision(req.id, 'rejected')} variant="destructive" size="sm" className="mr-2"><X className="w-4 h-4 mr-1"/>Reject</Button>
                      <Button onClick={() => handleDecision(req.id, 'approved')} variant="outline" className="bg-green-500/20 text-green-400 border-green-500/30 hover:bg-green-500/30"><Check className="w-4 h-4 mr-1"/>Approve</Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}