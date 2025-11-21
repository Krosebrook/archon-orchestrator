import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { FileSearch, Loader2, AlertCircle, CheckCircle, TrendingUp } from 'lucide-react';
import { base44 } from '@/api/base44Client';
import { toast } from 'sonner';
import { format } from 'date-fns';
import { handleError } from '../utils/api-client';

export default function LogAnalyzer({ agents, runs, metrics, onRefresh }) {
  const [selectedRun, setSelectedRun] = useState('');
  const [analysis, setAnalysis] = useState(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);

  const analyzeRun = async () => {
    if (!selectedRun) {
      toast.error('Please select a run to analyze');
      return;
    }

    setIsAnalyzing(true);
    try {
      const user = await base44.auth.me();
      const run = runs.find(r => r.id === selectedRun);
      if (!run) {
        toast.error('Run not found');
        return;
      }
      const agent = agents.find(a => a.id === run.agent_id);
      const runMetrics = metrics.filter(m => m.run_id === selectedRun);

      const logContext = {
        run_id: run.id,
        agent_name: agent?.name,
        status: run.status,
        error_message: run.error_message,
        started_at: run.started_at,
        finished_at: run.finished_at,
        duration: run.duration_ms,
        metrics: runMetrics.map(m => ({
          timestamp: m.timestamp,
          status: m.status,
          error_code: m.error_code,
          latency: m.latency_ms,
          cost: m.cost_cents
        }))
      };

      const result = await base44.integrations.Core.InvokeLLM({
        prompt: `You are an expert debugging assistant. Analyze this failed agent run and provide root cause analysis:

${JSON.stringify(logContext, null, 2)}

Provide:
1. **Root Cause**: The most likely reason for failure
2. **Error Category**: Categorize the error (config, network, timeout, logic, resource)
3. **Evidence**: Specific log entries or metrics that support your analysis
4. **Fix Steps**: Ordered steps to resolve (be specific and actionable)
5. **Prevention**: How to prevent this in the future

Be precise, technical, and actionable. Reference specific timestamps and metrics.`,
        response_json_schema: {
          type: "object",
          properties: {
            root_cause: { type: "string" },
            category: { type: "string", enum: ["config", "network", "timeout", "logic", "resource", "external"] },
            severity: { type: "string", enum: ["low", "medium", "high", "critical"] },
            evidence: { type: "array", items: { type: "string" } },
            fix_steps: { type: "array", items: { type: "string" } },
            prevention: { type: "array", items: { type: "string" } },
            similar_patterns: { type: "array", items: { type: "string" } }
          }
        }
      });

      setAnalysis({ ...result, run, agent });
      
      // Audit log for debug session
      await base44.entities.Audit.create({
        entity_type: 'run',
        entity_id: selectedRun,
        action: 'debug_analysis',
        metadata: { category: result.category, severity: result.severity },
        org_id: user.organization.id
      });
      
      toast.success('Analysis complete');
    } catch (error) {
      handleError(error);
    } finally {
      setIsAnalyzing(false);
    }
  };

  const severityColors = {
    critical: 'bg-red-500/20 text-red-400 border-red-500/30',
    high: 'bg-orange-500/20 text-orange-400 border-orange-500/30',
    medium: 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30',
    low: 'bg-blue-500/20 text-blue-400 border-blue-500/30'
  };

  return (
    <div className="space-y-6">
      <Card className="bg-slate-900 border-slate-800">
        <CardHeader>
          <CardTitle className="text-white">Select Failed Run</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex gap-4">
            <Select value={selectedRun} onValueChange={setSelectedRun}>
              <SelectTrigger className="bg-slate-800 border-slate-700 flex-1">
                <SelectValue placeholder="Select a failed run to analyze" />
              </SelectTrigger>
              <SelectContent className="bg-slate-900 border-slate-800">
                {runs.map(run => {
                  const agent = agents.find(a => a.id === run.agent_id);
                  return (
                    <SelectItem key={run.id} value={run.id}>
                      {agent?.name} - {format(new Date(run.finished_at || run.started_at), 'MMM d, HH:mm')}
                    </SelectItem>
                  );
                })}
              </SelectContent>
            </Select>
            <Button
              onClick={analyzeRun}
              disabled={isAnalyzing || !selectedRun}
              className="bg-blue-600 hover:bg-blue-700"
            >
              {isAnalyzing ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Analyzing...
                </>
              ) : (
                <>
                  <FileSearch className="w-4 h-4 mr-2" />
                  Analyze
                </>
              )}
            </Button>
          </div>
        </CardContent>
      </Card>

      {analysis && (
        <Card className="bg-slate-900 border-slate-800">
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="text-white">Analysis Results</CardTitle>
              <div className="flex items-center gap-2">
                <Badge variant="outline" className={severityColors[analysis.severity]}>
                  {analysis.severity}
                </Badge>
                <Badge variant="outline" className="bg-slate-800 text-slate-400">
                  {analysis.category}
                </Badge>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="p-4 bg-red-500/10 rounded-lg border border-red-500/30">
              <h4 className="text-sm font-semibold text-red-400 mb-2 flex items-center gap-2">
                <AlertCircle className="w-4 h-4" />
                Root Cause
              </h4>
              <p className="text-white">{analysis.root_cause}</p>
            </div>

            {analysis.evidence?.length > 0 && (
              <div className="space-y-2">
                <h4 className="text-sm font-semibold text-white">Evidence</h4>
                <div className="space-y-2">
                  {analysis.evidence.map((item, idx) => (
                    <div key={idx} className="p-3 bg-slate-950 rounded border border-slate-800 text-sm text-slate-300">
                      {item}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {analysis.fix_steps?.length > 0 && (
              <div className="space-y-2">
                <h4 className="text-sm font-semibold text-white flex items-center gap-2">
                  <CheckCircle className="w-4 h-4 text-green-400" />
                  Fix Steps
                </h4>
                <ol className="space-y-2 list-decimal list-inside">
                  {analysis.fix_steps.map((step, idx) => (
                    <li key={idx} className="p-3 bg-slate-950 rounded border border-slate-800 text-sm text-slate-300">
                      {step}
                    </li>
                  ))}
                </ol>
              </div>
            )}

            {analysis.prevention?.length > 0 && (
              <div className="p-4 bg-green-500/10 rounded-lg border border-green-500/30">
                <h4 className="text-sm font-semibold text-green-400 mb-2 flex items-center gap-2">
                  <TrendingUp className="w-4 h-4" />
                  Prevention Strategies
                </h4>
                <ul className="space-y-1">
                  {analysis.prevention.map((item, idx) => (
                    <li key={idx} className="text-sm text-slate-300 flex items-start gap-2">
                      <span className="text-green-400">•</span>
                      {item}
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}