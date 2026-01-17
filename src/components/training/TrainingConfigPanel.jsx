import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Slider } from '@/components/ui/slider';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Settings,
  Zap,
  Brain,
  Clock,
  DollarSign,
  AlertCircle,
  Info,
  ChevronDown,
  ChevronUp
} from 'lucide-react';
import { TRAINING_TYPES } from '@/hooks/useTraining';

/**
 * Training Configuration Panel Component
 *
 * Provides comprehensive configuration options for training jobs:
 * - Training type selection
 * - Hyperparameter tuning
 * - Advanced options
 * - Presets for common configurations
 */

const PRESETS = {
  quick: {
    name: 'Quick Training',
    description: 'Fast iteration for testing',
    config: {
      epochs: 3,
      batchSize: 64,
      learningRate: 0.01,
      earlyStopping: false,
      checkpointInterval: 3
    }
  },
  balanced: {
    name: 'Balanced',
    description: 'Good balance of speed and quality',
    config: {
      epochs: 10,
      batchSize: 32,
      learningRate: 0.001,
      earlyStopping: true,
      patience: 3,
      checkpointInterval: 5
    }
  },
  thorough: {
    name: 'Thorough Training',
    description: 'Maximum quality, longer training',
    config: {
      epochs: 50,
      batchSize: 16,
      learningRate: 0.0001,
      earlyStopping: true,
      patience: 5,
      checkpointInterval: 10,
      warmupSteps: 200
    }
  },
  fewShot: {
    name: 'Few-Shot Learning',
    description: 'For small datasets (< 100 examples)',
    config: {
      epochs: 5,
      batchSize: 8,
      learningRate: 0.0005,
      trainingType: 'few_shot',
      earlyStopping: true,
      patience: 2
    }
  }
};

const TRAINING_TYPE_INFO = {
  supervised: {
    label: 'Supervised Learning',
    description: 'Train with labeled input-output pairs',
    icon: '📚',
    recommended: 'Best for: Question answering, classification, generation'
  },
  reinforcement: {
    label: 'Reinforcement Learning',
    description: 'Learn from feedback and rewards',
    icon: '🎮',
    recommended: 'Best for: Optimization, decision making'
  },
  transfer: {
    label: 'Transfer Learning',
    description: 'Fine-tune from a pre-trained model',
    icon: '🔄',
    recommended: 'Best for: Domain adaptation, limited data'
  },
  few_shot: {
    label: 'Few-Shot Learning',
    description: 'Learn from minimal examples',
    icon: '✨',
    recommended: 'Best for: Small datasets (< 50 examples)'
  },
  fine_tuning: {
    label: 'Fine-Tuning',
    description: 'Adjust specific behaviors',
    icon: '🎯',
    recommended: 'Best for: Specific task optimization'
  }
};

