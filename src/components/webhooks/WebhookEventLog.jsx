import { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { CheckCircle, XCircle, Clock, AlertCircle, ExternalLink, RefreshCw } from 'lucide-react';
import { format } from 'date-fns';
import { toast } from 'sonner';

export default function WebhookEventLog() {
  const [events, setEvents] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadEvents();
  }, []);

  const loadEvents = async () => {
    setIsLoading(true);
    try {
      const data = await base44.entities.WebhookEvent.list('-created_date', 50);
      setEvents(data);
    } catch (error) {
      console.error('Failed to load events:', error);
      toast.error('Failed to load webhook events');
    } finally {
      setIsLoading(false);
    }
  };

  const getStatusBadge = (status) => {
    const config = {
      received: { icon: Clock, color: 'bg-blue-500/20 text-blue-400 border-blue-500/30', label: 'Received' },
      processing: { icon: Clock, color: 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30', label: 'Processing' },
      completed: { icon: CheckCircle, color: 'bg-green-500/20 text-green-400 border-green-500/30', label: 'Completed' },
      failed: { icon: XCircle, color: 'bg-red-500/20 text-red-400 border-red-500/30', label: 'Failed' }
    }[status] || { icon: AlertCircle, color: 'bg-slate-500/20 text-slate-400 border-slate-500/30', label: status };

    const Icon = config.icon;
    return (
      <Badge variant="outline" className={config.color}>
        <Icon className="w-3 h-3 mr-1" />
        {config.label}
      </Badge>
    );
  };

  return (
    <Card className="bg-slate-900 border-slate-800">
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle className="text-white">Webhook Event Log</CardTitle>
        <Button
          variant="outline"
          size="sm"
          onClick={loadEvents}
          className="border-slate-700"
        >
          <RefreshCw className="w-4 h-4 mr-2" />
          Refresh
        </Button>
      </CardHeader>

      <CardContent>
        {isLoading ? (
          <div className="text-center py-8 text-slate-400">Loading events...</div>
        ) : events.length === 0 ? (
          <div className="text-center py-12 text-slate-400">
            <Clock className="w-12 h-12 mx-auto mb-4 text-slate-600" />
            <p>No webhook events yet</p>
            <p className="text-sm mt-2">Events will appear here when webhooks are triggered</p>
          </div>
        ) : (
          <div className="rounded-lg border border-slate-700">
            <Table>
              <TableHeader>
                <TableRow className="border-b-slate-700 hover:bg-slate-900">
                  <TableHead className="text-slate-400">Time</TableHead>
                  <TableHead className="text-slate-400">Event Type</TableHead>
                  <TableHead className="text-slate-400">Source</TableHead>
                  <TableHead className="text-slate-400">Status</TableHead>
                  <TableHead className="text-slate-400">Processing Time</TableHead>
                  <TableHead className="text-slate-400">Run</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {events.map(event => (
                  <TableRow key={event.id} className="border-b-slate-700">
                    <TableCell className="text-slate-300">
                      {format(new Date(event.created_date), 'MMM d, h:mm:ss a')}
                    </TableCell>
                    <TableCell>
                      <code className="text-sm bg-slate-950 px-2 py-1 rounded text-blue-400">
                        {event.event_type}
                      </code>
                    </TableCell>
                    <TableCell className="text-slate-400 text-sm">
                      {event.source_ip}
                    </TableCell>
                    <TableCell>
                      {getStatusBadge(event.status)}
                    </TableCell>
                    <TableCell className="text-slate-400 text-sm">
                      {event.processing_time_ms ? `${event.processing_time_ms}ms` : '-'}
                    </TableCell>
                    <TableCell>
                      {event.workflow_run_id ? (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => window.location.href = `/runs/${event.workflow_run_id}`}
                          className="text-blue-400 hover:text-blue-300"
                        >
                          <ExternalLink className="w-3 h-3 mr-1" />
                          View Run
                        </Button>
                      ) : event.status === 'failed' && event.error_message ? (
                        <span className="text-xs text-red-400">{event.error_message}</span>
                      ) : (
                        <span className="text-slate-600 text-sm">-</span>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </CardContent>
    </Card>
  );
}