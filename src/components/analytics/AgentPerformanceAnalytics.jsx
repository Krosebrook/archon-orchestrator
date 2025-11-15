import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { TrendingUp, DollarSign, Zap, Clock, CheckCircle2, XCircle } from 'lucide-react';
import { base44 } from '@/api/base44Client';
import { LineChart, Line, BarChart, Bar, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { format, subDays } from 'date-fns';

const COLORS = ['#3b82f6', '#8b5cf6', '#10b981', '#f59e0b', '#ef4444', '#06b6d4'];

function MetricCard({ title, value, change, icon: Icon, trend = 'neutral' }) {
  const trendColors = {
    up: 'text-green-400',
    down: 'text-red-400',
    neutral: 'text-slate-400'
  };

  return (
    <Card className="bg-slate-900 border-slate-800">
      <CardContent className="pt-6">
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm text-slate-400">{title}</span>
          <Icon className="w-4 h-4 text-slate-500" />
        </div>
        <div className="text-2xl font-bold text-white mb-1">{value}</div>
        {change && (
          <div className={`text-xs flex items-center gap-1 ${trendColors[trend]}`}>
            <TrendingUp className="w-3 h-3" />
            {change}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

export default function AgentPerformanceAnalytics() {
  const [agents, setAgents] = useState([]);
  const [metrics, setMetrics] = useState([]);
  const [selectedAgent, setSelectedAgent] = useState('all');
  const [timeRange, setTimeRange] = useState('7d');
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, [timeRange, selectedAgent]);

  const loadData = async () => {
    setIsLoading(true);
    try {
      const [agentData, metricData] = await Promise.all([
        base44.entities.Agent.list(),
        base44.entities.AgentMetric.list('-timestamp', 1000)
      ]);
      setAgents(agentData);
      setMetrics(metricData);
    } catch (error) {
      console.error('Failed to load analytics:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const filteredMetrics = metrics.filter(m => {
    if (selectedAgent !== 'all' && m.agent_id !== selectedAgent) return false;
    
    const daysAgo = timeRange === '7d' ? 7 : timeRange === '30d' ? 30 : 90;
    const cutoff = subDays(new Date(), daysAgo);
    return new Date(m.timestamp) >= cutoff;
  });

  // Calculate aggregate stats
  const totalCost = filteredMetrics.reduce((sum, m) => sum + (m.cost_cents || 0), 0) / 100;
  const totalTokens = filteredMetrics.reduce((sum, m) => sum + (m.prompt_tokens || 0) + (m.completion_tokens || 0), 0);
  const avgLatency = filteredMetrics.length > 0 
    ? Math.round(filteredMetrics.reduce((sum, m) => sum + (m.latency_ms || 0), 0) / filteredMetrics.length)
    : 0;
  const successRate = filteredMetrics.length > 0
    ? Math.round((filteredMetrics.filter(m => m.status === 'success').length / filteredMetrics.length) * 100)
    : 0;

  // Group by date for time series
  const timeSeriesData = filteredMetrics.reduce((acc, m) => {
    const date = format(new Date(m.timestamp), 'MMM d');
    if (!acc[date]) {
      acc[date] = { date, cost: 0, tokens: 0, requests: 0, errors: 0 };
    }
    acc[date].cost += (m.cost_cents || 0) / 100;
    acc[date].tokens += (m.prompt_tokens || 0) + (m.completion_tokens || 0);
    acc[date].requests += 1;
    if (m.status !== 'success') acc[date].errors += 1;
    return acc;
  }, {});

  const chartData = Object.values(timeSeriesData).slice(-14);

  // Provider distribution
  const providerData = filteredMetrics.reduce((acc, m) => {
    acc[m.provider] = (acc[m.provider] || 0) + 1;
    return acc;
  }, {});

  const providerChartData = Object.entries(providerData).map(([name, value]) => ({ name, value }));

  // Agent comparison
  const agentStats = filteredMetrics.reduce((acc, m) => {
    if (!acc[m.agent_id]) {
      acc[m.agent_id] = { 
        agent_id: m.agent_id, 
        requests: 0, 
        cost: 0, 
        avgLatency: 0, 
        successRate: 0,
        latencies: []
      };
    }
    acc[m.agent_id].requests += 1;
    acc[m.agent_id].cost += (m.cost_cents || 0) / 100;
    acc[m.agent_id].latencies.push(m.latency_ms || 0);
    return acc;
  }, {});

  const agentComparisonData = Object.values(agentStats).map(stat => {
    const agent = agents.find(a => a.id === stat.agent_id);
    return {
      name: agent?.name || stat.agent_id.slice(0, 8),
      requests: stat.requests,
      cost: stat.cost,
      avgLatency: Math.round(stat.latencies.reduce((sum, l) => sum + l, 0) / stat.latencies.length)
    };
  }).slice(0, 10);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-white">Agent Performance Analytics</h2>
          <p className="text-slate-400">Detailed metrics across all AI agents</p>
        </div>
        <div className="flex items-center gap-3">
          <Select value={selectedAgent} onValueChange={setSelectedAgent}>
            <SelectTrigger className="w-48 bg-slate-800 border-slate-700">
              <SelectValue />
            </SelectTrigger>
            <SelectContent className="bg-slate-800 border-slate-700">
              <SelectItem value="all">All Agents</SelectItem>
              {agents.map(agent => (
                <SelectItem key={agent.id} value={agent.id}>{agent.name}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select value={timeRange} onValueChange={setTimeRange}>
            <SelectTrigger className="w-32 bg-slate-800 border-slate-700">
              <SelectValue />
            </SelectTrigger>
            <SelectContent className="bg-slate-800 border-slate-700">
              <SelectItem value="7d">Last 7 days</SelectItem>
              <SelectItem value="30d">Last 30 days</SelectItem>
              <SelectItem value="90d">Last 90 days</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <MetricCard
          title="Total Cost"
          value={`$${totalCost.toFixed(2)}`}
          change="+8% vs last period"
          icon={DollarSign}
          trend="up"
        />
        <MetricCard
          title="Total Tokens"
          value={totalTokens.toLocaleString()}
          change="+12% vs last period"
          icon={Zap}
          trend="up"
        />
        <MetricCard
          title="Avg Latency"
          value={`${avgLatency}ms`}
          change="-15ms vs last period"
          icon={Clock}
          trend="down"
        />
        <MetricCard
          title="Success Rate"
          value={`${successRate}%`}
          change="+2% vs last period"
          icon={CheckCircle2}
          trend="up"
        />
      </div>

      <Tabs defaultValue="trends" className="w-full">
        <TabsList className="grid w-full grid-cols-4 bg-slate-800">
          <TabsTrigger value="trends">Trends</TabsTrigger>
          <TabsTrigger value="providers">Providers</TabsTrigger>
          <TabsTrigger value="agents">Agent Comparison</TabsTrigger>
          <TabsTrigger value="errors">Errors</TabsTrigger>
        </TabsList>

        <TabsContent value="trends" className="mt-6">
          <Card className="bg-slate-900 border-slate-800">
            <CardHeader>
              <CardTitle className="text-white">Performance Over Time</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={400}>
                <LineChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                  <XAxis dataKey="date" stroke="#9ca3af" fontSize={12} />
                  <YAxis yAxisId="left" stroke="#9ca3af" fontSize={12} />
                  <YAxis yAxisId="right" orientation="right" stroke="#9ca3af" fontSize={12} />
                  <Tooltip
                    contentStyle={{ backgroundColor: '#1e293b', border: '1px solid #334155' }}
                    labelStyle={{ color: '#e2e8f0' }}
                  />
                  <Legend />
                  <Line yAxisId="left" type="monotone" dataKey="cost" stroke="#3b82f6" name="Cost ($)" strokeWidth={2} />
                  <Line yAxisId="right" type="monotone" dataKey="requests" stroke="#10b981" name="Requests" strokeWidth={2} />
                </LineChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="providers" className="mt-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card className="bg-slate-900 border-slate-800">
              <CardHeader>
                <CardTitle className="text-white">Provider Distribution</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <PieChart>
                    <Pie
                      data={providerChartData}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={(entry) => `${entry.name}: ${entry.value}`}
                      outerRadius={100}
                      fill="#8884d8"
                      dataKey="value"
                    >
                      {providerChartData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            <Card className="bg-slate-900 border-slate-800">
              <CardHeader>
                <CardTitle className="text-white">Provider Stats</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {Object.entries(providerData).map(([provider, count]) => {
                    const providerMetrics = filteredMetrics.filter(m => m.provider === provider);
                    const providerCost = providerMetrics.reduce((sum, m) => sum + (m.cost_cents || 0), 0) / 100;
                    const providerSuccess = Math.round((providerMetrics.filter(m => m.status === 'success').length / providerMetrics.length) * 100);
                    
                    return (
                      <div key={provider} className="p-3 bg-slate-950 rounded-lg border border-slate-800">
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-white font-medium capitalize">{provider}</span>
                          <Badge variant="outline" className="bg-slate-800 border-slate-700">
                            {count} requests
                          </Badge>
                        </div>
                        <div className="grid grid-cols-2 gap-2 text-xs">
                          <div className="text-slate-400">Cost: ${providerCost.toFixed(2)}</div>
                          <div className="text-slate-400">Success: {providerSuccess}%</div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="agents" className="mt-6">
          <Card className="bg-slate-900 border-slate-800">
            <CardHeader>
              <CardTitle className="text-white">Agent Comparison</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={400}>
                <BarChart data={agentComparisonData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                  <XAxis dataKey="name" stroke="#9ca3af" fontSize={12} />
                  <YAxis stroke="#9ca3af" fontSize={12} />
                  <Tooltip
                    contentStyle={{ backgroundColor: '#1e293b', border: '1px solid #334155' }}
                    labelStyle={{ color: '#e2e8f0' }}
                  />
                  <Legend />
                  <Bar dataKey="requests" fill="#3b82f6" name="Requests" />
                  <Bar dataKey="cost" fill="#8b5cf6" name="Cost ($)" />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="errors" className="mt-6">
          <Card className="bg-slate-900 border-slate-800">
            <CardHeader>
              <CardTitle className="text-white">Recent Errors</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {filteredMetrics.filter(m => m.status !== 'success').slice(0, 10).map((metric, idx) => {
                  const agent = agents.find(a => a.id === metric.agent_id);
                  return (
                    <div key={idx} className="p-3 bg-slate-950 rounded-lg border border-red-900/30">
                      <div className="flex items-start gap-3">
                        <XCircle className="w-5 h-5 text-red-400 mt-0.5" />
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <span className="text-white font-medium">{agent?.name || 'Unknown Agent'}</span>
                            <Badge variant="outline" className="bg-red-500/20 text-red-400 border-red-500/30">
                              {metric.status}
                            </Badge>
                          </div>
                          <div className="text-xs text-slate-400">
                            {format(new Date(metric.timestamp), 'MMM d, h:mm:ss a')} • {metric.model}
                          </div>
                          {metric.error_code && (
                            <div className="text-xs text-red-300 mt-1">Error: {metric.error_code}</div>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}