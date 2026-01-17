import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, BarChart, Bar, XAxis, YAxis, CartesianGrid } from 'recharts';
import { DollarSign } from 'lucide-react';

const COLORS = ['#3b82f6', '#8b5cf6', '#ec4899', '#f59e0b', '#10b981', '#06b6d4'];

export default function CostBreakdown({ runs, agents, workflows, detailed = false }) {
  const prepareCostByWorkflow = () => {
    const costMap = {};
    
    runs.forEach(run => {
      const workflow = workflows.find(w => w.id === run.workflow_id);
      const name = workflow?.name || 'Unknown';
      
      if (!costMap[name]) {
        costMap[name] = 0;
      }
      costMap[name] += run.cost_cents || 0;
    });

    return Object.entries(costMap)
      .map(([name, value]) => ({ name, value: value / 100 }))
      .sort((a, b) => b.value - a.value)
      .slice(0, 6);
  };

  const prepareCostByAgent = () => {
    const costMap = {};
    
    runs.forEach(run => {
      const agent = agents.find(a => a.id === run.agent_id);
      const name = agent?.name || 'Unknown';
      
      if (!costMap[name]) {
        costMap[name] = 0;
      }
      costMap[name] += run.cost_cents || 0;
    });

    return Object.entries(costMap)
      .map(([name, value]) => ({ name, value: value / 100 }))
      .sort((a, b) => b.value - a.value);
  };

  const workflowCosts = prepareCostByWorkflow();
  const agentCosts = prepareCostByAgent();

  return (
    <>
      <Card className="bg-slate-900 border-slate-800">
        <CardHeader>
          <CardTitle className="text-white flex items-center gap-2">
            <DollarSign className="w-5 h-5 text-green-400" />
            Cost by Workflow
          </CardTitle>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={detailed ? 400 : 300}>
            <PieChart>
              <Pie
                data={workflowCosts}
                cx="50%"
                cy="50%"
                labelLine={false}
                label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                outerRadius={detailed ? 120 : 100}
                fill="#8884d8"
                dataKey="value"
              >
                {workflowCosts.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip 
                contentStyle={{ backgroundColor: '#1e293b', border: '1px solid #334155' }}
                formatter={(value) => `$${value.toFixed(2)}`}
              />
            </PieChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      {detailed && (
        <Card className="bg-slate-900 border-slate-800">
          <CardHeader>
            <CardTitle className="text-white flex items-center gap-2">
              <DollarSign className="w-5 h-5 text-green-400" />
              Cost by Agent
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={400}>
              <BarChart data={agentCosts} layout="horizontal">
                <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                <XAxis type="number" stroke="#94a3b8" />
                <YAxis dataKey="name" type="category" stroke="#94a3b8" width={150} />
                <Tooltip 
                  contentStyle={{ backgroundColor: '#1e293b', border: '1px solid #334155' }}
                  formatter={(value) => `$${value.toFixed(2)}`}
                />
                <Bar dataKey="value" fill="#10b981" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      )}
    </>
  );
}