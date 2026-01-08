import React, { useState, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import {
  GitBranch,
  Plus,
  Trash2,
  GripVertical,
  Play,
  Save,
  ChevronRight,
  Database,
  Cog,
  Brain,
  TestTube,
  CheckCircle,
  BarChart3,
  Zap,
  ArrowDown,
  Copy
} from 'lucide-react';
import { toast } from 'sonner';

/**
 * Training Pipeline Builder Component
 *
 * Visual builder for creating multi-step training pipelines:
 * - Data preparation steps
 * - Training configuration
 * - Validation stages
 * - Post-training actions
 * - Pipeline templates
 */

const STEP_TYPES = {
  data_prep: {
    label: 'Data Preparation',
    icon: Database,
    color: 'bg-blue-500',
    description: 'Prepare and validate training data'
  },
  augmentation: {
    label: 'Data Augmentation',
    icon: Copy,
    color: 'bg-purple-500',
    description: 'Generate additional training samples'
  },
  training: {
    label: 'Training',
    icon: Brain,
    color: 'bg-green-500',
    description: 'Execute the training job'
  },
  validation: {
    label: 'Validation',
    icon: TestTube,
    color: 'bg-yellow-500',
    description: 'Validate model performance'
  },
  evaluation: {
    label: 'Evaluation',
    icon: BarChart3,
    color: 'bg-orange-500',
    description: 'Comprehensive evaluation'
  },
  optimization: {
    label: 'Optimization',
    icon: Zap,
    color: 'bg-pink-500',
    description: 'Apply optimizations'
  },
  checkpoint: {
    label: 'Checkpoint',
    icon: CheckCircle,
    color: 'bg-cyan-500',
    description: 'Save training state'
  }
};

const PIPELINE_TEMPLATES = [
  {
    id: 'standard',
    name: 'Standard Training',
    description: 'Basic training pipeline with validation',
    steps: [
      { type: 'data_prep', config: { validateData: true, shuffleData: true } },
      { type: 'training', config: { epochs: 10, batchSize: 32 } },
      { type: 'validation', config: { holdoutRatio: 0.2 } },
      { type: 'evaluation', config: { generateReport: true } }
    ]
  },
  {
    id: 'advanced',
    name: 'Advanced Training',
    description: 'Full pipeline with augmentation and optimization',
    steps: [
      { type: 'data_prep', config: { validateData: true, shuffleData: true, cleanData: true } },
      { type: 'augmentation', config: { augmentationFactor: 2, techniques: ['paraphrase', 'backtranslation'] } },
      { type: 'training', config: { epochs: 20, batchSize: 32, learningRate: 0.001 } },
      { type: 'checkpoint', config: { interval: 5 } },
      { type: 'validation', config: { holdoutRatio: 0.2 } },
      { type: 'optimization', config: { pruning: true, quantization: false } },
      { type: 'evaluation', config: { generateReport: true, compareBaseline: true } }
    ]
  },
  {
    id: 'quick',
    name: 'Quick Iteration',
    description: 'Fast training for rapid prototyping',
    steps: [
      { type: 'data_prep', config: { validateData: true } },
      { type: 'training', config: { epochs: 3, batchSize: 64 } },
      { type: 'validation', config: { holdoutRatio: 0.1 } }
    ]
  },
  {
    id: 'fewshot',
    name: 'Few-Shot Learning',
    description: 'Optimized for small datasets',
    steps: [
      { type: 'data_prep', config: { validateData: true, balanceClasses: true } },
      { type: 'augmentation', config: { augmentationFactor: 5, techniques: ['paraphrase', 'synonym_replacement'] } },
      { type: 'training', config: { epochs: 5, batchSize: 8, trainingType: 'few_shot' } },
      { type: 'validation', config: { holdoutRatio: 0.2, crossValidation: true } },
      { type: 'evaluation', config: { generateReport: true } }
    ]
  }
];

export default function TrainingPipelineBuilder({
  onPipelineChange,
  onExecute,
  agents = [],
  initialPipeline = null
}) {
  const [pipelineName, setPipelineName] = useState(initialPipeline?.name || 'New Pipeline');
  const [selectedAgent, setSelectedAgent] = useState(initialPipeline?.agentId || '');
  const [steps, setSteps] = useState(initialPipeline?.steps || []);
  const [selectedStep, setSelectedStep] = useState(null);
  const [isExecuting, setIsExecuting] = useState(false);

  // Add step to pipeline
  const addStep = useCallback((type) => {
    const stepType = STEP_TYPES[type];
    if (!stepType) return;

    const newStep = {
      id: crypto.randomUUID(),
      type,
      name: stepType.label,
      config: {},
      enabled: true
    };

    const updatedSteps = [...steps, newStep];
    setSteps(updatedSteps);
    setSelectedStep(newStep.id);
    onPipelineChange?.({ name: pipelineName, agentId: selectedAgent, steps: updatedSteps });
  }, [steps, pipelineName, selectedAgent, onPipelineChange]);

  // Remove step from pipeline
  const removeStep = useCallback((stepId) => {
    const updatedSteps = steps.filter(s => s.id !== stepId);
    setSteps(updatedSteps);
    if (selectedStep === stepId) setSelectedStep(null);
    onPipelineChange?.({ name: pipelineName, agentId: selectedAgent, steps: updatedSteps });
  }, [steps, selectedStep, pipelineName, selectedAgent, onPipelineChange]);

  // Update step configuration
  const updateStepConfig = useCallback((stepId, config) => {
    const updatedSteps = steps.map(s =>
      s.id === stepId ? { ...s, config: { ...s.config, ...config } } : s
    );
    setSteps(updatedSteps);
    onPipelineChange?.({ name: pipelineName, agentId: selectedAgent, steps: updatedSteps });
  }, [steps, pipelineName, selectedAgent, onPipelineChange]);

  // Toggle step enabled/disabled
  const toggleStep = useCallback((stepId) => {
    const updatedSteps = steps.map(s =>
      s.id === stepId ? { ...s, enabled: !s.enabled } : s
    );
    setSteps(updatedSteps);
    onPipelineChange?.({ name: pipelineName, agentId: selectedAgent, steps: updatedSteps });
  }, [steps, pipelineName, selectedAgent, onPipelineChange]);

  // Move step up/down
  const moveStep = useCallback((stepId, direction) => {
    const idx = steps.findIndex(s => s.id === stepId);
    if (idx === -1) return;

    const newIdx = direction === 'up' ? idx - 1 : idx + 1;
    if (newIdx < 0 || newIdx >= steps.length) return;

    const updatedSteps = [...steps];
    [updatedSteps[idx], updatedSteps[newIdx]] = [updatedSteps[newIdx], updatedSteps[idx]];
    setSteps(updatedSteps);
    onPipelineChange?.({ name: pipelineName, agentId: selectedAgent, steps: updatedSteps });
  }, [steps, pipelineName, selectedAgent, onPipelineChange]);

  // Load template
  const loadTemplate = useCallback((templateId) => {
    const template = PIPELINE_TEMPLATES.find(t => t.id === templateId);
    if (!template) return;

    const templateSteps = template.steps.map(s => ({
      id: crypto.randomUUID(),
      type: s.type,
      name: STEP_TYPES[s.type]?.label || s.type,
      config: s.config,
      enabled: true
    }));

    setSteps(templateSteps);
    setPipelineName(template.name);
    setSelectedStep(null);
    onPipelineChange?.({ name: template.name, agentId: selectedAgent, steps: templateSteps });
    toast.success(`Loaded template: ${template.name}`);
  }, [selectedAgent, onPipelineChange]);

  // Execute pipeline
  const executePipeline = useCallback(async () => {
    if (!selectedAgent) {
      toast.error('Please select an agent');
      return;
    }

    if (steps.length === 0) {
      toast.error('Add at least one step to the pipeline');
      return;
    }

    setIsExecuting(true);
    try {
      await onExecute?.({
        name: pipelineName,
        agentId: selectedAgent,
        steps: steps.filter(s => s.enabled)
      });
      toast.success('Pipeline execution started');
    } catch (error) {
      toast.error('Failed to execute pipeline');
    } finally {
      setIsExecuting(false);
    }
  }, [selectedAgent, steps, pipelineName, onExecute]);

  // Get selected step details
  const currentStep = steps.find(s => s.id === selectedStep);
  const currentStepType = currentStep ? STEP_TYPES[currentStep.type] : null;

  return (
    <div className="space-y-6">
      {/* Pipeline Header */}
      <Card className="bg-slate-900 border-slate-800">
        <CardHeader>
          <CardTitle className="text-white flex items-center gap-2">
            <GitBranch className="w-5 h-5 text-purple-400" />
            Training Pipeline Builder
          </CardTitle>
          <CardDescription>
            Design multi-step training workflows with customizable stages
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <Label className="text-slate-300">Pipeline Name</Label>
              <Input
                value={pipelineName}
                onChange={(e) => setPipelineName(e.target.value)}
                className="bg-slate-800 border-slate-700 mt-1"
              />
            </div>
            <div>
              <Label className="text-slate-300">Target Agent</Label>
              <Select value={selectedAgent} onValueChange={setSelectedAgent}>
                <SelectTrigger className="bg-slate-800 border-slate-700 mt-1">
                  <SelectValue placeholder="Select agent" />
                </SelectTrigger>
                <SelectContent className="bg-slate-900 border-slate-800">
                  {agents.map(agent => (
                    <SelectItem key={agent.id} value={agent.id}>{agent.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label className="text-slate-300">Load Template</Label>
              <Select onValueChange={loadTemplate}>
                <SelectTrigger className="bg-slate-800 border-slate-700 mt-1">
                  <SelectValue placeholder="Select template" />
                </SelectTrigger>
                <SelectContent className="bg-slate-900 border-slate-800">
                  {PIPELINE_TEMPLATES.map(template => (
                    <SelectItem key={template.id} value={template.id}>
                      {template.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Pipeline Builder */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Step Library */}
        <Card className="bg-slate-900 border-slate-800">
          <CardHeader>
            <CardTitle className="text-white text-sm">Available Steps</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {Object.entries(STEP_TYPES).map(([type, config]) => {
                const Icon = config.icon;
                return (
                  <button
                    key={type}
                    onClick={() => addStep(type)}
                    className="w-full p-3 bg-slate-950 rounded-lg border border-slate-800 hover:border-slate-700 transition-colors flex items-center gap-3 text-left"
                  >
                    <div className={`w-8 h-8 rounded ${config.color} flex items-center justify-center`}>
                      <Icon className="w-4 h-4 text-white" />
                    </div>
                    <div className="flex-1">
                      <p className="text-sm font-medium text-white">{config.label}</p>
                      <p className="text-xs text-slate-400">{config.description}</p>
                    </div>
                    <Plus className="w-4 h-4 text-slate-500" />
                  </button>
                );
              })}
            </div>
          </CardContent>
        </Card>

        {/* Pipeline Steps */}
        <Card className="bg-slate-900 border-slate-800">
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="text-white text-sm">Pipeline Steps ({steps.length})</CardTitle>
              <Button
                onClick={executePipeline}
                disabled={isExecuting || steps.length === 0 || !selectedAgent}
                size="sm"
                className="bg-green-600 hover:bg-green-700"
              >
                <Play className="w-4 h-4 mr-1" />
                Execute
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            {steps.length === 0 ? (
              <div className="text-center py-8 text-slate-400">
                <GitBranch className="w-8 h-8 mx-auto mb-2 opacity-50" />
                <p className="text-sm">Add steps from the library</p>
                <p className="text-xs">or load a template</p>
              </div>
            ) : (
              <div className="space-y-2">
                {steps.map((step, idx) => {
                  const stepType = STEP_TYPES[step.type];
                  const Icon = stepType?.icon || Cog;
                  const isSelected = selectedStep === step.id;

                  return (
                    <React.Fragment key={step.id}>
                      <div
                        onClick={() => setSelectedStep(step.id)}
                        className={`p-3 rounded-lg border cursor-pointer transition-all ${isSelected
                          ? 'bg-slate-800 border-purple-500 ring-1 ring-purple-500'
                          : step.enabled
                            ? 'bg-slate-950 border-slate-800 hover:border-slate-700'
                            : 'bg-slate-950/50 border-slate-800 opacity-50'
                          }`}
                      >
                        <div className="flex items-center gap-3">
                          <GripVertical className="w-4 h-4 text-slate-600 cursor-move" />
                          <div className={`w-8 h-8 rounded ${stepType?.color || 'bg-slate-600'} flex items-center justify-center`}>
                            <Icon className="w-4 h-4 text-white" />
                          </div>
                          <div className="flex-1">
                            <p className="text-sm font-medium text-white">{step.name}</p>
                            <p className="text-xs text-slate-400">Step {idx + 1}</p>
                          </div>
                          <div className="flex items-center gap-1">
                            <Switch
                              checked={step.enabled}
                              onCheckedChange={() => toggleStep(step.id)}
                              onClick={(e) => e.stopPropagation()}
                            />
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={(e) => { e.stopPropagation(); removeStep(step.id); }}
                              className="text-red-400 hover:text-red-300"
                            >
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          </div>
                        </div>
                      </div>
                      {idx < steps.length - 1 && (
                        <div className="flex justify-center">
                          <ArrowDown className="w-4 h-4 text-slate-600" />
                        </div>
                      )}
                    </React.Fragment>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Step Configuration */}
        <Card className="bg-slate-900 border-slate-800">
          <CardHeader>
            <CardTitle className="text-white text-sm">Step Configuration</CardTitle>
          </CardHeader>
          <CardContent>
            {currentStep && currentStepType ? (
              <div className="space-y-4">
                <div className="flex items-center gap-3 p-3 bg-slate-950 rounded-lg">
                  <div className={`w-10 h-10 rounded ${currentStepType.color} flex items-center justify-center`}>
                    <currentStepType.icon className="w-5 h-5 text-white" />
                  </div>
                  <div>
                    <p className="text-white font-medium">{currentStep.name}</p>
                    <p className="text-xs text-slate-400">{currentStepType.description}</p>
                  </div>
                </div>

                {/* Step-specific configuration */}
                {currentStep.type === 'data_prep' && (
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <Label className="text-slate-300">Validate Data</Label>
                      <Switch
                        checked={currentStep.config.validateData || false}
                        onCheckedChange={(v) => updateStepConfig(currentStep.id, { validateData: v })}
                      />
                    </div>
                    <div className="flex items-center justify-between">
                      <Label className="text-slate-300">Shuffle Data</Label>
                      <Switch
                        checked={currentStep.config.shuffleData || false}
                        onCheckedChange={(v) => updateStepConfig(currentStep.id, { shuffleData: v })}
                      />
                    </div>
                    <div className="flex items-center justify-between">
                      <Label className="text-slate-300">Clean Data</Label>
                      <Switch
                        checked={currentStep.config.cleanData || false}
                        onCheckedChange={(v) => updateStepConfig(currentStep.id, { cleanData: v })}
                      />
                    </div>
                  </div>
                )}

                {currentStep.type === 'training' && (
                  <div className="space-y-3">
                    <div>
                      <Label className="text-slate-300">Epochs</Label>
                      <Input
                        type="number"
                        value={currentStep.config.epochs || 10}
                        onChange={(e) => updateStepConfig(currentStep.id, { epochs: parseInt(e.target.value) })}
                        className="bg-slate-800 border-slate-700 mt-1"
                      />
                    </div>
                    <div>
                      <Label className="text-slate-300">Batch Size</Label>
                      <Input
                        type="number"
                        value={currentStep.config.batchSize || 32}
                        onChange={(e) => updateStepConfig(currentStep.id, { batchSize: parseInt(e.target.value) })}
                        className="bg-slate-800 border-slate-700 mt-1"
                      />
                    </div>
                    <div>
                      <Label className="text-slate-300">Learning Rate</Label>
                      <Select
                        value={(currentStep.config.learningRate || 0.001).toString()}
                        onValueChange={(v) => updateStepConfig(currentStep.id, { learningRate: parseFloat(v) })}
                      >
                        <SelectTrigger className="bg-slate-800 border-slate-700 mt-1">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent className="bg-slate-900 border-slate-800">
                          <SelectItem value="0.01">0.01</SelectItem>
                          <SelectItem value="0.001">0.001</SelectItem>
                          <SelectItem value="0.0001">0.0001</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                )}

                {currentStep.type === 'validation' && (
                  <div className="space-y-3">
                    <div>
                      <Label className="text-slate-300">Holdout Ratio</Label>
                      <Input
                        type="number"
                        step="0.1"
                        min="0.1"
                        max="0.5"
                        value={currentStep.config.holdoutRatio || 0.2}
                        onChange={(e) => updateStepConfig(currentStep.id, { holdoutRatio: parseFloat(e.target.value) })}
                        className="bg-slate-800 border-slate-700 mt-1"
                      />
                    </div>
                    <div className="flex items-center justify-between">
                      <Label className="text-slate-300">Cross Validation</Label>
                      <Switch
                        checked={currentStep.config.crossValidation || false}
                        onCheckedChange={(v) => updateStepConfig(currentStep.id, { crossValidation: v })}
                      />
                    </div>
                  </div>
                )}

                {currentStep.type === 'augmentation' && (
                  <div className="space-y-3">
                    <div>
                      <Label className="text-slate-300">Augmentation Factor</Label>
                      <Input
                        type="number"
                        min="1"
                        max="10"
                        value={currentStep.config.augmentationFactor || 2}
                        onChange={(e) => updateStepConfig(currentStep.id, { augmentationFactor: parseInt(e.target.value) })}
                        className="bg-slate-800 border-slate-700 mt-1"
                      />
                    </div>
                  </div>
                )}

                {currentStep.type === 'evaluation' && (
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <Label className="text-slate-300">Generate Report</Label>
                      <Switch
                        checked={currentStep.config.generateReport || false}
                        onCheckedChange={(v) => updateStepConfig(currentStep.id, { generateReport: v })}
                      />
                    </div>
                    <div className="flex items-center justify-between">
                      <Label className="text-slate-300">Compare Baseline</Label>
                      <Switch
                        checked={currentStep.config.compareBaseline || false}
                        onCheckedChange={(v) => updateStepConfig(currentStep.id, { compareBaseline: v })}
                      />
                    </div>
                  </div>
                )}

                {currentStep.type === 'checkpoint' && (
                  <div>
                    <Label className="text-slate-300">Checkpoint Interval</Label>
                    <Input
                      type="number"
                      min="1"
                      value={currentStep.config.interval || 5}
                      onChange={(e) => updateStepConfig(currentStep.id, { interval: parseInt(e.target.value) })}
                      className="bg-slate-800 border-slate-700 mt-1"
                    />
                    <p className="text-xs text-slate-500 mt-1">Save checkpoint every N epochs</p>
                  </div>
                )}
              </div>
            ) : (
              <div className="text-center py-8 text-slate-400">
                <Cog className="w-8 h-8 mx-auto mb-2 opacity-50" />
                <p className="text-sm">Select a step to configure</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Pipeline Summary */}
      {steps.length > 0 && (
        <Card className="bg-slate-900 border-slate-800">
          <CardHeader>
            <CardTitle className="text-white text-sm">Pipeline Summary</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2 flex-wrap">
              {steps.map((step, idx) => {
                const stepType = STEP_TYPES[step.type];
                const Icon = stepType?.icon || Cog;
                return (
                  <React.Fragment key={step.id}>
                    <Badge
                      className={`${step.enabled ? stepType?.color : 'bg-slate-700'} text-white`}
                    >
                      <Icon className="w-3 h-3 mr-1" />
                      {step.name}
                    </Badge>
                    {idx < steps.length - 1 && (
                      <ChevronRight className="w-4 h-4 text-slate-600" />
                    )}
                  </React.Fragment>
                );
              })}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
