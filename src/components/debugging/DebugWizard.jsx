import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Bug, Loader2, CheckCircle, ArrowRight, Lightbulb } from 'lucide-react';
import { base44 } from '@/api/base44Client';
import { toast } from 'sonner';

export default function DebugWizard({ agents, runs, metrics }) {
  const [issue, setIssue] = useState('');
  const [guidance, setGuidance] = useState(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [currentStep, setCurrentStep] = useState(0);

  const startDebugSession = async () => {
    if (!issue.trim()) {
      toast.error('Please describe the issue');
      return;
    }

    setIsGenerating(true);
    try {
      const contextData = {
        agents: agents.slice(0, 5).map(a => ({ id: a.id, name: a.name, status: a.status, config: a.config })),
        recent_failures: runs.filter(r => r.status === 'failed').slice(0, 10).map(r => ({
          agent_id: r.agent_id,
          error: r.error_message,
          timestamp: r.finished_at
        })),
        error_metrics: metrics.slice(0, 20).map(m => ({
          agent_id: m.agent_id,
          error_code: m.error_code,
          status: m.status
        }))
      };

      const result = await base44.integrations.Core.InvokeLLM({
        prompt: `You are an expert debugging coach. A developer is experiencing this issue:

"${issue}"

System Context:
${JSON.stringify(contextData, null, 2)}

Provide step-by-step debugging guidance:

For each step:
1. Clear action to take
2. What to look for
3. How to interpret results
4. When to move to next step

Include:
- Diagnostic questions to narrow down the issue
- Specific commands/queries to run
- Expected vs unexpected outcomes
- Common pitfalls to avoid

Be systematic, pedagogical, and thorough. Guide them to understand root cause, not just fix symptoms.`,
        response_json_schema: {
          type: "object",
          properties: {
            diagnosis: { type: "string" },
            steps: {
              type: "array",
              items: {
                type: "object",
                properties: {
                  step_number: { type: "integer" },
                  title: { type: "string" },
                  action: { type: "string" },
                  what_to_look_for: { type: "string" },
                  expected_outcome: { type: "string" },
                  if_unexpected: { type: "string" }
                }
              }
            },
            diagnostic_questions: { type: "array", items: { type: "string" } },
            common_pitfalls: { type: "array", items: { type: "string" } }
          }
        }
      });

      setGuidance(result);
      setCurrentStep(0);
      toast.success('Debug guidance generated');
    } catch (error) {
      console.error('Failed to generate guidance:', error);
      toast.error('Failed to generate guidance');
    } finally {
      setIsGenerating(false);
    }
  };

  const nextStep = () => {
    if (currentStep < (guidance?.steps?.length || 0) - 1) {
      setCurrentStep(currentStep + 1);
    }
  };

  const prevStep = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  return (
    <div className="space-y-6">
      <Card className="bg-slate-900 border-slate-800">
        <CardHeader>
          <CardTitle className="text-white">Describe Your Issue</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <Input
            value={issue}
            onChange={e => setIssue(e.target.value)}
            placeholder="e.g., Agent keeps timing out when processing large documents..."
            className="bg-slate-800 border-slate-700"
          />
          <Button
            onClick={startDebugSession}
            disabled={isGenerating}
            className="w-full bg-blue-600 hover:bg-blue-700"
          >
            {isGenerating ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Generating Guidance...
              </>
            ) : (
              <>
                <Bug className="w-4 h-4 mr-2" />
                Start Debug Session
              </>
            )}
          </Button>
        </CardContent>
      </Card>

      {guidance && (
        <>
          <Card className="bg-slate-900 border-slate-800">
            <CardHeader>
              <CardTitle className="text-white">Initial Diagnosis</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-slate-300">{guidance.diagnosis}</p>
            </CardContent>
          </Card>

          {guidance.diagnostic_questions?.length > 0 && (
            <Card className="bg-slate-900 border-slate-800">
              <CardHeader>
                <CardTitle className="text-white flex items-center gap-2">
                  <Lightbulb className="w-5 h-5 text-yellow-400" />
                  Diagnostic Questions
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2">
                  {guidance.diagnostic_questions.map((q, idx) => (
                    <li key={idx} className="flex items-start gap-2 text-sm text-slate-300">
                      <span className="text-yellow-400">?</span>
                      {q}
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>
          )}

          {guidance.steps?.length > 0 && (
            <Card className="bg-slate-900 border-slate-800">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="text-white">
                    Step {currentStep + 1} of {guidance.steps.length}
                  </CardTitle>
                  <Badge variant="outline" className="bg-blue-500/20 text-blue-400">
                    {guidance.steps[currentStep].title}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="p-4 bg-slate-950 rounded-lg border border-slate-800">
                  <h4 className="text-sm font-semibold text-white mb-2">Action</h4>
                  <p className="text-sm text-slate-300">{guidance.steps[currentStep].action}</p>
                </div>

                <div className="p-4 bg-blue-500/10 rounded-lg border border-blue-500/30">
                  <h4 className="text-sm font-semibold text-blue-400 mb-2">What to Look For</h4>
                  <p className="text-sm text-slate-300">{guidance.steps[currentStep].what_to_look_for}</p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="p-4 bg-green-500/10 rounded-lg border border-green-500/30">
                    <h4 className="text-sm font-semibold text-green-400 mb-2 flex items-center gap-2">
                      <CheckCircle className="w-4 h-4" />
                      Expected Outcome
                    </h4>
                    <p className="text-xs text-slate-300">{guidance.steps[currentStep].expected_outcome}</p>
                  </div>

                  <div className="p-4 bg-orange-500/10 rounded-lg border border-orange-500/30">
                    <h4 className="text-sm font-semibold text-orange-400 mb-2">If Unexpected</h4>
                    <p className="text-xs text-slate-300">{guidance.steps[currentStep].if_unexpected}</p>
                  </div>
                </div>

                <div className="flex justify-between pt-4">
                  <Button
                    onClick={prevStep}
                    disabled={currentStep === 0}
                    variant="outline"
                    className="border-slate-700"
                  >
                    Previous
                  </Button>
                  <Button
                    onClick={nextStep}
                    disabled={currentStep === guidance.steps.length - 1}
                    className="bg-blue-600 hover:bg-blue-700"
                  >
                    Next Step
                    <ArrowRight className="w-4 h-4 ml-2" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}

          {guidance.common_pitfalls?.length > 0 && (
            <Card className="bg-slate-900 border-slate-800">
              <CardHeader>
                <CardTitle className="text-white text-sm">Common Pitfalls</CardTitle>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2">
                  {guidance.common_pitfalls.map((pitfall, idx) => (
                    <li key={idx} className="flex items-start gap-2 text-sm text-slate-300">
                      <span className="text-red-400">⚠</span>
                      {pitfall}
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>
          )}
        </>
      )}
    </div>
  );
}