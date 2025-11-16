import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { CheckCircle2, XCircle, Clock, Loader2, Shield, AlertCircle } from 'lucide-react';
import { cn } from '@/lib/utils';

const STATUS_CONFIG = {
  pending: { 
    icon: Clock, 
    color: 'text-slate-400 bg-slate-500/10',
    border: 'border-slate-500/30',
    badge: 'bg-slate-500/20 text-slate-400 border-slate-500/30'
  },
  running: { 
    icon: Loader2, 
    color: 'text-blue-400 bg-blue-500/10',
    border: 'border-blue-500/30',
    badge: 'bg-blue-500/20 text-blue-400 border-blue-500/30',
    animate: 'animate-spin'
  },
  passed: { 
    icon: CheckCircle2, 
    color: 'text-green-400 bg-green-500/10',
    border: 'border-green-500/30',
    badge: 'bg-green-500/20 text-green-400 border-green-500/30'
  },
  failed: { 
    icon: XCircle, 
    color: 'text-red-400 bg-red-500/10',
    border: 'border-red-500/30',
    badge: 'bg-red-500/20 text-red-400 border-red-500/30'
  },
  bypassed: { 
    icon: AlertCircle, 
    color: 'text-yellow-400 bg-yellow-500/10',
    border: 'border-yellow-500/30',
    badge: 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30'
  }
};

export default function PipelineFlow({ stages, gates }) {
  return (
    <Card className="bg-slate-900 border-slate-800">
      <CardContent className="p-6">
        <div className="relative">
          {/* Connector Line */}
          <div className="absolute top-8 left-8 right-8 h-0.5 bg-slate-700" />
          
          {/* Stages */}
          <div className="relative flex justify-between items-start">
            {stages?.map((stage, idx) => {
              const config = STATUS_CONFIG[stage.status] || STATUS_CONFIG.pending;
              const Icon = config.icon;
              const stageGates = gates?.filter(g => g.criteria?.stage === stage.name) || [];
              
              return (
                <div key={idx} className="flex flex-col items-center gap-2 z-10">
                  {/* Stage Icon */}
                  <div className={cn(
                    'w-16 h-16 rounded-full border-2 flex items-center justify-center transition-all duration-300',
                    config.color,
                    config.border
                  )}>
                    <Icon className={cn('w-8 h-8', config.animate)} />
                  </div>
                  
                  {/* Stage Name */}
                  <div className="text-center">
                    <div className="text-sm font-medium text-white capitalize">{stage.name}</div>
                    <Badge variant="outline" className={cn('mt-1', config.badge)}>
                      {stage.status}
                    </Badge>
                  </div>
                  
                  {/* Gates for this stage */}
                  {stageGates.length > 0 && (
                    <div className="mt-2 flex flex-col gap-1">
                      {stageGates.map((gate, gIdx) => {
                        const gateConfig = STATUS_CONFIG[gate.status] || STATUS_CONFIG.pending;
                        const GateIcon = gateConfig.icon;
                        
                        return (
                          <div
                            key={gIdx}
                            className={cn(
                              'flex items-center gap-2 px-2 py-1 rounded border text-xs',
                              gateConfig.color,
                              gateConfig.border
                            )}
                          >
                            <Shield className="w-3 h-3" />
                            <span className="text-white">{gate.gate_type}</span>
                            <GateIcon className={cn('w-3 h-3 ml-auto', gateConfig.animate)} />
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}