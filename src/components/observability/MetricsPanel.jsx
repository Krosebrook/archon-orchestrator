import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { format } from 'date-fns';

export default function MetricsPanel({ metrics }) {
  const chartData = metrics
    .filter(m => m.metric_type === 'performance')
    .slice(0, 20)
    .reverse()
    .map(m => ({
      time: format(new Date(m.timestamp), 'HH:mm'),
      value: m.value
    }));

  return (
    <Card className="bg-slate-900 border-slate-800">
      <CardHeader>
        <CardTitle className="text-white">Performance Metrics</CardTitle>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={300}>
          <LineChart data={chartData}>
            <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
            <XAxis dataKey="time" stroke="#9ca3af" fontSize={12} />
            <YAxis stroke="#9ca3af" fontSize={12} />
            <Tooltip
              contentStyle={{ backgroundColor: '#1e293b', border: '1px solid #334155' }}
              labelStyle={{ color: '#e2e8f0' }}
            />
            <Line type="monotone" dataKey="value" stroke="#3b82f6" strokeWidth={2} />
          </LineChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}