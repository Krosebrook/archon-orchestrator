import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { AgentMetric, Agent } from '@/entities/all';
import { Activity, Cpu, HardDrive, Zap, TrendingUp, AlertTriangle } from 'lucide-react';
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { format, subMinutes } from 'date-fns';

export default function AgentMonitoringDashboard() {
  const [agents, setAgents] = useState([]);
  const [metrics, setMetrics] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadData();
    const interval = setInterval(loadData, 5000); // Refresh every 5 seconds
    return () => clearInterval(interval);
  }, []);

  const loadData = async () => {
    try {
      const [agentData, metricData] = await Promise.all([
        Agent.list(),
        AgentMetric.filter({}, '-timestamp', 100)
      ]);
      setAgents(agentData);
      setMetrics(metricData);
    } catch (error) {
      console.error('Failed to load monitoring data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const getAgentStats = (agentId) => {
    const agentMetrics = metrics.filter(m => m.agent_id === agentId);
    if (agentMetrics.length === 0) return null;

    const recent = agentMetrics.slice(0, 20);
    const avgLatency = recent.reduce((sum, m) => sum + (m.latency_ms || 0), 0) / recent.length;
    const avgCpu = recent.reduce((sum, m) => sum + (m.cpu_usage_percent || 0), 0) / recent.length;
    const avgMemory = recent.reduce((sum, m) => sum + (m.memory_mb || 0), 0) / recent.length;
    const errorRate = recent.filter(m => m.status === 'error').length / recent.length;
    const totalCost = recent.reduce((sum, m) => sum + (m.cost_cents || 0), 0);

    return {
      avgLatency: Math.round(avgLatency),
      avgCpu: Math.round(avgCpu * 10) / 10,
      avgMemory: Math.round(avgMemory),
      errorRate: Math.round(errorRate * 1000) / 10,
      totalCost: totalCost / 100,
      requestCount: recent.reduce((sum, m) => sum + (m.request_count || 1), 0)
    };
  };

  const getPerformanceData = () => {
    const now = new Date();
    const timeSlots = [];
    
    for (let i = 9; i >= 0; i--) {
      const time = subMinutes(now, i * 5);
      const slotMetrics = metrics.filter(m => {
        const metricTime = new Date(m.timestamp);
        return metricTime >= subMinutes(time, 5) && metricTime < time;
      });

      timeSlots.push({
        time: format(time, 'HH:mm'),
        latency: slotMetrics.reduce((sum, m) => sum + (m.latency_ms || 0), 0) / Math.max(slotMetrics.length, 1),
        cpu: slotMetrics.reduce((sum, m) => sum + (m.cpu_usage_percent || 0), 0) / Math.max(slotMetrics.length, 1),
        memory: slotMetrics.reduce((sum, m) => sum + (m.memory_mb || 0), 0) / Math.max(slotMetrics.length, 1),
        requests: slotMetrics.reduce((sum, m) => sum + (m.request_count || 1), 0)
      });
    }

    return timeSlots;
  };

  const performanceData = getPerformanceData();

  const getHealthStatus = (stats) => {
    if (!stats) return 'unknown';
    if (stats.errorRate > 10 || stats.avgCpu > 80) return 'critical';
    if (stats.errorRate > 5 || stats.avgCpu > 60) return 'warning';
    return 'healthy';
  };

  const statusColors = {
    healthy: 'bg-green-500/20 text-green-400 border-green-500/30',
    warning: 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30',
    critical: 'bg-red-500/20 text-red-400 border-red-500/30',
    unknown: 'bg-slate-500/20 text-slate-400 border-slate-500/30'
  };

  if (isLoading) {
    return (
      <div className="text-center py-12 text-slate-400">
        Loading monitoring data...
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="bg-slate-900 border-slate-800">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-sm text-slate-400">Active Agents</div>
                <div className="text-2xl font-bold text-white mt-1">
                  {agents.filter(a => a.status === 'active').length}
                </div>
              </div>
              <Activity className="w-8 h-8 text-blue-400" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-slate-900 border-slate-800">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-sm text-slate-400">Avg CPU Usage</div>
                <div className="text-2xl font-bold text-white mt-1">
                  {Math.round(metrics.slice(0, 20).reduce((sum, m) => sum + (m.cpu_usage_percent || 0), 0) / 20)}%
                </div>
              </div>
              <Cpu className="w-8 h-8 text-purple-400" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-slate-900 border-slate-800">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-sm text-slate-400">Avg Memory</div>
                <div className="text-2xl font-bold text-white mt-1">
                  {Math.round(metrics.slice(0, 20).reduce((sum, m) => sum + (m.memory_mb || 0), 0) / 20)}MB
                </div>
              </div>
              <HardDrive className="w-8 h-8 text-green-400" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-slate-900 border-slate-800">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-sm text-slate-400">Total Requests</div>
                <div className="text-2xl font-bold text-white mt-1">
                  {metrics.slice(0, 20).reduce((sum, m) => sum + (m.request_count || 1), 0)}
                </div>
              </div>
              <Zap className="w-8 h-8 text-yellow-400" />
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="bg-slate-900 border-slate-800">
          <CardHeader>
            <CardTitle className="text-white">Performance Over Time</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={250}>
              <LineChart data={performanceData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                <XAxis dataKey="time" stroke="#94a3b8" />
                <YAxis stroke="#94a3b8" />
                <Tooltip contentStyle={{ backgroundColor: '#1e293b', border: '1px solid #334155' }} />
                <Legend />
                <Line type="monotone" dataKey="latency" stroke="#60a5fa" name="Latency (ms)" />
                <Line type="monotone" dataKey="cpu" stroke="#a78bfa" name="CPU (%)" />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card className="bg-slate-900 border-slate-800">
          <CardHeader>
            <CardTitle className="text-white">Resource Utilization</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={250}>
              <BarChart data={performanceData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                <XAxis dataKey="time" stroke="#94a3b8" />
                <YAxis stroke="#94a3b8" />
                <Tooltip contentStyle={{ backgroundColor: '#1e293b', border: '1px solid #334155' }} />
                <Legend />
                <Bar dataKey="memory" fill="#34d399" name="Memory (MB)" />
                <Bar dataKey="requests" fill="#fbbf24" name="Requests" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      <Card className="bg-slate-900 border-slate-800">
        <CardHeader>
          <CardTitle className="text-white flex items-center gap-2">
            <TrendingUp className="w-5 h-5 text-blue-400" />
            Agent Health Status
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {agents.map(agent => {
              const stats = getAgentStats(agent.id);
              const health = getHealthStatus(stats);
              
              return (
                <div key={agent.id} className="p-4 bg-slate-950 rounded-lg border border-slate-800">
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-3">
                      <div className="text-white font-medium">{agent.name}</div>
                      <Badge variant="outline" className={statusColors[health]}>
                        {health}
                      </Badge>
                    </div>
                  </div>
                  
                  {stats ? (
                    <div className="grid grid-cols-2 sm:grid-cols-6 gap-4 text-sm">
                      <div>
                        <div className="text-slate-500 text-xs">Latency</div>
                        <div className="text-white">{stats.avgLatency}ms</div>
                      </div>
                      <div>
                        <div className="text-slate-500 text-xs">CPU</div>
                        <div className="text-white">{stats.avgCpu}%</div>
                      </div>
                      <div>
                        <div className="text-slate-500 text-xs">Memory</div>
                        <div className="text-white">{stats.avgMemory}MB</div>
                      </div>
                      <div>
                        <div className="text-slate-500 text-xs">Error Rate</div>
                        <div className={stats.errorRate > 5 ? 'text-red-400' : 'text-white'}>
                          {stats.errorRate}%
                        </div>
                      </div>
                      <div>
                        <div className="text-slate-500 text-xs">Requests</div>
                        <div className="text-white">{stats.requestCount}</div>
                      </div>
                      <div>
                        <div className="text-slate-500 text-xs">Cost</div>
                        <div className="text-white">${stats.totalCost.toFixed(2)}</div>
                      </div>
                    </div>
                  ) : (
                    <div className="text-slate-500 text-sm">No recent metrics</div>
                  )}
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}