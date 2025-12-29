import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Lightbulb, TrendingUp, Loader2, AlertTriangle } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';

export default function ExplainabilityDashboard() {
  const [logs, setLogs] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadLogs();
  }, []);

  const loadLogs = async () => {
    try {
      const data = await base44.entities.ExplainabilityLog.list('-timestamp', 50);
      setLogs(data);
    } catch (error) {
      console.error('Failed to load explainability logs:', error);
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-8 h-8 animate-spin text-blue-500" />
      </div>
    );
  }

  if (logs.length === 0) {
    return (
      <Card className="bg-slate-900 border-slate-800">
        <CardContent className="flex flex-col items-center justify-center h-96 text-slate-400">
          <Lightbulb className="w-16 h-16 mb-4 opacity-50" />
          <p>No explainability logs yet</p>
          <p className="text-sm mt-2">AI decision explanations will appear here</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      <Card className="bg-slate-900 border-slate-800">
        <CardHeader>
          <CardTitle className="text-white flex items-center gap-2">
            <Lightbulb className="w-5 h-5 text-yellow-400" />
            AI Decision Explainability
          </CardTitle>
          <p className="text-sm text-slate-400">
            Transparent insights into agent decision-making processes
          </p>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {logs.map((log) => (
              <ExplainabilityCard key={log.id} log={log} />
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

function ExplainabilityCard({ log }) {
  const [isExpanded, setIsExpanded] = useState(false);

  const confidenceColor = 
    log.confidence_score >= 0.8 ? 'text-green-400' :
    log.confidence_score >= 0.5 ? 'text-yellow-400' :
    'text-red-400';

  return (
    <div className="p-4 bg-slate-800 rounded-lg border border-slate-700">
      <div className="flex items-start justify-between mb-3">
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-1">
            <h4 className="text-white font-medium">{log.decision_point}</h4>
            <Badge variant="outline" className="text-xs">
              {log.model_used}
            </Badge>
          </div>
          <p className="text-xs text-slate-500">
            {new Date(log.timestamp).toLocaleString()}
          </p>
        </div>
        <div className="text-right">
          <div className={`text-sm font-medium ${confidenceColor}`}>
            {(log.confidence_score * 100).toFixed(0)}% confidence
          </div>
          <Progress 
            value={log.confidence_score * 100} 
            className="h-1 w-20 mt-1"
            indicatorClassName={log.confidence_score >= 0.8 ? 'bg-green-500' : log.confidence_score >= 0.5 ? 'bg-yellow-500' : 'bg-red-500'}
          />
        </div>
      </div>

      <div className="mb-3 p-3 bg-slate-900 rounded text-sm text-slate-300">
        <div className="text-xs text-slate-500 mb-1">Reasoning:</div>
        {log.reasoning}
      </div>

      {log.factors && log.factors.length > 0 && (
        <div className="mb-3">
          <div className="text-xs text-slate-500 mb-2">Key Factors:</div>
          <div className="space-y-2">
            {log.factors.map((factor, i) => (
              <div key={i} className="flex items-center gap-3">
                <div className="flex-1">
                  <div className="text-xs text-slate-300">{factor.factor}</div>
                  <Progress 
                    value={factor.weight * 100} 
                    className="h-1 mt-1"
                    indicatorClassName={
                      factor.impact === 'positive' ? 'bg-green-500' :
                      factor.impact === 'negative' ? 'bg-red-500' :
                      'bg-slate-500'
                    }
                  />
                </div>
                <Badge className={
                  factor.impact === 'positive' ? 'bg-green-900/30 text-green-300' :
                  factor.impact === 'negative' ? 'bg-red-900/30 text-red-300' :
                  'bg-slate-700 text-slate-300'
                }>
                  {factor.impact}
                </Badge>
              </div>
            ))}
          </div>
        </div>
      )}

      {log.alternative_paths && log.alternative_paths.length > 0 && (
        <div>
          <button
            onClick={() => setIsExpanded(!isExpanded)}
            className="text-xs text-blue-400 hover:text-blue-300 flex items-center gap-1"
          >
            <AlertTriangle className="w-3 h-3" />
            {log.alternative_paths.length} alternative paths considered
          </button>
          
          {isExpanded && (
            <div className="mt-2 space-y-2">
              {log.alternative_paths.map((alt, i) => (
                <div key={i} className="p-2 bg-slate-900 rounded text-xs">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-slate-300">{alt.path}</span>
                    <span className="text-slate-500">{(alt.probability * 100).toFixed(0)}%</span>
                  </div>
                  <div className="text-slate-500">{alt.why_not_chosen}</div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}