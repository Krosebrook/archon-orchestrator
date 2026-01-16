/**
 * @fileoverview Workflow Detail View
 * @module workflows/WorkflowDetailView
 */

import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { base44 } from '@/api/base44Client';
import { DetailView } from '../shared/DetailView';
import { ExportButton } from '../shared/ExportButton';
import { ShareDialog } from '../shared/ShareDialog';
import { ConfirmDialog } from '../shared/ConfirmDialog';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Play, Copy } from 'lucide-react';
import { toast } from 'sonner';
import { createPageUrl } from '@/utils';
import ReactMarkdown from 'react-markdown';
import AIInsightsDashboard from '../ai/AIInsightsDashboard';

export default function WorkflowDetailView() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [workflow, setWorkflow] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [_showShareDialog, _setShowShareDialog] = useState(false);

  useEffect(() => {
    loadWorkflow();
  }, [id]);

  const loadWorkflow = async () => {
    try {
      const [result] = await base44.entities.Workflow.filter({ id });
      setWorkflow(result);
    } catch (_error) {
      console.error('Failed to load workflow:', _error);
      toast.error('Failed to load workflow');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    try {
      await base44.entities.Workflow.delete(id);
      toast.success('Workflow deleted');
      navigate(createPageUrl('Workflows'));
    } catch (_error) {
      toast.error('Failed to delete workflow');
    }
  };

  const handleDuplicate = async () => {
    try {
      const duplicate = await base44.entities.Workflow.create({
        ...workflow,
        name: `${workflow.name} (Copy)`,
        id: undefined,
        created_date: undefined,
        updated_date: undefined
      });
      toast.success('Workflow duplicated');
      navigate(createPageUrl('WorkflowDetail', { id: duplicate.id }));
    } catch (_error) {
      toast.error('Failed to duplicate workflow');
    }
  };

  const handleRun = async () => {
    try {
      const run = await base44.functions.invoke('runWorkflow', {
        workflow_id: id
      });
      toast.success('Workflow started');
      navigate(createPageUrl('RunDetail', { id: run.id }));
    } catch (_error) {
      toast.error('Failed to start workflow');
    }
  };

  if (loading || !workflow) {
    return <DetailView loading />;
  }

  const metadata = [
    { label: 'Created', value: new Date(workflow.created_date).toLocaleString() },
    { label: 'Updated', value: new Date(workflow.updated_date).toLocaleString() },
    { label: 'Version', value: workflow.version || '1.0.0' },
    { label: 'Created By', value: workflow.created_by }
  ];

  const sections = [
    {
      title: 'Description',
      content: workflow.description ? (
        <ReactMarkdown className="prose prose-invert max-w-none">
          {workflow.description}
        </ReactMarkdown>
      ) : (
        <p className="text-slate-400">No description provided</p>
      )
    },
    {
      title: 'Configuration',
      content: (
        <div className="space-y-4">
          <div>
            <div className="text-sm text-slate-400 mb-2">Nodes</div>
            <div className="flex flex-wrap gap-2">
              {workflow.spec?.nodes?.map((node, i) => (
                <Badge key={i} variant="outline">
                  {node.label || node.type}
                </Badge>
              ))}
            </div>
          </div>
          {workflow.tags && workflow.tags.length > 0 && (
            <div>
              <div className="text-sm text-slate-400 mb-2">Tags</div>
              <div className="flex flex-wrap gap-2">
                {workflow.tags.map((tag, i) => (
                  <Badge key={i}>{tag}</Badge>
                ))}
              </div>
            </div>
          )}
        </div>
      )
    }
  ];

  return (
    <>
      <DetailView
        title={workflow.name}
        subtitle="Workflow"
        status={workflow.status}
        metadata={metadata}
        sections={sections}
        onBack={() => navigate(createPageUrl('Workflows'))}
        onEdit={() => navigate(createPageUrl('VisualWorkflowBuilder', { id }))}
        onDelete={() => setShowDeleteConfirm(true)}
        onShare={() => setShowShareDialog(true)}
        actions={
          <>
            <Button onClick={handleRun} className="bg-green-600 hover:bg-green-700">
              <Play className="w-4 h-4 mr-2" />
              Run
            </Button>
            <Button variant="outline" onClick={handleDuplicate}>
              <Copy className="w-4 h-4 mr-2" />
              Duplicate
            </Button>
            <ExportButton
              data={[workflow]}
              filename={`workflow-${workflow.name}`}
            />
          </>
        }
      />

      <ConfirmDialog
        open={showDeleteConfirm}
        onOpenChange={setShowDeleteConfirm}
        title="Delete Workflow?"
        description={`Are you sure you want to delete "${workflow.name}"? This action cannot be undone.`}
        confirmText="Delete"
        onConfirm={handleDelete}
      />

      <ShareDialog
        resourceType="workflow"
        resourceId={workflow.id}
        resourceName={workflow.name}
        trigger={<div style={{ display: 'none' }} />}
      />

      <div className="mt-6">
        <AIInsightsDashboard workflowId={workflow.id} />
      </div>
    </>
  );
}