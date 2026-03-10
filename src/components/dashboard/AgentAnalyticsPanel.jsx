import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import { Brain, TrendingUp, DollarSign, Zap, Clock } from 'lucide-react';
import { subDays, format, parseISO, startOfDay } from 'date-fns';
import { base44 } from '@/api/base44Client';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------
function buildDailyBuckets(runs, days) {
  const buckets = {};
  for (let i = days - 1; i >= 0; i--) {
    const d = format(subDays(new Date(), i), 'yyyy-MM-dd');
    buckets[d] = { date: d, label: format(subDays(new Date(), i), 'MMM d'), p95_ms: 0, prompt_tokens: 0, completion_tokens: 0, cost_cents: 0, count: 0, latencies: [] };
  }
  runs.forEach(r => {
    if (!r.started_at) return;
    const d = format(startOfDay(new Date(r.started_at)), 'yyyy-MM-dd');
    if (!buckets[d]) return;
    const b = buckets[d];
    b.count++;
    b.prompt_tokens += r.prompt_tokens || 0;
    b.completion_tokens += r.completion_tokens || 0;
    b.cost_cents += r.cost_cents || 0;
    if (r.duration_ms) b.latencies.push(r.duration_ms);
  });
  return Object.values(buckets).map(b => {
    if (b.latencies.length > 0) {
      const sorted = [...b.latencies].sort((a, c) => a - c);
      b.p95_ms = sorted[Math.floor(sorted.length * 0.95)] || 0;
    }
    return b;
  });
}

function StatPill({ icon: Icon, label, value, color = 'text-blue-400' }) {
  return (
    <div className="flex items-center gap-3 bg-slate-800/60 rounded-lg px-4 py-3">
      <Icon className={`w-5 h-5 ${color}`} />
      <div>
        <p className="text-xs text-slate-500">{label}</p>
        <p className="text-sm font-semibold text-white">{value}</p>
      </div>
    </div>
  );
}

const CUSTOM_TOOLTIP_STYLE = {
  contentStyle: { background: '#1e293b', border: '1px solid #334155', borderRadius: 8, fontSize: 12 },
  labelStyle: { color: '#94a3b8' },
};

