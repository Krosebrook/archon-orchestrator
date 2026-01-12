import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { DollarSign, TrendingUp, TrendingDown } from 'lucide-react';
import { subDays, format, startOfDay } from 'date-fns';

export default function AgentCostAnalysis({ agents, metrics, installations, selectedAgent, timeRange }) {
  const daysMap = { '7d': 7, '30d': 30, '90d': 90 };
  const days = daysMap[timeRange] || 30;

  const getTotalCost = () => {
    const total = metrics.reduce((sum, m) => sum + (m.cost_cents || 0), 0);
    return (total / 100).toFixed(2);
  };

  const getAvgCostPerRequest = () => {
    if (metrics.length === 0) return 0;
    const total = metrics.reduce((sum, m) => sum + (m.cost_cents || 0), 0);
    return (total / metrics.length / 100).toFixed(4);
  };

  const getCostTrend = () => {
    const data = [];
    for (let i = days - 1; i >= 0; i--) {
      const date = subDays(new Date(), i);
      const dayStart = startOfDay(date);
      
      const dayMetrics = metrics.filter(m => {
        const metricDate = startOfDay(new Date(m.timestamp));
        return metricDate.getTime() === dayStart.getTime();
      });
      
      const cost = dayMetrics.reduce((sum, m) => sum + (m.cost_cents || 0), 0) / 100;
      const requests = dayMetrics.reduce((sum, m) => sum + (m.request_count || 1), 0);
      
      data.push({
        date: format(date, 'MMM d'),
        cost: parseFloat(cost.toFixed(2)),
        requests
      });
    }
    return data;
  };

  const getCostByAgent = () => {
    const costMap = {};
    metrics.forEach(m => {
      const agent = agents.find(a => a.id === m.agent_id);
      const agentName = agent?.name || 'Unknown';
      if (!costMap[agentName]) {
        costMap[agentName] = { cost: 0, requests: 0 };
      }
      costMap[agentName].cost += (m.cost_cents || 0);
      costMap[agentName].requests += (m.request_count || 1);
    });
    
    return Object.entries(costMap)
      .map(([name, data]) => ({
        name,
        cost: parseFloat((data.cost / 100).toFixed(2)),
        requests: data.requests,
        avgCost: parseFloat((data.cost / data.requests / 100).toFixed(4))
      }))
      .sort((a, b) => b.cost - a.cost)
      .slice(0, 5);
  };

  const getCostByModel = () => {
    const modelMap = {};
    metrics.forEach(m => {
      const model = m.model || 'Unknown';
      if (!modelMap[model]) {
        modelMap[model] = 0;
      }
      modelMap[model] += (m.cost_cents || 0);
    });
    
    return Object.entries(modelMap)
      .map(([name, cost]) => ({
        name,
        value: parseFloat((cost / 100).toFixed(2))
      }))
      .sort((a, b) => b.value - a.value);
  };

  const costTrend = getCostTrend();
  const costByAgent = getCostByAgent();
  const costByModel = getCostByModel();
  const totalCost = getTotalCost();
  const avgCostPerRequest = getAvgCostPerRequest();

  const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899'];

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="bg-slate-900 border-slate-800">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-sm text-slate-400">Total Cost</div>
                <div className="text-2xl font-bold text-white mt-1">${totalCost}</div>
                <div className="flex items-center gap-1 text-xs text-green-400 mt-1">
                  <TrendingDown className="w-3 h-3" />
                  <span>-3.2% vs last period</span>
                </div>
              </div>
              <DollarSign className="w-8 h-8 text-green-400" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-slate-900 border-slate-800">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-sm text-slate-400">Avg Cost/Request</div>
                <div className="text-2xl font-bold text-white mt-1">${avgCostPerRequest}</div>
                <div className="flex items-center gap-1 text-xs text-red-400 mt-1">
                  <TrendingUp className="w-3 h-3" />
                  <span>+1.5% vs last period</span>
                </div>
              </div>
              <DollarSign className="w-8 h-8 text-blue-400" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-slate-900 border-slate-800">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-sm text-slate-400">Total Requests</div>
                <div className="text-2xl font-bold text-white mt-1">
                  {metrics.reduce((sum, m) => sum + (m.request_count || 1), 0)}
                </div>
                <div className="flex items-center gap-1 text-xs text-blue-400 mt-1">
                  <TrendingUp className="w-3 h-3" />
                  <span>+8.3% vs last period</span>
                </div>
              </div>
              <BarChart className="w-8 h-8 text-purple-400" />
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="bg-slate-900 border-slate-800">
          <CardHeader>
            <CardTitle className="text-white">Cost Trend Over Time</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={costTrend}>
                <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                <XAxis dataKey="date" stroke="#94a3b8" />
                <YAxis stroke="#94a3b8" />
                <Tooltip 
                  contentStyle={{ backgroundColor: '#1e293b', border: '1px solid #334155' }}
                  labelStyle={{ color: '#f1f5f9' }}
                />
                <Legend />
                <Line type="monotone" dataKey="cost" stroke="#10b981" name="Cost ($)" strokeWidth={2} />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card className="bg-slate-900 border-slate-800">
          <CardHeader>
            <CardTitle className="text-white">Requests vs Cost</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={costTrend}>
                <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                <XAxis dataKey="date" stroke="#94a3b8" />
                <YAxis stroke="#94a3b8" />
                <Tooltip 
                  contentStyle={{ backgroundColor: '#1e293b', border: '1px solid #334155' }}
                  labelStyle={{ color: '#f1f5f9' }}
                />
                <Legend />
                <Bar dataKey="requests" fill="#3b82f6" name="Requests" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="bg-slate-900 border-slate-800">
          <CardHeader>
            <CardTitle className="text-white">Cost by Agent</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {costByAgent.map((agent, idx) => (
                <div key={agent.name} className="space-y-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full flex items-center justify-center" style={{ backgroundColor: COLORS[idx % COLORS.length] + '20', color: COLORS[idx % COLORS.length] }}>
                        {idx + 1}
                      </div>
                      <div>
                        <div className="text-white font-medium">{agent.name}</div>
                        <div className="text-xs text-slate-500">{agent.requests} requests</div>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-white font-bold">${agent.cost}</div>
                      <div className="text-xs text-slate-500">${agent.avgCost}/req</div>
                    </div>
                  </div>
                  <div className="w-full bg-slate-800 rounded-full h-2">
                    <div 
                      className="h-2 rounded-full" 
                      style={{ 
                        width: `${(agent.cost / parseFloat(totalCost)) * 100}%`,
                        backgroundColor: COLORS[idx % COLORS.length]
                      }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card className="bg-slate-900 border-slate-800">
          <CardHeader>
            <CardTitle className="text-white">Cost by Model</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={280}>
              <PieChart>
                <Pie
                  data={costByModel}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, value }) => `${name}: $${value}`}
                  outerRadius={90}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {costByModel.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}