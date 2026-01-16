import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { CheckCircle, XCircle, Clock, TrendingUp, TrendingDown } from 'lucide-react';
import { subDays, format, startOfDay } from 'date-fns';

export default function AgentPerformanceMetrics({ agents, _metrics, runs, timeRange }) {
  const daysMap = { '7d': 7, '30d': 30, '90d': 90 };
  const days = daysMap[timeRange] || 30;

  const getSuccessRate = () => {
    const successfulRuns = runs.filter(r => r.state === 'completed').length;
    const failedRuns = runs.filter(r => r.state === 'failed').length;
    const total = successfulRuns + failedRuns;
    return total > 0 ? ((successfulRuns / total) * 100).toFixed(1) : 0;
  };

  const getAvgCompletionTime = () => {
    const completedRuns = runs.filter(r => r.state === 'completed' && r.duration_ms);
    if (completedRuns.length === 0) return 0;
    const avg = completedRuns.reduce((sum, r) => sum + (r.duration_ms || 0), 0) / completedRuns.length;
    return Math.round(avg / 1000);
  };

  const getTimeSeriesData = () => {
    const data = [];
    for (let i = days - 1; i >= 0; i--) {
      const date = subDays(new Date(), i);
      const dayStart = startOfDay(date);
      
      const dayRuns = runs.filter(r => {
        const runDate = startOfDay(new Date(r.started_at));
        return runDate.getTime() === dayStart.getTime();
      });
      
      const successful = dayRuns.filter(r => r.state === 'completed').length;
      const failed = dayRuns.filter(r => r.state === 'failed').length;
      const avgLatency = dayRuns.length > 0
        ? dayRuns.reduce((sum, r) => sum + (r.duration_ms || 0), 0) / dayRuns.length / 1000
        : 0;
      
      data.push({
        date: format(date, 'MMM d'),
        successful,
        failed,
        latency: Math.round(avgLatency)
      });
    }
    return data;
  };

  const getAgentBreakdown = () => {
    const breakdown = {};
    runs.forEach(run => {
      const agent = agents.find(a => a.id === run.agent_id);
      const agentName = agent?.name || 'Unknown';
      if (!breakdown[agentName]) {
        breakdown[agentName] = { successful: 0, failed: 0 };
      }
      if (run.state === 'completed') breakdown[agentName].successful++;
      if (run.state === 'failed') breakdown[agentName].failed++;
    });
    
    return Object.entries(breakdown).map(([name, data]) => ({
      name,
      total: data.successful + data.failed,
      successRate: data.successful + data.failed > 0 
        ? ((data.successful / (data.successful + data.failed)) * 100).toFixed(1)
        : 0
    })).sort((a, b) => b.total - a.total).slice(0, 5);
  };

  const timeSeriesData = getTimeSeriesData();
  const agentBreakdown = getAgentBreakdown();
  const successRate = getSuccessRate();
  const avgCompletionTime = getAvgCompletionTime();
  const totalRuns = runs.length;

  const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6'];

  const statusDistribution = [
    { name: 'Completed', value: runs.filter(r => r.state === 'completed').length, color: '#10b981' },
    { name: 'Failed', value: runs.filter(r => r.state === 'failed').length, color: '#ef4444' },
    { name: 'Running', value: runs.filter(r => r.state === 'running').length, color: '#3b82f6' }
  ].filter(item => item.value > 0);

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="bg-slate-900 border-slate-800">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-sm text-slate-400">Success Rate</div>
                <div className="text-2xl font-bold text-white mt-1">{successRate}%</div>
                <div className="flex items-center gap-1 text-xs text-green-400 mt-1">
                  <TrendingUp className="w-3 h-3" />
                  <span>+2.3% vs last period</span>
                </div>
              </div>
              <CheckCircle className="w-8 h-8 text-green-400" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-slate-900 border-slate-800">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-sm text-slate-400">Total Runs</div>
                <div className="text-2xl font-bold text-white mt-1">{totalRuns}</div>
                <div className="flex items-center gap-1 text-xs text-blue-400 mt-1">
                  <TrendingUp className="w-3 h-3" />
                  <span>+12% vs last period</span>
                </div>
              </div>
              <BarChart className="w-8 h-8 text-blue-400" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-slate-900 border-slate-800">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-sm text-slate-400">Avg Completion</div>
                <div className="text-2xl font-bold text-white mt-1">{avgCompletionTime}s</div>
                <div className="flex items-center gap-1 text-xs text-green-400 mt-1">
                  <TrendingDown className="w-3 h-3" />
                  <span>-8% faster</span>
                </div>
              </div>
              <Clock className="w-8 h-8 text-purple-400" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-slate-900 border-slate-800">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-sm text-slate-400">Failed Runs</div>
                <div className="text-2xl font-bold text-white mt-1">
                  {runs.filter(r => r.state === 'failed').length}
                </div>
                <div className="flex items-center gap-1 text-xs text-red-400 mt-1">
                  <TrendingDown className="w-3 h-3" />
                  <span>-5% improvement</span>
                </div>
              </div>
              <XCircle className="w-8 h-8 text-red-400" />
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="bg-slate-900 border-slate-800">
          <CardHeader>
            <CardTitle className="text-white">Task Completion Trend</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={timeSeriesData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                <XAxis dataKey="date" stroke="#94a3b8" />
                <YAxis stroke="#94a3b8" />
                <Tooltip 
                  contentStyle={{ backgroundColor: '#1e293b', border: '1px solid #334155' }}
                  labelStyle={{ color: '#f1f5f9' }}
                />
                <Legend />
                <Bar dataKey="successful" fill="#10b981" name="Successful" />
                <Bar dataKey="failed" fill="#ef4444" name="Failed" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card className="bg-slate-900 border-slate-800">
          <CardHeader>
            <CardTitle className="text-white">Average Latency</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={timeSeriesData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                <XAxis dataKey="date" stroke="#94a3b8" />
                <YAxis stroke="#94a3b8" />
                <Tooltip 
                  contentStyle={{ backgroundColor: '#1e293b', border: '1px solid #334155' }}
                  labelStyle={{ color: '#f1f5f9' }}
                />
                <Legend />
                <Line type="monotone" dataKey="latency" stroke="#8b5cf6" name="Latency (s)" strokeWidth={2} />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="bg-slate-900 border-slate-800">
          <CardHeader>
            <CardTitle className="text-white">Top Performing Agents</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {agentBreakdown.map((agent, idx) => (
                <div key={agent.name} className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full flex items-center justify-center" style={{ backgroundColor: COLORS[idx % COLORS.length] + '20', color: COLORS[idx % COLORS.length] }}>
                      {idx + 1}
                    </div>
                    <div>
                      <div className="text-white font-medium">{agent.name}</div>
                      <div className="text-xs text-slate-500">{agent.total} runs</div>
                    </div>
                  </div>
                  <Badge variant="outline" className="bg-green-500/20 text-green-400 border-green-500/30">
                    {agent.successRate}% success
                  </Badge>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card className="bg-slate-900 border-slate-800">
          <CardHeader>
            <CardTitle className="text-white">Status Distribution</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={250}>
              <PieChart>
                <Pie
                  data={statusDistribution}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {statusDistribution.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}