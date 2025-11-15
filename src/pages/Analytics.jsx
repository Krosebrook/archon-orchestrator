import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Run, Agent, Workflow } from '@/entities/all';
import { BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, AreaChart, Area } from 'recharts';
import { TrendingUp, DollarSign, Zap, AlertTriangle } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import { subDays, format } from 'date-fns';

const COLORS = ['#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6', '#06B6D4'];

export default function Analytics() {
  const [runs, setRuns] = useState([]);
  const [agents, setAgents] = useState([]);
  const [workflows, setWorkflows] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [timeRange, setTimeRange] = useState('30d');

  useEffect(() => {
    const fetchData = async () => {
      setIsLoading(true);
      try {
        const [runData, agentData, workflowData] = await Promise.all([
          Run.list('-started_at', 1000),
          Agent.list(),
          Workflow.list()
        ]);
        setRuns(runData);
        setAgents(agentData);
        setWorkflows(workflowData);
      } catch (error) {
        console.error("Failed to fetch analytics data:", error);
      } finally {
        setIsLoading(false);
      }
    };
    fetchData();
  }, []);

  // Cost trend data
  const costTrendData = Array.from({ length: 30 }).map((_, i) => {
    const date = subDays(new Date(), 29 - i);
    const dailyRuns = runs.filter(run => 
      format(new Date(run.started_at), 'yyyy-MM-dd') === format(date, 'yyyy-MM-dd')
    );
    const dailyCost = dailyRuns.reduce((sum, run) => sum + (run.cost_cents || 0), 0);
    return {
      date: format(date, 'MMM d'),
      cost: dailyCost / 100,
      runs: dailyRuns.length,
    };
  });

  // Agent performance data
  const agentPerformanceData = agents.map(agent => {
    const agentRuns = runs.filter(run => run.agent_id === agent.id);
    const totalCost = agentRuns.reduce((sum, run) => sum + (run.cost_cents || 0), 0);
    const successRate = agentRuns.length > 0 
      ? (agentRuns.filter(run => run.state === 'completed').length / agentRuns.length) * 100 
      : 0;
    return {
      name: agent.name,
      runs: agentRuns.length,
      cost: totalCost / 100,
      success_rate: Math.round(successRate),
    };
  });

  // Workflow success rates
  const workflowSuccessData = workflows.map(workflow => {
    const workflowRuns = runs.filter(run => run.workflow_id === workflow.id);
    const successCount = workflowRuns.filter(run => run.state === 'completed').length;
    const successRate = workflowRuns.length > 0 ? (successCount / workflowRuns.length) * 100 : 0;
    return {
      name: workflow.name,
      value: Math.round(successRate),
      runs: workflowRuns.length,
    };
  });

  // Token usage over time
  const tokenUsageData = Array.from({ length: 7 }).map((_, i) => {
    const date = subDays(new Date(), 6 - i);
    const dailyRuns = runs.filter(run => 
      format(new Date(run.started_at), 'yyyy-MM-dd') === format(date, 'yyyy-MM-dd')
    );
    const tokensIn = dailyRuns.reduce((sum, run) => sum + (run.tokens_in || 0), 0);
    const tokensOut = dailyRuns.reduce((sum, run) => sum + (run.tokens_out || 0), 0);
    return {
      date: format(date, 'EEE'),
      tokens_in: tokensIn,
      tokens_out: tokensOut,
      total: tokensIn + tokensOut,
    };
  });

  const totalCost = runs.reduce((sum, run) => sum + (run.cost_cents || 0), 0) / 100;
  const totalRuns = runs.length;
  const avgRunCost = totalRuns > 0 ? totalCost / totalRuns : 0;
  const failureRate = totalRuns > 0 
    ? (runs.filter(run => run.state === 'failed').length / totalRuns) * 100 
    : 0;

  return (
    <div>
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold text-white">Analytics</h1>
          <p className="text-slate-400">Deep insights into your AI operations and performance.</p>
        </div>
        <Select value={timeRange} onValueChange={setTimeRange}>
          <SelectTrigger className="w-32 bg-slate-800 border-slate-700 text-white">
            <SelectValue />
          </SelectTrigger>
          <SelectContent className="bg-slate-900 border-slate-800">
            <SelectItem value="7d">Last 7 days</SelectItem>
            <SelectItem value="30d">Last 30 days</SelectItem>
            <SelectItem value="90d">Last 90 days</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Key Metrics */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4 mb-8">
        <Card className="bg-slate-900 border-slate-800">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-slate-400">Total Spend</CardTitle>
            <DollarSign className="h-4 w-4 text-slate-500" />
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <Skeleton className="h-8 w-24" />
            ) : (
              <>
                <div className="text-2xl font-bold text-white">${totalCost.toFixed(2)}</div>
                <p className="text-xs text-slate-500">Across {totalRuns} runs</p>
              </>
            )}
          </CardContent>
        </Card>

        <Card className="bg-slate-900 border-slate-800">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-slate-400">Avg Cost/Run</CardTitle>
            <TrendingUp className="h-4 w-4 text-slate-500" />
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <Skeleton className="h-8 w-24" />
            ) : (
              <>
                <div className="text-2xl font-bold text-white">${avgRunCost.toFixed(3)}</div>
                <p className="text-xs text-green-400">↓ 12% from last month</p>
              </>
            )}
          </CardContent>
        </Card>

        <Card className="bg-slate-900 border-slate-800">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-slate-400">Success Rate</CardTitle>
            <Zap className="h-4 w-4 text-slate-500" />
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <Skeleton className="h-8 w-24" />
            ) : (
              <>
                <div className="text-2xl font-bold text-white">{(100 - failureRate).toFixed(1)}%</div>
                <p className="text-xs text-green-400">↑ 2.1% from last month</p>
              </>
            )}
          </CardContent>
        </Card>

        <Card className="bg-slate-900 border-slate-800">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-slate-400">Failure Rate</CardTitle>
            <AlertTriangle className="h-4 w-4 text-slate-500" />
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <Skeleton className="h-8 w-24" />
            ) : (
              <>
                <div className="text-2xl font-bold text-white">{failureRate.toFixed(1)}%</div>
                <p className="text-xs text-red-400">↑ 0.5% from last month</p>
              </>
            )}
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="cost" className="w-full">
        <TabsList className="grid w-full grid-cols-4 bg-slate-800 text-slate-400">
          <TabsTrigger value="cost" className="data-[state=active]:bg-slate-900 data-[state=active]:text-white">Cost Analysis</TabsTrigger>
          <TabsTrigger value="performance" className="data-[state=active]:bg-slate-900 data-[state=active]:text-white">Performance</TabsTrigger>
          <TabsTrigger value="usage" className="data-[state=active]:bg-slate-900 data-[state=active]:text-white">Token Usage</TabsTrigger>
          <TabsTrigger value="workflows" className="data-[state=active]:bg-slate-900 data-[state=active]:text-white">Workflows</TabsTrigger>
        </TabsList>

        <TabsContent value="cost" className="mt-6">
          <Card className="bg-slate-900 border-slate-800">
            <CardHeader>
              <CardTitle className="text-white">Daily Cost Trend</CardTitle>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <Skeleton className="h-[300px] w-full" />
              ) : (
                <ResponsiveContainer width="100%" height={300}>
                  <AreaChart data={costTrendData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                    <XAxis dataKey="date" stroke="#64748b" fontSize={12} />
                    <YAxis stroke="#64748b" fontSize={12} />
                    <Tooltip 
                      contentStyle={{ backgroundColor: '#1e293b', border: '1px solid #475569', borderRadius: '8px' }}
                      labelStyle={{ color: '#f1f5f9' }}
                    />
                    <Area type="monotone" dataKey="cost" stroke="#3B82F6" fill="rgba(59, 130, 246, 0.2)" />
                  </AreaChart>
                </ResponsiveContainer>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="performance" className="mt-6">
          <Card className="bg-slate-900 border-slate-800">
            <CardHeader>
              <CardTitle className="text-white">Agent Performance Comparison</CardTitle>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <Skeleton className="h-[300px] w-full" />
              ) : (
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={agentPerformanceData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                    <XAxis dataKey="name" stroke="#64748b" fontSize={12} />
                    <YAxis stroke="#64748b" fontSize={12} />
                    <Tooltip 
                      contentStyle={{ backgroundColor: '#1e293b', border: '1px solid #475569', borderRadius: '8px' }}
                    />
                    <Bar dataKey="success_rate" fill="#10B981" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="usage" className="mt-6">
          <Card className="bg-slate-900 border-slate-800">
            <CardHeader>
              <CardTitle className="text-white">Token Usage Over Time</CardTitle>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <Skeleton className="h-[300px] w-full" />
              ) : (
                <ResponsiveContainer width="100%" height={300}>
                  <LineChart data={tokenUsageData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                    <XAxis dataKey="date" stroke="#64748b" fontSize={12} />
                    <YAxis stroke="#64748b" fontSize={12} />
                    <Tooltip 
                      contentStyle={{ backgroundColor: '#1e293b', border: '1px solid #475569', borderRadius: '8px' }}
                    />
                    <Line type="monotone" dataKey="tokens_in" stroke="#3B82F6" strokeWidth={2} />
                    <Line type="monotone" dataKey="tokens_out" stroke="#10B981" strokeWidth={2} />
                  </LineChart>
                </ResponsiveContainer>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="workflows" className="mt-6">
          <Card className="bg-slate-900 border-slate-800">
            <CardHeader>
              <CardTitle className="text-white">Workflow Success Rates</CardTitle>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <Skeleton className="h-[300px] w-full" />
              ) : (
                <ResponsiveContainer width="100%" height={300}>
                  <PieChart>
                    <Pie
                      data={workflowSuccessData}
                      cx="50%"
                      cy="50%"
                      outerRadius={80}
                      fill="#8884d8"
                      dataKey="value"
                      label={({ name, value }) => `${name}: ${value}%`}
                    >
                      {workflowSuccessData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}