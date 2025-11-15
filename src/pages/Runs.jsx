import { useState, useEffect } from 'react';
import { Run, Workflow, Agent } from '@/entities/all';
import RunsTable from '../components/runs/RunsTable';

export default function Runs() {
  const [runs, setRuns] = useState([]);
  const [workflows, setWorkflows] = useState([]);
  const [agents, setAgents] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const loadData = async () => {
      setIsLoading(true);
      try {
        const [runData, workflowData, agentData] = await Promise.all([
          Run.list('-created_date'),
          Workflow.list(),
          Agent.list(),
        ]);
        setRuns(runData);
        setWorkflows(workflowData);
        setAgents(agentData);
      } catch (error) {
        console.error("Failed to load runs data:", error);
      } finally {
        setIsLoading(false);
      }
    };
    loadData();
  }, []);

  return (
    <div>
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold text-white">Runs</h1>
          <p className="text-slate-400">Browse and inspect all workflow executions.</p>
        </div>
      </div>
      <RunsTable runs={runs} workflows={workflows} agents={agents} isLoading={isLoading} />
    </div>
  );
}