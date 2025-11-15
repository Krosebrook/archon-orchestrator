import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ABTest } from '@/entities/ABTest';
import { GitCompare, Plus, Play, Pause } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';

export default function ABTestManager() {
  const [tests, setTests] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadTests();
  }, []);

  const loadTests = async () => {
    setIsLoading(true);
    try {
      const data = await ABTest.list();
      setTests(data);
    } catch (error) {
      console.error("Failed to load A/B tests:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const statusColors = {
    active: 'bg-green-500/20 text-green-400 border-green-500/30',
    paused: 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30',
    completed: 'bg-slate-500/20 text-slate-400 border-slate-500/30',
  };

  return (
    <Card className="bg-slate-900 border-slate-800">
      <CardHeader className="flex flex-row items-center justify-between">
        <div className="flex items-center gap-2">
            <GitCompare className="w-5 h-5 text-white"/>
            <CardTitle className="text-white">A/B Tests</CardTitle>
        </div>
        <Button className="bg-blue-600 hover:bg-blue-700">
          <Plus className="w-4 h-4 mr-2" /> New Test
        </Button>
      </CardHeader>
      <CardContent className="space-y-4">
        {tests.map(test => (
          <div key={test.id} className="p-4 rounded-lg border border-slate-800 bg-slate-950/50">
            <div className="flex items-center justify-between mb-3">
              <h3 className="font-semibold text-white">{test.name}</h3>
              <div className="flex items-center gap-2">
                <Badge className={`capitalize ${statusColors[test.status]}`}>{test.status}</Badge>
                <Button variant="ghost" size="icon" className="text-slate-400 hover:text-white">
                  {test.status === 'active' ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
                </Button>
              </div>
            </div>
            <p className="text-sm text-slate-400 mb-4">{test.description}</p>
            
            <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                    <p className="text-slate-300 mb-1">Variant A: <span className="font-mono text-blue-400">{test.variant_a.agent_id.substring(0, 8)}...</span></p>
                    <Progress value={test.metrics.variant_a_success_rate} className="h-2 [&>div]:bg-blue-500" />
                    <p className="text-xs text-slate-500 mt-1">{test.metrics.variant_a_success_rate}% success ({test.metrics.variant_a_runs} runs)</p>
                </div>
                 <div>
                    <p className="text-slate-300 mb-1">Variant B: <span className="font-mono text-purple-400">{test.variant_b.agent_id.substring(0, 8)}...</span></p>
                    <Progress value={test.metrics.variant_b_success_rate} className="h-2 [&>div]:bg-purple-500" />
                    <p className="text-xs text-slate-500 mt-1">{test.metrics.variant_b_success_rate}% success ({test.metrics.variant_b_runs} runs)</p>
                </div>
            </div>
          </div>
        ))}
        {tests.length === 0 && !isLoading && (
            <div className="text-center py-8 text-slate-500">
                No A/B tests running.
            </div>
        )}
      </CardContent>
    </Card>
  );
}