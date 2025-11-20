import React, { useState, useEffect } from 'react';
import { Run, Agent, AgentMetric, Workflow, Event } from '@/entities/all';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { BarChart3, TrendingUp, AlertTriangle, Zap, DollarSign, Clock } from 'lucide-react';
import RunHistoryTable from '../components/analytics/RunHistoryTable';
import PerformanceCharts from '../components/analytics/PerformanceCharts';
import CostBreakdown from '../components/analytics/CostBreakdown';
import ErrorTrendAnalysis from '../components/analytics/ErrorTrendAnalysis';
import BottleneckDetection from '../components/analytics/BottleneckDetection';
import PredictiveInsights from '../components/analytics/PredictiveInsights';
import { toast } from 'sonner';

export default function Analytics() {
  const [runs, setRuns] = useState([]);
  const [agents, setAgents] = useState([]);
  const [workflows, setWorkflows] = useState([]);
  const [metrics, setMetrics] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [timeRange, setTimeRange] = useState('7d');

  useEffect(() => {
    loadAnalyticsData();
    const interval = setInterval(loadAnalyticsData, 30000);
    return () => clearInterval(interval);
  }, [timeRange]);

  const loadAnalyticsData = async () => {
    try {
      const [runData, agentData, workflowData, metricData] = await Promise.all([
        Run.list('-created_date', 500),
        Agent.list(),
        Workflow.list(),
        AgentMetric.list('-timestamp', 1000)
      ]);

      setRuns(runData);
      setAgents(agentData);
      setWorkflows(workflowData);
      setMetrics(metricData);
    } catch (error) {
      console.error('Failed to load analytics:', error);
      toast.error('Failed to load analytics data');
    } finally {
      setIsLoading(false);
    }
  };

  const calculateOverviewStats = () => {
    const totalRuns = runs.length;
    const totalCost = runs.reduce((sum, r) => sum + (r.cost_cents || 0), 0);
    const avgLatency = metrics.length > 0 
      ? metrics.reduce((sum, m) => sum + (m.latency_ms || 0), 0) / metrics.length 
      : 0;
    const errorRate = runs.length > 0
      ? (runs.filter(r => r.state === 'failed').length / runs.length) * 100
      : 0;

    return { totalRuns, totalCost, avgLatency, errorRate };
  };

  const stats = calculateOverviewStats();

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-slate-400">Loading analytics...</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-white mb-2 flex items-center gap-2">
            <BarChart3 className="w-8 h-8 text-blue-400" />
            Workflow Analytics
          </h1>
          <p className="text-slate-400">Comprehensive performance and cost insights</p>
        </div>
        <select
          value={timeRange}
          onChange={(e) => setTimeRange(e.target.value)}
          className="bg-slate-900 border border-slate-700 rounded-lg px-4 py-2 text-white"
        >
          <option value="24h">Last 24 Hours</option>
          <option value="7d">Last 7 Days</option>
          <option value="30d">Last 30 Days</option>
          <option value="90d">Last 90 Days</option>
        </select>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card className="bg-slate-900 border-slate-800">
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="p-3 rounded-lg bg-blue-500/20">
                <Zap className="w-6 h-6 text-blue-400" />
              </div>
              <div>
                <div className="text-2xl font-bold text-white">{stats.totalRuns}</div>
                <div className="text-sm text-slate-400">Total Runs</div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-slate-900 border-slate-800">
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="p-3 rounded-lg bg-green-500/20">
                <DollarSign className="w-6 h-6 text-green-400" />
              </div>
              <div>
                <div className="text-2xl font-bold text-white">${(stats.totalCost / 100).toFixed(2)}</div>
                <div className="text-sm text-slate-400">Total Cost</div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-slate-900 border-slate-800">
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="p-3 rounded-lg bg-purple-500/20">
                <Clock className="w-6 h-6 text-purple-400" />
              </div>
              <div>
                <div className="text-2xl font-bold text-white">{Math.round(stats.avgLatency)}ms</div>
                <div className="text-sm text-slate-400">Avg Latency</div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-slate-900 border-slate-800">
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="p-3 rounded-lg bg-red-500/20">
                <AlertTriangle className="w-6 h-6 text-red-400" />
              </div>
              <div>
                <div className="text-2xl font-bold text-white">{stats.errorRate.toFixed(1)}%</div>
                <div className="text-sm text-slate-400">Error Rate</div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="overview" className="w-full">
        <TabsList className="grid w-full grid-cols-6 bg-slate-800">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="history">Run History</TabsTrigger>
          <TabsTrigger value="performance">Performance</TabsTrigger>
          <TabsTrigger value="costs">Costs</TabsTrigger>
          <TabsTrigger value="errors">Errors</TabsTrigger>
          <TabsTrigger value="insights">AI Insights</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="mt-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <PerformanceCharts runs={runs} metrics={metrics} />
            <CostBreakdown runs={runs} agents={agents} workflows={workflows} />
          </div>
        </TabsContent>

        <TabsContent value="history" className="mt-6">
          <RunHistoryTable runs={runs} agents={agents} workflows={workflows} />
        </TabsContent>

        <TabsContent value="performance" className="mt-6">
          <PerformanceCharts runs={runs} metrics={metrics} detailed />
        </TabsContent>

        <TabsContent value="costs" className="mt-6">
          <CostBreakdown runs={runs} agents={agents} workflows={workflows} detailed />
        </TabsContent>

        <TabsContent value="errors" className="mt-6">
          <ErrorTrendAnalysis runs={runs} workflows={workflows} />
        </TabsContent>

        <TabsContent value="insights" className="mt-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <BottleneckDetection runs={runs} workflows={workflows} agents={agents} />
            <PredictiveInsights runs={runs} metrics={metrics} />
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}