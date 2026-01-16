import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Sparkles, Loader2, CheckCircle, Info } from 'lucide-react';
import { base44 } from '@/api/base44Client';
import { toast } from 'sonner';

export default function AIPolicySuggestions({ onApplySuggestion }) {
  const [suggestions, setSuggestions] = useState(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [isApplying, setIsApplying] = useState(null);

  const generateSuggestions = async () => {
    setIsGenerating(true);
    toast.info('Analyzing historical data...');

    try {
      const response = await base44.functions.invoke('generateRefactorPolicies');

      if (response.data.success) {
        setSuggestions(response.data);
        toast.success(`Generated ${response.data.suggested_policies.length} policy suggestions`);
      } else {
        throw new Error(response.data.error || 'Generation failed');
      }
    } catch (error) {
      console.error('Policy generation error:', error);
      toast.error(error.message || 'Failed to generate policies');
    } finally {
      setIsGenerating(false);
    }
  };

  const applySuggestion = async (policy) => {
    setIsApplying(policy.name);
    try {
      await onApplySuggestion(policy);
      toast.success('Policy created from suggestion');
    } catch (_error) {
      toast.error('Failed to create policy');
    } finally {
      setIsApplying(null);
    }
  };

  return (
    <Card className="bg-slate-900 border-slate-800">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="text-white flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-purple-400" />
            AI Policy Suggestions
          </CardTitle>
          {!suggestions && (
            <Button
              onClick={generateSuggestions}
              disabled={isGenerating}
              className="bg-purple-600 hover:bg-purple-700"
            >
              {isGenerating ? (
                <><Loader2 className="w-4 h-4 mr-2 animate-spin" />Analyzing...</>
              ) : (
                <><Sparkles className="w-4 h-4 mr-2" />Generate</>
              )}
            </Button>
          )}
        </div>
      </CardHeader>
      <CardContent>
        {!suggestions ? (
          <div className="text-center py-8">
            <Sparkles className="w-12 h-12 text-slate-600 mx-auto mb-3" />
            <p className="text-sm text-slate-400">
              AI will analyze your refactoring history to suggest optimal policies
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {suggestions.insights && (
              <div className="p-3 bg-blue-900/20 rounded-lg border border-blue-800/30">
                <div className="flex items-start gap-2">
                  <Info className="w-4 h-4 text-blue-400 mt-0.5 flex-shrink-0" />
                  <div className="text-sm text-blue-300">{suggestions.insights}</div>
                </div>
              </div>
            )}

            <div className="space-y-3">
              {suggestions.suggested_policies.map((policy, idx) => (
                <div key={idx} className="p-4 bg-slate-950 rounded-lg border border-slate-800">
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-white font-medium">{policy.name}</span>
                        <Badge variant="outline" className="bg-purple-500/20 text-purple-400 border-purple-500/30 text-xs">
                          AI Suggested
                        </Badge>
                      </div>
                      <p className="text-sm text-slate-400 mb-2">{policy.description}</p>
                      <div className="text-xs text-slate-500 mb-3">
                        💡 {policy.rationale}
                      </div>
                      <div className="flex flex-wrap gap-2 text-xs">
                        <Badge variant="outline" className="bg-slate-800 border-slate-700">
                          {policy.scope}
                        </Badge>
                        <Badge variant="outline" className="bg-slate-800 border-slate-700">
                          {policy.enforcement}
                        </Badge>
                        {policy.rules.max_severity_auto_apply && (
                          <Badge variant="outline" className="bg-slate-800 border-slate-700">
                            Auto-apply: {policy.rules.max_severity_auto_apply}
                          </Badge>
                        )}
                      </div>
                    </div>
                  </div>
                  <Button
                    size="sm"
                    onClick={() => applySuggestion(policy)}
                    disabled={isApplying !== null}
                    className="bg-purple-600 hover:bg-purple-700 mt-2"
                  >
                    {isApplying === policy.name ? (
                      <><Loader2 className="w-3 h-3 mr-1 animate-spin" />Applying...</>
                    ) : (
                      <><CheckCircle className="w-3 h-3 mr-1" />Apply Policy</>
                    )}
                  </Button>
                </div>
              ))}
            </div>

            {suggestions.analysis && (
              <div className="mt-4 pt-4 border-t border-slate-800">
                <div className="text-xs text-slate-500 space-y-1">
                  <div>📊 Analyzed {suggestions.analysis.sessions_analyzed} sessions</div>
                  <div>📝 {suggestions.analysis.recommendations_analyzed} recommendations reviewed</div>
                </div>
              </div>
            )}

            <Button
              variant="outline"
              size="sm"
              onClick={() => setSuggestions(null)}
              className="w-full border-slate-700"
            >
              Generate New Suggestions
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}