import { useState, useEffect, useRef, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Wifi, WifiOff, Pause, Play, Trash2, Activity } from 'lucide-react';
import { format } from 'date-fns';
import { useAuth } from '../contexts/AuthContext';

// ---------------------------------------------------------------------------
// Simulated WS events for preview (real WS URL injected via VITE_WS_URL)
// ---------------------------------------------------------------------------
const MOCK_EVENTS = [
  { type: 'run', status: 'running',   message: 'Agent gpt-planner started workflow execution',   severity: 'info' },
  { type: 'run', status: 'completed', message: 'Workflow analysis-pipeline completed in 1.2s',    severity: 'info' },
  { type: 'run', status: 'failed',    message: 'Agent summarizer failed: token limit exceeded',   severity: 'error' },
  { type: 'run', status: 'queued',    message: 'New run queued for workflow data-extractor',       severity: 'info' },
  { type: 'log', severity: 'warn',    message: 'Rate limit approaching: 87% of quota used',       status: 'warn' },
  { type: 'log', severity: 'info',    message: 'Tool call: search_web → returned 12 results',     status: 'info' },
  { type: 'log', severity: 'error',   message: 'OpenAI API timeout after 30s, retrying (2/3)',    status: 'error' },
  { type: 'alert', severity: 'critical', message: 'Agent memory-manager exceeded cost budget',   status: 'critical' },
  { type: 'alert', severity: 'warn',  message: 'Anomaly detected: latency spike +340% on agent-7', status: 'warn' },
];

const STATUS_COLORS = {
  running:   'bg-blue-500/20 text-blue-300 border-blue-700',
  completed: 'bg-emerald-500/20 text-emerald-300 border-emerald-700',
  failed:    'bg-red-500/20 text-red-300 border-red-700',
  queued:    'bg-yellow-500/20 text-yellow-300 border-yellow-700',
  info:      'bg-slate-500/20 text-slate-300 border-slate-700',
  warn:      'bg-amber-500/20 text-amber-300 border-amber-700',
  error:     'bg-red-500/20 text-red-300 border-red-700',
  critical:  'bg-rose-500/20 text-rose-300 border-rose-700',
};

const TYPE_DOT = {
  run:   'bg-blue-400',
  log:   'bg-slate-400',
  alert: 'bg-amber-400',
};

