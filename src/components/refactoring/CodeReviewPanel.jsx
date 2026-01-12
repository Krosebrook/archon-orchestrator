import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Loader2, Sparkles, AlertTriangle, CheckCircle2, Code } from 'lucide-react';
import { base44 } from '@/api/base44Client';
import { toast } from 'sonner';

const SEVERITY_STYLES = {
  critical: { badge: 'bg-red-500/20 text-red-400 border-red-500/30', icon: AlertTriangle },
  high: { badge: 'bg-orange-500/20 text-orange-400 border-orange-500/30', icon: AlertTriangle },
  medium: { badge: 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30', icon: Code },
  low: { badge: 'bg-blue-500/20 text-blue-400 border-blue-500/30', icon: CheckCircle2 }
};

export default function CodeReviewPanel({ onReviewComplete }) {
  const [isReviewing, setIsReviewing] = useState(false);
  const [review, setReview] = useState(null);

  const startReview = async () => {
    setIsReviewing(true);
    toast.info('Starting AI code review...');
    
    try {
      const response = await base44.functions.invoke('aiCodeReview', {
        title: `Code Review ${new Date().toLocaleDateString()}`,
        scope: {
          categories: ['security', 'performance', 'maintainability', 'best-practices']
        }
      });

      if (response.data.success) {
        setReview(response.data);
        toast.success(`Review complete! Found ${response.data.findings?.length || 0} issues`);
        onReviewComplete?.(response.data);
      } else {
        throw new Error('Review failed');
      }
    } catch (error) {
      console.error('Review error:', error);
      toast.error('Failed to complete code review');
    } finally {
      setIsReviewing(false);
    }
  };

  return (
    <Card className="bg-slate-900 border-slate-800">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="text-white text-lg">AI Code Review</CardTitle>
          <Button
            onClick={startReview}
            disabled={isReviewing}
            className="bg-purple-600 hover:bg-purple-700"
          >
            {isReviewing ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Reviewing...
              </>
            ) : (
              <>
                <Sparkles className="w-4 h-4 mr-2" />
                Start Review
              </>
            )}
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        {!review && !isReviewing && (
          <div className="text-center py-8 text-slate-400">
            Click "Start Review" to analyze your codebase
          </div>
        )}

        {review && (
          <div className="space-y-4">
            <div className="flex items-center justify-between p-4 bg-slate-950 rounded-lg border border-slate-800">
              <div>
                <div className="text-white font-medium">Overall Score</div>
                <div className="text-xs text-slate-400 mt-1">{review.summary}</div>
              </div>
              <div className="text-3xl font-bold text-blue-400">
                {review.overall_score}<span className="text-lg text-slate-500">/100</span>
              </div>
            </div>

            <div className="space-y-2">
              <div className="text-sm font-medium text-slate-300">
                Found {review.findings?.length || 0} Issues
              </div>
              {review.findings?.map((finding, idx) => {
                const severityStyle = SEVERITY_STYLES[finding.severity] || SEVERITY_STYLES.low;
                const Icon = severityStyle.icon;
                
                return (
                  <div key={idx} className="p-3 bg-slate-950 rounded-lg border border-slate-800">
                    <div className="flex items-start gap-3">
                      <Icon className="w-4 h-4 mt-0.5 text-slate-400" />
                      <div className="flex-1 space-y-2">
                        <div className="flex items-center gap-2">
                          <Badge variant="outline" className={severityStyle.badge}>
                            {finding.severity}
                          </Badge>
                          <Badge variant="outline" className="bg-slate-800 text-slate-400 border-slate-700">
                            {finding.category}
                          </Badge>
                        </div>
                        <div className="text-sm text-white">{finding.issue}</div>
                        <div className="text-xs text-slate-400">
                          <code className="bg-slate-900 px-2 py-1 rounded">{finding.file}:{finding.line}</code>
                        </div>
                        <div className="text-xs text-green-400 bg-green-500/10 p-2 rounded">
                          💡 {finding.suggestion}
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}