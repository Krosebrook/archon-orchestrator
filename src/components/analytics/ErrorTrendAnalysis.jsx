import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { AlertTriangle, TrendingDown, TrendingUp } from 'lucide-react';
import { format, parseISO, subDays } from 'date-fns';

export default function ErrorTrendAnalysis({ runs, workflows }) {
  const prepareErrorTrendData = () => {
    const last7Days = Array.from({ length: 7 }, (_, i) => {
      const date = subDays(new Date(), 6 - i);
      return {
        date: format(date, 'MMM d'),
        errors: 0,
        total: 0
      };
    });

    runs.forEach(run => {
      const date = format(parseISO(run.started_at), 'MMM d');
      const dayData = last7Days.find(d => d.date === date);
      if (dayData) {
        dayData.total += 1;
        if (run.state === 'failed') dayData.errors += 1;
      }
    });

    return last7Days.map(d => ({
      date: d.date,
      errorRate: d.total > 0 ? ((d.errors / d.total) * 100).toFixed(1) : 0
    }));
  };

  const getTopErrors = () => {
    const errorMap = {};
    
    runs.filter(r => r.state === 'failed').forEach(run => {
      const workflow = workflows.find(w => w.id === run.workflow_id);
      const name = workflow?.name || 'Unknown';
      
      if (!errorMap[name]) {
        errorMap[name] = 0;
      }
      errorMap[name] += 1;
    });

    return Object.entries(errorMap)
      .map(([name, count]) => ({ name, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 5);
  };

  const errorTrendData = prepareErrorTrendData();
  const topErrors = getTopErrors();
  
  const currentErrorRate = parseFloat(errorTrendData[errorTrendData.length - 1]?.errorRate || 0);
  const previousErrorRate = parseFloat(errorTrendData[errorTrendData.length - 2]?.errorRate || 0);
  const isImproving = currentErrorRate < previousErrorRate;

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      <Card className="bg-slate-900 border-slate-800">
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="text-white flex items-center gap-2">
              <AlertTriangle className="w-5 h-5 text-red-400" />
              Error Rate Trend
            </CardTitle>
            {isImproving ? (
              <Badge variant="outline" className="bg-green-500/20 text-green-400 border-green-500/30">
                <TrendingDown className="w-3 h-3 mr-1" />
                Improving
              </Badge>
            ) : (
              <Badge variant="outline" className="bg-red-500/20 text-red-400 border-red-500/30">
                <TrendingUp className="w-3 h-3 mr-1" />
                Worsening
              </Badge>
            )}
          </div>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={errorTrendData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
              <XAxis dataKey="date" stroke="#94a3b8" />
              <YAxis stroke="#94a3b8" label={{ value: '%', angle: -90, position: 'insideLeft' }} />
              <Tooltip 
                contentStyle={{ backgroundColor: '#1e293b', border: '1px solid #334155' }}
                labelStyle={{ color: '#f1f5f9' }}
                formatter={(value) => `${value}%`}
              />
              <Line type="monotone" dataKey="errorRate" stroke="#ef4444" strokeWidth={2} />
            </LineChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      <Card className="bg-slate-900 border-slate-800">
        <CardHeader>
          <CardTitle className="text-white">Top Failed Workflows</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {topErrors.map((error, idx) => (
              <div key={idx} className="p-3 bg-slate-950 rounded-lg border border-slate-800">
                <div className="flex items-center justify-between mb-1">
                  <span className="text-sm font-medium text-white">{error.name}</span>
                  <Badge variant="outline" className="bg-red-500/20 text-red-400 border-red-500/30">
                    {error.count} failures
                  </Badge>
                </div>
                <div className="w-full bg-slate-800 rounded-full h-2">
                  <div 
                    className="bg-red-500 h-2 rounded-full" 
                    style={{ width: `${(error.count / topErrors[0].count) * 100}%` }}
                  />
                </div>
              </div>
            ))}
            {topErrors.length === 0 && (
              <div className="text-center py-8 text-slate-400">
                No errors detected - excellent work!
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}