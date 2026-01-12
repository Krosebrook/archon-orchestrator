import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Sparkles, Loader2, CheckCircle2 } from 'lucide-react';
import { base44 } from '@/api/base44Client';
import { toast } from 'sonner';
import { useNavigate } from 'react-router-dom';
import { createPageUrl } from '@/utils';

export default function WorkflowGenerator() {
  const [goal, setGoal] = useState('');
  const [context, setContext] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedWorkflow, setGeneratedWorkflow] = useState(null);
  const navigate = useNavigate();

  const generateWorkflow = async () => {
    if (!goal.trim()) {
      toast.error('Please describe your workflow goal');
      return;
    }

    setIsGenerating(true);
    try {
      const response = await base44.functions.invoke('generateWorkflow', {
        goal,
        context
      });

      if (response.data.success) {
        setGeneratedWorkflow(response.data.workflow);
        toast.success('Workflow generated successfully!');
      }
    } catch (error) {
      console.error('Generation error:', error);
      toast.error('Failed to generate workflow');
    } finally {
      setIsGenerating(false);
    }
  };

  const createWorkflow = async () => {
    try {
      const user = await base44.auth.me();
      const workflow = await base44.entities.Workflow.create({
        name: generatedWorkflow.workflow_name,
        description: generatedWorkflow.description,
        version: '1.0.0',
        spec: {
          nodes: generatedWorkflow.nodes,
          edges: generatedWorkflow.edges
        },
        org_id: user.organization?.id || 'org_default'
      });

      // Create collaboration if multiple agents involved
      const agentNodes = generatedWorkflow.nodes.filter(n => n.type === 'agent');
      if (agentNodes.length > 1) {
        await base44.entities.AgentCollaboration.create({
          name: `${generatedWorkflow.workflow_name} Collaboration`,
          workflow_id: workflow.id,
          participant_agents: agentNodes.map(n => n.config.agent_id),
          strategy: generatedWorkflow.collaboration_strategy || 'sequential',
          state: 'active',
          shared_context: {
            goal,
            auto_generated: true,
            estimated_cost_cents: generatedWorkflow.estimated_cost_cents
          },
          org_id: user.organization?.id || 'org_default'
        });
      }

      toast.success('Workflow created successfully!');
      navigate(createPageUrl(`WorkflowDetail?id=${workflow.id}`));
    } catch (error) {
      console.error('Failed to create workflow:', error);
      toast.error('Failed to create workflow');
    }
  };

  const previewWorkflow = () => {
    navigate(createPageUrl('Workflows'));
  };

  return (
    <Card className="bg-slate-900 border-slate-800">
      <CardHeader>
        <CardTitle className="text-white flex items-center gap-2">
          <Sparkles className="w-5 h-5 text-purple-400" />
          AI Workflow Generator
        </CardTitle>
        <p className="text-sm text-slate-400">
          Describe your goal and let AI design the complete workflow
        </p>
      </CardHeader>
      <CardContent className="space-y-4">
        {!generatedWorkflow ? (
          <>
            <div className="space-y-2">
              <Label className="text-slate-300">What do you want to automate?</Label>
              <Input
                value={goal}
                onChange={(e) => setGoal(e.target.value)}
                placeholder="e.g., Automate customer support ticket resolution"
                className="bg-slate-800 border-slate-700"
                disabled={isGenerating}
              />
            </div>

            <div className="space-y-2">
              <Label className="text-slate-300">Additional Context (Optional)</Label>
              <Textarea
                value={context}
                onChange={(e) => setContext(e.target.value)}
                placeholder="e.g., Prioritize urgent tickets, escalate to humans for refunds..."
                className="bg-slate-800 border-slate-700 resize-none"
                rows={3}
                disabled={isGenerating}
              />
            </div>

            <Button
              onClick={generateWorkflow}
              disabled={isGenerating || !goal.trim()}
              className="w-full bg-purple-600 hover:bg-purple-700"
            >
              {isGenerating ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Generating Workflow...
                </>
              ) : (
                <>
                  <Sparkles className="w-4 h-4 mr-2" />
                  Generate Workflow
                </>
              )}
            </Button>

            <div className="p-3 bg-blue-900/20 rounded-lg border border-blue-800/30">
              <div className="text-xs text-blue-400 font-medium mb-1">💡 Pro Tip</div>
              <p className="text-xs text-blue-300">
                Be specific about your goal. Include details about inputs, outputs, and any constraints.
              </p>
            </div>
          </>
        ) : (
          <div className="space-y-4">
            <div className="p-4 bg-green-900/20 rounded-lg border border-green-800/30">
              <div className="flex items-start gap-2 mb-2">
                <CheckCircle2 className="w-5 h-5 text-green-400 flex-shrink-0 mt-0.5" />
                <div className="flex-1">
                  <div className="text-sm text-green-400 font-medium mb-1">
                    {generatedWorkflow.workflow_name}
                  </div>
                  <p className="text-xs text-green-300">
                    {generatedWorkflow.description}
                  </p>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-3 gap-3">
              <div className="p-3 bg-slate-950 rounded-lg border border-slate-800">
                <div className="text-xs text-slate-400 mb-1">Nodes</div>
                <div className="text-lg font-bold text-white">
                  {generatedWorkflow.nodes?.length || 0}
                </div>
              </div>
              <div className="p-3 bg-slate-950 rounded-lg border border-slate-800">
                <div className="text-xs text-slate-400 mb-1">Agents</div>
                <div className="text-lg font-bold text-white">
                  {generatedWorkflow.nodes?.filter(n => n.type === 'agent').length || 0}
                </div>
              </div>
              <div className="p-3 bg-slate-950 rounded-lg border border-slate-800">
                <div className="text-xs text-slate-400 mb-1">Est. Cost</div>
                <div className="text-lg font-bold text-white">
                  ${((generatedWorkflow.estimated_cost_cents || 0) / 100).toFixed(2)}
                </div>
              </div>
            </div>

            {generatedWorkflow.reasoning && (
              <div className="p-3 bg-purple-900/20 rounded-lg border border-purple-800/30">
                <div className="text-xs text-purple-400 font-medium mb-1">Design Rationale</div>
                <p className="text-xs text-purple-300">{generatedWorkflow.reasoning}</p>
              </div>
            )}

            <div className="space-y-2">
              <div className="text-sm font-medium text-slate-300 mb-2">Workflow Steps</div>
              {generatedWorkflow.nodes?.map((node, idx) => (
                <div key={idx} className="p-3 bg-slate-950 rounded-lg border border-slate-800">
                  <div className="flex items-center gap-2 mb-1">
                    <Badge variant="outline" className="bg-slate-800 border-slate-700 text-xs">
                      {node.type}
                    </Badge>
                    <span className="text-sm text-white font-medium">{node.label}</span>
                  </div>
                  {node.config?.instructions && (
                    <p className="text-xs text-slate-400 mt-1">{node.config.instructions}</p>
                  )}
                </div>
              ))}
            </div>

            <div className="flex gap-2">
              <Button
                onClick={createWorkflow}
                className="flex-1 bg-green-600 hover:bg-green-700"
              >
                <CheckCircle2 className="w-4 h-4 mr-2" />
                Create Workflow
              </Button>
              <Button
                onClick={() => setGeneratedWorkflow(null)}
                variant="outline"
                className="border-slate-700"
              >
                Reset
              </Button>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}