/**
 * @fileoverview Workflow Analytics Dashboard
 * @description Comprehensive analytics for workflow execution metrics
 * @version 1.0.0
 */

import React, { useState, useEffect, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { DatePickerWithRange } from '@/components/ui/date-picker';
import { TrendingUp, TrendingDown, Clock, DollarSign, CheckCircle2, XCircle, Activity } from 'lucide-react';
import { base44 } from '@/api/base44Client';
import { toast } from 'sonner';
import ExecutionTimeChart from './charts/ExecutionTimeChart';
import SuccessRateChart from './charts/SuccessRateChart';
import CostTrendChart from './charts/CostTrendChart';
import ResourceUtilizationChart from './charts/ResourceUtilizationChart';
import WorkflowComparisonChart from './charts/WorkflowComparisonChart';

export default function WorkflowAnalyticsDashboard() {
  const [workflows, setWorkflows] = useState([]);
  const [runs, setRuns] = useState([]);
  const [metrics, setMetrics] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  
  const [selectedWorkflow, setSelectedWorkflow] = useState('all');
  const [selectedStatus, setSelectedStatus] = useState('all');
  const [dateRange, setDateRange] = useState({
    from: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
    to: new Date(),
  });

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setIsLoading(true);
    try {
      const [workflowsData, runsData, metricsData] = await Promise.all([
        base44.entities.Workflow.list(),
        base44.entities.Run.list('-created_date', 500),
        base44.entities.AgentMetric.list('-timestamp', 1000),
      ]);

      setWorkflows(workflowsData || []);
      setRuns(runsData || []);
      setMetrics(metricsData || []);
    } catch (error) {
      console.error('Failed to load analytics data:', error);
      toast.error('Failed to load analytics data');
    } finally {
      setIsLoading(false);
    }
  };

  const filteredRuns = useMemo(() => {
    return runs.filter(run => {
      const runDate = new Date(run.created_date);
      const matchesWorkflow = selectedWorkflow === 'all' || run.workflow_id === selectedWorkflow;
      const matchesStatus = selectedStatus === 'all' || run.status === selectedStatus;
      const matchesDateRange = runDate >= dateRange.from && runDate <= dateRange.to;
      
      return matchesWorkflow && matchesStatus && matchesDateRange;
    });
  }, [runs, selectedWorkflow, selectedStatus, dateRange]);

  const statistics = useMemo(() => {
    if (filteredRuns.length === 0) {
      return {
        totalRuns: 0,
        avgExecutionTime: 0,
        successRate: 0,
        totalCost: 0,
        avgCost: 0,
        failedRuns: 0,
      };
    }

    const totalRuns = filteredRuns.length;
    const successfulRuns = filteredRuns.filter(r => r.status === 'completed').length;
    const failedRuns = filteredRuns.filter(r => r.status === 'failed').length;
    
    const totalExecutionTime = filteredRuns.reduce((sum, run) => {
      const duration = run.duration_ms || 0;
      return sum + duration;
    }, 0);

    const relatedMetrics = metrics.filter(m => 
      filteredRuns.some(r => r.id === m.run_id)
    );

    const totalCost = relatedMetrics.reduce((sum, m) => sum + (m.cost_cents || 0), 0);

    return {
      totalRuns,
      avgExecutionTime: Math.round(totalExecutionTime / totalRuns),
      successRate: ((successfulRuns / totalRuns) * 100).toFixed(1),
      totalCost: totalCost / 100,
      avgCost: (totalCost / totalRuns / 100).toFixed(2),
      failedRuns,
    };
  }, [filteredRuns, metrics]);

  const previousPeriodStats = useMemo(() => {
    const periodLength = dateRange.to - dateRange.from;
    const previousFrom = new Date(dateRange.from - periodLength);
    const previousTo = new Date(dateRange.from);

    const previousRuns = runs.filter(run => {
      const runDate = new Date(run.created_date);
      const matchesWorkflow = selectedWorkflow === 'all' || run.workflow_id === selectedWorkflow;
      const matchesDateRange = runDate >= previousFrom && runDate < previousTo;
      return matchesWorkflow && matchesDateRange;
    });

    if (previousRuns.length === 0) return null;

    const successfulRuns = previousRuns.filter(r => r.status === 'completed').length;
    const totalExecutionTime = previousRuns.reduce((sum, run) => sum + (run.duration_ms || 0), 0);
    const relatedMetrics = metrics.filter(m => previousRuns.some(r => r.id === m.run_id));
    const totalCost = relatedMetrics.reduce((sum, m) => sum + (m.cost_cents || 0), 0);

    return {
      avgExecutionTime: Math.round(totalExecutionTime / previousRuns.length),
      successRate: ((successfulRuns / previousRuns.length) * 100).toFixed(1),
      avgCost: (totalCost / previousRuns.length / 100).toFixed(2),
    };
  }, [runs, metrics, selectedWorkflow, dateRange]);

  const calculateChange = (current, previous) => {
    if (!previous || previous === 0) return null;
    const change = ((current - previous) / previous) * 100;
    return change.toFixed(1);
  };

  const StatCard = ({ title, value, icon: Icon, trend, format = 'number' }) => {
    const formattedValue = format === 'currency' ? `$${value}` : 
                          format === 'time' ? `${Math.round(value / 1000)}s` :
                          format === 'percent' ? `${value}%` : value;

    return (
      <Card className="bg-slate-900 border-slate-800">
        <CardContent className="p-6">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm text-slate-400">{title}</span>
            <Icon className="w-4 h-4 text-slate-400" />
          </div>
          <div className="text-2xl font-bold text-white mb-1">{formattedValue}</div>
          {trend !== null && trend !== undefined && (
            <div className={`flex items-center text-xs ${parseFloat(trend) >= 0 ? 'text-green-400' : 'text-red-400'}`}>
              {parseFloat(trend) >= 0 ? <TrendingUp className="w-3 h-3 mr-1" /> : <TrendingDown className="w-3 h-3 mr-1" />}
              <span>{Math.abs(trend)}% vs previous period</span>
            </div>
          )}
        </CardContent>
      </Card>
    );
  };

  return (
    <div className="space-y-6">
      <Card className="bg-slate-900 border-slate-800">
        <CardContent className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <Select value={selectedWorkflow} onValueChange={setSelectedWorkflow}>
              <SelectTrigger className="bg-slate-950 border-slate-700 text-white">
                <SelectValue placeholder="All Workflows" />
              </SelectTrigger>
              <SelectContent className="bg-slate-900 border-slate-800">
                <SelectItem value="all">All Workflows</SelectItem>
                {workflows.map(workflow => (
                  <SelectItem key={workflow.id} value={workflow.id}>
                    {workflow.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select value={selectedStatus} onValueChange={setSelectedStatus}>
              <SelectTrigger className="bg-slate-950 border-slate-700 text-white">
                <SelectValue placeholder="All Statuses" />
              </SelectTrigger>
              <SelectContent className="bg-slate-900 border-slate-800">
                <SelectItem value="all">All Statuses</SelectItem>
                <SelectItem value="completed">Completed</SelectItem>
                <SelectItem value="failed">Failed</SelectItem>
                <SelectItem value="running">Running</SelectItem>
                <SelectItem value="pending">Pending</SelectItem>
              </SelectContent>
            </Select>

            <DatePickerWithRange
              date={dateRange}
              onDateChange={setDateRange}
              className="bg-slate-950 border-slate-700 text-white"
            />

            <Button 
              onClick={loadData} 
              variant="outline"
              className="border-slate-700 text-white hover:bg-slate-800"
            >
              Refresh Data
            </Button>
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="Total Runs"
          value={statistics.totalRuns}
          icon={Activity}
          trend={previousPeriodStats ? calculateChange(
            statistics.totalRuns,
            previousPeriodStats.totalRuns
          ) : null}
        />
        <StatCard
          title="Avg Execution Time"
          value={statistics.avgExecutionTime}
          icon={Clock}
          format="time"
          trend={previousPeriodStats ? calculateChange(
            statistics.avgExecutionTime,
            previousPeriodStats.avgExecutionTime
          ) : null}
        />
        <StatCard
          title="Success Rate"
          value={statistics.successRate}
          icon={CheckCircle2}
          format="percent"
          trend={previousPeriodStats ? calculateChange(
            parseFloat(statistics.successRate),
            parseFloat(previousPeriodStats.successRate)
          ) : null}
        />
        <StatCard
          title="Avg Cost per Run"
          value={statistics.avgCost}
          icon={DollarSign}
          format="currency"
          trend={previousPeriodStats ? calculateChange(
            parseFloat(statistics.avgCost),
            parseFloat(previousPeriodStats.avgCost)
          ) : null}
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <ExecutionTimeChart runs={filteredRuns} />
        <SuccessRateChart runs={filteredRuns} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <CostTrendChart runs={filteredRuns} metrics={metrics} />
        <ResourceUtilizationChart runs={filteredRuns} metrics={metrics} />
      </div>

      <WorkflowComparisonChart 
        workflows={workflows} 
        runs={filteredRuns}
        metrics={metrics}
      />
    </div>
  );
}