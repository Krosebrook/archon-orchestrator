import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { TrendingUp, Award, Target, Zap } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';

export default function TrainingAnalytics({ modules, sessions, agents }) {
  const totalModules = modules.length;
  const activeModules = modules.filter(m => m.status === 'active').length;
  const completedSessions = sessions.filter(s => s.status === 'completed').length;
  const avgImprovements = sessions
    .filter(s => s.improvements)
    .reduce((acc, s) => {
      acc.latency += s.improvements.latency_improvement_pct || 0;
      acc.accuracy += s.improvements.accuracy_improvement_pct || 0;
      acc.cost += s.improvements.cost_reduction_pct || 0;
      return acc;
    }, { latency: 0, accuracy: 0, cost: 0 });

  const sessionCount = sessions.filter(s => s.improvements).length || 1;
  avgImprovements.latency /= sessionCount;
  avgImprovements.accuracy /= sessionCount;
  avgImprovements.cost /= sessionCount;

  const modulesByType = modules.reduce((acc, m) => {
    acc[m.training_type] = (acc[m.training_type] || 0) + 1;
    return acc;
  }, {});

  const pieData = Object.entries(modulesByType).map(([type, count]) => ({
    name: type.replace(/_/g, ' '),
    value: count
  }));

  const COLORS = ['#8b5cf6', '#3b82f6', '#10b981', '#f59e0b'];

  const recentSessions = sessions.slice(0, 7).reverse().map((s, idx) => ({
    name: `S${idx + 1}`,
    samples: s.training_samples || 0,
    confidence: s.validation_results?.confidence_score || 0
  }));

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="bg-slate-900 border-slate-800">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-400">Total Modules</p>
                <p className="text-2xl font-bold text-white">{totalModules}</p>
              </div>
              <Target className="w-8 h-8 text-purple-400" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-slate-900 border-slate-800">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-400">Active Training</p>
                <p className="text-2xl font-bold text-white">{activeModules}</p>
              </div>
              <Zap className="w-8 h-8 text-blue-400" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-slate-900 border-slate-800">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-400">Sessions</p>
                <p className="text-2xl font-bold text-white">{completedSessions}</p>
              </div>
              <Award className="w-8 h-8 text-green-400" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-slate-900 border-slate-800">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-400">Avg Improvement</p>
                <p className="text-2xl font-bold text-white">{avgImprovements.accuracy.toFixed(1)}%</p>
              </div>
              <TrendingUp className="w-8 h-8 text-orange-400" />
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="bg-slate-900 border-slate-800">
          <CardHeader>
            <CardTitle className="text-white">Module Distribution</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={250}>
              <PieChart>
                <Pie
                  data={pieData}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, value }) => `${name}: ${value}`}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {pieData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card className="bg-slate-900 border-slate-800">
          <CardHeader>
            <CardTitle className="text-white">Recent Training Sessions</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={250}>
              <BarChart data={recentSessions}>
                <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                <XAxis dataKey="name" stroke="#94a3b8" />
                <YAxis stroke="#94a3b8" />
                <Tooltip
                  contentStyle={{ backgroundColor: '#1e293b', border: '1px solid #334155' }}
                  labelStyle={{ color: '#f1f5f9' }}
                />
                <Bar dataKey="samples" fill="#8b5cf6" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      <Card className="bg-slate-900 border-slate-800">
        <CardHeader>
          <CardTitle className="text-white">Top Performing Modules</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {modules
              .filter(m => m.success_metrics?.current_score)
              .sort((a, b) => b.success_metrics.current_score - a.success_metrics.current_score)
              .slice(0, 5)
              .map(module => {
                const agent = agents.find(a => a.id === module.agent_id);
                const progress = module.success_metrics.current_score / module.success_metrics.target_score * 100;
                return (
                  <div key={module.id} className="p-3 bg-slate-950 rounded border border-slate-800">
                    <div className="flex items-center justify-between mb-2">
                      <div>
                        <p className="text-sm font-medium text-white">{module.name}</p>
                        <p className="text-xs text-slate-400">{agent?.name}</p>
                      </div>
                      <Badge className="bg-green-500/20 text-green-400">
                        {module.success_metrics.current_score.toFixed(1)}
                      </Badge>
                    </div>
                    <div className="w-full bg-slate-800 rounded-full h-2">
                      <div
                        className="bg-green-500 h-2 rounded-full transition-all"
                        style={{ width: `${Math.min(progress, 100)}%` }}
                      />
                    </div>
                  </div>
                );
              })}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}