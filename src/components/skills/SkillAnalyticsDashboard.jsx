import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { TrendingUp, TrendingDown, Activity, DollarSign, Zap } from 'lucide-react';
import { base44 } from '@/api/base44Client';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

export default function SkillAnalyticsDashboard({ skillId }) {
  const [usage, setUsage] = useState([]);
  const [insights, setInsights] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadAnalytics();
  }, [skillId]);

  const loadAnalytics = async () => {
    setIsLoading(true);
    try {
      const usageData = skillId 
        ? await base44.entities.SkillUsage.filter({ skill_id: skillId })
        : await base44.entities.SkillUsage.list();
      setUsage(usageData);
      generateInsights(usageData);
    } catch (error) {
      console.error('Failed to load analytics:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const generateInsights = async (usageData) => {
    try {
      const result = await base44.integrations.Core.InvokeLLM({
        prompt: `Analyze this skill usage data and provide insights:
${JSON.stringify(usageData.slice(0, 20), null, 2)}

Provide:
1. Top performing skills (highest success rate + lowest latency)
2. Underutilized skills (low usage despite installation)
3. Skills to optimize (high cost or latency)
4. Skills to retire (consistently failing or unused)`,
        response_json_schema: {
          type: "object",
          properties: {
            top_performers: { type: "array", items: { type: "string" } },
            underutilized: { type: "array", items: { type: "string" } },
            needs_optimization: { type: "array", items: { type: "string" } },
            retire_candidates: { type: "array", items: { type: "string" } }
          }
        }
      });
      setInsights(result);
    } catch (error) {
      console.error('Failed to generate insights:', error);
    }
  };

  const totalExecutions = usage.reduce((sum, u) => sum + u.execution_count, 0);
  const totalCost = usage.reduce((sum, u) => sum + (u.total_cost_cents || 0), 0);
  const avgSuccessRate = usage.reduce((sum, u) => {
    const rate = u.success_count / Math.max(u.execution_count, 1);
    return sum + rate;
  }, 0) / Math.max(usage.length, 1);

  const performanceData = usage.slice(0, 10).map(u => ({
    name: u.skill_id.slice(0, 8),
    score: u.performance_score || 0,
    executions: u.execution_count
  }));

  const COLORS = ['#3b82f6', '#8b5cf6', '#ec4899', '#f59e0b', '#10b981'];

  if (isLoading) {
    return <div className="text-slate-400 text-center py-12">Loading analytics...</div>;
  }

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card className="bg-slate-900 border-slate-800">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-400">Total Executions</p>
                <p className="text-2xl font-bold text-white">{totalExecutions}</p>
              </div>
              <Activity className="w-8 h-8 text-blue-400" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-slate-900 border-slate-800">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-400">Success Rate</p>
                <p className="text-2xl font-bold text-white">{(avgSuccessRate * 100).toFixed(1)}%</p>
              </div>
              <TrendingUp className="w-8 h-8 text-green-400" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-slate-900 border-slate-800">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-400">Total Cost</p>
                <p className="text-2xl font-bold text-white">${(totalCost / 100).toFixed(2)}</p>
              </div>
              <DollarSign className="w-8 h-8 text-yellow-400" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-slate-900 border-slate-800">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-400">Active Skills</p>
                <p className="text-2xl font-bold text-white">{usage.length}</p>
              </div>
              <Zap className="w-8 h-8 text-purple-400" />
            </div>
          </CardContent>
        </Card>
      </div>

      <Card className="bg-slate-900 border-slate-800">
        <CardHeader>
          <CardTitle className="text-white">Performance by Skill</CardTitle>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={performanceData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
              <XAxis dataKey="name" stroke="#94a3b8" />
              <YAxis stroke="#94a3b8" />
              <Tooltip contentStyle={{ backgroundColor: '#1e293b', border: '1px solid #334155' }} />
              <Bar dataKey="score" fill="#8b5cf6" />
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      {insights && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Card className="bg-slate-900 border-slate-800">
            <CardHeader>
              <CardTitle className="text-white flex items-center gap-2">
                <TrendingUp className="w-5 h-5 text-green-400" />
                Top Performers
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {insights.top_performers?.map((skill, idx) => (
                  <div key={idx} className="p-3 bg-slate-950 rounded-lg border border-green-500/30">
                    <p className="text-sm text-white">{skill}</p>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          <Card className="bg-slate-900 border-slate-800">
            <CardHeader>
              <CardTitle className="text-white flex items-center gap-2">
                <TrendingDown className="w-5 h-5 text-red-400" />
                Retire Candidates
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {insights.retire_candidates?.map((skill, idx) => (
                  <div key={idx} className="p-3 bg-slate-950 rounded-lg border border-red-500/30">
                    <p className="text-sm text-white">{skill}</p>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}