/**
 * @fileoverview Execution Time Chart
 * @description Line chart showing workflow execution times over time
 * @version 1.0.0
 */

import React, { useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import { format } from 'date-fns';
import { Clock } from 'lucide-react';

export default function ExecutionTimeChart({ runs }) {
  const chartData = useMemo(() => {
    const grouped = runs.reduce((acc, run) => {
      const date = format(new Date(run.created_date), 'MMM dd');
      if (!acc[date]) {
        acc[date] = { date, total: 0, count: 0 };
      }
      acc[date].total += run.duration_ms || 0;
      acc[date].count += 1;
      return acc;
    }, {});

    return Object.values(grouped)
      .map(item => ({
        date: item.date,
        avgTime: Math.round(item.total / item.count / 1000),
        count: item.count,
      }))
      .sort((a, b) => new Date(a.date) - new Date(b.date));
  }, [runs]);

  const CustomTooltip = ({ active, payload }) => {
    if (!active || !payload || !payload.length) return null;

    return (
      <div className="bg-slate-900 border border-slate-700 rounded-lg p-3 shadow-xl">
        <p className="text-sm text-slate-300 mb-1">{payload[0].payload.date}</p>
        <p className="text-sm font-semibold text-white">
          Avg Time: {payload[0].value}s
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
          <Clock className="w-5 h-5 text-blue-400" />
          Execution Time Trend
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
              stroke="#94a3b8"
              style={{ fontSize: '12px' }}
              label={{ value: 'Seconds', angle: -90, position: 'insideLeft', style: { fill: '#94a3b8' } }}
            />
            <Tooltip content={<CustomTooltip />} />
            <Legend wrapperStyle={{ color: '#94a3b8', fontSize: '12px' }} />
            <Line 
              type="monotone" 
              dataKey="avgTime" 
              stroke="#3b82f6" 
              strokeWidth={2}
              dot={{ fill: '#3b82f6', r: 4 }}
              activeDot={{ r: 6 }}
              name="Avg Execution Time"
            />
          </LineChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}