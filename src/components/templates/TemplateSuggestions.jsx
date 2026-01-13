import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Sparkles, Loader2, Plus } from 'lucide-react';
import { base44 } from '@/api/base44Client';
import { toast } from 'sonner';
import { useNavigate } from 'react-router-dom';
import { createPageUrl } from '@/utils';

export default function TemplateSuggestions() {
  const [goal, setGoal] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [suggestions, setSuggestions] = useState(null);
  const navigate = useNavigate();

  const getSuggestions = async () => {
    if (!goal.trim()) return;

    setIsLoading(true);
    try {
      const response = await base44.functions.invoke('suggestTemplates', { goal });
      
      if (response.data.success) {
        setSuggestions(response.data);
        toast.success('Found matching templates');
      }
    } catch (error) {
      console.error('Suggestion error:', error);
      toast.error('Failed to get suggestions');
    } finally {
      setIsLoading(false);
    }
  };

  // Renamed from useTemplate to avoid React Hook naming conflict
  // This is not a hook, just a regular async function
  const handleUseTemplate = async (template) => {
    try {
      const user = await base44.auth.me();
      const workflow = await base44.entities.Workflow.create({
        name: `${template.name} (AI suggested)`,
        description: template.description,
        spec: template.spec,
        version: '1.0.0',
        org_id: user.organization?.id || 'org_default'
      });

      await base44.entities.WorkflowTemplate.update(template.id, {
        usage_count: (template.usage_count || 0) + 1
      });

      toast.success('Workflow created from template');
      navigate(createPageUrl(`WorkflowDetail?id=${workflow.id}`));
    } catch (error) {
      console.error('Failed to use template:', error);
      toast.error('Failed to create workflow');
    }
  };

  return (
    <Card className="bg-slate-900 border-slate-800">
      <CardHeader>
        <CardTitle className="text-white flex items-center gap-2">
          <Sparkles className="w-5 h-5 text-purple-400" />
          AI Template Suggestions
        </CardTitle>
        <p className="text-sm text-slate-400">
          Describe your goal and get template recommendations
        </p>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex gap-2">
          <Input
            value={goal}
            onChange={(e) => setGoal(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && getSuggestions()}
            placeholder="e.g., Process customer feedback and generate insights"
            className="bg-slate-800 border-slate-700"
            disabled={isLoading}
          />
          <Button
            onClick={getSuggestions}
            disabled={isLoading || !goal.trim()}
            className="bg-purple-600 hover:bg-purple-700"
          >
            {isLoading ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Sparkles className="w-4 h-4" />
            )}
          </Button>
        </div>

        {suggestions && (
          <div className="space-y-3">
            {suggestions.recommendations.length === 0 ? (
              <div className="p-4 bg-yellow-900/20 rounded-lg border border-yellow-800/30">
                <div className="text-sm text-yellow-400 font-medium mb-1">
                  No matching templates found
                </div>
                <p className="text-xs text-yellow-300">
                  {suggestions.custom_workflow_needed 
                    ? 'Try using the AI Workflow Generator instead'
                    : 'Refine your goal or browse the template library'
                  }
                </p>
              </div>
            ) : (
              <>
                <div className="text-sm text-slate-300 font-medium">
                  {suggestions.recommendations.length} matching templates
                </div>
                {suggestions.recommendations.map((rec, idx) => (
                  <div key={idx} className="p-4 bg-slate-950 rounded-lg border border-slate-800">
                    <div className="flex items-start justify-between mb-2">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="text-white font-medium">{rec.template.name}</span>
                          <Badge variant="outline" className="bg-green-500/20 text-green-400 border-green-500/30 text-xs">
                            {rec.relevance_score}% match
                          </Badge>
                        </div>
                        <p className="text-xs text-slate-400 mb-2">{rec.template.description}</p>
                      </div>
                    </div>

                    <div className="p-2 bg-purple-900/20 rounded border border-purple-800/30 mb-3">
                      <div className="text-xs text-purple-400 font-medium mb-1">Why this matches</div>
                      <p className="text-xs text-purple-300">{rec.reasoning}</p>
                    </div>

                    <div className="flex flex-wrap gap-2 mb-3">
                      <Badge variant="outline" className="bg-blue-500/20 text-blue-400 border-blue-500/30 text-xs">
                        {rec.template.category}
                      </Badge>
                      <Badge variant="outline" className="bg-slate-800 border-slate-700 text-xs">
                        {rec.template.spec?.nodes?.length || 0} nodes
                      </Badge>
                    </div>

                    <Button
                      size="sm"
                      onClick={() => handleUseTemplate(rec.template)}
                      className="w-full bg-green-600 hover:bg-green-700"
                    >
                      <Plus className="w-3 h-3 mr-2" />
                      Use This Template
                    </Button>
                  </div>
                ))}
              </>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}