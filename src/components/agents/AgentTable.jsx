
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem, // Keeping this import as it was in the original, though the outline removes its usage. It's harmless.
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { MoreHorizontal } from 'lucide-react'; // Keeping these imports, though Pencil, Trash2, Copy icons are removed from usage. It's harmless.
import { Skeleton } from '@/components/ui/skeleton';
import { format } from 'date-fns';
import { Card, CardContent } from '@/components/ui/card'; // New import for Card and CardContent

const statusColors = {
  active: 'bg-green-500/20 text-green-400 border-green-500/30',
  inactive: 'bg-slate-500/20 text-slate-400 border-slate-500/30',
  error: 'bg-red-500/20 text-red-400 border-red-500/30',
  deprecated: 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30',
};

const providerColors = {
  openai: 'bg-sky-500/20 text-sky-400 border-sky-500/30',
  anthropic: 'bg-amber-500/20 text-amber-400 border-amber-500/30',
}

export default function AgentTable({ agents, isLoading, onEdit, onDelete, canEdit, canDelete }) {
  return (
    <Card className="bg-slate-900 border-slate-800">
      <CardContent className="p-0">
        <Table>
          <TableHeader>
            <TableRow className="border-b-slate-800 hover:bg-slate-900">
              <TableHead className="text-slate-400">Agent</TableHead>
              <TableHead className="text-slate-400">Status</TableHead>
              {/* Provider column removed as per outline */}
              <TableHead className="text-slate-400">Model</TableHead>
              <TableHead className="text-slate-400">Last Updated</TableHead>
              <TableHead className="text-right"><span className="sr-only">Actions</span></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              Array(5).fill(0).map((_, i) => ( // Adjusted to 5 columns from original 6
                <TableRow key={i} className="border-b-slate-800">
                  <TableCell><Skeleton className="h-4 w-40" /></TableCell>
                  <TableCell><Skeleton className="h-6 w-20 rounded-md" /></TableCell>
                  <TableCell><Skeleton className="h-4 w-32" /></TableCell>
                  <TableCell><Skeleton className="h-4 w-28" /></TableCell>
                  <TableCell><Skeleton className="h-8 w-8" /></TableCell>
                </TableRow>
              ))
            ) : agents.length === 0 ? (
              <TableRow>
                <TableCell colSpan={5} className="h-24 text-center text-slate-400"> {/* Adjusted colSpan to 5 */}
                  No agents found.
                </TableCell>
              </TableRow>
            ) : (
              agents.map((agent) => (
                <TableRow key={agent.id} className="border-b-slate-700"> {/* Changed border color and removed hover:bg-slate-800/50 */}
                  <TableCell>
                    <div className="flex items-center gap-3"> {/* Added flex container */}
                      <div> {/* Wrapper div to keep name and version stacked */}
                        <div className="font-medium text-white">{agent.name}</div>
                        <div className="text-sm text-slate-500">v{agent.version}</div>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline" className={`capitalize ${statusColors[agent.status]}`}>{agent.status}</Badge>
                  </TableCell>
                  {/* Provider Cell removed as per outline */}
                  <TableCell className="text-slate-400 font-mono"> {/* Moved styles directly to TableCell */}
                    {agent.config.model}
                  </TableCell>
                  <TableCell className="text-slate-400">
                    {format(new Date(agent.updated_date), 'MMM d, yyyy')}
                  </TableCell>
                  <TableCell className="text-right"> {/* Added text-right */}
                    {(canEdit || canDelete) && ( // Conditional rendering for dropdown
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon" className="text-slate-400 hover:text-white"> {/* Updated button classes/size */}
                            <span className="sr-only">Open menu</span>
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="bg-slate-800 border-slate-700 text-slate-200"> {/* Updated content classes */}
                          {/* DropdownMenuLabel removed as per outline */}
                          {canEdit && ( // Conditionally render Edit option
                            <DropdownMenuItem onClick={() => onEdit(agent)} className="focus:bg-slate-800">
                              {/* Pencil icon removed as per outline */}
                              Edit
                            </DropdownMenuItem>
                          )}
                          {/* Copy ID and DropdownMenuSeparator removed as per outline */}
                          {canDelete && ( // Conditionally render Delete option
                            <DropdownMenuItem
                              onClick={() => onDelete(agent.id)}
                              className="text-red-400 focus:bg-red-900/50 focus:text-red-400" // Updated focus and text classes
                            >
                              {/* Trash2 icon removed as per outline */}
                              Delete
                            </DropdownMenuItem>
                          )}
                        </DropdownMenuContent>
                      </DropdownMenu>
                    )}
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