export default function TrainingConfigPanel({
  config,
  onConfigChange,
  estimatedCost,
  estimatedDuration
}) {
  const [activePreset, setActivePreset] = useState('balanced');
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [configTab, setConfigTab] = useState('basic');

  const updateConfig = (key, value) => {
    onConfigChange?.({ ...config, [key]: value });
  };

  const applyPreset = (presetKey) => {
    const preset = PRESETS[presetKey];
    if (preset) {
      onConfigChange?.({ ...config, ...preset.config });
      setActivePreset(presetKey);
    }
  };

  const currentTypeInfo = TRAINING_TYPE_INFO[config.trainingType] || TRAINING_TYPE_INFO.supervised;

  return (
    <div className="space-y-6">
      {/* Training Type Selection */}
      <Card className="bg-slate-900 border-slate-800">
        <CardHeader>
          <CardTitle className="text-white flex items-center gap-2">
            <Brain className="w-5 h-5 text-purple-400" />
            Training Type
          </CardTitle>
          <CardDescription>
            Select the learning paradigm for your training job
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-3">
            {Object.entries(TRAINING_TYPE_INFO).map(([type, info]) => (
              <button
                key={type}
                onClick={() => updateConfig('trainingType', type)}
                className={`p-4 rounded-lg border text-left transition-all ${config.trainingType === type
                  ? 'bg-purple-600/20 border-purple-500 ring-1 ring-purple-500'
                  : 'bg-slate-950 border-slate-800 hover:border-slate-700'
                  }`}
              >
                <span className="text-2xl mb-2 block">{info.icon}</span>
                <p className="text-sm font-medium text-white">{info.label}</p>
                <p className="text-xs text-slate-400 mt-1">{info.description}</p>
              </button>
            ))}
          </div>

          <div className="mt-4 p-3 bg-blue-500/10 border border-blue-500/30 rounded flex items-start gap-2">
            <Info className="w-4 h-4 text-blue-400 mt-0.5 shrink-0" />
            <p className="text-sm text-blue-300">{currentTypeInfo.recommended}</p>
          </div>
        </CardContent>
      </Card>

      {/* Presets */}
      <Card className="bg-slate-900 border-slate-800">
        <CardHeader>
          <CardTitle className="text-white flex items-center gap-2">
            <Zap className="w-5 h-5 text-yellow-400" />
            Quick Presets
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {Object.entries(PRESETS).map(([key, preset]) => (
              <button
                key={key}
                onClick={() => applyPreset(key)}
                className={`p-3 rounded-lg border text-left transition-all ${activePreset === key
                  ? 'bg-yellow-600/20 border-yellow-500'
                  : 'bg-slate-950 border-slate-800 hover:border-slate-700'
                  }`}
              >
                <p className="text-sm font-medium text-white">{preset.name}</p>
                <p className="text-xs text-slate-400 mt-1">{preset.description}</p>
              </button>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Configuration */}
      <Card className="bg-slate-900 border-slate-800">
        <CardHeader>
          <CardTitle className="text-white flex items-center gap-2">
            <Settings className="w-5 h-5 text-blue-400" />
            Configuration
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Tabs value={configTab} onValueChange={setConfigTab}>
            <TabsList className="grid w-full grid-cols-3 bg-slate-800 mb-6">
              <TabsTrigger value="basic">Basic</TabsTrigger>
              <TabsTrigger value="optimization">Optimization</TabsTrigger>
              <TabsTrigger value="advanced">Advanced</TabsTrigger>
            </TabsList>

            <TabsContent value="basic" className="space-y-6">
              {/* Epochs */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <Label className="text-slate-300">Epochs</Label>
                  <span className="text-sm text-slate-400">{config.epochs}</span>
                </div>
                <Slider
                  value={[config.epochs]}
                  onValueChange={([v]) => updateConfig('epochs', v)}
                  min={1}
                  max={100}
                  step={1}
                  className="w-full"
                />
                <p className="text-xs text-slate-500">Number of complete passes through the training data</p>
              </div>

              {/* Batch Size */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <Label className="text-slate-300">Batch Size</Label>
                  <span className="text-sm text-slate-400">{config.batchSize}</span>
                </div>
                <Slider
                  value={[config.batchSize]}
                  onValueChange={([v]) => updateConfig('batchSize', v)}
                  min={1}
                  max={128}
                  step={1}
                  className="w-full"
                />
                <p className="text-xs text-slate-500">Samples processed before updating the model</p>
              </div>

              {/* Learning Rate */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <Label className="text-slate-300">Learning Rate</Label>
                  <span className="text-sm text-slate-400">{config.learningRate}</span>
                </div>
                <Select
                  value={config.learningRate.toString()}
                  onValueChange={(v) => updateConfig('learningRate', parseFloat(v))}
                >
                  <SelectTrigger className="bg-slate-800 border-slate-700">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-slate-900 border-slate-800">
                    <SelectItem value="0.1">0.1 (Very High)</SelectItem>
                    <SelectItem value="0.01">0.01 (High)</SelectItem>
                    <SelectItem value="0.001">0.001 (Standard)</SelectItem>
                    <SelectItem value="0.0001">0.0001 (Low)</SelectItem>
                    <SelectItem value="0.00001">0.00001 (Very Low)</SelectItem>
                  </SelectContent>
                </Select>
                <p className="text-xs text-slate-500">Controls how much to adjust the model</p>
              </div>

              {/* Validation Split */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <Label className="text-slate-300">Validation Split</Label>
                  <span className="text-sm text-slate-400">{Math.round(config.validationSplit * 100)}%</span>
                </div>
                <Slider
                  value={[config.validationSplit * 100]}
                  onValueChange={([v]) => updateConfig('validationSplit', v / 100)}
                  min={10}
                  max={40}
                  step={5}
                  className="w-full"
                />
              </div>
            </TabsContent>

            <TabsContent value="optimization" className="space-y-6">
              {/* Optimizer */}
              <div className="space-y-2">
                <Label className="text-slate-300">Optimizer</Label>
                <Select
                  value={config.optimizer || 'adam'}
                  onValueChange={(v) => updateConfig('optimizer', v)}
                >
                  <SelectTrigger className="bg-slate-800 border-slate-700">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-slate-900 border-slate-800">
                    <SelectItem value="adam">Adam (Recommended)</SelectItem>
                    <SelectItem value="adamw">AdamW</SelectItem>
                    <SelectItem value="sgd">SGD</SelectItem>
                    <SelectItem value="rmsprop">RMSprop</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Learning Rate Scheduler */}
              <div className="space-y-2">
                <Label className="text-slate-300">Learning Rate Scheduler</Label>
                <Select
                  value={config.schedulerType || 'linear'}
                  onValueChange={(v) => updateConfig('schedulerType', v)}
                >
                  <SelectTrigger className="bg-slate-800 border-slate-700">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-slate-900 border-slate-800">
                    <SelectItem value="constant">Constant</SelectItem>
                    <SelectItem value="linear">Linear Decay</SelectItem>
                    <SelectItem value="cosine">Cosine Annealing</SelectItem>
                    <SelectItem value="polynomial">Polynomial Decay</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Early Stopping */}
              <div className="flex items-center justify-between p-3 bg-slate-950 rounded">
                <div>
                  <p className="text-sm font-medium text-white">Early Stopping</p>
                  <p className="text-xs text-slate-400">Stop training if validation loss stops improving</p>
                </div>
                <Switch
                  checked={config.earlyStopping}
                  onCheckedChange={(v) => updateConfig('earlyStopping', v)}
                />
              </div>

              {config.earlyStopping && (
                <div className="space-y-3 ml-4">
                  <div className="flex items-center justify-between">
                    <Label className="text-slate-300">Patience</Label>
                    <span className="text-sm text-slate-400">{config.patience} epochs</span>
                  </div>
                  <Slider
                    value={[config.patience || 3]}
                    onValueChange={([v]) => updateConfig('patience', v)}
                    min={1}
                    max={10}
                    step={1}
                    className="w-full"
                  />
                </div>
              )}

              {/* Warmup Steps */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <Label className="text-slate-300">Warmup Steps</Label>
                  <span className="text-sm text-slate-400">{config.warmupSteps || 0}</span>
                </div>
                <Slider
                  value={[config.warmupSteps || 0]}
                  onValueChange={([v]) => updateConfig('warmupSteps', v)}
                  min={0}
                  max={500}
                  step={10}
                  className="w-full"
                />
              </div>
            </TabsContent>

            <TabsContent value="advanced" className="space-y-6">
              {/* Checkpoint Interval */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <Label className="text-slate-300">Checkpoint Interval</Label>
                  <span className="text-sm text-slate-400">Every {config.checkpointInterval || 5} epochs</span>
                </div>
                <Slider
                  value={[config.checkpointInterval || 5]}
                  onValueChange={([v]) => updateConfig('checkpointInterval', v)}
                  min={1}
                  max={20}
                  step={1}
                  className="w-full"
                />
              </div>

              {/* Max Gradient Norm */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <Label className="text-slate-300">Max Gradient Norm</Label>
                  <span className="text-sm text-slate-400">{config.maxGradNorm || 1.0}</span>
                </div>
                <Slider
                  value={[(config.maxGradNorm || 1.0) * 10]}
                  onValueChange={([v]) => updateConfig('maxGradNorm', v / 10)}
                  min={1}
                  max={50}
                  step={1}
                  className="w-full"
                />
              </div>

              {/* Mixed Precision */}
              <div className="flex items-center justify-between p-3 bg-slate-950 rounded">
                <div>
                  <p className="text-sm font-medium text-white">Mixed Precision Training</p>
                  <p className="text-xs text-slate-400">Use FP16 for faster training (if supported)</p>
                </div>
                <Switch
                  checked={config.mixedPrecision || false}
                  onCheckedChange={(v) => updateConfig('mixedPrecision', v)}
                />
              </div>

              {/* Data Augmentation */}
              <div className="flex items-center justify-between p-3 bg-slate-950 rounded">
                <div>
                  <p className="text-sm font-medium text-white">Data Augmentation</p>
                  <p className="text-xs text-slate-400">Generate variations of training examples</p>
                </div>
                <Switch
                  checked={config.useDataAugmentation || false}
                  onCheckedChange={(v) => updateConfig('useDataAugmentation', v)}
                />
              </div>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>

      {/* Estimates */}
      <Card className="bg-slate-900 border-slate-800">
        <CardHeader>
          <CardTitle className="text-white">Estimates</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 gap-4">
            <div className="p-4 bg-slate-950 rounded-lg">
              <div className="flex items-center gap-2 text-slate-400 mb-2">
                <Clock className="w-4 h-4" />
                <span className="text-sm">Estimated Duration</span>
              </div>
              <p className="text-2xl font-bold text-white">
                {estimatedDuration ? `${Math.round(estimatedDuration / 60000)} min` : '~10 min'}
              </p>
            </div>
            <div className="p-4 bg-slate-950 rounded-lg">
              <div className="flex items-center gap-2 text-slate-400 mb-2">
                <DollarSign className="w-4 h-4" />
                <span className="text-sm">Estimated Cost</span>
              </div>
              <p className="text-2xl font-bold text-white">
                ${estimatedCost ? estimatedCost.toFixed(4) : '0.05'}
              </p>
            </div>
          </div>

          <div className="mt-4 p-3 bg-yellow-500/10 border border-yellow-500/30 rounded flex items-start gap-2">
            <AlertCircle className="w-4 h-4 text-yellow-400 mt-0.5 shrink-0" />
            <p className="text-xs text-yellow-300">
              Estimates are approximate and may vary based on data complexity and system load.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
