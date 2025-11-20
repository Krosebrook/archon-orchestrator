import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Play, Sparkles, Clock, DollarSign, Loader2 } from 'lucide-react';
import { Workflow, WorkflowTemplate } from '@/entities/all';
import { createPageUrl } from '@/utils';
import { base44 } from '@/api/base44Client';
import { toast } from 'sonner';

export default function TemplateCard({ template, onRefresh }) {
  const navigate = useNavigate();
  const [isCreating, setIsCreating] = useState(false);

  const complexityColors = {
    beginner: 'bg-green-500/20 text-green-400 border-green-500/30',
    intermediate: 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30',
    advanced: 'bg-red-500/20 text-red-400 border-red-500/30'
  };

  const categoryColors = {
    customer_service: 'bg-blue-500/20 text-blue-400',
    data_processing: 'bg-purple-500/20 text-purple-400',
    content_generation: 'bg-pink-500/20 text-pink-400',
    automation: 'bg-green-500/20 text-green-400',
    integration: 'bg-orange-500/20 text-orange-400',
    analytics: 'bg-cyan-500/20 text-cyan-400'
  };

  const handleUseTemplate = async () => {
    setIsCreating(true);
    try {
      const user = await base44.auth.me();
      
      const newWorkflow = await Workflow.create({
        name: `${template.name} (from template)`,
        description: template.description,
        spec: template.spec,
        version: '1.0.0',
        org_id: user.organization.id
      });

      await WorkflowTemplate.update(template.id, {
        usage_count: (template.usage_count || 0) + 1
      });

      toast.success('Workflow created from template');
      onRefresh?.();
      navigate(createPageUrl(`WorkflowDetail?id=${newWorkflow.id}`));
    } catch (error) {
      console.error('Failed to create workflow from template:', error);
      toast.error('Failed to create workflow');
    } finally {
      setIsCreating(false);
    }
  };

  return (
    <Card className="bg-slate-900 border-slate-800 hover:border-slate-700 transition-all hover:shadow-lg">
      <CardHeader>
        <div className="flex items-start justify-between mb-2">
          <CardTitle className="text-white text-lg">{template.name}</CardTitle>
          {template.is_featured && (
            <Sparkles className="w-4 h-4 text-yellow-400 flex-shrink-0" />
          )}
        </div>
        <div className="flex flex-wrap gap-2">
          <Badge variant="outline" className={categoryColors[template.category]}>
            {template.category.replace('_', ' ')}
          </Badge>
          <Badge variant="outline" className={complexityColors[template.complexity]}>
            {template.complexity}
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <p className="text-sm text-slate-400 line-clamp-3">{template.description}</p>

        {template.tags && template.tags.length > 0 && (
          <div className="flex flex-wrap gap-1">
            {template.tags.slice(0, 4).map((tag, idx) => (
              <span key={idx} className="text-xs px-2 py-0.5 bg-slate-800 text-slate-400 rounded">
                {tag}
              </span>
            ))}
            {template.tags.length > 4 && (
              <span className="text-xs px-2 py-0.5 bg-slate-800 text-slate-400 rounded">
                +{template.tags.length - 4}
              </span>
            )}
          </div>
        )}

        {template.ai_features && template.ai_features.length > 0 && (
          <div className="flex items-center gap-2">
            <Sparkles className="w-3 h-3 text-purple-400" />
            <span className="text-xs text-purple-400">
              AI-powered: {template.ai_features.join(', ')}
            </span>
          </div>
        )}

        <div className="grid grid-cols-2 gap-3 pt-2 border-t border-slate-800">
          <div className="flex items-center gap-2">
            <Clock className="w-3 h-3 text-slate-500" />
            <span className="text-xs text-slate-400">
              ~{template.estimated_duration_sec || 60}s
            </span>
          </div>
          <div className="flex items-center gap-2">
            <DollarSign className="w-3 h-3 text-slate-500" />
            <span className="text-xs text-slate-400">
              ${((template.estimated_cost_per_run_cents || 10) / 100).toFixed(2)}
            </span>
          </div>
        </div>

        <Button
          onClick={handleUseTemplate}
          disabled={isCreating}
          className="w-full bg-blue-600 hover:bg-blue-700"
        >
          {isCreating ? (
            <>
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              Creating...
            </>
          ) : (
            <>
              <Play className="w-4 h-4 mr-2" />
              Use Template
            </>
          )}
        </Button>

        {template.usage_count > 0 && (
          <div className="text-center">
            <span className="text-xs text-slate-500">
              Used {template.usage_count} {template.usage_count === 1 ? 'time' : 'times'}
            </span>
          </div>
        )}
      </CardContent>
    </Card>
  );
}