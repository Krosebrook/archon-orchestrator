import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { ArrowRight, Loader2, Sparkles } from 'lucide-react';
import { base44 } from '@/api/base44Client';
import { toast } from 'sonner';

export default function AgentSequencer({ agents }) {
  const [taskDescription, setTaskDescription] = useState('');
  const [suggestedSequence, setSuggestedSequence] = useState(null);
  const [isLoading, setIsLoading] = useState(false);

  const handleSuggestSequence = async () => {
    if (!taskDescription.trim()) {
      toast.error('Please describe the task');
      return;
    }

    setIsLoading(true);
    try {
      const agentContext = agents.map(a => ({
        id: a.id,
        name: a.name,
        provider: a.config.provider,
        model: a.config.model,
        capabilities: a.config.capabilities || [],
        cost_estimate: a.config.provider === 'openai' ? 'medium' : 'low'
      }));

      const result = await base44.integrations.Core.InvokeLLM({
        prompt: `You are an expert at agent orchestration. Given a task and available agents, suggest the optimal sequence.

Available Agents:
${JSON.stringify(agentContext, null, 2)}

Task: ${taskDescription}

Return a JSON object with this structure:
{
  "sequence": [
    {
      "agent_id": "agent_id_here",
      "agent_name": "name",
      "step": 1,
      "purpose": "what this agent does in the workflow",
      "estimated_cost_cents": 5,
      "estimated_duration_sec": 10
    }
  ],
  "reasoning": "why this sequence is optimal",
  "alternatives": ["alternative approach 1", "alternative approach 2"],
  "total_cost_cents": 50,
  "total_duration_sec": 120
}`,
        response_json_schema: {
          type: 'object',
          properties: {
            sequence: {
              type: 'array',
              items: {
                type: 'object',
                properties: {
                  agent_id: { type: 'string' },
                  agent_name: { type: 'string' },
                  step: { type: 'integer' },
                  purpose: { type: 'string' },
                  estimated_cost_cents: { type: 'integer' },
                  estimated_duration_sec: { type: 'integer' }
                }
              }
            },
            reasoning: { type: 'string' },
            alternatives: { type: 'array', items: { type: 'string' } },
            total_cost_cents: { type: 'integer' },
            total_duration_sec: { type: 'integer' }
          }
        }
      });

      setSuggestedSequence(result);
      toast.success('Agent sequence generated');
    } catch (error) {
      console.error('Sequence generation failed:', error);
      toast.error('Failed to generate sequence');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Card className="bg-slate-900 border-slate-800">
      <CardHeader>
        <CardTitle className="text-white flex items-center gap-2">
          <Sparkles className="w-5 h-5 text-blue-400" />
          Agent Sequencer
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="space-y-2">
          <label className="text-sm text-slate-400">Describe your task</label>
          <Textarea
            value={taskDescription}
            onChange={(e) => setTaskDescription(e.target.value)}
            placeholder="E.g., Process customer support tickets, extract key issues, analyze sentiment, generate response drafts..."
            className="min-h-[100px] bg-slate-950 border-slate-700 text-white"
          />
          <Button
            onClick={handleSuggestSequence}
            disabled={isLoading || !taskDescription.trim()}
            className="w-full bg-blue-600 hover:bg-blue-700"
          >
            {isLoading ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Analyzing...
              </>
            ) : (
              <>
                <Sparkles className="w-4 h-4 mr-2" />
                Suggest Optimal Sequence
              </>
            )}
          </Button>
        </div>

        {suggestedSequence && (
          <div className="space-y-4">
            <div className="p-4 bg-slate-950 rounded-lg border border-slate-800">
              <div className="text-sm font-medium text-white mb-2">Reasoning</div>
              <p className="text-sm text-slate-300">{suggestedSequence.reasoning}</p>
            </div>

            <div className="space-y-3">
              <div className="text-sm font-medium text-white">Suggested Sequence</div>
              {suggestedSequence.sequence.map((step, idx) => (
                <div key={idx} className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-blue-500/20 flex items-center justify-center flex-shrink-0">
                    <span className="text-sm font-medium text-blue-400">{step.step}</span>
                  </div>
                  <div className="flex-1 p-3 bg-slate-950 rounded-lg border border-slate-800">
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-sm font-medium text-white">{step.agent_name}</span>
                      <div className="flex items-center gap-2">
                        <Badge variant="outline" className="text-xs">
                          ${(step.estimated_cost_cents / 100).toFixed(3)}
                        </Badge>
                        <Badge variant="outline" className="text-xs">
                          {step.estimated_duration_sec}s
                        </Badge>
                      </div>
                    </div>
                    <p className="text-xs text-slate-400">{step.purpose}</p>
                  </div>
                  {idx < suggestedSequence.sequence.length - 1 && (
                    <ArrowRight className="w-4 h-4 text-slate-600 flex-shrink-0" />
                  )}
                </div>
              ))}
            </div>

            <div className="p-4 bg-green-500/10 rounded-lg border border-green-500/30">
              <div className="flex items-center justify-between">
                <span className="text-sm text-slate-300">Total Estimated Cost</span>
                <span className="text-sm font-medium text-green-400">
                  ${(suggestedSequence.total_cost_cents / 100).toFixed(2)}
                </span>
              </div>
              <div className="flex items-center justify-between mt-2">
                <span className="text-sm text-slate-300">Total Estimated Duration</span>
                <span className="text-sm font-medium text-green-400">
                  {suggestedSequence.total_duration_sec}s
                </span>
              </div>
            </div>

            {suggestedSequence.alternatives && suggestedSequence.alternatives.length > 0 && (
              <div className="p-4 bg-slate-950 rounded-lg border border-slate-800">
                <div className="text-sm font-medium text-white mb-2">Alternative Approaches</div>
                <ul className="space-y-1">
                  {suggestedSequence.alternatives.map((alt, idx) => (
                    <li key={idx} className="text-xs text-slate-400 pl-4">• {alt}</li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}