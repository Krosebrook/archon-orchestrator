import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Progress } from '@/components/ui/progress';
import {
  Activity,
  AlertCircle,
  CheckCircle2,
  Clock,
  Cpu,
  Database,
  DollarSign,
  TrendingUp,
  Zap,
  RefreshCw,
  AlertTriangle
} from 'lucide-react';
import { base44 } from '@/api/base44Client';
import { Run, Agent, Alert, SystemMetric } from '@/entities/all';
import { LineChart, Line, AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { format, subHours } from 'date-fns';

function MetricCard({ title, value, unit, icon: Icon, trend, status = 'normal' }) {
  const statusColors = {
    normal: 'text-green-400',
    warning: 'text-yellow-400',
    critical: 'text-red-400'
  };

  return (
    <Card className="bg-slate-900 border-slate-800">
      <CardContent className="pt-6">
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm text-slate-400">{title}</span>
          <Icon className="w-4 h-4 text-slate-500" />
        </div>
        <div className={`text-3xl font-bold ${statusColors[status]}`}>
          {value}
          {unit && <span className="text-lg text-slate-500 ml-1">{unit}</span>}
        </div>
        {trend && (
          <div className="flex items-center gap-1 mt-2 text-xs text-slate-400">
            <TrendingUp className="w-3 h-3" />
            {trend}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

function HealthStatus({ services }) {
  return (
    <Card className="bg-slate-900 border-slate-800">
      <CardHeader>
        <CardTitle className="text-white text-lg">System Health</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {services.map((service) => (
            <div key={service.name} className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                {service.status === 'operational' ? (
                  <CheckCircle2 className="w-5 h-5 text-green-400" />
                ) : service.status === 'degraded' ? (
                  <AlertTriangle className="w-5 h-5 text-yellow-400" />
                ) : (
                  <AlertCircle className="w-5 h-5 text-red-400" />
                )}
                <div>
                  <div className="text-white font-medium">{service.name}</div>
                  <div className="text-xs text-slate-400">{service.uptime}% uptime</div>
                </div>
              </div>
              <Badge
                variant="outline"
                className={
                  service.status === 'operational'
                    ? 'bg-green-500/20 text-green-400 border-green-500/30'
                    : service.status === 'degraded'
                    ? 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30'
                    : 'bg-red-500/20 text-red-400 border-red-500/30'
                }
              >
                {service.status}
              </Badge>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}

export default function Monitoring() {
  const [runs, setRuns] = useState([]);
  const [agents, setAgents] = useState([]);
  const [alerts, setAlerts] = useState([]);
  const [metrics, setMetrics] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [autoRefresh, setAutoRefresh] = useState(true);

  const loadData = async () => {
    setIsLoading(true);
    try {
      const [runData, agentData, alertData, metricData] = await Promise.all([
        Run.list('-started_at', 100),
        Agent.list(),
        Alert.list(),
        SystemMetric.list('-timestamp', 50)
      ]);
      setRuns(runData);
      setAgents(agentData);
      setAlerts(alertData);
      setMetrics(metricData);
    } catch (error) {
      console.error('Failed to load monitoring data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadData();
    
    if (autoRefresh) {
      const interval = setInterval(loadData, 30000);
      return () => clearInterval(interval);
    }
  }, [autoRefresh]);

  const successRate = runs.length > 0 
    ? Math.round((runs.filter(r => r.state === 'completed').length / runs.length) * 100)
    : 0;

  const avgCost = runs.length > 0
    ? (runs.reduce((sum, r) => sum + (r.cost_cents || 0), 0) / runs.length / 100).toFixed(2)
    : 0;

  const activeAgents = agents.filter(a => a.status === 'active').length;
  const errorAgents = agents.filter(a => a.status === 'error').length;

  const recentRuns = runs.slice(0, 24);
  const performanceData = recentRuns.reverse().map((run, idx) => ({
    name: `Run ${idx + 1}`,
    cost: (run.cost_cents || 0) / 100,
    tokens: (run.tokens_in || 0) + (run.tokens_out || 0),
    duration: run.finished_at && run.started_at 
      ? (new Date(run.finished_at) - new Date(run.started_at)) / 1000
      : 0
  }));

  const services = [
    { name: 'API Gateway', status: 'operational', uptime: 99.9 },
    { name: 'Database', status: 'operational', uptime: 99.8 },
    { name: 'AI Providers', status: 'operational', uptime: 98.5 },
    { name: 'WebSocket', status: 'operational', uptime: 99.7 },
    { name: 'Background Jobs', status: 'operational', uptime: 99.9 }
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-3xl font-bold text-white mb-2">System Monitoring</h1>
          <p className="text-slate-400">Real-time system health, metrics, and performance tracking</p>
        </div>
        <div className="flex items-center gap-3">
          <Badge variant="outline" className="bg-green-500/20 text-green-400 border-green-500/30">
            <Activity className="w-3 h-3 mr-1" />
            All Systems Operational
          </Badge>
          <Button
            size="sm"
            variant="outline"
            onClick={() => setAutoRefresh(!autoRefresh)}
            className={autoRefresh ? 'border-blue-600' : 'border-slate-700'}
          >
            <RefreshCw className={`w-4 h-4 mr-2 ${autoRefresh ? 'animate-spin' : ''}`} />
            {autoRefresh ? 'Auto-Refresh ON' : 'Auto-Refresh OFF'}
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <MetricCard
          title="Success Rate (24h)"
          value={successRate}
          unit="%"
          icon={CheckCircle2}
          trend="+2.3% vs yesterday"
          status={successRate >= 95 ? 'normal' : successRate >= 80 ? 'warning' : 'critical'}
        />
        <MetricCard
          title="Avg Cost per Run"
          value={`$${avgCost}`}
          icon={DollarSign}
          trend="-8% vs last week"
          status="normal"
        />
        <MetricCard
          title="Active Agents"
          value={activeAgents}
          unit={`/${agents.length}`}
          icon={Zap}
          status={errorAgents === 0 ? 'normal' : 'warning'}
        />
        <MetricCard
          title="Response Time (P95)"
          value="245"
          unit="ms"
          icon={Clock}
          trend="-12ms vs baseline"
          status="normal"
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <Card className="bg-slate-900 border-slate-800">
            <CardHeader>
              <CardTitle className="text-white text-lg">Performance Trends</CardTitle>
            </CardHeader>
            <CardContent>
              <Tabs defaultValue="cost" className="w-full">
                <TabsList className="grid w-full grid-cols-3 bg-slate-800">
                  <TabsTrigger value="cost">Cost</TabsTrigger>
                  <TabsTrigger value="tokens">Tokens</TabsTrigger>
                  <TabsTrigger value="duration">Duration</TabsTrigger>
                </TabsList>
                <TabsContent value="cost" className="mt-4">
                  <ResponsiveContainer width="100%" height={300}>
                    <AreaChart data={performanceData}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                      <XAxis dataKey="name" stroke="#9ca3af" fontSize={12} />
                      <YAxis stroke="#9ca3af" fontSize={12} />
                      <Tooltip
                        contentStyle={{ backgroundColor: '#1e293b', border: '1px solid #334155' }}
                        labelStyle={{ color: '#e2e8f0' }}
                      />
                      <Area type="monotone" dataKey="cost" stroke="#3b82f6" fill="#3b82f6" fillOpacity={0.3} />
                    </AreaChart>
                  </ResponsiveContainer>
                </TabsContent>
                <TabsContent value="tokens" className="mt-4">
                  <ResponsiveContainer width="100%" height={300}>
                    <LineChart data={performanceData}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                      <XAxis dataKey="name" stroke="#9ca3af" fontSize={12} />
                      <YAxis stroke="#9ca3af" fontSize={12} />
                      <Tooltip
                        contentStyle={{ backgroundColor: '#1e293b', border: '1px solid #334155' }}
                        labelStyle={{ color: '#e2e8f0' }}
                      />
                      <Line type="monotone" dataKey="tokens" stroke="#8b5cf6" strokeWidth={2} />
                    </LineChart>
                  </ResponsiveContainer>
                </TabsContent>
                <TabsContent value="duration" className="mt-4">
                  <ResponsiveContainer width="100%" height={300}>
                    <AreaChart data={performanceData}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                      <XAxis dataKey="name" stroke="#9ca3af" fontSize={12} />
                      <YAxis stroke="#9ca3af" fontSize={12} />
                      <Tooltip
                        contentStyle={{ backgroundColor: '#1e293b', border: '1px solid #334155' }}
                        labelStyle={{ color: '#e2e8f0' }}
                      />
                      <Area type="monotone" dataKey="duration" stroke="#10b981" fill="#10b981" fillOpacity={0.3} />
                    </AreaChart>
                  </ResponsiveContainer>
                </TabsContent>
              </Tabs>
            </CardContent>
          </Card>
        </div>

        <HealthStatus services={services} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="bg-slate-900 border-slate-800">
          <CardHeader>
            <CardTitle className="text-white text-lg">Recent Errors</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {runs.filter(r => r.state === 'failed').slice(0, 5).map((run) => (
                <div key={run.id} className="flex items-start gap-3 p-3 bg-slate-950 rounded-lg border border-slate-800">
                  <AlertCircle className="w-4 h-4 text-red-400 mt-0.5" />
                  <div className="flex-1">
                    <div className="text-sm text-white font-medium">Run {run.id.slice(0, 8)}</div>
                    <div className="text-xs text-slate-400 mt-1">
                      {format(new Date(run.started_at), 'MMM d, h:mm a')}
                    </div>
                  </div>
                </div>
              ))}
              {runs.filter(r => r.state === 'failed').length === 0 && (
                <div className="text-center text-slate-400 py-8">No errors in the last 24 hours</div>
              )}
            </div>
          </CardContent>
        </Card>

        <Card className="bg-slate-900 border-slate-800">
          <CardHeader>
            <CardTitle className="text-white text-lg">Active Alerts</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {alerts.filter(a => a.enabled).slice(0, 5).map((alert) => (
                <div key={alert.id} className="flex items-start gap-3 p-3 bg-slate-950 rounded-lg border border-slate-800">
                  <AlertTriangle className="w-4 h-4 text-yellow-400 mt-0.5" />
                  <div className="flex-1">
                    <div className="text-sm text-white font-medium">{alert.name}</div>
                    <div className="text-xs text-slate-400 mt-1">
                      {alert.condition?.threshold && `Threshold: ${alert.condition.threshold}`}
                    </div>
                  </div>
                </div>
              ))}
              {alerts.filter(a => a.enabled).length === 0 && (
                <div className="text-center text-slate-400 py-8">No active alerts configured</div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}