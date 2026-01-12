import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { CheckCircle2, AlertCircle, Info, Loader2, Sparkles } from 'lucide-react';
import { base44 } from '@/api/base44Client';

export default function OperationValidator({ operation, onApplyFix }) {
  const [validation, setValidation] = useState(null);
  const [isValidating, setIsValidating] = useState(false);

  useEffect(() => {
    // Auto-validate when operation changes (debounced)
    const timer = setTimeout(() => {
      if (operation?.id && operation?.name) {
        validateOperation();
      }
    }, 1000);

    return () => clearTimeout(timer);
  }, [operation]);

  const validateOperation = async () => {
    setIsValidating(true);
    try {
      const result = await base44.functions.invoke('validateOperationSchema', {
        operation,
      });

      if (result.data?.success) {
        setValidation(result.data.data);
      }
    } catch (error) {
      console.error('Validation error:', error);
    } finally {
      setIsValidating(false);
    }
  };

  if (!validation && !isValidating) {
    return null;
  }

  if (isValidating) {
    return (
      <Card className="bg-slate-800 border-slate-700">
        <CardContent className="py-4">
          <div className="flex items-center gap-2 text-slate-400">
            <Loader2 className="w-4 h-4 animate-spin" />
            <span className="text-sm">AI is analyzing your operation...</span>
          </div>
        </CardContent>
      </Card>
    );
  }

  const severityConfig = {
    error: { icon: AlertCircle, color: 'text-red-400', bg: 'bg-red-900/20' },
    warning: { icon: AlertCircle, color: 'text-yellow-400', bg: 'bg-yellow-900/20' },
    info: { icon: Info, color: 'text-blue-400', bg: 'bg-blue-900/20' },
  };

  return (
    <Card className="bg-slate-800 border-slate-700">
      <CardContent className="py-4 space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-purple-400" />
            <span className="text-sm font-medium">AI Validation Results</span>
          </div>
          <Badge
            variant={validation.score >= 80 ? 'default' : validation.score >= 60 ? 'secondary' : 'destructive'}
          >
            Score: {validation.score}/100
          </Badge>
        </div>

        {validation.issues && validation.issues.length > 0 && (
          <div className="space-y-2">
            {validation.issues.map((issue, idx) => {
              const config = severityConfig[issue.severity];
              const Icon = config.icon;
              return (
                <div key={idx} className={`p-2 rounded ${config.bg} text-sm`}>
                  <div className="flex items-start gap-2">
                    <Icon className={`w-4 h-4 ${config.color} mt-0.5`} />
                    <div>
                      <div className={`font-medium ${config.color}`}>{issue.field}</div>
                      <div className="text-slate-300">{issue.message}</div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {validation.suggestions && validation.suggestions.length > 0 && (
          <div className="space-y-1">
            <div className="text-xs font-medium text-slate-400">Suggestions:</div>
            {validation.suggestions.map((suggestion, idx) => (
              <div key={idx} className="text-sm text-slate-300 flex items-start gap-2">
                <CheckCircle2 className="w-3 h-3 text-green-400 mt-1" />
                <span>{suggestion}</span>
              </div>
            ))}
          </div>
        )}

        {validation.improved_schemas && validation.score < 80 && (
          <Button
            size="sm"
            onClick={() => onApplyFix(validation.improved_schemas)}
            className="w-full bg-purple-600 hover:bg-purple-700"
          >
            <Sparkles className="w-3 h-3 mr-2" />
            Apply AI Improvements
          </Button>
        )}
      </CardContent>
    </Card>
  );
}