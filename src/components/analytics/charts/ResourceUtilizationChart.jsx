/**
 * @fileoverview Resource Utilization Chart
 * @description Shows CPU and memory usage trends
 * @version 1.0.0
 */

import { useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import { format } from 'date-fns';
import { Activity } from 'lucide-react';

export default function ResourceUtilizationChart({ runs, metrics }) {
  const chartData = useMemo(() => {
    const grouped = runs.reduce((acc, run) => {
      const date = format(new Date(run.created_date), 'MMM dd');
      if (!acc[date]) {
        acc[date] = { date, cpu: [], memory: [] };
      }
      
      const runMetrics = metrics.filter(m => m.run_id === run.id);
      runMetrics.forEach(m => {
        if (m.cpu_usage_percent !== undefined) acc[date].cpu.push(m.cpu_usage_percent);
        if (m.memory_mb !== undefined) acc[date].memory.push(m.memory_mb);
      });
      
      return acc;
    }, {});

    return Object.values(grouped)
      .map(item => ({
        date: item.date,
        avgCpu: item.cpu.length > 0 
          ? (item.cpu.reduce((a, b) => a + b, 0) / item.cpu.length).toFixed(1)
          : 0,
        avgMemory: item.memory.length > 0
          ? Math.round(item.memory.reduce((a, b) => a + b, 0) / item.memory.length)
          : 0,
      }))
      .filter(item => item.avgCpu > 0 || item.avgMemory > 0)
      .sort((a, b) => new Date(a.date) - new Date(b.date));
  }, [runs, metrics]);

  const CustomTooltip = ({ active, payload }) => {
    if (!active || !payload || !payload.length) return null;

    return (
      <div className="bg-slate-900 border border-slate-700 rounded-lg p-3 shadow-xl">
        <p className="text-sm text-slate-300 mb-1">{payload[0].payload.date}</p>
        <p className="text-sm font-semibold text-blue-400">
          CPU: {payload[0].value}%
        </p>
        <p className="text-sm font-semibold text-purple-400">
          Memory: {payload[1]?.value || 0} MB
        </p>
      </div>
    );
  };

  if (chartData.length === 0) {
    return (
      <Card className="bg-slate-900 border-slate-800">
        <CardHeader>
          <CardTitle className="text-white flex items-center gap-2">
            <Activity className="w-5 h-5 text-purple-400" />
            Resource Utilization
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-[300px] flex items-center justify-center text-slate-500">
            No resource utilization data available
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="bg-slate-900 border-slate-800">
      <CardHeader>
        <CardTitle className="text-white flex items-center gap-2">
          <Activity className="w-5 h-5 text-purple-400" />
          Resource Utilization
        </CardTitle>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={300}>
          <LineChart data={chartData}>
            <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
            <XAxis 
              dataKey="date" 
              stroke="#94a3b8"
              style={{ fontSize: '12px' }}
            />
            <YAxis 
              yAxisId="left"
              stroke="#94a3b8"
              style={{ fontSize: '12px' }}
              label={{ value: 'CPU %', angle: -90, position: 'insideLeft', style: { fill: '#94a3b8' } }}
            />
            <YAxis 
              yAxisId="right"
              orientation="right"
              stroke="#94a3b8"
              style={{ fontSize: '12px' }}
              label={{ value: 'Memory (MB)', angle: 90, position: 'insideRight', style: { fill: '#94a3b8' } }}
            />
            <Tooltip content={<CustomTooltip />} />
            <Legend wrapperStyle={{ color: '#94a3b8', fontSize: '12px' }} />
            <Line 
              yAxisId="left"
              type="monotone" 
              dataKey="avgCpu" 
              stroke="#3b82f6" 
              strokeWidth={2}
              dot={{ fill: '#3b82f6', r: 4 }}
              name="Avg CPU %"
            />
            <Line 
              yAxisId="right"
              type="monotone" 
              dataKey="avgMemory" 
              stroke="#a855f7" 
              strokeWidth={2}
              dot={{ fill: '#a855f7', r: 4 }}
              name="Avg Memory (MB)"
            />
          </LineChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}