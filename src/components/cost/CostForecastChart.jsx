import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, Area, AreaChart } from 'recharts';
import { TrendingUp, TrendingDown, Minus } from 'lucide-react';

export default function CostForecastChart({ forecasts, onRefresh }) {
  if (forecasts.length === 0) {
    return (
      <Card className="bg-slate-900 border-slate-800">
        <CardContent className="flex flex-col items-center justify-center h-96 text-slate-400">
          <TrendingUp className="w-16 h-16 mb-4 opacity-50" />
          <p>No forecasts available</p>
          <p className="text-sm mt-2">Generate a forecast to see cost predictions</p>
        </CardContent>
      </Card>
    );
  }

  const latestForecast = forecasts[0];
  
  const chartData = latestForecast.daily_breakdown.map((day) => ({
    date: new Date(day.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
    predicted: day.predicted_cents / 100,
    lower: day.lower_bound_cents / 100,
    upper: day.upper_bound_cents / 100,
  }));

  const trendIcons = {
    increasing: TrendingUp,
    stable: Minus,
    decreasing: TrendingDown,
  };

  const trendColors = {
    increasing: 'text-red-400',
    stable: 'text-blue-400',
    decreasing: 'text-green-400',
  };

  const TrendIcon = trendIcons[latestForecast.trend];

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="bg-slate-900 border-slate-800">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-400">Predicted {latestForecast.forecast_period.replace('_', ' ')}</p>
                <p className="text-2xl font-bold text-white mt-1">
                  ${(latestForecast.predicted_total_cents / 100).toFixed(2)}
                </p>
              </div>
              <TrendIcon className={`w-8 h-8 ${trendColors[latestForecast.trend]}`} />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-slate-900 border-slate-800">
          <CardContent className="pt-6">
            <div>
              <p className="text-sm text-slate-400">Confidence</p>
              <p className="text-2xl font-bold text-white mt-1">
                {(latestForecast.confidence_score * 100).toFixed(0)}%
              </p>
              <p className="text-xs text-slate-500 mt-1 capitalize">
                Based on {latestForecast.historical_days} days of data
              </p>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-slate-900 border-slate-800">
          <CardContent className="pt-6">
            <div>
              <p className="text-sm text-slate-400">Daily Average</p>
              <p className="text-2xl font-bold text-white mt-1">
                ${(latestForecast.predicted_daily_avg_cents / 100).toFixed(2)}
              </p>
              <p className="text-xs text-slate-500 mt-1 capitalize">
                Trend: {latestForecast.trend}
              </p>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card className="bg-slate-900 border-slate-800">
        <CardHeader>
          <CardTitle className="text-white">Cost Forecast</CardTitle>
          <p className="text-sm text-slate-400">
            Predicted spending with confidence intervals
          </p>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={400}>
            <AreaChart data={chartData}>
              <defs>
                <linearGradient id="confidenceGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3}/>
                  <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
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
                tickFormatter={(value) => `$${value.toFixed(0)}`}
              />
              <Tooltip 
                contentStyle={{ 
                  backgroundColor: '#1e293b', 
                  border: '1px solid #334155',
                  borderRadius: '8px',
                }}
                labelStyle={{ color: '#e2e8f0' }}
                formatter={(value) => [`$${value.toFixed(2)}`]}
              />
              <Legend />
              <Area
                type="monotone"
                dataKey="upper"
                stroke="none"
                fill="url(#confidenceGradient)"
                name="Upper Bound"
              />
              <Area
                type="monotone"
                dataKey="lower"
                stroke="none"
                fill="url(#confidenceGradient)"
                name="Lower Bound"
              />
              <Line 
                type="monotone" 
                dataKey="predicted" 
                stroke="#3b82f6" 
                strokeWidth={3}
                dot={{ fill: '#3b82f6', r: 4 }}
                name="Predicted Cost"
              />
            </AreaChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>
    </div>
  );
}