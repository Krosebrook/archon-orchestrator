import { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Bug, FileSearch, Sparkles, GitBranch, Eye, X } from 'lucide-react';
import { handleError } from '../components/utils/api-client';
import LogAnalyzer from '../components/debugging/LogAnalyzer';
import RefactoringSuggestions from '../components/debugging/RefactoringSuggestions';
import DebugWizard from '../components/debugging/DebugWizard';
import APIDocumentation from '../components/debugging/APIDocumentation';
import ExecutionInspector from '../components/debugging/ExecutionInspector';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';

export default function AgentDebugger() {
  const [agents, setAgents] = useState([]);
  const [runs, setRuns] = useState([]);
  const [metrics, setMetrics] = useState([]);
  const [_isLoading, _setIsLoading] = useState(true);
  const [inspectingRun, setInspectingRun] = useState(null);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setIsLoading(true);
    try {
      const [agentData, runData, metricData] = await Promise.all([
        base44.entities.Agent.list(),
        base44.entities.Run.filter({ status: 'failed' }, '-finished_at', 50),
        base44.entities.AgentMetric.filter({ status: 'error' }, '-timestamp', 100)
      ]);
      setAgents(agentData);
      setRuns(runData);
      setMetrics(metricData);
    } catch (error) {
      handleError(error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-white mb-2">AI Debugging Assistant</h1>
        <p className="text-slate-400">Analyze errors, get refactoring suggestions, and debug complex agent behaviors</p>
      </div>

      <Tabs defaultValue="logs" className="w-full">
        <TabsList className="grid w-full grid-cols-5 bg-slate-800">
          <TabsTrigger value="logs" className="flex items-center gap-2">
            <FileSearch className="w-4 h-4" />
            Log Analysis
          </TabsTrigger>
          <TabsTrigger value="inspector" className="flex items-center gap-2">
            <Eye className="w-4 h-4" />
            Inspector
          </TabsTrigger>
          <TabsTrigger value="refactor" className="flex items-center gap-2">
            <Sparkles className="w-4 h-4" />
            Refactoring
          </TabsTrigger>
          <TabsTrigger value="debug" className="flex items-center gap-2">
            <Bug className="w-4 h-4" />
            Debug Wizard
          </TabsTrigger>
          <TabsTrigger value="api" className="flex items-center gap-2">
            <GitBranch className="w-4 h-4" />
            API Docs
          </TabsTrigger>
        </TabsList>

        <TabsContent value="logs" className="mt-6">
          <LogAnalyzer
            agents={agents}
            runs={runs}
            metrics={metrics}
            onRefresh={loadData}
            onInspectRun={setInspectingRun}
          />
        </TabsContent>

        <TabsContent value="inspector" className="mt-6">
          {runs.length > 0 ? (
            <div className="space-y-4">
              <p className="text-slate-400 text-sm">Select a run from the list to inspect its execution</p>
              <div className="grid gap-4">
                {runs.slice(0, 10).map(run => {
                  const agent = agents.find(a => a.id === run.agent_id);
                  return (
                    <div
                      key={run.id}
                      onClick={() => setInspectingRun(run)}
                      className="p-4 bg-slate-900 border border-slate-800 rounded-lg cursor-pointer hover:border-blue-500/50 transition-colors"
                    >
                      <div className="flex items-center justify-between">
                        <div>
                          <div className="text-white font-medium">{agent?.name || 'Unknown Agent'}</div>
                          <div className="text-sm text-slate-400 mt-1">
                            Run {run.id.slice(0, 8)} - {run.status}
                          </div>
                        </div>
                        <Button size="sm" className="bg-blue-600 hover:bg-blue-700">
                          <Eye className="w-4 h-4 mr-2" />
                          Inspect
                        </Button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          ) : (
            <div className="text-center py-12 text-slate-400">
              No runs available for inspection
            </div>
          )}
        </TabsContent>

        <TabsContent value="refactor" className="mt-6">
          <RefactoringSuggestions
            agents={agents}
            onRefresh={loadData}
          />
        </TabsContent>

        <TabsContent value="debug" className="mt-6">
          <DebugWizard
            agents={agents}
            runs={runs}
            metrics={metrics}
          />
        </TabsContent>

        <TabsContent value="api" className="mt-6">
          <APIDocumentation />
        </TabsContent>
      </Tabs>

      {/* Execution Inspector Modal */}
      <Dialog open={!!inspectingRun} onOpenChange={(open) => !open && setInspectingRun(null)}>
        <DialogContent className="max-w-6xl max-h-[90vh] bg-slate-950 border-slate-800 overflow-y-auto">
          <DialogHeader>
            <div className="flex items-center justify-between">
              <DialogTitle className="text-white">Execution Inspector</DialogTitle>
              <Button
                onClick={() => setInspectingRun(null)}
                variant="ghost"
                size="icon"
                className="text-slate-400 hover:text-white"
              >
                <X className="w-4 h-4" />
              </Button>
            </div>
          </DialogHeader>
          {inspectingRun && (
            <ExecutionInspector
              run={inspectingRun}
              onClose={() => setInspectingRun(null)}
            />
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}