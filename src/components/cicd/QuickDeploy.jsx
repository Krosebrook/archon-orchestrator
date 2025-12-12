import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Rocket, Loader2 } from 'lucide-react';
import { toast } from 'sonner';

export default function QuickDeploy({ onWorkflowSelect, onPipelineSelect }) {
  const [workflows, setWorkflows] = useState([]);
  const [pipelines, setPipelines] = useState([]);
  const [selectedWorkflowId, setSelectedWorkflowId] = useState('');
  const [selectedPipelineId, setSelectedPipelineId] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const [workflowData, pipelineData] = await Promise.all([
        base44.entities.Workflow.filter({ status: 'active' }, '-updated_date', 50),
        base44.entities.CIPipeline.list('-created_date')
      ]);
      setWorkflows(workflowData);
      setPipelines(pipelineData);
    } catch (error) {
      console.error('Failed to load data:', error);
      toast.error('Failed to load workflows and pipelines');
    } finally {
      setLoading(false);
    }
  };

  const handleDeploy = () => {
    const workflow = workflows.find(w => w.id === selectedWorkflowId);
    const pipeline = pipelines.find(p => p.id === selectedPipelineId);

    if (!workflow || !pipeline) {
      toast.error('Please select both workflow and pipeline');
      return;
    }

    onWorkflowSelect(workflow);
    onPipelineSelect(pipeline);
    toast.success('Ready to execute pipeline');
  };

  return (
    <Card className="bg-slate-900 border-slate-800">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Rocket className="w-5 h-5" />
          Quick Deploy
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {loading ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="w-6 h-6 animate-spin text-slate-400" />
          </div>
        ) : (
          <>
            <div className="space-y-2">
              <label className="text-sm font-medium text-slate-300">Workflow</label>
              <Select value={selectedWorkflowId} onValueChange={setSelectedWorkflowId}>
                <SelectTrigger className="border-slate-700">
                  <SelectValue placeholder="Select workflow" />
                </SelectTrigger>
                <SelectContent className="bg-slate-900 border-slate-800">
                  {workflows.map(workflow => (
                    <SelectItem key={workflow.id} value={workflow.id}>
                      <div className="flex items-center gap-2">
                        <span>{workflow.name}</span>
                        <Badge variant="outline" className="text-xs">
                          v{workflow.version}
                        </Badge>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium text-slate-300">Pipeline</label>
              <Select value={selectedPipelineId} onValueChange={setSelectedPipelineId}>
                <SelectTrigger className="border-slate-700">
                  <SelectValue placeholder="Select pipeline" />
                </SelectTrigger>
                <SelectContent className="bg-slate-900 border-slate-800">
                  {pipelines.map(pipeline => (
                    <SelectItem key={pipeline.id} value={pipeline.id}>
                      {pipeline.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <Button
              onClick={handleDeploy}
              disabled={!selectedWorkflowId || !selectedPipelineId}
              className="w-full bg-green-600 hover:bg-green-700"
            >
              <Rocket className="w-4 h-4 mr-2" />
              Load for Deployment
            </Button>
          </>
        )}
      </CardContent>
    </Card>
  );
}