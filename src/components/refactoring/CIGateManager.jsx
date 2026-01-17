import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Shield, CheckCircle2, XCircle, Clock, Users, Loader2 } from 'lucide-react';
import { base44 } from '@/api/base44Client';
import { toast } from 'sonner';
import { format } from 'date-fns';

const GATE_ICONS = {
  approval: Users,
  test: CheckCircle2,
  security: Shield,
  performance: Clock,
  policy: Shield
};

const GATE_STATUS_CONFIG = {
  pending: { 
    badge: 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30',
    icon: Clock
  },
  running: {
    badge: 'bg-blue-500/20 text-blue-400 border-blue-500/30',
    icon: Loader2,
    animate: 'animate-spin'
  },
  passed: { 
    badge: 'bg-green-500/20 text-green-400 border-green-500/30',
    icon: CheckCircle2
  },
  failed: { 
    badge: 'bg-red-500/20 text-red-400 border-red-500/30',
    icon: XCircle
  },
  bypassed: { 
    badge: 'bg-slate-500/20 text-slate-400 border-slate-500/30',
    icon: Shield
  }
};

export default function CIGateManager({ pipelineId, gates: propGates, onGateUpdate }) {
  const [gates, setGates] = useState(propGates || []);
  const [isLoading, setIsLoading] = useState(!propGates);

  useEffect(() => {
    if (propGates) {
      setGates(propGates);
    } else if (pipelineId) {
      loadGates();
    }
  }, [pipelineId, propGates]);

  const loadGates = async () => {
    setIsLoading(true);
    try {
      const data = await base44.entities.CIGate.filter({ pipeline_id: pipelineId });
      setGates(data);
    } catch (error) {
      console.error('Failed to load gates:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const approveGate = async (gate, decision) => {
    try {
      const user = await base44.auth.me();
      const newApproval = {
        user: user.email,
        decision,
        comment: '',
        timestamp: new Date().toISOString()
      };

      const updatedApprovals = [...(gate.approvals || []), newApproval];
      const allApproved = gate.required_approvers?.every(approver =>
        updatedApprovals.some(a => a.user === approver && a.decision === 'approve')
      );

      await base44.entities.CIGate.update(gate.id, {
        approvals: updatedApprovals,
        status: decision === 'reject' ? 'failed' : (allApproved ? 'passed' : 'pending')
      });

      toast.success(`Gate ${decision === 'approve' ? 'approved' : 'rejected'}`);
      onGateUpdate?.();
      loadGates();
    } catch (error) {
      console.error('Failed to update gate:', error);
      toast.error('Failed to update gate');
    }
  };

  if (isLoading) {
    return (
      <Card className="bg-slate-900 border-slate-800">
        <CardContent className="p-8 text-center">
          <Loader2 className="w-8 h-8 animate-spin mx-auto text-slate-400" />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="bg-slate-900 border-slate-800">
      <CardHeader>
        <CardTitle className="text-white flex items-center gap-2">
          <Shield className="w-5 h-5" />
          Quality Gates
          <Badge variant="outline" className="ml-auto bg-slate-800 border-slate-700">
            {gates.length} gates
          </Badge>
        </CardTitle>
      </CardHeader>
      <CardContent>
        {gates.length === 0 ? (
          <div className="text-center py-8 text-slate-400">
            No gates configured for this pipeline
          </div>
        ) : (
          <div className="space-y-3">
            {gates.map((gate) => {
              const Icon = GATE_ICONS[gate.gate_type] || Shield;
              const statusConfig = GATE_STATUS_CONFIG[gate.status] || GATE_STATUS_CONFIG.pending;
              const StatusIcon = statusConfig.icon;

              return (
                <div key={gate.id} className="p-4 bg-slate-950 rounded-lg border border-slate-800 transition-all hover:border-slate-700">
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex items-center gap-3">
                      <div className="p-2 rounded-lg bg-slate-800">
                        <Icon className="w-4 h-4 text-slate-400" />
                      </div>
                      <div>
                        <div className="flex items-center gap-2 mb-1">
                          <span className="text-white font-medium">{gate.name}</span>
                          <Badge variant="outline" className={statusConfig.badge}>
                            <StatusIcon className={`w-3 h-3 mr-1 ${statusConfig.animate || ''}`} />
                            {gate.status}
                          </Badge>
                        </div>
                        <div className="text-xs text-slate-400 capitalize">{gate.gate_type} gate</div>
                      </div>
                    </div>
                  </div>

                  {gate.required_approvers && gate.required_approvers.length > 0 && (
                    <div className="mb-3">
                      <div className="text-xs text-slate-500 mb-1">Required Approvers:</div>
                      <div className="flex flex-wrap gap-1">
                        {gate.required_approvers.map((approver, idx) => {
                          const hasApproved = gate.approvals?.some(
                            a => a.user === approver && a.decision === 'approve'
                          );
                          return (
                            <Badge
                              key={idx}
                              variant="outline"
                              className={hasApproved 
                                ? 'bg-green-500/20 text-green-400 border-green-500/30' 
                                : 'bg-slate-800 border-slate-700'
                              }
                            >
                              {hasApproved && <CheckCircle2 className="w-3 h-3 mr-1" />}
                              {approver}
                            </Badge>
                          );
                        })}
                      </div>
                    </div>
                  )}

                  {gate.status === 'pending' && gate.gate_type === 'approval' && (
                    <div className="flex gap-2">
                      <Button
                        size="sm"
                        onClick={() => approveGate(gate, 'approve')}
                        className="bg-green-600 hover:bg-green-700"
                      >
                        <CheckCircle2 className="w-3 h-3 mr-1" />
                        Approve
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => approveGate(gate, 'reject')}
                        className="border-red-700 text-red-400 hover:bg-red-900/20"
                      >
                        <XCircle className="w-3 h-3 mr-1" />
                        Reject
                      </Button>
                    </div>
                  )}

                  {gate.approvals && gate.approvals.length > 0 && (
                    <div className="mt-3 pt-3 border-t border-slate-800">
                      <div className="text-xs text-slate-500 mb-2">Approval History:</div>
                      <div className="space-y-1">
                        {gate.approvals.map((approval, idx) => (
                          <div key={idx} className="text-xs text-slate-400 flex items-center gap-2">
                            {approval.decision === 'approve' ? (
                              <CheckCircle2 className="w-3 h-3 text-green-400" />
                            ) : (
                              <XCircle className="w-3 h-3 text-red-400" />
                            )}
                            <span>{approval.user}</span>
                            <span className="text-slate-600">•</span>
                            <span>{format(new Date(approval.timestamp), 'MMM d, h:mm a')}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </CardContent>
    </Card>
  );
}