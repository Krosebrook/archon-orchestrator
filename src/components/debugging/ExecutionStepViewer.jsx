/**
 * @fileoverview Execution Step Detailed Viewer
 * @description Granular view of individual execution step with token breakdown,
 * API call details, intermediate reasoning, and evidence trails.
 * 
 * @module debugging/ExecutionStepViewer
 * @version 1.0.0
 */

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { 
  Brain, Zap, Clock, 
  DollarSign 
} from 'lucide-react';

export default function ExecutionStepViewer({ step, totalTokens, totalCost }) {
  if (!step) return null;

  const tokenPercentage = totalTokens > 0 
    ? ((step.tokens.input + step.tokens.output) / totalTokens) * 100 
    : 0;

  const costPercentage = totalCost > 0 
    ? (step.cost / totalCost) * 100 
    : 0;

  return (
    <div className="space-y-4">
      {/* Token Breakdown */}
      <Card className="bg-slate-950 border-slate-800">
        <CardHeader className="pb-3">
          <CardTitle className="text-sm text-white flex items-center gap-2">
            <Zap className="w-4 h-4 text-yellow-400" />
            Token Usage
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <div className="p-3 bg-slate-900 rounded border border-slate-800">
              <div className="text-xs text-slate-400 mb-1">Input Tokens</div>
              <div className="text-lg font-bold text-white">
                {step.tokens.input.toLocaleString()}
              </div>
            </div>
            <div className="p-3 bg-slate-900 rounded border border-slate-800">
              <div className="text-xs text-slate-400 mb-1">Output Tokens</div>
              <div className="text-lg font-bold text-white">
                {step.tokens.output.toLocaleString()}
              </div>
            </div>
          </div>
          
          <div>
            <div className="flex items-center justify-between text-xs mb-1">
              <span className="text-slate-400">% of Total</span>
              <span className="text-slate-300">{tokenPercentage.toFixed(1)}%</span>
            </div>
            <Progress value={tokenPercentage} className="h-1" />
          </div>

          <div className="flex items-center justify-between p-2 bg-amber-500/10 rounded border border-amber-500/30">
            <span className="text-xs text-amber-400">Total Tokens</span>
            <span className="text-sm font-semibold text-white">
              {(step.tokens.input + step.tokens.output).toLocaleString()}
            </span>
          </div>
        </CardContent>
      </Card>

      {/* Cost Breakdown */}
      <Card className="bg-slate-950 border-slate-800">
        <CardHeader className="pb-3">
          <CardTitle className="text-sm text-white flex items-center gap-2">
            <DollarSign className="w-4 h-4 text-green-400" />
            Cost Analysis
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="p-3 bg-slate-900 rounded border border-slate-800">
            <div className="text-xs text-slate-400 mb-1">Step Cost</div>
            <div className="text-2xl font-bold text-white">
              ${(step.cost / 100).toFixed(4)}
            </div>
          </div>

          <div>
            <div className="flex items-center justify-between text-xs mb-1">
              <span className="text-slate-400">% of Total Cost</span>
              <span className="text-slate-300">{costPercentage.toFixed(1)}%</span>
            </div>
            <Progress value={costPercentage} className="h-1" />
          </div>

          <div className="p-2 bg-green-500/10 rounded border border-green-500/30 text-xs">
            <div className="flex items-center justify-between">
              <span className="text-green-400">Est. Cost per 1K runs</span>
              <span className="text-white font-semibold">
                ${((step.cost * 1000) / 100).toFixed(2)}
              </span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Performance */}
      <Card className="bg-slate-950 border-slate-800">
        <CardHeader className="pb-3">
          <CardTitle className="text-sm text-white flex items-center gap-2">
            <Clock className="w-4 h-4 text-blue-400" />
            Performance
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          <div className="flex items-center justify-between p-2 bg-slate-900 rounded">
            <span className="text-xs text-slate-400">Latency</span>
            <span className="text-sm font-semibold text-white">{step.latency}ms</span>
          </div>
          
          {step.latency > 1000 && (
            <div className="p-2 bg-orange-500/10 rounded border border-orange-500/30 text-xs text-orange-400">
              ⚠ High latency - consider optimization
            </div>
          )}
        </CardContent>
      </Card>

      {/* Reasoning Trace */}
      {step.thoughts && step.thoughts.length > 0 && (
        <Card className="bg-slate-950 border-slate-800">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm text-white flex items-center gap-2">
              <Brain className="w-4 h-4 text-purple-400" />
              Reasoning Trace
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {step.thoughts.map((thought, idx) => (
              <div key={idx} className="p-2 bg-slate-900 rounded border border-slate-800 text-xs text-slate-300">
                {thought}
              </div>
            ))}
          </CardContent>
        </Card>
      )}
    </div>
  );
}