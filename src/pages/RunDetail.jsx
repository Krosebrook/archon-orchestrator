
import { useState, useEffect, useCallback } from 'react';
import { Run, Workflow, Agent, Event } from '@/entities/all';
import { useLocation } from 'react-router-dom';
import RunHeader from '../components/runs/RunHeader';
import RunMetrics from '../components/runs/RunMetrics';
import RunTimeline from '../components/runs/RunTimeline';
import LiveLogStream from '../components/runs/LiveLogStream';
import { Skeleton } from '@/components/ui/skeleton';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { AlertTriangle, ArrowLeft, Code } from 'lucide-react';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import ExecutionTracker from '../components/workflows/ExecutionTracker';

export default function RunDetail() {
  const [run, setRun] = useState(null);
  const [workflow, setWorkflow] = useState(null);
  const [agent, setAgent] = useState(null);
  const [events, setEvents] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  
  const location = useLocation();
  const searchParams = new URLSearchParams(location.search);
  const runId = searchParams.get('id');

  const loadRunDetails = useCallback(async () => {
    if (!runId) {
      setError("No run ID provided.");
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    setError(null);
    try {
      const runData = await Run.get(runId);
      if (!runData) {
        throw new Error("Run not found.");
      }
      setRun(runData);

      const [workflowData, agentData, eventData] = await Promise.all([
        Workflow.get(runData.workflow_id),
        Agent.get(runData.agent_id),
        Event.filter({ run_id: runId }, '-created_date')
      ]);

      setWorkflow(workflowData);
      setAgent(agentData);
      setEvents(eventData);
    } catch (e) {
      console.error("Failed to load run details:", e);
      setError(e.message);
    } finally {
      setIsLoading(false);
    }
  }, [runId]);

  useEffect(() => {
    loadRunDetails();
  }, [loadRunDetails]);

  if (isLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-10 w-48" />
        <Skeleton className="h-24 w-full" />
        <Skeleton className="h-40 w-full" />
        <Skeleton className="h-64 w-full" />
      </div>
    );
  }

  if (error) {
    return (
      <Alert variant="destructive" className="bg-red-900/50 border-red-500/30">
        <AlertTriangle className="h-4 w-4 text-red-400" />
        <AlertTitle>Error Loading Run</AlertTitle>
        <AlertDescription>{error}</AlertDescription>
      </Alert>
    );
  }

  return (
    <div className="space-y-6">
      <Link to={createPageUrl('Runs')} className="inline-flex items-center gap-2 text-slate-400 hover:text-white mb-4">
        <ArrowLeft className="w-4 h-4" />
        Back to All Runs
      </Link>
      
      <h1 className="text-3xl font-bold text-white mb-2">Run Details</h1>
      <p className="text-slate-400 mb-6 font-mono text-sm">ID: {run.id}</p>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <RunHeader run={run} workflow={workflow} agent={agent} />
          <RunMetrics run={run} workflow={workflow} agent={agent} />
          
          <Tabs defaultValue="logs" className="w-full">
            <TabsList className="grid w-full grid-cols-4 bg-slate-800 text-slate-400">
              <TabsTrigger value="logs" className="data-[state=active]:bg-slate-900 data-[state=active]:text-white">Logs</TabsTrigger>
              <TabsTrigger value="timeline" className="data-[state=active]:bg-slate-900 data-[state=active]:text-white">Timeline</TabsTrigger>
              <TabsTrigger value="input" className="data-[state=active]:bg-slate-900 data-[state=active]:text-white">Input</TabsTrigger>
              <TabsTrigger value="output" className="data-[state=active]:bg-slate-900 data-[state=active]:text-white">Output</TabsTrigger>
            </TabsList>
            <TabsContent value="logs" className="mt-6">
              <LiveLogStream runId={run.id} isActive={run.state === 'running'} />
            </TabsContent>
            <TabsContent value="timeline" className="mt-6">
              <RunTimeline events={events} />
            </TabsContent>
            <TabsContent value="input" className="mt-6">
              <Card className="bg-slate-900 border-slate-800">
                <CardHeader><CardTitle className="flex items-center gap-2 text-white"><Code className="w-5 h-5"/>Run Input</CardTitle></CardHeader>
                <CardContent>
                  <pre className="text-sm bg-slate-950 p-4 rounded-md border border-slate-700 text-slate-300 whitespace-pre-wrap">
                    {JSON.stringify(run.input_data || { message: "No input data provided." }, null, 2)}
                  </pre>
                </CardContent>
              </Card>
            </TabsContent>
            <TabsContent value="output" className="mt-6">
              <Card className="bg-slate-900 border-slate-800">
                <CardHeader><CardTitle className="flex items-center gap-2 text-white"><Code className="w-5 h-5"/>Final Output</CardTitle></CardHeader>
                <CardContent>
                  <pre className="text-sm bg-slate-950 p-4 rounded-md border border-slate-700 text-slate-300 whitespace-pre-wrap">
                    {JSON.stringify(run.output_data || { message: "Run has not completed or produced no output." }, null, 2)}
                  </pre>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
        <div>
          <ExecutionTracker runId={runId} />
        </div>
      </div>
    </div>
  );
}
