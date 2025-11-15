
import React, { useState } from 'react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { formatDistanceToNow } from 'date-fns';

export default function AuditsTable({ audits }) {
  const [expandedAuditIds, setExpandedAuditIds] = useState(new Set());

  // Function to toggle the expanded state for a specific audit row
  const toggleExpand = (auditId) => {
    setExpandedAuditIds((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(auditId)) {
        newSet.delete(auditId); // Collapse if already expanded
      } else {
        newSet.add(auditId); // Expand if not expanded
      }
      return newSet;
    });
  };

  return (
    <div className="rounded-lg border border-slate-800 bg-slate-900">
      <Table>
        <TableHeader>
          <TableRow className="border-b-slate-800 hover:bg-slate-900">
            <TableHead className="text-slate-400">Action</TableHead>
            <TableHead className="text-slate-400">Actor</TableHead>
            <TableHead className="text-slate-400">Entity</TableHead>
            <TableHead className="text-slate-400">Timestamp</TableHead>
            {/* New column for the expand/collapse indicator */}
            <TableHead className="text-slate-400 w-[50px]"></TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {audits.map((audit) => (
            // Use React.Fragment to group the main row and the expandable row
            <React.Fragment key={audit.id}>
              <TableRow
                className="border-b-slate-800 hover:bg-slate-800/50 cursor-pointer"
                onClick={() => toggleExpand(audit.id)}
              >
                <TableCell className="font-mono text-white">{audit.action}</TableCell>
                <TableCell className="text-slate-400">{audit.actor}</TableCell>
                <TableCell className="font-mono text-slate-400">{audit.entity}: {audit.entity_id.substring(0, 8)}...</TableCell>
                <TableCell className="text-slate-500">{formatDistanceToNow(new Date(audit.created_date), { addSuffix: true })}</TableCell>
                {/* Expand/Collapse indicator */}
                <TableCell className="text-center">
                  {expandedAuditIds.has(audit.id) ? (
                    <span className="text-slate-300">-</span>
                  ) : (
                    <span className="text-slate-300">+</span>
                  )}
                </TableCell>
              </TableRow>
              {expandedAuditIds.has(audit.id) && (
                // This row contains the detailed diff, displayed only when expanded
                <TableRow className="border-b-slate-800 bg-slate-800/50">
                  {/* colSpan covers all 5 columns of the table */}
                  <TableCell colSpan={5} className="py-2 px-4">
                    <div className="text-sm text-slate-300">
                      <h4 className="font-semibold mb-2">Detailed Diff:</h4>
                      {audit.diff ? (
                        <pre className="whitespace-pre-wrap break-all bg-slate-900 p-3 rounded text-xs text-slate-100 overflow-auto max-h-60">
                          {/* Display diff as pretty-printed JSON */}
                          {JSON.stringify(audit.diff, null, 2)}
                        </pre>
                      ) : (
                        <p className="text-slate-500">No detailed diff available for this audit.</p>
                      )}
                    </div>
                  </TableCell>
                </TableRow>
              )}
            </React.Fragment>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
