import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Run } from '@/entities/Run';
import { Play, AlertTriangle, CheckCircle, XCircle } from 'lucide-react';

export default function PolicySimulator({ policy, _onClose }) {
  const [_testRuns, _setTestRuns] = useState([]);
  const [isSimulating, setIsSimulating] = useState(false);
  const [simulationResults, setSimulationResults] = useState(null);
  const [customRule, setCustomRule] = useState('');

  useState(() => {
    if (policy) {
      setCustomRule(JSON.stringify(policy.rule, null, 2));
    }
  }, [policy]);

  const runSimulation = async () => {
    setIsSimulating(true);
    try {
      // Fetch recent runs to simulate against
      const runs = await Run.list('-created_date', 100);
      _setTestRuns(runs);

      // Parse the policy rule
      let rule;
      try {
        rule = JSON.parse(customRule);
      } catch (_e) {
        setSimulationResults({
          error: 'Invalid JSON in policy rule',
          results: []
        });
        setIsSimulating(false);
        return;
      }

      // Simulate policy evaluation
      const results = runs.map(run => {
        const evaluation = evaluatePolicy(run, rule);
        return {
          runId: run.id,
          run,
          blocked: evaluation.blocked,
          reason: evaluation.reason,
        };
      });

      const blockedCount = results.filter(r => r.blocked).length;
      const allowedCount = results.length - blockedCount;

      setSimulationResults({
        totalRuns: results.length,
        blocked: blockedCount,
        allowed: allowedCount,
        blockRate: ((blockedCount / results.length) * 100).toFixed(1),
        results: results.slice(0, 20), // Show first 20 results
      });

    } catch (error) {
      console.error('Simulation failed:', error);
      setSimulationResults({
        error: 'Simulation failed: ' + error.message,
        results: []
      });
    } finally {
      setIsSimulating(false);
    }
  };

  // Simple policy evaluation logic
  const evaluatePolicy = (run, rule) => {
    try {
      // Example rule evaluation
      if (rule.max_cost_cents && run.cost_cents > rule.max_cost_cents) {
        return {
          blocked: true,
          reason: `Cost ${run.cost_cents} exceeds limit ${rule.max_cost_cents}`
        };
      }

      if (rule.max_tokens && (run.tokens_in + run.tokens_out) > rule.max_tokens) {
        return {
          blocked: true,
          reason: `Token usage ${run.tokens_in + run.tokens_out} exceeds limit ${rule.max_tokens}`
        };
      }

      if (rule.blocked_states && rule.blocked_states.includes(run.state)) {
        return {
          blocked: true,
          reason: `Run state '${run.state}' is blocked by policy`
        };
      }

      return { blocked: false, reason: 'Policy allows this run' };
    } catch (_e) {
      return { blocked: false, reason: 'Policy evaluation error' };
    }
  };

  return (
    <div className="space-y-6">
      <Card className="bg-slate-900 border-slate-800">
        <CardHeader>
          <CardTitle className="text-white flex items-center gap-2">
            <Play className="w-5 h-5 text-blue-400" />
            Policy Simulator
          </CardTitle>
          <p className="text-slate-400 text-sm">
            Test your policy against the last 100 workflow runs to see what would be blocked.
          </p>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label className="text-slate-400">Policy Rule (JSON)</Label>
            <Textarea
              value={customRule}
              onChange={(e) => setCustomRule(e.target.value)}
              className="mt-2 h-32 font-mono bg-slate-950 border-slate-700 text-white"
              placeholder="Enter policy rule JSON..."
            />
          </div>

          <Button 
            onClick={runSimulation} 
            disabled={isSimulating || !customRule.trim()}
            className="bg-blue-600 hover:bg-blue-700"
          >
            <Play className="w-4 h-4 mr-2" />
            {isSimulating ? 'Simulating...' : 'Run Simulation'}
          </Button>
        </CardContent>
      </Card>

      {isSimulating && (
        <Card className="bg-slate-900 border-slate-800">
          <CardContent className="p-6">
            <div className="flex items-center gap-3">
              <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-500"></div>
              <span className="text-white">Running simulation against recent workflow runs...</span>
            </div>
          </CardContent>
        </Card>
      )}

      {simulationResults && (
        <Card className="bg-slate-900 border-slate-800">
          <CardHeader>
            <CardTitle className="text-white">Simulation Results</CardTitle>
          </CardHeader>
          <CardContent>
            {simulationResults.error ? (
              <div className="flex items-center gap-2 text-red-400 bg-red-500/10 p-4 rounded-md">
                <XCircle className="w-5 h-5" />
                <span>{simulationResults.error}</span>
              </div>
            ) : (
              <div className="space-y-4">
                {/* Summary */}
                <div className="grid grid-cols-3 gap-4">
                  <div className="text-center p-4 bg-slate-800 rounded-md">
                    <div className="text-2xl font-bold text-white">{simulationResults.totalRuns}</div>
                    <div className="text-sm text-slate-400">Total Runs</div>
                  </div>
                  <div className="text-center p-4 bg-red-500/10 rounded-md">
                    <div className="text-2xl font-bold text-red-400">{simulationResults.blocked}</div>
                    <div className="text-sm text-slate-400">Would Block</div>
                  </div>
                  <div className="text-center p-4 bg-green-500/10 rounded-md">
                    <div className="text-2xl font-bold text-green-400">{simulationResults.allowed}</div>
                    <div className="text-sm text-slate-400">Would Allow</div>
                  </div>
                </div>

                <div className="flex items-center gap-2 p-4 bg-slate-800 rounded-md">
                  <AlertTriangle className="w-5 h-5 text-yellow-400" />
                  <span className="text-white">
                    This policy would block {simulationResults.blockRate}% of recent runs
                  </span>
                </div>

                {/* Sample Results */}
                <div>
                  <h4 className="text-white font-medium mb-3">Sample Results (showing first 20)</h4>
                  <div className="space-y-2">
                    {simulationResults.results.map((result) => (
                      <div
                        key={result.runId}
                        className={`flex items-center justify-between p-3 rounded-md ${
                          result.blocked ? 'bg-red-500/10 border border-red-500/20' : 'bg-green-500/10 border border-green-500/20'
                        }`}
                      >
                        <div className="flex items-center gap-3">
                          {result.blocked ? (
                            <XCircle className="w-4 h-4 text-red-400" />
                          ) : (
                            <CheckCircle className="w-4 h-4 text-green-400" />
                          )}
                          <div>
                            <span className="font-mono text-sm text-white">
                              Run #{result.runId.slice(-8)}
                            </span>
                            <p className="text-xs text-slate-400">{result.reason}</p>
                          </div>
                        </div>
                        <div className="text-right text-xs text-slate-400">
                          <div>Cost: ${(result.run.cost_cents / 100).toFixed(2)}</div>
                          <div>Tokens: {result.run.tokens_in + result.run.tokens_out}</div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}