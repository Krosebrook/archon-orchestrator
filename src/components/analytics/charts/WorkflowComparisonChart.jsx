/**
 * @fileoverview Workflow Comparison Chart
 * @description Compare metrics across different workflows
 * @version 1.0.0
 */

import { useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import { GitBranch } from 'lucide-react';

export default function WorkflowComparisonChart({ workflows, runs, metrics }) {
  const chartData = useMemo(() => {
    return workflows.map(workflow => {
      const workflowRuns = runs.filter(r => r.workflow_id === workflow.id);
      
      if (workflowRuns.length === 0) {
        return {
          name: workflow.name.length > 20 ? workflow.name.substring(0, 20) + '...' : workflow.name,
          runs: 0,
          avgTime: 0,
          successRate: 0,
          avgCost: 0,
        };
      }

      const successfulRuns = workflowRuns.filter(r => r.status === 'completed').length;
      const totalTime = workflowRuns.reduce((sum, r) => sum + (r.duration_ms || 0), 0);
      
      const workflowMetrics = metrics.filter(m => 
        workflowRuns.some(r => r.id === m.run_id)
      );
      const totalCost = workflowMetrics.reduce((sum, m) => sum + (m.cost_cents || 0), 0);

      return {
        name: workflow.name.length > 20 ? workflow.name.substring(0, 20) + '...' : workflow.name,
        fullName: workflow.name,
        runs: workflowRuns.length,
        avgTime: Math.round(totalTime / workflowRuns.length / 1000),
        successRate: parseFloat(((successfulRuns / workflowRuns.length) * 100).toFixed(1)),
        avgCost: parseFloat((totalCost / workflowRuns.length / 100).toFixed(2)),
      };
    }).filter(w => w.runs > 0);
  }, [workflows, runs, metrics]);

  const CustomTooltip = ({ active, payload }) => {
    if (!active || !payload || !payload.length) return null;

    return (
      <div className="bg-slate-900 border border-slate-700 rounded-lg p-3 shadow-xl">
        <p className="text-sm text-white font-semibold mb-2">{payload[0].payload.fullName}</p>
        <p className="text-sm text-slate-300">Runs: {payload[0].payload.runs}</p>
        <p className="text-sm text-blue-400">Avg Time: {payload[0].payload.avgTime}s</p>
        <p className="text-sm text-green-400">Success: {payload[0].payload.successRate}%</p>
        <p className="text-sm text-yellow-400">Avg Cost: ${payload[0].payload.avgCost}</p>
      </div>
    );
  };

  if (chartData.length === 0) {
    return (
      <Card className="bg-slate-900 border-slate-800">
        <CardHeader>
          <CardTitle className="text-white flex items-center gap-2">
            <GitBranch className="w-5 h-5 text-indigo-400" />
            Workflow Comparison
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-[300px] flex items-center justify-center text-slate-500">
            No workflow data available for comparison
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="bg-slate-900 border-slate-800">
      <CardHeader>
        <CardTitle className="text-white flex items-center gap-2">
          <GitBranch className="w-5 h-5 text-indigo-400" />
          Workflow Comparison
        </CardTitle>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={400}>
          <BarChart data={chartData}>
            <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
            <XAxis 
              dataKey="name" 
              stroke="#94a3b8"
              style={{ fontSize: '11px' }}
              angle={-45}
              textAnchor="end"
              height={100}
            />
            <YAxis 
              stroke="#94a3b8"
              style={{ fontSize: '12px' }}
            />
            <Tooltip content={<CustomTooltip />} />
            <Legend wrapperStyle={{ color: '#94a3b8', fontSize: '12px' }} />
            <Bar dataKey="runs" fill="#6366f1" name="Total Runs" />
            <Bar dataKey="successRate" fill="#10b981" name="Success Rate %" />
            <Bar dataKey="avgTime" fill="#3b82f6" name="Avg Time (s)" />
          </BarChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}