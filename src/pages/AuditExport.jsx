import { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Download, FileText, CalendarIcon, Filter } from 'lucide-react';
import { toast } from 'sonner';
import { useAuth } from '../components/contexts/AuthContext';

const ENTITY_TYPES = [
  'Workflow', 'Agent', 'Run', 'Policy', 'User',
  'Team', 'Integration', 'Skill', 'Template', 'System'
];

const ACTIONS = [
  'create', 'update', 'delete', 'view', 'execute',
  'login', 'logout', 'export', 'import', 'approve',
  'reject', 'configure', 'deploy', 'rollback'
];

const SEVERITY_LEVELS = ['info', 'warning', 'critical'];

export default function AuditExport() {
  const { organization } = useAuth();
  const [startDate, setStartDate] = useState(null);
  const [endDate, setEndDate] = useState(null);
  const [format, setFormat] = useState('json');
  const [selectedEntities, setSelectedEntities] = useState([]);
  const [selectedActions, setSelectedActions] = useState([]);
  const [selectedSeverities, setSelectedSeverities] = useState([]);
  const [limit, setLimit] = useState('10000');
  const [isExporting, setIsExporting] = useState(false);
  const [lastExport, setLastExport] = useState(null);

  const handleExport = async () => {
    if (!startDate || !endDate) {
      toast.error('Please select date range');
      return;
    }

    if (!organization?.id) {
      toast.error('Organization context missing');
      return;
    }

    setIsExporting(true);

    try {
      const payload = {
        org_id: organization.id,
        start_date: startDate.toISOString(),
        end_date: endDate.toISOString(),
        format,
        entity_types: selectedEntities,
        actions: selectedActions,
        severity_levels: selectedSeverities,
        limit: parseInt(limit, 10)
      };

      const { data, headers } = await base44.functions.invoke('exportAudits', payload);

      // Create blob and download
      const blob = new Blob([data], {
        type: format === 'csv' ? 'text/csv' : 'application/json'
      });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `audit_export_${Date.now()}.${format}`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      a.remove();

      const recordCount = headers['x-record-count'] || '0';
      setLastExport({
        date: new Date(),
        recordCount,
        format
      });

      toast.success(`Exported ${recordCount} audit records`);
    } catch (error) {
      console.error('Export failed:', error);
      toast.error(error.message || 'Export failed');
    } finally {
      setIsExporting(false);
    }
  };

  const toggleEntity = (entity) => {
    setSelectedEntities(prev =>
      prev.includes(entity) ? prev.filter(e => e !== entity) : [...prev, entity]
    );
  };

  const toggleAction = (action) => {
    setSelectedActions(prev =>
      prev.includes(action) ? prev.filter(a => a !== action) : [...prev, action]
    );
  };

  const toggleSeverity = (severity) => {
    setSelectedSeverities(prev =>
      prev.includes(severity) ? prev.filter(s => s !== severity) : [...prev, severity]
    );
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div>
        <h1 className="text-3xl font-bold mb-2">Audit Log Export</h1>
        <p className="text-slate-400">Export audit logs for compliance and security analysis</p>
      </div>

      <Card className="bg-slate-900 border-slate-800">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="w-5 h-5" />
            Export Configuration
          </CardTitle>
          <CardDescription>Select date range and filters for export</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Date Range */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Start Date</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button variant="outline" className="w-full justify-start border-slate-700">
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {startDate ? format(startDate, 'PPP') : 'Select date'}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0 bg-slate-900 border-slate-800">
                  <Calendar
                    mode="single"
                    selected={startDate}
                    onSelect={setStartDate}
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
            </div>

            <div className="space-y-2">
              <Label>End Date</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button variant="outline" className="w-full justify-start border-slate-700">
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {endDate ? format(endDate, 'PPP') : 'Select date'}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0 bg-slate-900 border-slate-800">
                  <Calendar
                    mode="single"
                    selected={endDate}
                    onSelect={setEndDate}
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
            </div>
          </div>

          {/* Format & Limit */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Export Format</Label>
              <Select value={format} onValueChange={setFormat}>
                <SelectTrigger className="border-slate-700">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-slate-900 border-slate-800">
                  <SelectItem value="json">JSON</SelectItem>
                  <SelectItem value="csv">CSV</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Record Limit</Label>
              <Input
                type="number"
                value={limit}
                onChange={(e) => setLimit(e.target.value)}
                className="border-slate-700"
                placeholder="10000"
              />
            </div>
          </div>

          {/* Filters */}
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <Filter className="w-4 h-4 text-slate-400" />
              <Label>Filters (Optional)</Label>
            </div>

            {/* Entity Types */}
            <div className="space-y-2">
              <Label className="text-sm text-slate-400">Entity Types</Label>
              <div className="flex flex-wrap gap-2">
                {ENTITY_TYPES.map(entity => (
                  <Badge
                    key={entity}
                    variant={selectedEntities.includes(entity) ? 'default' : 'outline'}
                    className="cursor-pointer"
                    onClick={() => toggleEntity(entity)}
                  >
                    {entity}
                  </Badge>
                ))}
              </div>
            </div>

            {/* Actions */}
            <div className="space-y-2">
              <Label className="text-sm text-slate-400">Actions</Label>
              <div className="flex flex-wrap gap-2">
                {ACTIONS.map(action => (
                  <Badge
                    key={action}
                    variant={selectedActions.includes(action) ? 'default' : 'outline'}
                    className="cursor-pointer"
                    onClick={() => toggleAction(action)}
                  >
                    {action}
                  </Badge>
                ))}
              </div>
            </div>

            {/* Severity */}
            <div className="space-y-2">
              <Label className="text-sm text-slate-400">Severity Levels</Label>
              <div className="flex gap-2">
                {SEVERITY_LEVELS.map(severity => (
                  <Badge
                    key={severity}
                    variant={selectedSeverities.includes(severity) ? 'default' : 'outline'}
                    className="cursor-pointer"
                    onClick={() => toggleSeverity(severity)}
                  >
                    {severity}
                  </Badge>
                ))}
              </div>
            </div>
          </div>

          {/* Export Button */}
          <Button
            onClick={handleExport}
            disabled={isExporting || !startDate || !endDate}
            className="w-full bg-blue-600 hover:bg-blue-700"
            size="lg"
          >
            <Download className="w-4 h-4 mr-2" />
            {isExporting ? 'Exporting...' : 'Export Audit Logs'}
          </Button>

          {/* Last Export Info */}
          {lastExport && (
            <div className="pt-4 border-t border-slate-800">
              <p className="text-sm text-slate-400">
                Last export: {format(lastExport.date, 'PPP p')} • {lastExport.recordCount} records • {lastExport.format.toUpperCase()}
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Compliance Notice */}
      <Card className="bg-slate-900 border-slate-800">
        <CardContent className="pt-6">
          <div className="flex gap-3">
            <div className="text-amber-500">
              <FileText className="w-5 h-5" />
            </div>
            <div>
              <h4 className="font-medium mb-1">Compliance & Retention</h4>
              <p className="text-sm text-slate-400">
                Audit logs are retained for 7 years per SOC2 requirements. Sensitive fields
                (before/after snapshots) are redacted in exports. All export actions are logged
                and require admin privileges.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}