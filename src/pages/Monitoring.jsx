import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Activity, TrendingUp, AlertTriangle, Zap, DollarSign, Clock } from 'lucide-react';
import { base44 } from '@/api/base44Client';
import { Line, Bar } from 'recharts';
import { ResponsiveContainer, LineChart, BarChart, XAxis, YAxis, CartesianGrid, Tooltip, Legend } from 'recharts';
import { Badge } from '@/components/ui/badge';
import { format } from 'date-fns';

export default function Monitoring() {
  const [metrics, setMetrics] = useState([]);
  const [runs, setRuns] = useState([]);
  const [alerts, setAlerts] = useState([]);
  const [systemMetrics, setSystemMetrics] = useState([]);
  const [timeRange, setTimeRange] = useState('1h');

  useEffect(() => {
    loadData();
    const interval = setInterval(loadData, 5000);
    return () => clearInterval(interval);
  }, [timeRange]);

  const loadData = async () => {
    try {
      const now = new Date();
      const ranges = {
        '1h': 60 * 60 * 1000,
        '6h': 6 * 60 * 60 * 1000,
        '24h': 24 * 60 * 60 * 1000
      };
      const startTime = new Date(now - ranges[timeRange]);

      const [metricsData, runsData, alertsData, sysMetricsData] = await Promise.all([
        base44.entities.AgentMetric.filter(
          { timestamp: { $gte: startTime.toISOString() } },
          '-timestamp',
          500
        ),
        base44.entities.Run.filter(
          { created_date: { $gte: startTime.toISOString() } },
          '-created_date',
          100
        ),
        base44.entities.Alert.filter({ status: 'active' }, '-created_date', 20),
        base44.entities.SystemMetric.filter(
          { timestamp: { $gte: startTime.toISOString() } },
          '-timestamp',
          200
        )
      ]);

      setMetrics(metricsData);
      setRuns(runsData);
      setAlerts(alertsData);
      setSystemMetrics(sysMetricsData);
    } catch (error) {
      console.error('Failed to load monitoring data:', error);
    }
  };

  // Aggregate metrics by time buckets
  const aggregateByTime = (data, valueKey, buckets = 12) => {
    const bucketSize = (Date.now() - Date.parse(data[data.length - 1]?.timestamp || Date.now())) / buckets;
    const aggregated = [];

    for (let i = 0; i < buckets; i++) {
      const bucketStart = Date.now() - (buckets - i) * bucketSize;
      const bucketEnd = bucketStart + bucketSize;
      const bucketData = data.filter(d => {
        const time = Date.parse(d.timestamp || d.created_date);
        return time >= bucketStart && time < bucketEnd;
      });

      aggregated.push({
        time: format(new Date(bucketStart), 'HH:mm'),
        value: bucketData.reduce((sum, d) => sum + (d[valueKey] || 0), 0) / Math.max(bucketData.length, 1)
      });
    }

    return aggregated;
  };

  const costData = aggregateByTime(metrics, 'cost_cents');
  const latencyData = aggregateByTime(metrics, 'latency_ms');
  const runData = aggregateByTime(runs, 'cost_cents');

  // Calculate summary stats
  const totalCost = metrics.reduce((sum, m) => sum + (m.cost_cents || 0), 0);
  const avgLatency = metrics.reduce((sum, m) => sum + (m.latency_ms || 0), 0) / Math.max(metrics.length, 1);
  const successRate = runs.filter(r => r.state === 'completed').length / Math.max(runs.length, 1);
  const activeRuns = runs.filter(r => r.state === 'running').length;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-white mb-2">Advanced Monitoring</h1>
          <p className="text-slate-400">Real-time performance metrics and system health</p>
        </div>
        <div className="flex gap-2">
          {['1h', '6h', '24h'].map(range => (
            <button
              key={range}
              onClick={() => setTimeRange(range)}
              className={`px-3 py-1 rounded-lg text-sm ${
                timeRange === range
                  ? 'bg-blue-600 text-white'
                  : 'bg-slate-800 text-slate-400 hover:bg-slate-700'
              }`}
            >
              {range}
            </button>
          ))}
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-6">
        <Card className="bg-slate-900 border-slate-800">
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="p-3 rounded-lg bg-green-500/20">
                <DollarSign className="w-6 h-6 text-green-400" />
              </div>
              <div>
                <div className="text-2xl font-bold text-white">${(totalCost / 100).toFixed(2)}</div>
                <div className="text-sm text-slate-400">Total Cost</div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-slate-900 border-slate-800">
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="p-3 rounded-lg bg-blue-500/20">
                <Clock className="w-6 h-6 text-blue-400" />
              </div>
              <div>
                <div className="text-2xl font-bold text-white">{Math.round(avgLatency)}ms</div>
                <div className="text-sm text-slate-400">Avg Latency</div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-slate-900 border-slate-800">
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="p-3 rounded-lg bg-purple-500/20">
                <TrendingUp className="w-6 h-6 text-purple-400" />
              </div>
              <div>
                <div className="text-2xl font-bold text-white">{(successRate * 100).toFixed(1)}%</div>
                <div className="text-sm text-slate-400">Success Rate</div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-slate-900 border-slate-800">
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="p-3 rounded-lg bg-orange-500/20">
                <Activity className="w-6 h-6 text-orange-400" />
              </div>
              <div>
                <div className="text-2xl font-bold text-white">{activeRuns}</div>
                <div className="text-sm text-slate-400">Active Runs</div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="performance" className="w-full">
        <TabsList className="grid w-full grid-cols-4 bg-slate-800">
          <TabsTrigger value="performance">Performance</TabsTrigger>
          <TabsTrigger value="cost">Cost</TabsTrigger>
          <TabsTrigger value="alerts">Alerts ({alerts.length})</TabsTrigger>
          <TabsTrigger value="system">System</TabsTrigger>
        </TabsList>

        <TabsContent value="performance" className="mt-6">
          <Card className="bg-slate-900 border-slate-800">
            <CardHeader>
              <CardTitle className="text-white">Latency Trends</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={latencyData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                  <XAxis dataKey="time" stroke="#94a3b8" />
                  <YAxis stroke="#94a3b8" />
                  <Tooltip
                    contentStyle={{ backgroundColor: '#1e293b', border: '1px solid #334155' }}
                    labelStyle={{ color: '#cbd5e1' }}
                  />
                  <Legend />
                  <Line type="monotone" dataKey="value" stroke="#3b82f6" name="Latency (ms)" strokeWidth={2} />
                </LineChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="cost" className="mt-6">
          <Card className="bg-slate-900 border-slate-800">
            <CardHeader>
              <CardTitle className="text-white">Cost Analysis</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={costData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                  <XAxis dataKey="time" stroke="#94a3b8" />
                  <YAxis stroke="#94a3b8" />
                  <Tooltip
                    contentStyle={{ backgroundColor: '#1e293b', border: '1px solid #334155' }}
                    labelStyle={{ color: '#cbd5e1' }}
                  />
                  <Legend />
                  <Bar dataKey="value" fill="#10b981" name="Cost (cents)" />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="alerts" className="mt-6">
          <Card className="bg-slate-900 border-slate-800">
            <CardHeader>
              <CardTitle className="text-white flex items-center gap-2">
                <AlertTriangle className="w-5 h-5 text-orange-400" />
                Active Alerts
              </CardTitle>
            </CardHeader>
            <CardContent>
              {alerts.length === 0 ? (
                <div className="text-center py-8 text-slate-400">
                  No active alerts
                </div>
              ) : (
                <div className="space-y-3">
                  {alerts.map(alert => (
                    <div key={alert.id} className="p-3 bg-red-900/20 rounded-lg border border-red-800/30">
                      <div className="flex items-start justify-between mb-1">
                        <span className="text-white font-medium">{alert.name}</span>
                        <Badge variant="outline" className="bg-red-500/20 text-red-400 border-red-500/30">
                          {alert.severity}
                        </Badge>
                      </div>
                      <p className="text-sm text-slate-400 mb-2">{alert.message}</p>
                      <div className="text-xs text-slate-500">
                        {format(new Date(alert.created_date), 'MMM d, h:mm a')}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="system" className="mt-6">
          <Card className="bg-slate-900 border-slate-800">
            <CardHeader>
              <CardTitle className="text-white">System Health</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 gap-4">
                {systemMetrics.slice(0, 6).map((metric, idx) => (
                  <div key={idx} className="p-3 bg-slate-950 rounded-lg border border-slate-800">
                    <div className="text-sm text-slate-400 mb-1">{metric.metric_name}</div>
                    <div className="text-lg font-bold text-white">
                      {metric.value} {metric.unit}
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}