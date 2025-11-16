import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { TestTube, Play, Loader2, TrendingDown, Shield, AlertTriangle } from 'lucide-react';
import { base44 } from '@/api/base44Client';
import { toast } from 'sonner';

export default function PolicySimulator({ policies }) {
  const [selectedPolicy, setSelectedPolicy] = useState(null);
  const [simulation, setSimulation] = useState(null);
  const [isSimulating, setIsSimulating] = useState(false);

  const runSimulation = async (policy) => {
    setIsSimulating(true);
    setSelectedPolicy(policy);
    toast.info('Running simulation on historical data...');

    try {
      const response = await base44.functions.invoke('simulatePolicy', {
        policy_rules: policy.rules,
        lookback_days: 30
      });

      if (response.data.success) {
        setSimulation(response.data.simulation);
        toast.success('Simulation complete');
      } else {
        throw new Error('Simulation failed');
      }
    } catch (error) {
      console.error('Simulation error:', error);
      toast.error('Failed to run simulation');
    } finally {
      setIsSimulating(false);
    }
  };

  const getRiskColor = (score) => {
    if (score >= 70) return 'text-red-400';
    if (score >= 40) return 'text-yellow-400';
    return 'text-green-400';
  };

  return (
    <Card className="bg-slate-900 border-slate-800">
      <CardHeader>
        <CardTitle className="text-white flex items-center gap-2">
          <TestTube className="w-5 h-5" />
          Policy Simulator
        </CardTitle>
      </CardHeader>
      <CardContent>
        {!simulation ? (
          <div>
            <p className="text-sm text-slate-400 mb-4">
              Test policies against historical refactoring data
            </p>
            <div className="space-y-2">
              {policies.slice(0, 5).map((policy) => (
                <Button
                  key={policy.id}
                  onClick={() => runSimulation(policy)}
                  disabled={isSimulating}
                  variant="outline"
                  className="w-full justify-start border-slate-700 hover:bg-slate-800"
                >
                  {isSimulating && selectedPolicy?.id === policy.id ? (
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  ) : (
                    <Play className="w-4 h-4 mr-2" />
                  )}
                  {policy.name}
                </Button>
              ))}
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="flex items-center justify-between mb-3">
              <span className="text-sm font-medium text-white">
                {selectedPolicy.name}
              </span>
              <Button
                size="sm"
                variant="ghost"
                onClick={() => setSimulation(null)}
                className="text-slate-400"
              >
                Clear
              </Button>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="p-3 bg-slate-950 rounded-lg border border-slate-800">
                <div className="text-xs text-slate-400 mb-1">Impact</div>
                <div className="text-2xl font-bold text-white">
                  {simulation.impact_percentage}%
                </div>
                <div className="text-xs text-slate-500">
                  {simulation.total_impacted} of {simulation.total_recommendations}
                </div>
              </div>

              <div className="p-3 bg-slate-950 rounded-lg border border-slate-800">
                <div className="text-xs text-slate-400 mb-1">Risk Score</div>
                <div className={`text-2xl font-bold ${getRiskColor(simulation.risk_score)}`}>
                  {simulation.risk_score}
                </div>
                <div className="text-xs text-slate-500">
                  {simulation.risk_score >= 70 ? 'High' : simulation.risk_score >= 40 ? 'Medium' : 'Low'} risk
                </div>
              </div>
            </div>

            <div className="space-y-2">
              <div className="text-sm font-medium text-slate-300">Breakdown</div>
              
              <div className="flex items-center justify-between p-2 bg-green-900/20 rounded border border-green-800/30">
                <div className="flex items-center gap-2 text-xs text-green-400">
                  <TrendingDown className="w-3 h-3" />
                  Auto-Apply
                </div>
                <span className="text-sm font-medium text-green-400">
                  {simulation.breakdown.would_auto_apply}
                </span>
              </div>

              <div className="flex items-center justify-between p-2 bg-yellow-900/20 rounded border border-yellow-800/30">
                <div className="flex items-center gap-2 text-xs text-yellow-400">
                  <Shield className="w-3 h-3" />
                  Require Approval
                </div>
                <span className="text-sm font-medium text-yellow-400">
                  {simulation.breakdown.would_require_approval}
                </span>
              </div>

              <div className="flex items-center justify-between p-2 bg-red-900/20 rounded border border-red-800/30">
                <div className="flex items-center gap-2 text-xs text-red-400">
                  <AlertTriangle className="w-3 h-3" />
                  Block
                </div>
                <span className="text-sm font-medium text-red-400">
                  {simulation.breakdown.would_block}
                </span>
              </div>
            </div>

            <div className="p-3 bg-blue-900/20 rounded-lg border border-blue-800/30">
              <div className="text-xs text-blue-400 mb-1">⏱️ Time Savings</div>
              <div className="text-sm text-blue-300">
                ~{simulation.estimated_time_saved_minutes} minutes saved
              </div>
            </div>

            {simulation.sample_matches && simulation.sample_matches.length > 0 && (
              <div>
                <div className="text-xs text-slate-400 mb-2">Sample Matches</div>
                <div className="space-y-1">
                  {simulation.sample_matches.slice(0, 3).map((match, idx) => (
                    <div key={idx} className="text-xs p-2 bg-slate-950 rounded border border-slate-800">
                      <div className="flex items-center gap-2 mb-1">
                        <Badge variant="outline" className="text-[10px] bg-slate-800 border-slate-700">
                          {match.severity}
                        </Badge>
                        <span className="text-slate-400">{match.category}</span>
                      </div>
                      <div className="text-slate-300">{match.title}</div>
                      <div className="text-slate-500 mt-1">→ {match.action.replace('_', ' ')}</div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}