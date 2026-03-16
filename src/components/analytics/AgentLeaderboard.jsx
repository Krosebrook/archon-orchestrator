import { useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { TrendingUp, TrendingDown, AlertTriangle, DollarSign, Zap, Clock } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899'];

function RiskBadge({ score }) {
  if (score > 0.6) return <Badge className="bg-red-500/20 text-red-400 border-0">High Cost</Badge>;
  if (score > 0.3) return <Badge className="bg-yellow-500/20 text-yellow-400 border-0">Moderate</Badge>;
  return <Badge className="bg-green-500/20 text-green-400 border-0">Efficient</Badge>;
}

export default function AgentLeaderboard({ agents, metrics, runs }) {
  const agentStats = useMemo(() => {
    return agents.map(agent => {
      const agentMetrics = metrics.filter(m => m.agent_id === agent.id);
      const agentRuns = runs.filter(r => r.agent_id === agent.id);

      const totalCostCents = agentMetrics.reduce((s, m) => s + (m.cost_cents || 0), 0);
      const totalPromptTokens = agentMetrics.reduce((s, m) => s + (m.prompt_tokens || 0), 0);
      const totalCompletionTokens = agentMetrics.reduce((s, m) => s + (m.completion_tokens || 0), 0);
      const totalTokens = totalPromptTokens + totalCompletionTokens;

      const latencies = agentMetrics.filter(m => m.latency_ms).map(m => m.latency_ms);
      const avgLatency = latencies.length > 0
        ? Math.round(latencies.reduce((s, v) => s + v, 0) / latencies.length)
        : (agentRuns.filter(r => r.duration_ms).reduce((s, r, _i, arr) => s + r.duration_ms / arr.length, 0) || 0);

      const completedRuns = agentRuns.filter(r => r.state === 'completed').length;
      const totalRuns = agentRuns.length;
      const successRate = totalRuns > 0 ? (completedRuns / totalRuns) * 100 : 0;

      // Cost efficiency score (higher cost relative to others = worse)
      const costScore = totalCostCents;

      return {
        id: agent.id,
        name: agent.name,
        totalCost: (totalCostCents / 100).toFixed(3),
        totalCostCents,
        totalTokens,
        avgLatencyMs: Math.round(avgLatency),
        successRate: successRate.toFixed(1),
        totalRuns,
        costScore,
      };
    }).filter(a => a.totalRuns > 0 || a.totalCostCents > 0)
      .sort((a, b) => b.totalCostCents - a.totalCostCents);
  }, [agents, metrics, runs]);

  const maxCost = Math.max(...agentStats.map(a => a.totalCostCents), 1);

  const chartData = agentStats.slice(0, 8).map(a => ({
    name: a.name.length > 12 ? a.name.slice(0, 12) + '…' : a.name,
    cost: parseFloat(a.totalCost),
    latency: Math.round(a.avgLatencyMs / 1000 * 100) / 100,
    tokens: Math.round(a.totalTokens / 1000),
  }));

  if (agentStats.length === 0) {
    return (
      <Card className="bg-slate-900 border-slate-800">
        <CardContent className="pt-12 pb-12 text-center text-slate-500">
          No agent data yet. Run some agents to see metrics here.
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Cost Leaderboard Table */}
      <Card className="bg-slate-900 border-slate-800">
        <CardHeader>
          <CardTitle className="text-white flex items-center gap-2">
            <DollarSign className="w-5 h-5 text-yellow-400" />
            Agent Cost & Performance Leaderboard
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-slate-800 text-slate-400 text-xs uppercase">
                  <th className="text-left py-3 px-2">#</th>
                  <th className="text-left py-3 px-2">Agent</th>
                  <th className="text-right py-3 px-2">Total Cost</th>
                  <th className="text-right py-3 px-2">Tokens</th>
                  <th className="text-right py-3 px-2">Avg Latency</th>
                  <th className="text-right py-3 px-2">Success Rate</th>
                  <th className="text-right py-3 px-2">Runs</th>
                  <th className="text-center py-3 px-2">Efficiency</th>
                </tr>
              </thead>
              <tbody>
                {agentStats.map((agent, idx) => (
                  <tr key={agent.id} className="border-b border-slate-800/50 hover:bg-slate-800/30 transition-colors">
                    <td className="py-3 px-2 text-slate-500">{idx + 1}</td>
                    <td className="py-3 px-2">
                      <div className="flex items-center gap-2">
                        <div className="w-2 h-2 rounded-full" style={{ backgroundColor: COLORS[idx % COLORS.length] }} />
                        <span className="text-white font-medium">{agent.name}</span>
                      </div>
                    </td>
                    <td className="py-3 px-2 text-right">
                      <span className="text-white font-mono">${agent.totalCost}</span>
                      <div className="w-full bg-slate-800 rounded-full h-1 mt-1">
                        <div className="h-1 rounded-full bg-yellow-500"
                          style={{ width: `${(agent.totalCostCents / maxCost) * 100}%` }} />
                      </div>
                    </td>
                    <td className="py-3 px-2 text-right text-slate-300 font-mono">
                      {agent.totalTokens > 0 ? `${(agent.totalTokens / 1000).toFixed(1)}K` : '—'}
                    </td>
                    <td className="py-3 px-2 text-right">
                      <span className={`font-mono ${agent.avgLatencyMs > 3000 ? 'text-red-400' : agent.avgLatencyMs > 1500 ? 'text-yellow-400' : 'text-green-400'}`}>
                        {agent.avgLatencyMs > 0 ? `${(agent.avgLatencyMs / 1000).toFixed(2)}s` : '—'}
                      </span>
                    </td>
                    <td className="py-3 px-2 text-right">
                      <span className={`font-mono ${parseFloat(agent.successRate) < 70 ? 'text-red-400' : parseFloat(agent.successRate) < 90 ? 'text-yellow-400' : 'text-green-400'}`}>
                        {agent.totalRuns > 0 ? `${agent.successRate}%` : '—'}
                      </span>
                    </td>
                    <td className="py-3 px-2 text-right text-slate-400">{agent.totalRuns}</td>
                    <td className="py-3 px-2 text-center">
                      <RiskBadge score={agent.totalCostCents / maxCost} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {/* Side-by-side charts */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card className="bg-slate-900 border-slate-800">
          <CardHeader>
            <CardTitle className="text-white text-sm flex items-center gap-2">
              <DollarSign className="w-4 h-4 text-yellow-400" /> Cost by Agent ($)
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={chartData} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" stroke="#334155" horizontal={false} />
                <XAxis type="number" stroke="#94a3b8" tick={{ fontSize: 11 }} />
                <YAxis dataKey="name" type="category" stroke="#94a3b8" tick={{ fontSize: 11 }} width={80} />
                <Tooltip contentStyle={{ backgroundColor: '#1e293b', border: '1px solid #334155' }} />
                <Bar dataKey="cost" fill="#f59e0b" name="Cost ($)" radius={[0, 4, 4, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card className="bg-slate-900 border-slate-800">
          <CardHeader>
            <CardTitle className="text-white text-sm flex items-center gap-2">
              <Zap className="w-4 h-4 text-blue-400" /> Tokens (K) by Agent
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={chartData} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" stroke="#334155" horizontal={false} />
                <XAxis type="number" stroke="#94a3b8" tick={{ fontSize: 11 }} />
                <YAxis dataKey="name" type="category" stroke="#94a3b8" tick={{ fontSize: 11 }} width={80} />
                <Tooltip contentStyle={{ backgroundColor: '#1e293b', border: '1px solid #334155' }} />
                <Bar dataKey="tokens" fill="#3b82f6" name="Tokens (K)" radius={[0, 4, 4, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card className="bg-slate-900 border-slate-800">
          <CardHeader>
            <CardTitle className="text-white text-sm flex items-center gap-2">
              <Clock className="w-4 h-4 text-purple-400" /> Avg Latency (s) by Agent
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={chartData} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" stroke="#334155" horizontal={false} />
                <XAxis type="number" stroke="#94a3b8" tick={{ fontSize: 11 }} />
                <YAxis dataKey="name" type="category" stroke="#94a3b8" tick={{ fontSize: 11 }} width={80} />
                <Tooltip contentStyle={{ backgroundColor: '#1e293b', border: '1px solid #334155' }} />
                <Bar dataKey="latency" fill="#8b5cf6" name="Latency (s)" radius={[0, 4, 4, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* High-cost / poor-performing alerts */}
      {agentStats.some(a => parseFloat(a.successRate) < 70 && a.totalRuns > 0) && (
        <Card className="bg-red-950/30 border-red-800/40">
          <CardHeader>
            <CardTitle className="text-red-300 text-sm flex items-center gap-2">
              <AlertTriangle className="w-4 h-4" /> Agents Needing Attention
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {agentStats.filter(a => parseFloat(a.successRate) < 70 && a.totalRuns > 0).map(agent => (
                <div key={agent.id} className="flex items-center justify-between text-sm">
                  <span className="text-white">{agent.name}</span>
                  <div className="flex items-center gap-3">
                    <span className="text-red-400">{agent.successRate}% success rate</span>
                    <TrendingDown className="w-4 h-4 text-red-400" />
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}