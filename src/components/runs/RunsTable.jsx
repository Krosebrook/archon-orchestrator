
import { useState, useEffect } from 'react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ArrowRight, Bot, GitFork, X } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { formatDistance } from 'date-fns';
import { Checkbox } from '@/components/ui/checkbox';

const statusStyles = {
    running: "bg-blue-500/20 text-blue-400 border-blue-500/30",
    completed: "bg-green-500/20 text-green-400 border-green-500/30",
    failed: "bg-red-500/20 text-red-400 border-red-500/30",
    pending: "bg-yellow-500/20 text-yellow-400 border-yellow-500/30",
    cancelled: "bg-slate-500/20 text-slate-400 border-slate-500/30"
};

export default function RunsTable({ runs, workflows, agents, isLoading, onRerunSelected, onCancelSelected }) {
  const getWorkflowName = (id) => workflows.find(w => w.id === id)?.name || 'Unknown Workflow';
  const getAgentName = (id) => agents.find(a => a.id === id)?.name || 'Unknown Agent';

  const [selectedRunIds, setSelectedRunIds] = useState(new Set());
  const [allRowsSelected, setAllRowsSelected] = useState(false);
  const [isIndeterminate, setIsIndeterminate] = useState(false);

  // Effect to ensure selected IDs are still present in the current runs list
  // This runs when the `runs` prop changes (e.g., filtering) or when selection changes.
  useEffect(() => {
    if (runs.length === 0) {
      setSelectedRunIds(new Set());
      setAllRowsSelected(false);
      setIsIndeterminate(false);
      return;
    }

    const currentRunIds = new Set(runs.map(run => run.id));
    const newSelectedRunIds = new Set([...selectedRunIds].filter(id => currentRunIds.has(id)));
    
    // Only update state if the derived selection is different from the current one.
    // This prevents an infinite loop.
    if (newSelectedRunIds.size !== selectedRunIds.size) {
        setSelectedRunIds(newSelectedRunIds);
    }
  // FIX: The error `React Hook useEffect has a missing dependency: 'selectedRunIds'`
  // occurred because this effect reads from `selectedRunIds` to calculate `newSelectedRunIds`
  // but did not declare it as a dependency. Adding it to the array ensures the effect
  // re-runs correctly when the selection changes, preventing stale state.
  }, [runs, selectedRunIds]);


  // Effect to update 'allRowsSelected' and 'isIndeterminate' flags based on current selection
  useEffect(() => {
    const selectedCount = selectedRunIds.size;
    const totalCount = runs.length;

    setAllRowsSelected(selectedCount === totalCount && totalCount > 0);
    setIsIndeterminate(selectedCount > 0 && selectedCount < totalCount);
  }, [selectedRunIds, runs.length]);


  const handleSelectAllClick = (checked) => {
    if (checked) {
      const newSelected = new Set(runs.map(run => run.id));
      setSelectedRunIds(newSelected);
    } else {
      setSelectedRunIds(new Set());
    }
  };

  const handleRowSelectClick = (runId) => {
    const newSelected = new Set(selectedRunIds);
    if (newSelected.has(runId)) {
      newSelected.delete(runId);
    } else {
      newSelected.add(runId);
    }
    setSelectedRunIds(newSelected);
  };

  const clearSelection = () => {
    setSelectedRunIds(new Set());
  };

  const handleRerun = () => {
    if (onRerunSelected) {
      onRerunSelected(Array.from(selectedRunIds));
      clearSelection(); // Clear selection after action
    }
  };

  const handleCancel = () => {
    if (onCancelSelected) {
      onCancelSelected(Array.from(selectedRunIds));
      clearSelection(); // Clear selection after action
    }
  };

  const hasSelected = selectedRunIds.size > 0;

  return (
    <div className="rounded-lg border border-slate-800 bg-slate-900">
      {hasSelected && (
        <div className="flex items-center justify-between px-4 py-3 border-b border-slate-800">
          <div className="flex items-center gap-2">
            <span className="text-sm font-medium text-white">{selectedRunIds.size} selected</span>
            <Button variant="ghost" size="sm" onClick={clearSelection} className="text-slate-400 hover:text-white">
              <X className="w-4 h-4 mr-1" /> Clear selection
            </Button>
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={handleRerun}
              disabled={isLoading || !hasSelected}
              className="text-white border-slate-700 hover:bg-slate-700/50"
            >
              Rerun Selected
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={handleCancel}
              disabled={isLoading || !hasSelected}
              className="text-red-400 border-red-700 hover:bg-red-900/50"
            >
              Cancel Selected
            </Button>
          </div>
        </div>
      )}
      <div className="overflow-x-auto">
        <Table className="min-w-[800px]">
          <TableHeader>
            <TableRow className="border-b-slate-800 hover:bg-slate-900">
              <TableHead className="w-[40px] pr-0"> {/* New column for checkbox */}
                  <Checkbox
                      checked={allRowsSelected}
                      onCheckedChange={handleSelectAllClick}
                      disabled={isLoading || runs.length === 0}
                      aria-label="Select all runs"
                      className="border-slate-600 data-[state=checked]:bg-white data-[state=checked]:text-slate-900"
                      indeterminate={isIndeterminate}
                  />
              </TableHead>
              <TableHead className="text-slate-400">Workflow</TableHead>
              <TableHead className="text-slate-400">Agent</TableHead>
              <TableHead className="text-slate-400">Status</TableHead>
              <TableHead className="text-slate-400">Duration</TableHead>
              <TableHead className="text-slate-400 text-right">Cost</TableHead>
              <TableHead><span className="sr-only">Details</span></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              Array(8).fill(0).map((_, i) => (
                <TableRow key={i} className="border-b-slate-800">
                  {/* Adjust colSpan to 7 */}
                  <TableCell colSpan={7}><Skeleton className="h-8 w-full" /></TableCell>
                </TableRow>
              ))
            ) : runs.length === 0 ? (
              <TableRow>
                  {/* Adjust colSpan to 7 */}
                  <TableCell colSpan={7} className="h-24 text-center text-slate-400">No runs found.</TableCell>
              </TableRow>
            ) : (
              runs.map((run) => (
                <TableRow key={run.id} className="border-b-slate-800 hover:bg-slate-800/50">
                  <TableCell className="pr-0"> {/* New column for checkbox */}
                      <Checkbox
                          checked={selectedRunIds.has(run.id)}
                          onCheckedChange={() => handleRowSelectClick(run.id)}
                          disabled={isLoading}
                          aria-label={`Select run ${run.id}`}
                          className="border-slate-600 data-[state=checked]:bg-white data-[state=checked]:text-slate-900"
                      />
                  </TableCell>
                  <TableCell className="font-medium text-white flex items-center gap-2">
                    <GitFork className="w-4 h-4 text-slate-500"/>
                    {getWorkflowName(run.workflow_id)}
                  </TableCell>
                  <TableCell className="text-slate-300 flex items-center gap-2">
                    <Bot className="w-4 h-4 text-slate-500"/>
                    {getAgentName(run.agent_id)}
                  </TableCell>
                  <TableCell><Badge variant="outline" className={`capitalize ${statusStyles[run.state]}`}>{run.state}</Badge></TableCell>
                  <TableCell className="text-slate-400">{formatDistance(new Date(run.finished_at || new Date()), new Date(run.started_at))}</TableCell>
                  <TableCell className="text-right font-mono text-slate-300">${(run.cost_cents / 100).toFixed(2)}</TableCell>
                  <TableCell>
                    <Link to={createPageUrl(`RunDetail?id=${run.id}`)}>
                      <Button variant="ghost" size="icon" className="h-8 w-8 p-0 text-slate-400 hover:text-white hover:bg-slate-800">
                        <ArrowRight className="h-4 w-4" />
                      </Button>
                    </Link>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
