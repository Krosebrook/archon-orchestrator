import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { CheckCircle2, XCircle, Clock, Loader2, Shield, AlertCircle, GitBranch, ArrowRight } from 'lucide-react';
import { cn } from '@/lib/utils';
import { motion } from 'framer-motion';

const STATUS_CONFIG = {
  pending: { 
    icon: Clock, 
    color: 'text-slate-400',
    bg: 'bg-slate-500/10',
    border: 'border-slate-500/30',
    badge: 'bg-slate-500/20 text-slate-400 border-slate-500/30',
    glow: 'shadow-slate-500/0'
  },
  running: { 
    icon: Loader2, 
    color: 'text-blue-400',
    bg: 'bg-blue-500/10',
    border: 'border-blue-500/50',
    badge: 'bg-blue-500/20 text-blue-400 border-blue-500/30',
    animate: 'animate-spin',
    glow: 'shadow-blue-500/50 shadow-lg',
    pulse: true
  },
  success: { 
    icon: CheckCircle2, 
    color: 'text-green-400',
    bg: 'bg-green-500/10',
    border: 'border-green-500/30',
    badge: 'bg-green-500/20 text-green-400 border-green-500/30',
    glow: 'shadow-green-500/30 shadow-md'
  },
  passed: { 
    icon: CheckCircle2, 
    color: 'text-green-400',
    bg: 'bg-green-500/10',
    border: 'border-green-500/30',
    badge: 'bg-green-500/20 text-green-400 border-green-500/30',
    glow: 'shadow-green-500/30 shadow-md'
  },
  failed: { 
    icon: XCircle, 
    color: 'text-red-400',
    bg: 'bg-red-500/10',
    border: 'border-red-500/50',
    badge: 'bg-red-500/20 text-red-400 border-red-500/30',
    glow: 'shadow-red-500/50 shadow-lg',
    pulse: true
  },
  bypassed: { 
    icon: AlertCircle, 
    color: 'text-yellow-400',
    bg: 'bg-yellow-500/10',
    border: 'border-yellow-500/30',
    badge: 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30',
    glow: 'shadow-yellow-500/30 shadow-md'
  }
};

const GATE_TYPE_ICONS = {
  approval: Shield,
  test: CheckCircle2,
  security: Shield,
  performance: GitBranch,
  policy: AlertCircle
};

