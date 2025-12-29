import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  Lightbulb, 
  TrendingDown, 
  CheckCircle2, 
  XCircle,
  ChevronDown,
  ChevronUp,
  Sparkles,
} from 'lucide-react';
import { toast } from 'sonner';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';

export default function OptimizationRecommendations({ recommendations, onRefresh }) {
  const categoryIcons = {
    model_selection: '🤖',
    token_optimization: '📝',
    caching: '💾',
    batching: '📦',
    scheduling: '⏰',
    architecture: '🏗️',
  };

  const priorityColors = {
    critical: 'bg-red-900/20 text-red-400 border-red-700',
    high: 'bg-orange-900/20 text-orange-400 border-orange-700',
    medium: 'bg-yellow-900/20 text-yellow-400 border-yellow-700',
    low: 'bg-blue-900/20 text-blue-400 border-blue-700',
  };

  const effortColors = {
    low: 'bg-green-900/20 text-green-400',
    medium: 'bg-yellow-900/20 text-yellow-400',
    high: 'bg-red-900/20 text-red-400',
  };

  const grouped = recommendations.reduce((acc, rec) => {
    if (!acc[rec.category]) acc[rec.category] = [];
    acc[rec.category].push(rec);
    return acc;
  }, {});

  if (recommendations.length === 0) {
    return (
      <Card className="bg-slate-900 border-slate-800">
        <CardContent className="flex flex-col items-center justify-center h-96 text-slate-400">
          <Lightbulb className="w-16 h-16 mb-4 opacity-50" />
          <p>No optimization recommendations yet</p>
          <p className="text-sm mt-2">Analyze your usage to get AI-driven cost savings suggestions</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      {Object.entries(grouped).map(([category, recs]) => (
        <Card key={category} className="bg-slate-900 border-slate-800">
          <CardHeader>
            <CardTitle className="text-white flex items-center gap-2">
              <span className="text-2xl">{categoryIcons[category]}</span>
              {category.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}
              <Badge variant="outline" className="ml-2">
                {recs.length}
              </Badge>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {recs.map((rec) => (
              <RecommendationCard 
                key={rec.id} 
                recommendation={rec}
                priorityColors={priorityColors}
                effortColors={effortColors}
                onRefresh={onRefresh}
              />
            ))}
          </CardContent>
        </Card>
      ))}
    </div>
  );
}

function RecommendationCard({ recommendation, priorityColors, effortColors, onRefresh }) {
  const [isOpen, setIsOpen] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);

  const handleStatusChange = async (newStatus) => {
    setIsUpdating(true);
    try {
      await base44.entities.CostOptimizationRecommendation.update(recommendation.id, {
        status: newStatus,
        ...(newStatus === 'implemented' ? { implemented_at: new Date().toISOString() } : {}),
      });
      toast.success(`Recommendation ${newStatus}`);
      onRefresh();
    } catch (error) {
      console.error('Failed to update recommendation:', error);
      toast.error('Failed to update recommendation');
    } finally {
      setIsUpdating(false);
    }
  };

  return (
    <Collapsible open={isOpen} onOpenChange={setIsOpen}>
      <div className={`p-4 rounded-lg border ${priorityColors[recommendation.priority]}`}>
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-2">
              <h4 className="font-medium text-white">{recommendation.title}</h4>
              <Badge className={effortColors[recommendation.implementation_effort]}>
                {recommendation.implementation_effort} effort
              </Badge>
            </div>
            <p className="text-sm text-slate-300 mb-3">{recommendation.description}</p>
            
            {recommendation.estimated_savings_cents > 0 && (
              <div className="flex items-center gap-4 text-sm mb-3">
                <div className="flex items-center gap-1 text-green-400">
                  <TrendingDown className="w-4 h-4" />
                  <span className="font-medium">
                    ${(recommendation.estimated_savings_cents / 100).toFixed(2)}/mo savings
                  </span>
                </div>
                {recommendation.estimated_savings_percentage && (
                  <span className="text-slate-400">
                    (~{recommendation.estimated_savings_percentage}% reduction)
                  </span>
                )}
              </div>
            )}

            <CollapsibleContent>
              <div className="mt-4 pt-4 border-t border-slate-700 space-y-3">
                {recommendation.actionable_steps && recommendation.actionable_steps.length > 0 && (
                  <div>
                    <h5 className="text-sm font-medium text-slate-400 mb-2">Implementation Steps:</h5>
                    <ol className="list-decimal list-inside space-y-1 text-sm text-slate-300">
                      {recommendation.actionable_steps.map((step, i) => (
                        <li key={i}>{step}</li>
                      ))}
                    </ol>
                  </div>
                )}

                {recommendation.current_config && recommendation.recommended_config && (
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <h5 className="text-sm font-medium text-slate-400 mb-2">Current:</h5>
                      <pre className="text-xs bg-slate-800 p-2 rounded text-slate-300 overflow-auto">
                        {JSON.stringify(recommendation.current_config, null, 2)}
                      </pre>
                    </div>
                    <div>
                      <h5 className="text-sm font-medium text-slate-400 mb-2">Recommended:</h5>
                      <pre className="text-xs bg-slate-800 p-2 rounded text-green-300 overflow-auto">
                        {JSON.stringify(recommendation.recommended_config, null, 2)}
                      </pre>
                    </div>
                  </div>
                )}
              </div>
            </CollapsibleContent>
          </div>

          <div className="flex flex-col gap-2 ml-4">
            <CollapsibleTrigger asChild>
              <Button size="sm" variant="ghost" className="text-slate-400">
                {isOpen ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
              </Button>
            </CollapsibleTrigger>
          </div>
        </div>

        {recommendation.status === 'new' && (
          <div className="flex gap-2 mt-4 pt-4 border-t border-slate-700">
            <Button
              size="sm"
              onClick={() => handleStatusChange('implemented')}
              disabled={isUpdating}
              className="bg-green-600 hover:bg-green-700"
            >
              <CheckCircle2 className="w-3 h-3 mr-1" />
              Mark Implemented
            </Button>
            <Button
              size="sm"
              variant="outline"
              onClick={() => handleStatusChange('reviewing')}
              disabled={isUpdating}
            >
              Under Review
            </Button>
            <Button
              size="sm"
              variant="ghost"
              onClick={() => handleStatusChange('dismissed')}
              disabled={isUpdating}
              className="text-red-400"
            >
              <XCircle className="w-3 h-3 mr-1" />
              Dismiss
            </Button>
          </div>
        )}

        {recommendation.status === 'implemented' && recommendation.implemented_at && (
          <div className="mt-3 text-xs text-green-400 flex items-center gap-1">
            <CheckCircle2 className="w-3 h-3" />
            Implemented on {new Date(recommendation.implemented_at).toLocaleDateString()}
          </div>
        )}
      </div>
    </Collapsible>
  );
}