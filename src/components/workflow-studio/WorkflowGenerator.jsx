import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Code, Loader2, Sparkles, Save } from 'lucide-react';
import { base44 } from '@/api/base44Client';
import { Workflow } from '@/entities/all';
import { toast } from 'sonner';

export default function WorkflowGenerator({ agents, onRefresh }) {
  const [description, setDescription] = useState('');
  const [workflowName, setWorkflowName] = useState('');
  const [generatedSpec, setGeneratedSpec] = useState(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  const handleGenerate = async () => {
    if (!description.trim()) {
      toast.error('Please describe the workflow');
      return;
    }

    setIsGenerating(true);
    try {
      const agentContext = agents.map(a => ({
        id: a.id,
        name: a.name,
        provider: a.config.provider,
        model: a.config.model
      }));

      const result = await base44.integrations.Core.InvokeLLM({
        prompt: `Generate a workflow specification based on the following description.

Available Agents:
${JSON.stringify(agentContext, null, 2)}

Description: ${description}

Create a workflow spec with nodes and edges. Each node should have:
- id: unique identifier
- type: one of (trigger, agent, tool, condition, webhook, email, output)
- position: {x, y} coordinates
- data: {label, config}

Return JSON:
{
  "name": "generated workflow name",
  "description": "workflow description",
  "spec": {
    "nodes": [...],
    "edges": [...]
  }
}`,
        response_json_schema: {
          type: 'object',
          properties: {
            name: { type: 'string' },
            description: { type: 'string' },
            spec: {
              type: 'object',
              properties: {
                nodes: { type: 'array', items: { type: 'object' } },
                edges: { type: 'array', items: { type: 'object' } }
              }
            }
          }
        }
      });

      setGeneratedSpec(result);
      setWorkflowName(result.name);
      toast.success('Workflow generated successfully');
    } catch (error) {
      console.error('Workflow generation failed:', error);
      toast.error('Failed to generate workflow');
    } finally {
      setIsGenerating(false);
    }
  };

  const handleSave = async () => {
    if (!workflowName.trim() || !generatedSpec) {
      toast.error('Please generate a workflow first');
      return;
    }

    setIsSaving(true);
    try {
      const user = await base44.auth.me();
      await Workflow.create({
        name: workflowName,
        description: generatedSpec.description,
        spec: generatedSpec.spec,
        version: '1.0.0',
        org_id: user.organization.id
      });

      toast.success('Workflow saved successfully');
      onRefresh?.();
      setDescription('');
      setWorkflowName('');
      setGeneratedSpec(null);
    } catch (error) {
      console.error('Failed to save workflow:', error);
      toast.error('Failed to save workflow');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <Card className="bg-slate-900 border-slate-800">
      <CardHeader>
        <CardTitle className="text-white flex items-center gap-2">
          <Code className="w-5 h-5 text-green-400" />
          Workflow Generator
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="space-y-4">
          <div className="space-y-2">
            <Label className="text-slate-400">Describe your workflow in natural language</Label>
            <Textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="E.g., When a new document is uploaded, extract text, analyze sentiment, categorize by topic, and send email notification with summary..."
              className="min-h-[120px] bg-slate-950 border-slate-700 text-white"
            />
          </div>

          <Button
            onClick={handleGenerate}
            disabled={isGenerating || !description.trim()}
            className="w-full bg-green-600 hover:bg-green-700"
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
        </div>

        {generatedSpec && (
          <div className="space-y-4">
            <div className="space-y-2">
              <Label className="text-slate-400">Workflow Name</Label>
              <Input
                value={workflowName}
                onChange={(e) => setWorkflowName(e.target.value)}
                className="bg-slate-950 border-slate-700 text-white"
              />
            </div>

            <div className="p-4 bg-slate-950 rounded-lg border border-slate-800">
              <div className="text-sm font-medium text-white mb-2">Description</div>
              <p className="text-sm text-slate-300">{generatedSpec.description}</p>
            </div>

            <div className="p-4 bg-slate-950 rounded-lg border border-slate-800">
              <div className="text-sm font-medium text-white mb-2">Workflow Specification</div>
              <pre className="text-xs text-slate-400 overflow-auto max-h-[300px]">
                {JSON.stringify(generatedSpec.spec, null, 2)}
              </pre>
            </div>

            <div className="p-4 bg-blue-500/10 rounded-lg border border-blue-500/30">
              <div className="text-sm text-blue-300 mb-2">Workflow Preview</div>
              <div className="text-xs text-slate-400">
                {generatedSpec.spec.nodes.length} nodes, {generatedSpec.spec.edges.length} connections
              </div>
            </div>

            <Button
              onClick={handleSave}
              disabled={isSaving}
              className="w-full bg-blue-600 hover:bg-blue-700"
            >
              {isSaving ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Saving...
                </>
              ) : (
                <>
                  <Save className="w-4 h-4 mr-2" />
                  Save Workflow
                </>
              )}
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}