import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import TraceViewer from '../components/observability/TraceViewer';
import { base44 } from '@/api/base44Client';
import { Eye, Activity, Cpu, Database, AlertCircle } from 'lucide-react';
import TraceExplorer from '../components/observability/TraceExplorer';
import MetricsPanel from '../components/observability/MetricsPanel';
import LogsViewer from '../components/observability/LogsViewer';
import PerformanceInsights from '../components/observability/PerformanceInsights';

export default function Observability() {
  const [metrics, setMetrics] = useState([]);
  const [runs, setRuns] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadData();
    const interval = setInterval(loadData, 10000);
    return () => clearInterval(interval);
  }, []);

  const loadData = async () => {
    try {
      const [metricsData, runsData] = await Promise.all([
        base44.entities.SystemMetric.list('-timestamp', 100),
        base44.entities.Run.list('-started_at', 50)
      ]);
      setMetrics(metricsData);
      setRuns(runsData);
    } catch (error) {
      console.error('Failed to load observability data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const recentRuns = runs.slice(0, 10);
  const avgLatency = runs.length > 0 
    ? Math.round(runs.reduce((sum, r) => {
        if (!r.started_at || !r.finished_at) return sum;
        return sum + (new Date(r.finished_at) - new Date(r.started_at));
      }, 0) / runs.length / 1000)
    : 0;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-white mb-2 flex items-center gap-3">
          <Eye className="w-8 h-8 text-blue-400" />
          Advanced Observability
        </h1>
        <p className="text-slate-400">Real-time system monitoring, traces, and performance insights</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="bg-slate-900 border-slate-800">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm text-slate-400">Active Runs</span>
              <Activity className="w-4 h-4 text-green-500" />
            </div>
            <div className="text-3xl font-bold text-white">
              {runs.filter(r => r.state === 'running').length}
            </div>
          </CardContent>
        </Card>

        <Card className="bg-slate-900 border-slate-800">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm text-slate-400">Avg Latency</span>
              <Cpu className="w-4 h-4 text-blue-500" />
            </div>
            <div className="text-3xl font-bold text-blue-400">{avgLatency}s</div>
          </CardContent>
        </Card>

        <Card className="bg-slate-900 border-slate-800">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm text-slate-400">Error Rate</span>
              <AlertCircle className="w-4 h-4 text-red-500" />
            </div>
            <div className="text-3xl font-bold text-red-400">
              {runs.length > 0 
                ? ((runs.filter(r => r.state === 'failed').length / runs.length) * 100).toFixed(1)
                : 0}%
            </div>
          </CardContent>
        </Card>

        <Card className="bg-slate-900 border-slate-800">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm text-slate-400">Metrics</span>
              <Database className="w-4 h-4 text-purple-500" />
            </div>
            <div className="text-3xl font-bold text-purple-400">{metrics.length}</div>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="traces" className="w-full">
        <TabsList className="grid w-full grid-cols-4 bg-slate-800">
          <TabsTrigger value="traces">Traces</TabsTrigger>
          <TabsTrigger value="metrics">Metrics</TabsTrigger>
          <TabsTrigger value="logs">Logs</TabsTrigger>
          <TabsTrigger value="insights">Insights</TabsTrigger>
        </TabsList>

        <TabsContent value="traces" className="mt-6">
          <TraceExplorer runs={recentRuns} />
        </TabsContent>

        <TabsContent value="metrics" className="mt-6">
          <MetricsPanel metrics={metrics} />
        </TabsContent>

        <TabsContent value="logs" className="mt-6">
          <LogsViewer runs={recentRuns} />
        </TabsContent>

        <TabsContent value="insights" className="mt-6">
          <PerformanceInsights runs={runs} metrics={metrics} />
        </TabsContent>
      </Tabs>
    </div>
  );
}