export default function PipelineFlow({ stages = [], gates = [] }) {
  const hasStages = stages && stages.length > 0;

  return (
    <Card className="bg-slate-900 border-slate-800">
      <CardHeader>
        <CardTitle className="text-white flex items-center gap-2">
          <GitBranch className="w-5 h-5 text-purple-400" />
          Pipeline Flow
        </CardTitle>
      </CardHeader>
      <CardContent className="p-6">
        {!hasStages ? (
          <div className="text-center py-12 text-slate-400">
            <GitBranch className="w-12 h-12 mx-auto mb-3 text-slate-600" />
            No pipeline stages available
          </div>
        ) : (
          <div className="relative">
            {/* Main Flow Line */}
            <div className="absolute top-12 left-0 right-0 h-0.5 bg-gradient-to-r from-slate-700 via-slate-600 to-slate-700" />
            
            {/* Stages & Gates DAG */}
            <div className="relative flex justify-between items-start gap-4">
              {stages.map((stage, idx) => {
                const config = STATUS_CONFIG[stage.status] || STATUS_CONFIG.pending;
                const Icon = config.icon;
                const stageGates = gates.filter(g => 
                  g.criteria?.stage === stage.name || 
                  g.name?.toLowerCase().includes(stage.name?.toLowerCase())
                );
                const hasFailedGates = stageGates.some(g => g.status === 'failed');
                const hasPendingGates = stageGates.some(g => g.status === 'pending' && g.gate_type === 'approval');
                
                return (
                  <div key={idx} className="flex flex-col items-center gap-3 z-10 flex-1">
                    {/* Stage Node */}
                    <motion.div
                      initial={{ scale: 0.8, opacity: 0 }}
                      animate={{ scale: 1, opacity: 1 }}
                      transition={{ delay: idx * 0.1 }}
                      className="relative"
                    >
                      <div className={cn(
                        'w-20 h-20 rounded-full border-2 flex items-center justify-center transition-all duration-300 relative',
                        config.bg,
                        config.border,
                        config.glow,
                        config.pulse && 'animate-pulse'
                      )}>
                        <Icon className={cn('w-9 h-9', config.color, config.animate)} />
                        
                        {/* Status Indicators */}
                        {hasFailedGates && (
                          <div className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 rounded-full border-2 border-slate-900 flex items-center justify-center">
                            <XCircle className="w-3 h-3 text-white" />
                          </div>
                        )}
                        {hasPendingGates && !hasFailedGates && (
                          <div className="absolute -top-1 -right-1 w-5 h-5 bg-yellow-500 rounded-full border-2 border-slate-900 flex items-center justify-center animate-pulse">
                            <Clock className="w-3 h-3 text-white" />
                          </div>
                        )}
                      </div>
                    </motion.div>
                    
                    {/* Stage Info */}
                    <div className="text-center">
                      <div className="text-sm font-medium text-white capitalize mb-1">
                        {stage.name}
                      </div>
                      <Badge variant="outline" className={cn('text-xs', config.badge)}>
                        {stage.status}
                      </Badge>
                    </div>
                    
                    {/* Quality Gates */}
                    {stageGates.length > 0 && (
                      <motion.div 
                        initial={{ opacity: 0, y: -10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: idx * 0.1 + 0.2 }}
                        className="flex flex-col gap-2 w-full"
                      >
                        {stageGates.map((gate, gIdx) => {
                          const gateConfig = STATUS_CONFIG[gate.status] || STATUS_CONFIG.pending;
                          const GateIcon = gateConfig.icon;
                          const GateTypeIcon = GATE_TYPE_ICONS[gate.gate_type] || Shield;
                          
                          return (
                            <motion.div
                              key={gIdx}
                              initial={{ scale: 0.9, opacity: 0 }}
                              animate={{ scale: 1, opacity: 1 }}
                              transition={{ delay: idx * 0.1 + 0.3 + gIdx * 0.05 }}
                              className={cn(
                                'relative flex items-center gap-2 px-3 py-2 rounded-lg border transition-all duration-300',
                                gateConfig.bg,
                                gateConfig.border,
                                gateConfig.pulse && 'animate-pulse',
                                'hover:scale-105'
                              )}
                            >
                              <GateTypeIcon className={cn('w-4 h-4 flex-shrink-0', gateConfig.color)} />
                              <div className="flex-1 min-w-0">
                                <div className="text-xs font-medium text-white truncate">
                                  {gate.name}
                                </div>
                                <div className="text-xs text-slate-400 capitalize">
                                  {gate.gate_type}
                                </div>
                              </div>
                              <GateIcon className={cn('w-4 h-4 flex-shrink-0', gateConfig.color, gateConfig.animate)} />
                              
                              {/* Approval Required Indicator */}
                              {gate.status === 'pending' && gate.gate_type === 'approval' && (
                                <div className="absolute -top-2 -right-2 w-4 h-4 bg-yellow-500 rounded-full border-2 border-slate-900 animate-pulse" />
                              )}
                            </motion.div>
                          );
                        })}
                      </motion.div>
                    )}
                    
                    {/* Connector Arrow */}
                    {idx < stages.length - 1 && (
                      <div className="absolute top-12 left-1/2 transform translate-x-1/2">
                        <ArrowRight className={cn(
                          'w-6 h-6 transition-colors duration-300',
                          stage.status === 'success' ? 'text-green-400' : 
                          stage.status === 'running' ? 'text-blue-400' : 
                          'text-slate-600'
                        )} />
                      </div>
                    )}
                  </div>
                );
              })}
            </div>

            {/* Pipeline Summary */}
            <div className="mt-8 pt-6 border-t border-slate-800">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="p-3 bg-slate-950 rounded-lg border border-slate-800">
                  <div className="text-xs text-slate-400 mb-1">Total Stages</div>
                  <div className="text-lg font-bold text-white">{stages.length}</div>
                </div>
                <div className="p-3 bg-slate-950 rounded-lg border border-slate-800">
                  <div className="text-xs text-slate-400 mb-1">Completed</div>
                  <div className="text-lg font-bold text-green-400">
                    {stages.filter(s => s.status === 'success').length}
                  </div>
                </div>
                <div className="p-3 bg-slate-950 rounded-lg border border-slate-800">
                  <div className="text-xs text-slate-400 mb-1">Active Gates</div>
                  <div className="text-lg font-bold text-blue-400">{gates.length}</div>
                </div>
                <div className="p-3 bg-slate-950 rounded-lg border border-slate-800">
                  <div className="text-xs text-slate-400 mb-1">Blocked</div>
                  <div className="text-lg font-bold text-red-400">
                    {gates.filter(g => g.status === 'failed').length}
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}