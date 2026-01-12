/**
 * @fileoverview Cost Trend Chart
 * @description Bar chart showing workflow costs over time
 * @version 1.0.0
 */

import { useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import { format } from 'date-fns';
import { DollarSign } from 'lucide-react';

export default function CostTrendChart({ runs, metrics }) {
  const chartData = useMemo(() => {
    const grouped = runs.reduce((acc, run) => {
      const date = format(new Date(run.created_date), 'MMM dd');
      if (!acc[date]) {
        acc[date] = { date, totalCost: 0, count: 0 };
      }
      
      const runMetrics = metrics.filter(m => m.run_id === run.id);
      const runCost = runMetrics.reduce((sum, m) => sum + (m.cost_cents || 0), 0);
      
      acc[date].totalCost += runCost;
      acc[date].count += 1;
      return acc;
    }, {});

    return Object.values(grouped)
      .map(item => ({
        date: item.date,
        totalCost: (item.totalCost / 100).toFixed(2),
        avgCost: (item.totalCost / item.count / 100).toFixed(2),
        count: item.count,
      }))
      .sort((a, b) => new Date(a.date) - new Date(b.date));
  }, [runs, metrics]);

  const CustomTooltip = ({ active, payload }) => {
    if (!active || !payload || !payload.length) return null;

    return (
      <div className="bg-slate-900 border border-slate-700 rounded-lg p-3 shadow-xl">
        <p className="text-sm text-slate-300 mb-1">{payload[0].payload.date}</p>
        <p className="text-sm font-semibold text-white">
          Total: ${payload[0].value}
        </p>
        <p className="text-sm text-slate-400">
          Avg: ${payload[0].payload.avgCost}
        </p>
        <p className="text-xs text-slate-400">
          {payload[0].payload.count} runs
        </p>
      </div>
    );
  };

  return (
    <Card className="bg-slate-900 border-slate-800">
      <CardHeader>
        <CardTitle className="text-white flex items-center gap-2">
          <DollarSign className="w-5 h-5 text-green-400" />
          Cost Trend
        </CardTitle>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={300}>
          <BarChart data={chartData}>
            <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
            <XAxis 
              dataKey="date" 
              stroke="#94a3b8"
              style={{ fontSize: '12px' }}
            />
            <YAxis 
              stroke="#94a3b8"
              style={{ fontSize: '12px' }}
              label={{ value: 'Cost ($)', angle: -90, position: 'insideLeft', style: { fill: '#94a3b8' } }}
            />
            <Tooltip content={<CustomTooltip />} />
            <Legend wrapperStyle={{ color: '#94a3b8', fontSize: '12px' }} />
            <Bar 
              dataKey="totalCost" 
              fill="#10b981"
              radius={[4, 4, 0, 0]}
              name="Total Daily Cost"
            />
          </BarChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}