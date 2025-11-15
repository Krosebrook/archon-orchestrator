import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Switch } from '@/components/ui/switch';
import { Button } from '@/components/ui/button';
import { Pencil } from 'lucide-react';
import { Policy } from '@/entities/Policy';

export default function PoliciesTable({ policies, onEdit, onToggle }) {
  
  const handleToggle = async (policy) => {
    await Policy.update(policy.id, { enabled: !policy.enabled });
    onToggle();
  };

  return (
    <div className="rounded-lg border border-slate-800 bg-slate-900">
      <Table>
        <TableHeader>
          <TableRow className="border-b-slate-800 hover:bg-slate-900">
            <TableHead className="text-slate-400">Policy</TableHead>
            <TableHead className="text-slate-400">Description</TableHead>
            <TableHead className="text-slate-400">Status</TableHead>
            <TableHead><span className="sr-only">Actions</span></TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {policies.map((policy) => (
            <TableRow key={policy.id} className="border-b-slate-800 hover:bg-slate-800/50">
              <TableCell className="font-mono text-white">{policy.key}</TableCell>
              <TableCell className="text-slate-400">{policy.description}</TableCell>
              <TableCell>
                <Switch
                  checked={policy.enabled}
                  onCheckedChange={() => handleToggle(policy)}
                  className="data-[state=checked]:bg-blue-600 data-[state=unchecked]:bg-slate-700"
                />
              </TableCell>
              <TableCell>
                <Button variant="ghost" size="icon" className="text-slate-400 hover:text-white" onClick={() => onEdit(policy)}>
                  <Pencil className="w-4 h-4" />
                </Button>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}