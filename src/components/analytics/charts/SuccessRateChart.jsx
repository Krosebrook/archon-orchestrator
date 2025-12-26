/**
 * @fileoverview Success Rate Chart
 * @description Area chart showing workflow success/failure rates over time
 * @version 1.0.0
 */

import React, { useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import { format } from 'date-fns';
import { CheckCircle2 } from 'lucide-react';

export default function SuccessRateChart({ runs }) {
  const chartData = useMemo(() => {
    const grouped = runs.reduce((acc, run) => {
      const date = format(new Date(run.created_date), 'MMM dd');
      if (!acc[date]) {
        acc[date] = { date, success: 0, failed: 0, total: 0 };
      }
      acc[date].total += 1;
      if (run.status === 'completed') {
        acc[date].success += 1;
      } else if (run.status === 'failed') {
        acc[date].failed += 1;
      }
      return acc;
    }, {});

    return Object.values(grouped)
      .map(item => ({
        date: item.date,
        successRate: ((item.success / item.total) * 100).toFixed(1),
        failureRate: ((item.failed / item.total) * 100).toFixed(1),
        total: item.total,
      }))
      .sort((a, b) => new Date(a.date) - new Date(b.date));
  }, [runs]);

  const CustomTooltip = ({ active, payload }) => {
    if (!active || !payload || !payload.length) return null;

    return (
      <div className="bg-slate-900 border border-slate-700 rounded-lg p-3 shadow-xl">
        <p className="text-sm text-slate-300 mb-1">{payload[0].payload.date}</p>
        <p className="text-sm font-semibold text-green-400">
          Success: {payload[0].value}%
        </p>
        <p className="text-sm font-semibold text-red-400">
          Failed: {payload[1]?.value || 0}%
        </p>
        <p className="text-xs text-slate-400 mt-1">
          {payload[0].payload.total} total runs
        </p>
      </div>
    );
  };

  return (
    <Card className="bg-slate-900 border-slate-800">
      <CardHeader>
        <CardTitle className="text-white flex items-center gap-2">
          <CheckCircle2 className="w-5 h-5 text-green-400" />
          Success Rate Over Time
        </CardTitle>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={300}>
          <AreaChart data={chartData}>
            <defs>
              <linearGradient id="successGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#10b981" stopOpacity={0.8}/>
                <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
              </linearGradient>
              <linearGradient id="failureGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#ef4444" stopOpacity={0.8}/>
                <stop offset="95%" stopColor="#ef4444" stopOpacity={0}/>
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
            <XAxis 
              dataKey="date" 
              stroke="#94a3b8"
              style={{ fontSize: '12px' }}
            />
            <YAxis 
              stroke="#94a3b8"
              style={{ fontSize: '12px' }}
              label={{ value: 'Percentage', angle: -90, position: 'insideLeft', style: { fill: '#94a3b8' } }}
            />
            <Tooltip content={<CustomTooltip />} />
            <Legend wrapperStyle={{ color: '#94a3b8', fontSize: '12px' }} />
            <Area
              type="monotone"
              dataKey="successRate"
              stroke="#10b981"
              fillOpacity={1}
              fill="url(#successGradient)"
              name="Success Rate"
            />
            <Area
              type="monotone"
              dataKey="failureRate"
              stroke="#ef4444"
              fillOpacity={1}
              fill="url(#failureGradient)"
              name="Failure Rate"
            />
          </AreaChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}