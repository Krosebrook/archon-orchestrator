import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { TrendingUp, AlertTriangle } from 'lucide-react';

export default function PerformanceInsights({ runs, metrics }) {
  const insights = [
    {
      type: 'success',
      title: 'Performance Stable',
      description: 'Average latency within acceptable range'
    },
    {
      type: 'warning',
      title: 'Cost Trending Up',
      description: '15% increase in token usage over last 24h'
    }
  ];

  return (
    <Card className="bg-slate-900 border-slate-800">
      <CardHeader>
        <CardTitle className="text-white">AI Insights</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {insights.map((insight, idx) => (
            <div key={idx} className={`p-3 rounded-lg border ${
              insight.type === 'warning' 
                ? 'bg-yellow-900/20 border-yellow-800/30'
                : 'bg-green-900/20 border-green-800/30'
            }`}>
              <div className="flex items-start gap-2">
                {insight.type === 'warning' ? (
                  <AlertTriangle className="w-4 h-4 text-yellow-400 mt-0.5" />
                ) : (
                  <TrendingUp className="w-4 h-4 text-green-400 mt-0.5" />
                )}
                <div>
                  <div className={`font-medium mb-1 ${
                    insight.type === 'warning' ? 'text-yellow-400' : 'text-green-400'
                  }`}>
                    {insight.title}
                  </div>
                  <div className="text-xs text-slate-400">{insight.description}</div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}