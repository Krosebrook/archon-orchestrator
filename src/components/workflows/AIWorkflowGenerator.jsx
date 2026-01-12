/**
 * @fileoverview AI Workflow Generator
 * @description Generate complete workflows from natural language descriptions
 * @version 1.0.0
 */

import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Sparkles, Wand2, Loader2, Save, Play } from 'lucide-react';
import { base44 } from '@/api/base44Client';
import { toast } from 'sonner';
import GeneratedWorkflowPreview from './GeneratedWorkflowPreview';

export default function AIWorkflowGenerator({ open, onOpenChange, onWorkflowGenerated, onSaveAsTemplate }) {
  const [prompt, setPrompt] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedWorkflow, setGeneratedWorkflow] = useState(null);
  const [showPreview, setShowPreview] = useState(false);

  const examplePrompts = [
    "Create a customer support workflow that triages tickets, analyzes sentiment, and routes to the right team",
    "Build a content moderation pipeline that checks text for inappropriate content and flags violations",
    "Design a workflow that processes invoices, extracts data, validates amounts, and sends for approval",
    "Make a lead qualification workflow that scores leads based on engagement and notifies sales team",
  ];

  const generateWorkflow = async () => {
    if (!prompt.trim()) {
      toast.error('Please describe your workflow');
      return;
    }

    setIsGenerating(true);
    try {
      const result = await base44.integrations.Core.InvokeLLM({
        prompt: `You are a workflow architect. Generate a complete, production-ready workflow specification based on this description:

"${prompt}"

Create a workflow with:
1. Clear node structure (agents, tools, conditions, data operations)
2. Proper connections between nodes (edges)
3. Realistic configurations for each node
4. Error handling and fallback paths where appropriate
5. Descriptive labels and metadata

Return a JSON object with this structure:
{
  "name": "Workflow Name",
  "description": "Brief description",
  "category": "automation|data_processing|customer_service|content_generation|integration|analytics",
  "nodes": [
    {
      "id": "unique_id",
      "data": {
        "label": "Node Label",
        "type": "agent|tool|condition|data|webhook|email",
        "description": "What this node does",
        "config": {
          // Node-specific configuration
          // For agents: model, temperature, system_prompt
          // For tools: tool_name, parameters
          // For conditions: condition_type, criteria
        }
      },
      "position": { "x": number, "y": number }
    }
  ],
  "edges": [
    {
      "id": "edge_id",
      "source": "source_node_id",
      "target": "target_node_id",
      "data": {
        "label": "Connection label",
        "condition": "optional condition"
      }
    }
  ],
  "tags": ["tag1", "tag2"],
  "complexity": "beginner|intermediate|advanced",
  "estimated_duration_sec": number,
  "estimated_cost_cents": number
}`,
        response_json_schema: {
          type: 'object',
          properties: {
            name: { type: 'string' },
            description: { type: 'string' },
            category: { type: 'string' },
            nodes: {
              type: 'array',
              items: {
                type: 'object',
                properties: {
                  id: { type: 'string' },
                  data: { type: 'object' },
                  position: { type: 'object' }
                }
              }
            },
            edges: {
              type: 'array',
              items: {
                type: 'object',
                properties: {
                  id: { type: 'string' },
                  source: { type: 'string' },
                  target: { type: 'string' },
                  data: { type: 'object' }
                }
              }
            },
            tags: { type: 'array', items: { type: 'string' } },
            complexity: { type: 'string' },
            estimated_duration_sec: { type: 'number' },
            estimated_cost_cents: { type: 'number' }
          }
        }
      });

      setGeneratedWorkflow(result);
      setShowPreview(true);
      toast.success('Workflow generated successfully!');
    } catch (error) {
      console.error('Failed to generate workflow:', error);
      toast.error('Failed to generate workflow: ' + error.message);
    } finally {
      setIsGenerating(false);
    }
  };

  const handleApply = () => {
    onWorkflowGenerated?.(generatedWorkflow);
    setShowPreview(false);
    setPrompt('');
    setGeneratedWorkflow(null);
    onOpenChange(false);
  };

  const handleSaveAsTemplate = async () => {
    try {
      const user = await base44.auth.me();
      
      await base44.entities.WorkflowTemplate.create({
        name: generatedWorkflow.name,
        description: generatedWorkflow.description,
        category: generatedWorkflow.category,
        spec: {
          nodes: generatedWorkflow.nodes,
          edges: generatedWorkflow.edges,
        },
        tags: generatedWorkflow.tags || [],
        complexity: generatedWorkflow.complexity || 'intermediate',
        estimated_duration_sec: generatedWorkflow.estimated_duration_sec || 60,
        estimated_cost_cents: generatedWorkflow.estimated_cost_cents || 10,
        ai_features: ['ai_generated'],
        is_featured: false,
        usage_count: 0,
        org_id: user.organization?.id || 'org_acme',
      });

      toast.success('Workflow saved as template!');
      onSaveAsTemplate?.();
      handleApply();
    } catch (error) {
      console.error('Failed to save template:', error);
      toast.error('Failed to save as template');
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="bg-slate-900 border-slate-800 max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-white flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-purple-400" />
            AI Workflow Generator
          </DialogTitle>
        </DialogHeader>

        {!showPreview ? (
          <div className="space-y-4 mt-4">
            <div>
              <label className="text-sm text-slate-400 mb-2 block">
                Describe your workflow in natural language
              </label>
              <Textarea
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
                placeholder="Example: Create a workflow that processes customer feedback, analyzes sentiment, categorizes issues, and creates tickets for urgent matters..."
                className="bg-slate-950 border-slate-700 text-white resize-none h-32"
              />
            </div>

            <div>
              <p className="text-xs text-slate-400 mb-2">Try these examples:</p>
              <div className="grid grid-cols-1 gap-2">
                {examplePrompts.map((example, idx) => (
                  <button
                    key={idx}
                    onClick={() => setPrompt(example)}
                    className="text-left p-3 bg-slate-950 hover:bg-slate-800 rounded-lg border border-slate-800 hover:border-slate-700 transition-colors text-sm text-slate-300"
                  >
                    {example}
                  </button>
                ))}
              </div>
            </div>

            <Button
              onClick={generateWorkflow}
              disabled={isGenerating || !prompt.trim()}
              className="w-full bg-purple-600 hover:bg-purple-700"
              size="lg"
            >
              {isGenerating ? (
                <>
                  <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                  Generating Workflow...
                </>
              ) : (
                <>
                  <Wand2 className="w-5 h-5 mr-2" />
                  Generate Workflow
                </>
              )}
            </Button>
          </div>
        ) : (
          <div className="space-y-4 mt-4">
            <GeneratedWorkflowPreview workflow={generatedWorkflow} />

            <div className="flex gap-3">
              <Button
                onClick={() => {
                  setShowPreview(false);
                  setGeneratedWorkflow(null);
                }}
                variant="outline"
                className="flex-1 border-slate-700"
              >
                Back to Edit
              </Button>
              <Button
                onClick={handleSaveAsTemplate}
                variant="outline"
                className="flex-1 border-slate-700"
              >
                <Save className="w-4 h-4 mr-2" />
                Save as Template
              </Button>
              <Button
                onClick={handleApply}
                className="flex-1 bg-blue-600 hover:bg-blue-700"
              >
                <Play className="w-4 h-4 mr-2" />
                Apply to Builder
              </Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}