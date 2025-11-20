import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { Clock, Zap } from 'lucide-react';
import { format, parseISO, subDays } from 'date-fns';

export default function PerformanceCharts({ runs, metrics, detailed = false }) {
  const prepareLatencyData = () => {
    const last7Days = Array.from({ length: 7 }, (_, i) => {
      const date = subDays(new Date(), 6 - i);
      return {
        date: format(date, 'MMM d'),
        avgLatency: 0,
        count: 0
      };
    });

    metrics.forEach(metric => {
      const date = format(parseISO(metric.timestamp), 'MMM d');
      const dayData = last7Days.find(d => d.date === date);
      if (dayData) {
        dayData.avgLatency += metric.latency_ms || 0;
        dayData.count += 1;
      }
    });

    return last7Days.map(d => ({
      date: d.date,
      avgLatency: d.count > 0 ? Math.round(d.avgLatency / d.count) : 0
    }));
  };

  const prepareThroughputData = () => {
    const last7Days = Array.from({ length: 7 }, (_, i) => {
      const date = subDays(new Date(), 6 - i);
      return {
        date: format(date, 'MMM d'),
        completed: 0,
        failed: 0
      };
    });

    runs.forEach(run => {
      const date = format(parseISO(run.started_at), 'MMM d');
      const dayData = last7Days.find(d => d.date === date);
      if (dayData) {
        if (run.state === 'completed') dayData.completed += 1;
        if (run.state === 'failed') dayData.failed += 1;
      }
    });

    return last7Days;
  };

  const latencyData = prepareLatencyData();
  const throughputData = prepareThroughputData();

  return (
    <>
      <Card className="bg-slate-900 border-slate-800">
        <CardHeader>
          <CardTitle className="text-white flex items-center gap-2">
            <Clock className="w-5 h-5 text-purple-400" />
            Average Latency Trend
          </CardTitle>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={detailed ? 400 : 300}>
            <LineChart data={latencyData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
              <XAxis dataKey="date" stroke="#94a3b8" />
              <YAxis stroke="#94a3b8" label={{ value: 'ms', angle: -90, position: 'insideLeft' }} />
              <Tooltip 
                contentStyle={{ backgroundColor: '#1e293b', border: '1px solid #334155' }}
                labelStyle={{ color: '#f1f5f9' }}
              />
              <Line type="monotone" dataKey="avgLatency" stroke="#a78bfa" strokeWidth={2} />
            </LineChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      {detailed && (
        <Card className="bg-slate-900 border-slate-800">
          <CardHeader>
            <CardTitle className="text-white flex items-center gap-2">
              <Zap className="w-5 h-5 text-blue-400" />
              Throughput Analysis
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={400}>
              <BarChart data={throughputData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                <XAxis dataKey="date" stroke="#94a3b8" />
                <YAxis stroke="#94a3b8" />
                <Tooltip 
                  contentStyle={{ backgroundColor: '#1e293b', border: '1px solid #334155' }}
                  labelStyle={{ color: '#f1f5f9' }}
                />
                <Legend />
                <Bar dataKey="completed" fill="#10b981" name="Completed" />
                <Bar dataKey="failed" fill="#ef4444" name="Failed" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      )}
    </>
  );
}