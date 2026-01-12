/**
 * @fileoverview Export Button Component
 * @module shared/ExportButton
 */

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Download, FileJson, FileText, Loader2 } from 'lucide-react';
import { base44 } from '@/api/base44Client';
import { toast } from 'sonner';

/**
 * Export button with format selection (CSV, JSON).
 * 
 * @example
 * <ExportButton
 *   entity="runs"
 *   filename="workflow-runs"
 *   data={runs}
 * />
 */
export function ExportButton({
  entity,
  filename = 'export',
  data = null,
  variant = 'outline',
  size = 'default',
  className = ''
}) {
  const [loading, setLoading] = useState(false);

  const handleExport = async (format) => {
    setLoading(true);
    try {
      if (data) {
        // Export provided data directly
        exportData(data, format, filename);
      } else if (entity) {
        // Fetch and export from backend
        const response = await base44.functions.invoke('exportData', {
          entity,
          format,
          limit: 1000
        });
        
        if (response.status === 200) {
          const blob = new Blob([response.data], {
            type: format === 'csv' ? 'text/csv' : 'application/json'
          });
          downloadBlob(blob, `${filename}.${format}`);
          toast.success(`Exported as ${format.toUpperCase()}`);
        } else {
          throw new Error('Export failed');
        }
      }
    } catch (error) {
      console.error('[Export] Error:', error);
      toast.error('Export failed');
    } finally {
      setLoading(false);
    }
  };

  const exportData = (data, format, filename) => {
    let content;
    let mimeType;
    let extension;

    if (format === 'csv') {
      content = convertToCSV(data);
      mimeType = 'text/csv';
      extension = 'csv';
    } else {
      content = JSON.stringify(data, null, 2);
      mimeType = 'application/json';
      extension = 'json';
    }

    const blob = new Blob([content], { type: mimeType });
    downloadBlob(blob, `${filename}.${extension}`);
    toast.success(`Exported as ${format.toUpperCase()}`);
  };

  const convertToCSV = (data) => {
    if (!data || data.length === 0) return '';

    const headers = Object.keys(data[0]);
    const rows = data.map(obj =>
      headers.map(header => {
        const value = obj[header];
        if (value === null || value === undefined) return '';
        const str = String(value);
        return str.includes(',') || str.includes('"')
          ? `"${str.replace(/"/g, '""')}"`
          : str;
      }).join(',')
    );

    return [headers.join(','), ...rows].join('\n');
  };

  const downloadBlob = (blob, filename) => {
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant={variant}
          size={size}
          disabled={loading}
          className={className}
        >
          {loading ? (
            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
          ) : (
            <Download className="w-4 h-4 mr-2" />
          )}
          Export
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuItem onClick={() => handleExport('json')}>
          <FileJson className="w-4 h-4 mr-2" />
          Export as JSON
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => handleExport('csv')}>
          <FileText className="w-4 h-4 mr-2" />
          Export as CSV
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}