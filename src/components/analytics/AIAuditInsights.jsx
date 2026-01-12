import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Shield, Loader2, AlertTriangle, CheckCircle, XCircle } from 'lucide-react';
import { WorkflowAudit } from '@/entities/all';
import { base44 } from '@/api/base44Client';
import { toast } from 'sonner';
import { format, parseISO } from 'date-fns';

export default function AIAuditInsights({ runs, workflows }) {
  const [audits, setAudits] = useState([]);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadAudits();
  }, []);

  const loadAudits = async () => {
    try {
      const data = await WorkflowAudit.filter({ status: 'open' }, '-created_date', 20);
      setAudits(data);
    } catch (error) {
      console.error('Failed to load audits:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const runAIAudit = async () => {
    setIsAnalyzing(true);
    try {
      const user = await base44.auth.me();
      
      const recentRuns = runs.slice(0, 50);
      const runSummary = recentRuns.map(r => ({
        workflow_id: r.workflow_id,
        workflow_name: workflows.find(w => w.id === r.workflow_id)?.name || 'Unknown',
        state: r.state,
        cost_cents: r.cost_cents,
        tokens_in: r.tokens_in,
        tokens_out: r.tokens_out,
        started_at: r.started_at,
        finished_at: r.finished_at
      }));

      const result = await base44.integrations.Core.InvokeLLM({
        prompt: `You are a security and compliance auditor for AI workflows. Analyze these workflow runs and identify:

1. SECURITY VULNERABILITIES: Potential data leaks, insecure operations, unauthorized access patterns
2. COMPLIANCE RISKS: PII handling issues, data retention concerns, regulatory violations
3. PERFORMANCE ANTI-PATTERNS: Resource waste, inefficient operations, cost optimization opportunities

Workflow Runs Data:
${JSON.stringify(runSummary, null, 2)}

For each finding, provide:
- Audit type (security/compliance/performance)
- Severity (critical/high/medium/low)
- Clear finding description
- Risk score 0-100
- Actionable recommendations
- Supporting evidence

Return findings as JSON array:`,
        response_json_schema: {
          type: 'object',
          properties: {
            findings: {
              type: 'array',
              items: {
                type: 'object',
                properties: {
                  workflow_id: { type: 'string' },
                  run_id: { type: 'string' },
                  audit_type: { type: 'string', enum: ['security', 'compliance', 'performance'] },
                  severity: { type: 'string', enum: ['critical', 'high', 'medium', 'low'] },
                  finding: { type: 'string' },
                  risk_score: { type: 'integer' },
                  recommendations: { type: 'array', items: { type: 'string' } },
                  evidence: { type: 'object' }
                }
              }
            }
          }
        }
      });

      const creates = result.findings.map(finding =>
        WorkflowAudit.create({
          ...finding,
          status: 'open',
          org_id: user.organization.id
        })
      );

      await Promise.all(creates);
      toast.success(`${result.findings.length} audit findings identified`);
      loadAudits();
    } catch (error) {
      console.error('AI audit failed:', error);
      toast.error('Failed to complete audit analysis');
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleResolve = async (auditId) => {
    try {
      const user = await base44.auth.me();
      await WorkflowAudit.update(auditId, {
        status: 'resolved',
        resolved_by: user.email,
        resolved_at: new Date().toISOString()
      });
      toast.success('Finding resolved');
      loadAudits();
    } catch (error) {
      console.error('Failed to resolve audit:', error);
      toast.error('Failed to resolve finding');
    }
  };

  const handleDismiss = async (auditId) => {
    try {
      await WorkflowAudit.update(auditId, { status: 'dismissed' });
      toast.success('Finding dismissed');
      loadAudits();
    } catch (error) {
      console.error('Failed to dismiss audit:', error);
      toast.error('Failed to dismiss finding');
    }
  };

  const severityColors = {
    critical: 'bg-red-500/20 text-red-400 border-red-500/30',
    high: 'bg-orange-500/20 text-orange-400 border-orange-500/30',
    medium: 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30',
    low: 'bg-blue-500/20 text-blue-400 border-blue-500/30'
  };

  const typeColors = {
    security: 'bg-red-500/20 text-red-400',
    compliance: 'bg-purple-500/20 text-purple-400',
    performance: 'bg-green-500/20 text-green-400'
  };

  const criticalCount = audits.filter(a => a.severity === 'critical').length;

  return (
    <Card className="bg-slate-900 border-slate-800">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="text-white flex items-center gap-2">
            <Shield className="w-5 h-5 text-blue-400" />
            AI Security & Compliance Audit
          </CardTitle>
          <Button
            onClick={runAIAudit}
            disabled={isAnalyzing}
            className="bg-blue-600 hover:bg-blue-700"
          >
            {isAnalyzing ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Analyzing...
              </>
            ) : (
              'Run Audit'
            )}
          </Button>
        </div>
        {criticalCount > 0 && (
          <div className="flex items-center gap-2 mt-2 p-2 bg-red-500/10 rounded border border-red-500/30">
            <AlertTriangle className="w-4 h-4 text-red-400" />
            <span className="text-sm text-red-400">{criticalCount} critical findings require attention</span>
          </div>
        )}
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="text-center py-8 text-slate-400">Loading audits...</div>
        ) : audits.length === 0 ? (
          <div className="text-center py-8 text-slate-400">
            No open audit findings. Run an AI audit to analyze your workflows.
          </div>
        ) : (
          <div className="space-y-3 max-h-[500px] overflow-y-auto">
            {audits.map(audit => {
              const workflow = workflows.find(w => w.id === audit.workflow_id);
              return (
                <div key={audit.id} className="p-4 bg-slate-950 rounded-lg border border-slate-800">
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <Badge variant="outline" className={severityColors[audit.severity]}>
                        {audit.severity}
                      </Badge>
                      <Badge variant="outline" className={typeColors[audit.audit_type]}>
                        {audit.audit_type}
                      </Badge>
                      {audit.risk_score && (
                        <Badge variant="outline" className="bg-slate-800 text-slate-400">
                          Risk: {audit.risk_score}
                        </Badge>
                      )}
                    </div>
                  </div>

                  <div className="text-sm font-medium text-white mb-1">
                    {workflow?.name || 'Unknown Workflow'}
                  </div>
                  <p className="text-sm text-slate-300 mb-3">{audit.finding}</p>

                  {audit.recommendations && audit.recommendations.length > 0 && (
                    <div className="mb-3">
                      <div className="text-xs text-slate-400 mb-1">Recommendations:</div>
                      <ul className="space-y-1">
                        {audit.recommendations.map((rec, idx) => (
                          <li key={idx} className="text-xs text-slate-400 pl-4">• {rec}</li>
                        ))}
                      </ul>
                    </div>
                  )}

                  <div className="flex items-center justify-between pt-3 border-t border-slate-800">
                    <span className="text-xs text-slate-500">
                      {format(parseISO(audit.created_date), 'MMM d, HH:mm')}
                    </span>
                    <div className="flex gap-2">
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => handleDismiss(audit.id)}
                        className="text-slate-400 hover:text-white"
                      >
                        <XCircle className="w-3 h-3 mr-1" />
                        Dismiss
                      </Button>
                      <Button
                        size="sm"
                        onClick={() => handleResolve(audit.id)}
                        className="bg-green-600 hover:bg-green-700"
                      >
                        <CheckCircle className="w-3 h-3 mr-1" />
                        Resolve
                      </Button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </CardContent>
    </Card>
  );
}