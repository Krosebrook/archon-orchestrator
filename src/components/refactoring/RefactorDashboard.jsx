
import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import {
  AlertTriangle,
  CheckCircle,
  Clock,
  Code,
  Database,
  Shield,
  Zap,
  TrendingUp,
  ChevronRight,
  X,
  Play,
  RotateCcw,
  Loader2
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { base44 } from '@/api/base44Client';
import { toast } from 'sonner';

const STAGE_CONFIG = {
  0: {
    name: 'Stage 0: Safeguards & Backup',
    description: 'Backup existing data and run baseline tests',
    icon: Shield,
    color: 'bg-slate-600'
  },
  1: {
    name: 'Stage 1: Safe Cleanup',
    description: 'Remove unused code and consolidate duplicates',
    icon: Code,
    color: 'bg-blue-600'
  },
  2: {
    name: 'Stage 2: Optimizations',
    description: 'Performance improvements and refactoring',
    icon: Zap,
    color: 'bg-purple-600'
  },
  3: {
    name: 'Stage 3: Schema Enhancements',
    description: 'Database and API schema improvements',
    icon: Database,
    color: 'bg-green-600'
  }
};

const SEVERITY_STYLES = {
  critical: {
    badge: 'bg-red-500/20 text-red-400 border-red-500/30',
    icon: AlertTriangle,
    color: 'text-red-400'
  },
  high: {
    badge: 'bg-orange-500/20 text-orange-400 border-orange-500/30',
    icon: AlertTriangle,
    color: 'text-orange-400'
  },
  medium: {
    badge: 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30',
    icon: Clock,
    color: 'text-yellow-400'
  },
  low: {
    badge: 'bg-blue-500/20 text-blue-400 border-blue-500/30',
    icon: TrendingUp,
    color: 'text-blue-400'
  }
};

const CATEGORY_LABELS = {
  redundancy: { label: 'Redundancy', color: 'text-slate-400' },
  performance: { label: 'Performance', color: 'text-purple-400' },
  security: { label: 'Security', color: 'text-red-400' },
  maintainability: { label: 'Maintainability', color: 'text-blue-400' },
  schema: { label: 'Schema', color: 'text-green-400' }
};

function ScoreCard({ label, score, icon: Icon }) {
  const getScoreColor = (score) => {
    if (score >= 80) return 'text-green-400';
    if (score >= 60) return 'text-yellow-400';
    return 'text-red-400';
  };

  return (
    <Card className="bg-slate-900 border-slate-800">
      <CardContent className="pt-6">
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm text-slate-400">{label}</span>
          <Icon className="w-4 h-4 text-slate-500" />
        </div>
        <div className={cn("text-3xl font-bold", getScoreColor(score))}>
          {score}
          <span className="text-lg text-slate-500">/100</span>
        </div>
        <Progress value={score} className="mt-2 h-1" />
      </CardContent>
    </Card>
  );
}

function RecommendationCard({ recommendation, onDismiss, onApply, onRollback }) {
  const [expanded, setExpanded] = useState(false);
  const [isApplying, setIsApplying] = useState(false);
  const [isRollingBack, setIsRollingBack] = useState(false);
  
  const severityConfig = SEVERITY_STYLES[recommendation.severity] || SEVERITY_STYLES.low;
  const SeverityIcon = severityConfig.icon;
  const categoryConfig = CATEGORY_LABELS[recommendation.category] || CATEGORY_LABELS.redundancy;

  const handleApply = async () => {
    setIsApplying(true);
    try {
      await onApply(recommendation);
    } finally {
      setIsApplying(false);
    }
  };

  const handleRollback = async () => {
    setIsRollingBack(true);
    try {
      await onRollback(recommendation);
    } finally {
      setIsRollingBack(false);
    }
  };

  const isCompleted = recommendation.status === 'completed';
  const isInProgress = recommendation.status === 'in_progress';

  return (
    <Card className="bg-slate-900 border-slate-800 hover:border-slate-700 transition-all">
      <CardContent className="p-4">
        <div className="flex items-start justify-between gap-4">
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-2">
              <SeverityIcon className={cn("w-4 h-4", severityConfig.color)} />
              <Badge variant="outline" className={severityConfig.badge}>
                {recommendation.severity}
              </Badge>
              <Badge variant="outline" className="bg-slate-800 text-slate-300 border-slate-700">
                {categoryConfig.label}
              </Badge>
              <span className="text-xs text-slate-500">Stage {recommendation.stage}</span>
              {isCompleted && (
                <Badge variant="outline" className="bg-green-500/20 text-green-400 border-green-500/30">
                  <CheckCircle className="w-3 h-3 mr-1" />
                  Applied
                </Badge>
              )}
              {isInProgress && (
                <Badge variant="outline" className="bg-blue-500/20 text-blue-400 border-blue-500/30">
                  <Loader2 className="w-3 h-3 mr-1 animate-spin" />
                  In Progress
                </Badge>
              )}
            </div>

            <h3 className="text-white font-medium mb-1">{recommendation.title}</h3>
            <p className="text-sm text-slate-400 mb-2">{recommendation.description}</p>

            {expanded && (
              <div className="mt-4 space-y-3 text-sm">
                <div className="bg-slate-950 p-3 rounded-lg border border-slate-800">
                  <div className="text-slate-400 font-medium mb-1">💡 Recommendation</div>
                  <div className="text-slate-300">{recommendation.recommendation}</div>
                </div>

                {recommendation.affected_files && recommendation.affected_files.length > 0 && (
                  <div>
                    <div className="text-slate-400 font-medium mb-1">📁 Affected Files</div>
                    <div className="flex flex-wrap gap-1">
                      {recommendation.affected_files.map((file, idx) => (
                        <code key={idx} className="text-xs bg-slate-950 px-2 py-1 rounded text-blue-400">
                          {file}
                        </code>
                      ))}
                    </div>
                  </div>
                )}

                {recommendation.estimated_impact && (
                  <div>
                    <div className="text-slate-400 font-medium mb-1">📊 Estimated Impact</div>
                    <div className="space-y-1">
                      {recommendation.estimated_impact.performance_gain && (
                        <div className="text-xs text-slate-300">
                          ⚡ {recommendation.estimated_impact.performance_gain}
                        </div>
                      )}
                      {recommendation.estimated_impact.code_reduction && (
                        <div className="text-xs text-slate-300">
                          📉 {recommendation.estimated_impact.code_reduction}
                        </div>
                      )}
                      {recommendation.estimated_impact.security_improvement && (
                        <div className="text-xs text-slate-300">
                          🔒 {recommendation.estimated_impact.security_improvement}
                        </div>
                      )}
                    </div>
                  </div>
                )}

                <div className="bg-orange-500/10 p-3 rounded-lg border border-orange-500/20">
                  <div className="text-orange-400 font-medium mb-1 flex items-center gap-1">
                    <RotateCcw className="w-3 h-3" /> Rollback Strategy
                  </div>
                  <div className="text-xs text-orange-300">{recommendation.rollback_strategy}</div>
                </div>

                <div className="flex items-center gap-2 pt-2">
                  <Badge variant="outline" className={`text-xs ${
                    recommendation.risk_level === 'high' ? 'bg-red-500/10 text-red-400 border-red-500/30' :
                    recommendation.risk_level === 'medium' ? 'bg-yellow-500/10 text-yellow-400 border-yellow-500/30' :
                    'bg-green-500/10 text-green-400 border-green-500/30'
                  }`}>
                    Risk: {recommendation.risk_level}
                  </Badge>
                  {isCompleted && recommendation.applied_by && (
                    <span className="text-xs text-slate-500">
                      Applied by {recommendation.applied_by}
                    </span>
                  )}
                </div>
              </div>
            )}
          </div>

          <div className="flex flex-col gap-2">
            <Button
              size="icon"
              variant="ghost"
              onClick={() => setExpanded(!expanded)}
              className="text-slate-400 hover:text-white"
            >
              <ChevronRight className={cn("w-4 h-4 transition-transform", expanded && "rotate-90")} />
            </Button>
          </div>
        </div>

        {expanded && (
          <div className="flex items-center gap-2 mt-4 pt-4 border-t border-slate-800">
            {!isCompleted && !isInProgress && (
              <>
                <Button
                  size="sm"
                  onClick={handleApply}
                  disabled={isApplying}
                  className="bg-blue-600 hover:bg-blue-700"
                >
                  {isApplying ? (
                    <>
                      <Loader2 className="w-3 h-3 mr-1 animate-spin" />
                      Applying...
                    </>
                  ) : (
                    <>
                      <Play className="w-3 h-3 mr-1" />
                      Apply Fix
                    </>
                  )}
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => onDismiss(recommendation)}
                  className="border-slate-700 hover:bg-slate-800"
                >
                  <X className="w-3 h-3 mr-1" />
                  Dismiss
                </Button>
              </>
            )}
            {isCompleted && (
              <Button
                size="sm"
                variant="outline"
                onClick={handleRollback}
                disabled={isRollingBack}
                className="border-orange-700 hover:bg-orange-900/20 text-orange-400"
              >
                {isRollingBack ? (
                  <>
                    <Loader2 className="w-3 h-3 mr-1 animate-spin" />
                    Rolling back...
                  </>
                ) : (
                  <>
                    <RotateCcw className="w-3 h-3 mr-1" />
                    Rollback
                  </>
                )}
              </Button>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

export default function RefactorDashboard({ session, recommendations, onRefresh }) {
  const [selectedStage, setSelectedStage] = useState('all');
  const [selectedCategory, setSelectedCategory] = useState('all');

  const filteredRecommendations = recommendations.filter(rec => {
    if (selectedStage !== 'all' && rec.stage !== parseInt(selectedStage)) return false;
    if (selectedCategory !== 'all' && rec.category !== selectedCategory) return false;
    if (rec.status === 'dismissed') return false;
    return true;
  });

  const handleApply = async (recommendation) => {
    const toastId = toast.loading('Applying refactor...');
    
    try {
      const response = await base44.functions.invoke('applyRefactor', {
        recommendation_id: recommendation.id
      });

      if (response.data.success) {
        toast.success('Refactor applied successfully!', { id: toastId });
        onRefresh?.();
      } else {
        throw new Error('Failed to apply refactor');
      }
    } catch (error) {
      console.error('Apply error:', error);
      toast.error('Failed to apply refactor', { id: toastId });
    }
  };

  const handleRollback = async (recommendation) => {
    const toastId = toast.loading('Rolling back refactor...');
    
    try {
      const response = await base44.functions.invoke('rollbackRefactor', {
        recommendation_id: recommendation.id
      });

      if (response.data.success) {
        toast.success('Refactor rolled back successfully!', { id: toastId });
        onRefresh?.();
      } else {
        throw new Error('Failed to rollback refactor');
      }
    } catch (error) {
      console.error('Rollback error:', error);
      toast.error('Failed to rollback refactor', { id: toastId });
    }
  };

  const handleDismiss = async (recommendation) => {
    try {
      await base44.entities.RefactorRecommendation.update(recommendation.id, {
        status: 'dismissed'
      });
      toast.success('Recommendation dismissed');
      onRefresh?.();
    } catch (error) {
      console.error('Dismiss error:', error);
      toast.error('Failed to dismiss recommendation');
    }
  };

  if (!session) {
    return (
      <Card className="bg-slate-900 border-slate-800">
        <CardContent className="p-8 text-center">
          <div className="text-slate-400">No analysis session loaded</div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Score Overview */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
        <ScoreCard
          label="Overall Health"
          score={Math.round(session.overall_score || 75)}
          icon={CheckCircle}
        />
        <ScoreCard
          label="Security"
          score={Math.round(session.scores_breakdown?.security || 80)}
          icon={Shield}
        />
        <ScoreCard
          label="Performance"
          score={Math.round(session.scores_breakdown?.performance || 70)}
          icon={Zap}
        />
        <ScoreCard
          label="Maintainability"
          score={Math.round(session.scores_breakdown?.maintainability || 75)}
          icon={Code}
        />
        <ScoreCard
          label="Reliability"
          score={Math.round(session.scores_breakdown?.reliability || 80)}
          icon={Database}
        />
      </div>

      {/* Summary Stats */}
      <Card className="bg-slate-900 border-slate-800">
        <CardHeader>
          <CardTitle className="text-white text-lg">Refactoring Summary</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-red-400">{session.critical_count || 0}</div>
              <div className="text-xs text-slate-400">Critical</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-orange-400">{session.high_count || 0}</div>
              <div className="text-xs text-slate-400">High</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-yellow-400">{session.medium_count || 0}</div>
              <div className="text-xs text-slate-400">Medium</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-blue-400">{session.low_count || 0}</div>
              <div className="text-xs text-slate-400">Low</div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Filters */}
      <div className="flex flex-wrap gap-4">
        <div>
          <label className="text-sm text-slate-400 mb-2 block">Stage</label>
          <div className="flex gap-2">
            <Button
              size="sm"
              variant={selectedStage === 'all' ? 'default' : 'outline'}
              onClick={() => setSelectedStage('all')}
              className={selectedStage === 'all' ? '' : 'border-slate-700'}
            >
              All
            </Button>
            {[0, 1, 2, 3].map(stage => (
              <Button
                key={stage}
                size="sm"
                variant={selectedStage === String(stage) ? 'default' : 'outline'}
                onClick={() => setSelectedStage(String(stage))}
                className={selectedStage === String(stage) ? '' : 'border-slate-700'}
              >
                {stage}
              </Button>
            ))}
          </div>
        </div>

        <div>
          <label className="text-sm text-slate-400 mb-2 block">Category</label>
          <div className="flex flex-wrap gap-2">
            <Button
              size="sm"
              variant={selectedCategory === 'all' ? 'default' : 'outline'}
              onClick={() => setSelectedCategory('all')}
              className={selectedCategory === 'all' ? '' : 'border-slate-700'}
            >
              All
            </Button>
            {Object.entries(CATEGORY_LABELS).map(([key, { label }]) => (
              <Button
                key={key}
                size="sm"
                variant={selectedCategory === key ? 'default' : 'outline'}
                onClick={() => setSelectedCategory(key)}
                className={selectedCategory === key ? '' : 'border-slate-700'}
              >
                {label}
              </Button>
            ))}
          </div>
        </div>
      </div>

      {/* Recommendations List */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold text-white">
            {filteredRecommendations.length} Recommendation{filteredRecommendations.length !== 1 ? 's' : ''}
          </h3>
        </div>

        {filteredRecommendations.length === 0 ? (
          <Card className="bg-slate-900 border-slate-800">
            <CardContent className="p-8 text-center">
              <div className="text-slate-400">No recommendations match your filters</div>
            </CardContent>
          </Card>
        ) : (
          filteredRecommendations.map(rec => (
            <RecommendationCard
              key={rec.id}
              recommendation={rec}
              onApply={handleApply}
              onRollback={handleRollback}
              onDismiss={handleDismiss}
            />
          ))
        )}
      </div>
    </div>
  );
}
