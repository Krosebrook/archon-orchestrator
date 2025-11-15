import { useState, useEffect } from 'react';
import { WorkflowVersion } from '@/entities/WorkflowVersion';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { GitCommit, Eye } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';

export default function VersionHistory({ workflowId }) {
  const [versions, setVersions] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const loadVersions = async () => {
      setIsLoading(true);
      try {
        const data = await WorkflowVersion.filter({ workflow_id: workflowId }, '-created_date');
        setVersions(data);
      } catch (error) {
        console.error("Failed to load workflow versions:", error);
      } finally {
        setIsLoading(false);
      }
    };
    if (workflowId) {
      loadVersions();
    }
  }, [workflowId]);

  return (
    <Card className="bg-slate-900 border-slate-800">
      <CardHeader>
        <CardTitle>Version History</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="rounded-lg border border-slate-700">
          <Table>
            <TableHeader>
              <TableRow className="border-b-slate-700 hover:bg-slate-900">
                <TableHead className="text-slate-400">Version</TableHead>
                <TableHead className="text-slate-400">Description</TableHead>
                <TableHead className="text-slate-400">Date</TableHead>
                <TableHead className="text-slate-400">Status</TableHead>
                <TableHead><span className="sr-only">Actions</span></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {versions.map(version => (
                <TableRow key={version.id} className="border-b-slate-700">
                  <TableCell className="font-mono text-white flex items-center gap-2">
                    <GitCommit className="w-4 h-4 text-slate-500" />
                    {version.version}
                  </TableCell>
                  <TableCell className="text-slate-300">{version.changelog}</TableCell>
                  <TableCell className="text-slate-400">
                    {formatDistanceToNow(new Date(version.created_date), { addSuffix: true })}
                  </TableCell>
                  <TableCell>
                    {version.is_active && <Badge className="bg-green-500/20 text-green-400">Active</Badge>}
                  </TableCell>
                  <TableCell className="text-right">
                    <Button variant="outline" size="sm" className="mr-2">Revert to this version</Button>
                    <Button variant="ghost" size="sm"><Eye className="w-4 h-4 mr-2" />View Spec</Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </CardContent>
    </Card>
  );
}