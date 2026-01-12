import { useState, useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { WorkflowTemplate, Workflow } from '@/entities/all';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { ArrowLeft, Save, Play, Sparkles, Eye } from 'lucide-react';
import { createPageUrl } from '@/utils';
import { base44 } from '@/api/base44Client';
import VisualWorkflowDesigner from '../components/workflows/VisualWorkflowDesigner';
import { toast } from 'sonner';

const NODE_TYPES = {
  trigger: { icon: null, color: 'from-green-500 to-emerald-600', label: 'Trigger' },
  agent: { icon: null, color: 'from-blue-500 to-cyan-600', label: 'AI Agent' },
  tool: { icon: null, color: 'from-purple-500 to-violet-600', label: 'Tool' },
  condition: { icon: null, color: 'from-yellow-500 to-orange-600', label: 'Condition' }
};

export default function TemplateCustomizer() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const templateId = searchParams.get('template');

  const [template, setTemplate] = useState(null);
  const [customizationPrompt, setCustomizationPrompt] = useState('');
  const [workflowName, setWorkflowName] = useState('');
  const [workflowDescription, setWorkflowDescription] = useState('');
  const [customizedSpec, setCustomizedSpec] = useState(null);
  const [isCustomizing, setIsCustomizing] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (templateId) {
      loadTemplate();
    } else {
      setIsLoading(false);
    }
  }, [templateId]);

  const loadTemplate = async () => {
    try {
      const data = await WorkflowTemplate.get(templateId);
      setTemplate(data);
      setWorkflowName(data.name);
      setWorkflowDescription(data.description);
      setCustomizedSpec(data.spec);
    } catch (error) {
      console.error('Failed to load template:', error);
      toast.error('Failed to load template');
    } finally {
      setIsLoading(false);
    }
  };

  const handleAICustomization = async () => {
    if (!customizationPrompt.trim()) {
      toast.error('Please describe your customization');
      return;
    }

    setIsCustomizing(true);
    try {
      const result = await base44.integrations.Core.InvokeLLM({
        prompt: `You are a workflow customization expert. Given this workflow template and user request, modify the workflow specification to match their needs.

Current Template:
Name: ${template.name}
Description: ${template.description}
Current Spec: ${JSON.stringify(template.spec, null, 2)}

User Request: "${customizationPrompt}"

Generate a customized workflow spec that:
1. Maintains the overall structure but adapts to the user's request
2. Updates node configurations as needed
3. Adds or removes nodes if requested
4. Ensures all connections remain valid

Return the modified spec as JSON:`,
        response_json_schema: {
          type: 'object',
          properties: {
            spec: {
              type: 'object',
              properties: {
                nodes: { type: 'array' },
                edges: { type: 'array' }
              }
            },
            explanation: { type: 'string' }
          }
        }
      });

      setCustomizedSpec(result.spec);
      toast.success('Template customized successfully');
      if (result.explanation) {
        toast.info(result.explanation, { duration: 5000 });
      }
    } catch (error) {
      console.error('Customization failed:', error);
      toast.error('Failed to customize template');
    } finally {
      setIsCustomizing(false);
    }
  };

  const handleSaveAsTemplate = async () => {
    if (!workflowName.trim()) {
      toast.error('Please provide a name');
      return;
    }

    try {
      const user = await base44.auth.me();
      await WorkflowTemplate.create({
        name: workflowName,
        description: workflowDescription,
        category: template?.category || 'automation',
        spec: customizedSpec,
        tags: template?.tags || [],
        org_id: user.organization?.id || 'org_acme'
      });

      toast.success('Template saved successfully');
      navigate(createPageUrl('Templates'));
    } catch (error) {
      console.error('Failed to save template:', error);
      toast.error('Failed to save template');
    }
  };

  const handleDeploy = async () => {
    if (!workflowName.trim()) {
      toast.error('Please provide a name');
      return;
    }

    try {
      const user = await base44.auth.me();
      const workflow = await Workflow.create({
        name: workflowName,
        description: workflowDescription,
        spec: customizedSpec,
        version: '1.0.0',
        org_id: user.organization?.id || 'org_acme'
      });

      toast.success('Workflow deployed successfully');
      navigate(createPageUrl(`WorkflowDetail?id=${workflow.id}`));
    } catch (error) {
      console.error('Failed to deploy workflow:', error);
      toast.error('Failed to deploy workflow');
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-slate-400">Loading template...</div>
      </div>
    );
  }

  if (!template) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-center">
          <p className="text-slate-400 mb-4">No template selected</p>
          <Button onClick={() => navigate(createPageUrl('Templates'))}>
            Browse Templates
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button
            variant="ghost"
            onClick={() => navigate(createPageUrl('Templates'))}
            className="text-slate-400"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back
          </Button>
          <div>
            <h1 className="text-3xl font-bold text-white flex items-center gap-2">
              <Sparkles className="w-8 h-8 text-purple-400" />
              Customize Template
            </h1>
            <p className="text-slate-400 mt-1">Based on: {template.name}</p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-1 space-y-6">
          <Card className="bg-slate-900 border-slate-800">
            <CardHeader>
              <CardTitle className="text-white">AI Customization</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Textarea
                  value={customizationPrompt}
                  onChange={(e) => setCustomizationPrompt(e.target.value)}
                  placeholder="Describe how you want to customize this template... e.g., 'Add a sentiment analysis step after the initial response' or 'Send notifications to Slack instead of email'"
                  className="bg-slate-950 border-slate-700 text-white resize-none h-32"
                />
              </div>
              <Button
                onClick={handleAICustomization}
                disabled={isCustomizing}
                className="w-full bg-purple-600 hover:bg-purple-700"
              >
                {isCustomizing ? (
                  <>Customizing...</>
                ) : (
                  <>
                    <Sparkles className="w-4 h-4 mr-2" />
                    Apply Customization
                  </>
                )}
              </Button>
            </CardContent>
          </Card>

          <Card className="bg-slate-900 border-slate-800">
            <CardHeader>
              <CardTitle className="text-white">Workflow Details</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <label className="text-sm text-slate-400 mb-2 block">Name</label>
                <Input
                  value={workflowName}
                  onChange={(e) => setWorkflowName(e.target.value)}
                  placeholder="Enter workflow name"
                  className="bg-slate-950 border-slate-700 text-white"
                />
              </div>
              <div>
                <label className="text-sm text-slate-400 mb-2 block">Description</label>
                <Textarea
                  value={workflowDescription}
                  onChange={(e) => setWorkflowDescription(e.target.value)}
                  placeholder="Enter description"
                  className="bg-slate-950 border-slate-700 text-white resize-none h-24"
                />
              </div>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  onClick={handleSaveAsTemplate}
                  className="flex-1 border-slate-700"
                >
                  <Save className="w-4 h-4 mr-2" />
                  Save as Template
                </Button>
                <Button
                  onClick={handleDeploy}
                  className="flex-1 bg-blue-600 hover:bg-blue-700"
                >
                  <Play className="w-4 h-4 mr-2" />
                  Deploy
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="lg:col-span-2">
          <Card className="bg-slate-900 border-slate-800 h-[calc(100vh-16rem)]">
            <CardHeader>
              <CardTitle className="text-white flex items-center gap-2">
                <Eye className="w-5 h-5" />
                Visual Preview
              </CardTitle>
            </CardHeader>
            <CardContent className="p-0 h-[calc(100%-5rem)]">
              {customizedSpec && (
                <VisualWorkflowDesigner
                  spec={customizedSpec}
                  onSpecChange={setCustomizedSpec}
                  nodeTypes={NODE_TYPES}
                  agents={[]}
                  tools={[]}
                  className="h-full"
                />
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}