function EventRow({ ev }) {
  const label = ev.severity || ev.status || 'info';
  return (
    <div className="flex items-start gap-3 py-2.5 border-b border-slate-800/60 last:border-0 animate-in fade-in duration-300">
      <div className="flex flex-col items-center gap-1 pt-1 flex-shrink-0">
        <div className={`w-2 h-2 rounded-full ${TYPE_DOT[ev.type] || 'bg-slate-500'}`} />
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 flex-wrap">
          <Badge variant="outline" className={`text-[10px] px-1.5 py-0 capitalize ${STATUS_COLORS[label] || STATUS_COLORS.info}`}>
            {ev.type}:{label}
          </Badge>
          <span className="text-xs text-slate-300 break-all">{ev.message}</span>
        </div>
        <p className="text-[10px] text-slate-600 mt-0.5">{format(ev.ts, 'HH:mm:ss.SSS')}</p>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Main component
// ---------------------------------------------------------------------------
export default function LiveEventFeed({ orgId }) {
  const { user } = useAuth();
  const resolvedOrg = orgId || user?.org_id || 'demo';

  const [events, setEvents] = useState([]);
  const [status, setStatus] = useState('connecting'); // connecting | open | closed | error
  const [paused, setPaused] = useState(false);
  const [filter, setFilter] = useState('all');
  const wsRef = useRef(null);
  const pausedRef = useRef(false);
  const reconnectTimer = useRef(null);
  const mockTimer = useRef(null);
  const bottomRef = useRef(null);

  const addEvent = useCallback((ev) => {
    if (pausedRef.current) return;
    setEvents(prev => {
      const next = [...prev, { ...ev, id: crypto.randomUUID(), ts: new Date() }];
      return next.length > 200 ? next.slice(-200) : next;
    });
  }, []);

  // Auto-scroll
  useEffect(() => {
    if (!paused) bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [events, paused]);

  // WebSocket + mock fallback
  useEffect(() => {
    const wsUrl = import.meta.env.VITE_WS_URL;

    if (wsUrl) {
      const connect = () => {
        setStatus('connecting');
        const ws = new WebSocket(`${wsUrl}/org:${resolvedOrg}:agents`);
        wsRef.current = ws;

        ws.onopen = () => setStatus('open');
        ws.onmessage = (e) => {
          try { addEvent(JSON.parse(e.data)); } catch {}
        };
        ws.onerror = () => setStatus('error');
        ws.onclose = () => {
          setStatus('closed');
          reconnectTimer.current = setTimeout(connect, 3000 + Math.random() * 2000);
        };
      };
      connect();
    } else {
      // Mock simulation
      setStatus('open');
      const tick = () => {
        const ev = MOCK_EVENTS[Math.floor(Math.random() * MOCK_EVENTS.length)];
        addEvent(ev);
        mockTimer.current = setTimeout(tick, 800 + Math.random() * 2400);
      };
      mockTimer.current = setTimeout(tick, 600);
    }

    return () => {
      clearTimeout(reconnectTimer.current);
      clearTimeout(mockTimer.current);
      wsRef.current?.close();
    };
  }, [resolvedOrg, addEvent]);

  const togglePause = () => {
    pausedRef.current = !paused;
    setPaused(p => !p);
  };

  const filtered = filter === 'all' ? events : events.filter(e => e.type === filter);
  const statusMeta = {
    connecting: { icon: Activity, color: 'text-yellow-400', label: 'Connecting' },
    open:       { icon: Wifi,     color: 'text-emerald-400', label: 'Live' },
    closed:     { icon: WifiOff,  color: 'text-slate-400',  label: 'Reconnecting' },
    error:      { icon: WifiOff,  color: 'text-red-400',    label: 'Error' },
  }[status];
  const StatusIcon = statusMeta.icon;

  return (
    <Card className="bg-slate-900 border-slate-700">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between flex-wrap gap-2">
          <div className="flex items-center gap-2">
            <Activity className="w-5 h-5 text-blue-400" />
            <CardTitle className="text-white text-base">Live Event Feed</CardTitle>
            <div className={`flex items-center gap-1.5 text-xs ${statusMeta.color}`}>
              <StatusIcon className="w-3.5 h-3.5" />
              {statusMeta.label}
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Select value={filter} onValueChange={setFilter}>
              <SelectTrigger className="h-7 w-28 text-xs bg-slate-800 border-slate-700">
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="bg-slate-800 border-slate-700 text-slate-200">
                <SelectItem value="all">All types</SelectItem>
                <SelectItem value="run">Runs</SelectItem>
                <SelectItem value="log">Logs</SelectItem>
                <SelectItem value="alert">Alerts</SelectItem>
              </SelectContent>
            </Select>
            <Button size="sm" variant="outline" className="h-7 text-xs border-slate-700" onClick={togglePause}>
              {paused ? <><Play className="w-3 h-3 mr-1" />Resume</> : <><Pause className="w-3 h-3 mr-1" />Pause</>}
            </Button>
            <Button size="sm" variant="ghost" className="h-7 text-xs text-slate-500" onClick={() => setEvents([])}>
              <Trash2 className="w-3 h-3" />
            </Button>
          </div>
        </div>
        <p className="text-xs text-slate-500 mt-1">
          Topic: <code className="text-slate-400">org:{resolvedOrg}:agents</code>
          {paused && <Badge className="ml-2 bg-amber-600 text-white text-[10px]">Paused</Badge>}
        </p>
      </CardHeader>
      <CardContent className="p-0">
        <div className="h-72 overflow-y-auto px-4 py-1 bg-slate-950/50 rounded-b-lg">
          {filtered.length === 0 && (
            <div className="flex items-center justify-center h-full text-slate-600 text-sm">
              {status === 'connecting' ? 'Connecting to event stream...' : 'Waiting for events...'}
            </div>
          )}
          {filtered.map(ev => <EventRow key={ev.id} ev={ev} />)}
          <div ref={bottomRef} />
        </div>
      </CardContent>
    </Card>
  );
}