// ---------------------------------------------------------------------------
// Main
// ---------------------------------------------------------------------------
export default function AgentAnalyticsPanel() {
  const [runs, setRuns] = useState([]);
  const [agents, setAgents] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [days, setDays] = useState('14');
  const [selectedAgent, setSelectedAgent] = useState('all');

  useEffect(() => {
    setIsLoading(true);
    Promise.all([
      base44.entities.Run.list('-started_at', 200),
      base44.entities.Agent.list('-created_date', 50),
    ]).then(([r, a]) => { setRuns(r); setAgents(a); }).finally(() => setIsLoading(false));
  }, []);

  const filteredRuns = selectedAgent === 'all' ? runs : runs.filter(r => r.agent_id === selectedAgent);
  const daysNum = Number(days);
  const buckets = buildDailyBuckets(filteredRuns, daysNum);
  const cutoff = subDays(new Date(), daysNum - 1);
  const inRange = filteredRuns.filter(r => r.started_at && new Date(r.started_at) >= cutoff);

  const totalCost = inRange.reduce((s, r) => s + (r.cost_cents || 0), 0);
  const totalPrompt = inRange.reduce((s, r) => s + (r.prompt_tokens || 0), 0);
  const totalCompletion = inRange.reduce((s, r) => s + (r.completion_tokens || 0), 0);
  const allLatencies = inRange.flatMap(r => r.duration_ms ? [r.duration_ms] : []).sort((a, b) => a - b);
  const p95 = allLatencies.length ? allLatencies[Math.floor(allLatencies.length * 0.95)] : 0;

  if (isLoading) {
    return (
      <Card className="bg-slate-900 border-slate-700">
        <CardContent className="flex items-center justify-center h-64">
          <div className="text-slate-500 text-sm animate-pulse">Loading analytics…</div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="bg-slate-900 border-slate-700">
      <CardHeader>
        <div className="flex items-center justify-between flex-wrap gap-3">
          <div className="flex items-center gap-3">
            <Brain className="w-5 h-5 text-purple-400" />
            <div>
              <CardTitle className="text-white">Agent Performance Analytics</CardTitle>
              <CardDescription className="text-slate-400">P95 latency, token usage, and cost trends</CardDescription>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Select value={selectedAgent} onValueChange={setSelectedAgent}>
              <SelectTrigger className="h-8 w-40 text-xs bg-slate-800 border-slate-700">
                <SelectValue placeholder="All agents" />
              </SelectTrigger>
              <SelectContent className="bg-slate-800 border-slate-700 text-slate-200">
                <SelectItem value="all">All agents</SelectItem>
                {agents.map(a => <SelectItem key={a.id} value={a.id}>{a.name}</SelectItem>)}
              </SelectContent>
            </Select>
            <Select value={days} onValueChange={setDays}>
              <SelectTrigger className="h-8 w-24 text-xs bg-slate-800 border-slate-700">
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="bg-slate-800 border-slate-700 text-slate-200">
                <SelectItem value="7">7 days</SelectItem>
                <SelectItem value="14">14 days</SelectItem>
                <SelectItem value="30">30 days</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      </CardHeader>

      <CardContent className="space-y-6">
        {/* Summary pills */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <StatPill icon={Clock} label="P95 Latency" value={p95 ? `${p95.toLocaleString()} ms` : 'N/A'} color="text-blue-400" />
          <StatPill icon={Zap} label="Prompt Tokens" value={totalPrompt.toLocaleString()} color="text-purple-400" />
          <StatPill icon={TrendingUp} label="Completion Tokens" value={totalCompletion.toLocaleString()} color="text-emerald-400" />
          <StatPill icon={DollarSign} label="Total Cost" value={`$${(totalCost / 100).toFixed(2)}`} color="text-amber-400" />
        </div>

        {/* P95 Latency line chart */}
        <div>
          <p className="text-xs text-slate-400 mb-2 font-medium uppercase tracking-wider">P95 Latency (ms)</p>
          <ResponsiveContainer width="100%" height={180}>
            <LineChart data={buckets} {...CUSTOM_TOOLTIP_STYLE}>
              <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
              <XAxis dataKey="label" tick={{ fontSize: 10, fill: '#64748b' }} />
              <YAxis tick={{ fontSize: 10, fill: '#64748b' }} unit="ms" />
              <Tooltip {...CUSTOM_TOOLTIP_STYLE} formatter={v => [`${v} ms`, 'P95']} />
              <Line type="monotone" dataKey="p95_ms" stroke="#60a5fa" strokeWidth={2} dot={false} name="P95 Latency" />
            </LineChart>
          </ResponsiveContainer>
        </div>

        {/* Token usage bar chart */}
        <div>
          <p className="text-xs text-slate-400 mb-2 font-medium uppercase tracking-wider">Token Usage</p>
          <ResponsiveContainer width="100%" height={180}>
            <BarChart data={buckets} {...CUSTOM_TOOLTIP_STYLE}>
              <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
              <XAxis dataKey="label" tick={{ fontSize: 10, fill: '#64748b' }} />
              <YAxis tick={{ fontSize: 10, fill: '#64748b' }} />
              <Tooltip {...CUSTOM_TOOLTIP_STYLE} />
              <Legend wrapperStyle={{ fontSize: 11 }} />
              <Bar dataKey="prompt_tokens" name="Prompt" fill="#a78bfa" radius={[2, 2, 0, 0]} />
              <Bar dataKey="completion_tokens" name="Completion" fill="#34d399" radius={[2, 2, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Cost per day line chart */}
        <div>
          <p className="text-xs text-slate-400 mb-2 font-medium uppercase tracking-wider">Cost (¢ per day)</p>
          <ResponsiveContainer width="100%" height={150}>
            <LineChart data={buckets} {...CUSTOM_TOOLTIP_STYLE}>
              <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
              <XAxis dataKey="label" tick={{ fontSize: 10, fill: '#64748b' }} />
              <YAxis tick={{ fontSize: 10, fill: '#64748b' }} unit="¢" />
              <Tooltip {...CUSTOM_TOOLTIP_STYLE} formatter={v => [`${v}¢`, 'Cost']} />
              <Line type="monotone" dataKey="cost_cents" stroke="#fbbf24" strokeWidth={2} dot={false} name="Cost (¢)" />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
}