import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Bug, FileSearch, Sparkles, GitBranch } from 'lucide-react';
import { handleError } from '../components/utils/api-client';
import LogAnalyzer from '../components/debugging/LogAnalyzer';
import RefactoringSuggestions from '../components/debugging/RefactoringSuggestions';
import DebugWizard from '../components/debugging/DebugWizard';
import APIDocumentation from '../components/debugging/APIDocumentation';

export default function AgentDebugger() {
  const [agents, setAgents] = useState([]);
  const [runs, setRuns] = useState([]);
  const [metrics, setMetrics] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

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
        <TabsList className="grid w-full grid-cols-4 bg-slate-800">
          <TabsTrigger value="logs" className="flex items-center gap-2">
            <FileSearch className="w-4 h-4" />
            Log Analysis
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
          />
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
    </div>
  );
}