import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Zap, Loader2, AlertTriangle, CheckCircle } from 'lucide-react';
import { adaptAgentBehavior } from '@/functions/adaptAgentBehavior';
import { toast } from 'sonner';
import { handleError } from '../utils/api-client';

export default function AdaptiveLearning({ agents, sessions, onRefresh }) {
  const [selectedAgent, setSelectedAgent] = useState('');
  const [autoApply, setAutoApply] = useState(false);
  const [feedbackWindow, setFeedbackWindow] = useState(7);
  const [isAdapting, setIsAdapting] = useState(false);
  const [adaptation, setAdaptation] = useState(null);

  const triggerAdaptation = async () => {
    if (!selectedAgent) {
      toast.error('Please select an agent');
      return;
    }

    setIsAdapting(true);
    try {
      const { data: result } = await adaptAgentBehavior({
        agent_id: selectedAgent,
        feedback_window_days: feedbackWindow,
        auto_apply: autoApply
      });

      setAdaptation(result);
      if (result.applied) {
        toast.success('Agent configuration updated automatically');
      } else {
        toast.success('Adaptation recommendations generated');
      }
      onRefresh();
    } catch (error) {
      handleError(error);
    } finally {
      setIsAdapting(false);
    }
  };

  const riskColors = {
    low: 'bg-green-500/20 text-green-400 border-green-500/30',
    medium: 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30',
    high: 'bg-red-500/20 text-red-400 border-red-500/30'
  };

  return (
    <div className="space-y-6">
      <Card className="bg-slate-900 border-slate-800">
        <CardHeader>
          <CardTitle className="text-white">Adaptive Learning Configuration</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-sm text-slate-400">
            Automatically adapt agent behavior based on recent performance trends and user feedback.
          </p>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Select value={selectedAgent} onValueChange={setSelectedAgent}>
              <SelectTrigger className="bg-slate-800 border-slate-700">
                <SelectValue placeholder="Select agent" />
              </SelectTrigger>
              <SelectContent className="bg-slate-900 border-slate-800">
                {agents.map(agent => (
                  <SelectItem key={agent.id} value={agent.id}>
                    {agent.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select value={feedbackWindow.toString()} onValueChange={v => setFeedbackWindow(parseInt(v))}>
              <SelectTrigger className="bg-slate-800 border-slate-700">
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="bg-slate-900 border-slate-800">
                <SelectItem value="1">Last 24 hours</SelectItem>
                <SelectItem value="3">Last 3 days</SelectItem>
                <SelectItem value="7">Last 7 days</SelectItem>
                <SelectItem value="14">Last 14 days</SelectItem>
                <SelectItem value="30">Last 30 days</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="flex items-center justify-between p-3 bg-slate-950 rounded border border-slate-800">
            <div>
              <p className="text-sm font-medium text-white">Auto-apply low-risk changes</p>
              <p className="text-xs text-slate-400">Automatically apply adaptations with low risk and high confidence</p>
            </div>
            <Switch checked={autoApply} onCheckedChange={setAutoApply} />
          </div>

          <Button
            onClick={triggerAdaptation}
            disabled={isAdapting || !selectedAgent}
            className="w-full bg-purple-600 hover:bg-purple-700"
          >
            {isAdapting ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Analyzing...
              </>
            ) : (
              <>
                <Zap className="w-4 h-4 mr-2" />
                Generate Adaptation
              </>
            )}
          </Button>
        </CardContent>
      </Card>

      {adaptation && (
        <>
          <Card className="bg-slate-900 border-slate-800">
            <CardHeader>
              <CardTitle className="text-white">Performance Trends</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="p-3 bg-slate-950 rounded">
                  <p className="text-xs text-slate-500">Success Rate</p>
                  <p className="text-lg font-semibold text-white">
                    {(adaptation.performance_trends.success_rate * 100).toFixed(1)}%
                  </p>
                </div>
                <div className="p-3 bg-slate-950 rounded">
                  <p className="text-xs text-slate-500">Avg Latency</p>
                  <p className="text-lg font-semibold text-white">
                    {adaptation.performance_trends.avg_latency.toFixed(0)}ms
                  </p>
                </div>
                <div className="p-3 bg-slate-950 rounded">
                  <p className="text-xs text-slate-500">Avg Cost</p>
                  <p className="text-lg font-semibold text-white">
                    ${(adaptation.performance_trends.avg_cost / 100).toFixed(3)}
                  </p>
                </div>
                <div className="p-3 bg-slate-950 rounded">
                  <p className="text-xs text-slate-500">Total Runs</p>
                  <p className="text-lg font-semibold text-white">
                    {adaptation.performance_trends.total_runs}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-slate-900 border-slate-800">
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="text-white">Recommended Adaptations</CardTitle>
                <div className="flex items-center gap-2">
                  <Badge variant="outline" className={riskColors[adaptation.adaptation.risk_assessment.risk_level]}>
                    {adaptation.adaptation.risk_assessment.risk_level} risk
                  </Badge>
                  <Badge variant="outline" className="bg-blue-500/20 text-blue-400">
                    {(adaptation.adaptation.risk_assessment.confidence * 100).toFixed(0)}% confidence
                  </Badge>
                  {adaptation.applied && (
                    <Badge className="bg-green-500/20 text-green-400">
                      <CheckCircle className="w-3 h-3 mr-1" />
                      Applied
                    </Badge>
                  )}
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              {adaptation.adaptation.recommended_config && (
                <div className="p-4 bg-slate-950 rounded border border-slate-800">
                  <h4 className="text-sm font-semibold text-white mb-2">Configuration Changes</h4>
                  <pre className="text-xs text-slate-300 whitespace-pre-wrap">
                    {JSON.stringify(adaptation.adaptation.recommended_config, null, 2)}
                  </pre>
                </div>
              )}

              {adaptation.adaptation.behavior_modifications?.length > 0 && (
                <div className="space-y-2">
                  <h4 className="text-sm font-semibold text-white">Behavior Modifications</h4>
                  {adaptation.adaptation.behavior_modifications.map((mod, idx) => (
                    <div key={idx} className="p-3 bg-slate-950 rounded border border-slate-800">
                      <p className="text-sm font-medium text-white mb-1">{mod.modification}</p>
                      <p className="text-xs text-slate-400 mb-2">{mod.rationale}</p>
                      <p className="text-xs text-green-400">{mod.expected_impact}</p>
                    </div>
                  ))}
                </div>
              )}

              {adaptation.adaptation.risk_assessment.concerns?.length > 0 && (
                <div className="p-4 bg-orange-500/10 rounded border border-orange-500/30">
                  <h4 className="text-sm font-semibold text-orange-400 mb-2 flex items-center gap-2">
                    <AlertTriangle className="w-4 h-4" />
                    Concerns
                  </h4>
                  <ul className="space-y-1">
                    {adaptation.adaptation.risk_assessment.concerns.map((concern, idx) => (
                      <li key={idx} className="text-xs text-slate-300 flex items-start gap-2">
                        <span className="text-orange-400">•</span>
                        {concern}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </CardContent>
          </Card>
        </>
      )}
    </div>
  );
}