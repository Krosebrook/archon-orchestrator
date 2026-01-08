import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import {
  GitCompare,
  Trophy,
  TrendingUp,
  TrendingDown,
  Minus,
  BarChart3,
  Target,
  Loader2,
  Info,
  CheckCircle,
  AlertTriangle
} from 'lucide-react';
import { compareTrainingRuns } from '@/functions/compareTrainingRuns';
import { toast } from 'sonner';
import { handleError } from '../utils/api-client';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Radar,
  Legend
} from 'recharts';

/**
 * A/B Testing Framework Component
 *
 * Enables comparison of multiple training runs:
 * - Select runs to compare
 * - Statistical significance analysis
 * - Visual comparison charts
 * - Winner determination
 * - Recommendations
 */
export default function ABTestingFramework({ trainingJobs, agents }) {
  const [selectedRuns, setSelectedRuns] = useState([]);
  const [comparisonMetrics, setComparisonMetrics] = useState([
    'accuracy', 'loss', 'validation_accuracy', 'training_time'
  ]);
  const [isComparing, setIsComparing] = useState(false);
  const [comparisonResult, setComparisonResult] = useState(null);

  const availableMetrics = [
    { id: 'accuracy', label: 'Accuracy' },
    { id: 'loss', label: 'Loss' },
    { id: 'validation_accuracy', label: 'Validation Accuracy' },
    { id: 'validation_loss', label: 'Validation Loss' },
    { id: 'training_time', label: 'Training Time' },
    { id: 'convergence_speed', label: 'Convergence Speed' },
    { id: 'stability', label: 'Stability' },
    { id: 'cost_efficiency', label: 'Cost Efficiency' }
  ];

  // Toggle run selection
  const toggleRunSelection = (jobId) => {
    setSelectedRuns(prev => {
      if (prev.includes(jobId)) {
        return prev.filter(id => id !== jobId);
      }
      if (prev.length >= 5) {
        toast.warning('Maximum 5 runs can be compared');
        return prev;
      }
      return [...prev, jobId];
    });
  };

  // Toggle metric selection
  const toggleMetric = (metricId) => {
    setComparisonMetrics(prev => {
      if (prev.includes(metricId)) {
        return prev.filter(id => id !== metricId);
      }
      return [...prev, metricId];
    });
  };

  // Run comparison
  const runComparison = async () => {
    if (selectedRuns.length < 2) {
      toast.error('Select at least 2 runs to compare');
      return;
    }

    setIsComparing(true);
    try {
      const { data: result } = await compareTrainingRuns({
        run_ids: selectedRuns,
        comparison_metrics: comparisonMetrics,
        statistical_tests: true,
        generate_recommendations: true
      });

      setComparisonResult(result);
      toast.success('Comparison complete');
    } catch (error) {
      handleError(error);
    } finally {
      setIsComparing(false);
    }
  };

  // Get agent name for job
  const getAgentName = (agentId) => {
    const agent = agents.find(a => a.id === agentId);
    return agent?.name || 'Unknown Agent';
  };

  // Prepare chart data
  const prepareBarChartData = () => {
    if (!comparisonResult?.metric_comparisons) return [];

    return Object.entries(comparisonResult.metric_comparisons).map(([metric, data]) => ({
      metric: metric.replace(/_/g, ' '),
      ...data.values.reduce((acc, v, i) => ({
        ...acc,
        [`Run ${i + 1}`]: typeof v.value === 'number' ? v.value : 0
      }), {})
    }));
  };

  // Prepare radar chart data
  const prepareRadarData = () => {
    if (!comparisonResult?.runs) return [];

    return comparisonResult.runs.map((run, idx) => ({
      run: `Run ${idx + 1}`,
      accuracy: (run.results?.final_accuracy || 0) * 100,
      efficiency: Math.min(100, (1 - (run.results?.final_loss || 1)) * 100),
      speed: Math.min(100, 100 - ((run.results?.training_time_ms || 0) / 10000)),
      stability: run.results?.final_validation_accuracy ?
        (1 - Math.abs((run.results?.final_accuracy || 0) - run.results.final_validation_accuracy)) * 100 : 50
    }));
  };

  const COLORS = ['#3b82f6', '#8b5cf6', '#10b981', '#f59e0b', '#ef4444'];

  return (
    <div className="space-y-6">
      {/* Run Selection */}
      <Card className="bg-slate-900 border-slate-800">
        <CardHeader>
          <CardTitle className="text-white flex items-center gap-2">
            <GitCompare className="w-5 h-5 text-blue-400" />
            Select Runs to Compare
          </CardTitle>
          <CardDescription>
            Choose 2-5 completed training runs for comparison
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-3 max-h-64 overflow-y-auto">
            {trainingJobs.filter(j => j.status === 'completed').map((job) => {
              const isSelected = selectedRuns.includes(job.id);
              return (
                <div
                  key={job.id}
                  onClick={() => toggleRunSelection(job.id)}
                  className={`flex items-center justify-between p-3 rounded-lg border cursor-pointer transition-all ${isSelected
                    ? 'bg-blue-600/20 border-blue-500'
                    : 'bg-slate-950 border-slate-800 hover:border-slate-700'
                    }`}
                >
                  <div className="flex items-center gap-3">
                    <Checkbox checked={isSelected} />
                    <div>
                      <p className="text-sm font-medium text-white">
                        {getAgentName(job.agent_id)}
                      </p>
                      <p className="text-xs text-slate-400">
                        {job.config?.trainingType} | {job.config?.total_epochs} epochs
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-medium text-white">
                      {job.results?.final_accuracy ? `${(job.results.final_accuracy * 100).toFixed(1)}%` : '--'}
                    </p>
                    <p className="text-xs text-slate-400">
                      Loss: {job.results?.final_loss?.toFixed(4) || '--'}
                    </p>
                  </div>
                </div>
              );
            })}

            {trainingJobs.filter(j => j.status === 'completed').length === 0 && (
              <div className="text-center py-8 text-slate-400">
                <Info className="w-8 h-8 mx-auto mb-2 opacity-50" />
                <p>No completed training runs available</p>
              </div>
            )}
          </div>

          {/* Metric Selection */}
          <div className="mt-6">
            <Label className="text-slate-300 mb-3 block">Comparison Metrics</Label>
            <div className="flex flex-wrap gap-2">
              {availableMetrics.map((metric) => (
                <Button
                  key={metric.id}
                  variant={comparisonMetrics.includes(metric.id) ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => toggleMetric(metric.id)}
                  className={comparisonMetrics.includes(metric.id) ? 'bg-purple-600' : ''}
                >
                  {metric.label}
                </Button>
              ))}
            </div>
          </div>

          {/* Compare Button */}
          <Button
            onClick={runComparison}
            disabled={selectedRuns.length < 2 || isComparing}
            className="w-full mt-6 bg-blue-600 hover:bg-blue-700"
          >
            {isComparing ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Comparing...
              </>
            ) : (
              <>
                <BarChart3 className="w-4 h-4 mr-2" />
                Compare {selectedRuns.length} Runs
              </>
            )}
          </Button>
        </CardContent>
      </Card>

      {/* Comparison Results */}
      {comparisonResult && (
        <>
          {/* Winner Announcement */}
          <Card className="bg-gradient-to-r from-yellow-600/20 to-orange-600/20 border-yellow-500/30">
            <CardContent className="pt-6">
              <div className="flex items-center gap-4">
                <Trophy className="w-12 h-12 text-yellow-400" />
                <div>
                  <p className="text-sm text-yellow-300">Best Performing Run</p>
                  <p className="text-2xl font-bold text-white">
                    {getAgentName(comparisonResult.winner?.job_id?.split('_')[0] || '')}
                  </p>
                  <p className="text-sm text-slate-300">
                    Score: {(comparisonResult.winner?.score * 100).toFixed(1)}% |
                    Margin: {((comparisonResult.winner?.margin || 0) * 100).toFixed(1)}%
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Metric Comparison */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Bar Chart */}
            <Card className="bg-slate-900 border-slate-800">
              <CardHeader>
                <CardTitle className="text-white text-sm">Metric Comparison</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={prepareBarChartData()}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                    <XAxis dataKey="metric" stroke="#94a3b8" fontSize={10} />
                    <YAxis stroke="#94a3b8" fontSize={10} />
                    <Tooltip
                      contentStyle={{ backgroundColor: '#1e293b', border: '1px solid #334155' }}
                      labelStyle={{ color: '#f1f5f9' }}
                    />
                    <Legend />
                    {selectedRuns.map((_, idx) => (
                      <Bar
                        key={idx}
                        dataKey={`Run ${idx + 1}`}
                        fill={COLORS[idx % COLORS.length]}
                      />
                    ))}
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            {/* Radar Chart */}
            <Card className="bg-slate-900 border-slate-800">
              <CardHeader>
                <CardTitle className="text-white text-sm">Performance Overview</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <RadarChart data={[
                    { subject: 'Accuracy', fullMark: 100 },
                    { subject: 'Efficiency', fullMark: 100 },
                    { subject: 'Speed', fullMark: 100 },
                    { subject: 'Stability', fullMark: 100 }
                  ]}>
                    <PolarGrid stroke="#334155" />
                    <PolarAngleAxis dataKey="subject" stroke="#94a3b8" fontSize={10} />
                    <PolarRadiusAxis angle={30} domain={[0, 100]} stroke="#94a3b8" />
                    {prepareRadarData().map((run, idx) => (
                      <Radar
                        key={idx}
                        name={run.run}
                        dataKey={(d) => {
                          const key = d.subject.toLowerCase();
                          return run[key] || 0;
                        }}
                        stroke={COLORS[idx % COLORS.length]}
                        fill={COLORS[idx % COLORS.length]}
                        fillOpacity={0.2}
                      />
                    ))}
                    <Legend />
                  </RadarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>

          {/* Detailed Results Table */}
          <Card className="bg-slate-900 border-slate-800">
            <CardHeader>
              <CardTitle className="text-white text-sm">Detailed Results</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-slate-700">
                      <th className="text-left py-2 px-3 text-slate-400">Run</th>
                      <th className="text-left py-2 px-3 text-slate-400">Agent</th>
                      <th className="text-right py-2 px-3 text-slate-400">Accuracy</th>
                      <th className="text-right py-2 px-3 text-slate-400">Loss</th>
                      <th className="text-right py-2 px-3 text-slate-400">Duration</th>
                      <th className="text-right py-2 px-3 text-slate-400">Score</th>
                    </tr>
                  </thead>
                  <tbody>
                    {comparisonResult.runs?.map((run, idx) => {
                      const isWinner = comparisonResult.winner?.job_id === run.job_id;
                      const ranking = comparisonResult.overall_ranking?.find(r => r.job_id === run.job_id);

                      return (
                        <tr
                          key={run.job_id}
                          className={`border-b border-slate-800 ${isWinner ? 'bg-yellow-500/10' : ''}`}
                        >
                          <td className="py-2 px-3">
                            <div className="flex items-center gap-2">
                              {isWinner && <Trophy className="w-4 h-4 text-yellow-400" />}
                              <span className="text-white">Run {idx + 1}</span>
                            </div>
                          </td>
                          <td className="py-2 px-3 text-white">{getAgentName(run.agent_id)}</td>
                          <td className="py-2 px-3 text-right text-white">
                            {run.results?.final_accuracy ? `${(run.results.final_accuracy * 100).toFixed(2)}%` : '--'}
                          </td>
                          <td className="py-2 px-3 text-right text-white">
                            {run.results?.final_loss?.toFixed(4) || '--'}
                          </td>
                          <td className="py-2 px-3 text-right text-white">
                            {run.results?.training_time_ms ? `${Math.round(run.results.training_time_ms / 60000)}m` : '--'}
                          </td>
                          <td className="py-2 px-3 text-right">
                            <Badge className={isWinner ? 'bg-yellow-500/20 text-yellow-400' : 'bg-slate-700'}>
                              {ranking?.score ? `${(ranking.score * 100).toFixed(0)}%` : '--'}
                            </Badge>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>

          {/* Statistical Analysis */}
          {comparisonResult.statistical_analysis && (
            <Card className="bg-slate-900 border-slate-800">
              <CardHeader>
                <CardTitle className="text-white text-sm flex items-center gap-2">
                  <Target className="w-4 h-4 text-green-400" />
                  Statistical Significance
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div className="p-3 bg-slate-950 rounded">
                    <p className="text-xs text-slate-500">Significant</p>
                    <p className="text-lg font-semibold text-white flex items-center gap-2">
                      {comparisonResult.statistical_analysis.accuracy_comparison?.significant ? (
                        <><CheckCircle className="w-4 h-4 text-green-400" /> Yes</>
                      ) : (
                        <><AlertTriangle className="w-4 h-4 text-yellow-400" /> No</>
                      )}
                    </p>
                  </div>
                  <div className="p-3 bg-slate-950 rounded">
                    <p className="text-xs text-slate-500">P-Value</p>
                    <p className="text-lg font-semibold text-white">
                      {comparisonResult.statistical_analysis.accuracy_comparison?.pValue?.toFixed(3) || '--'}
                    </p>
                  </div>
                  <div className="p-3 bg-slate-950 rounded">
                    <p className="text-xs text-slate-500">Effect Size</p>
                    <p className="text-lg font-semibold text-white">
                      {comparisonResult.statistical_analysis.accuracy_comparison?.effectSize?.toFixed(3) || '--'}
                    </p>
                  </div>
                  <div className="p-3 bg-slate-950 rounded">
                    <p className="text-xs text-slate-500">Improvement</p>
                    <p className="text-lg font-semibold text-green-400">
                      +{comparisonResult.statistical_analysis.improvement_percent?.toFixed(1) || 0}%
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Recommendations */}
          {comparisonResult.recommendations && (
            <Card className="bg-slate-900 border-slate-800">
              <CardHeader>
                <CardTitle className="text-white text-sm">AI Recommendations</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {comparisonResult.recommendations.summary && (
                  <p className="text-slate-300">{comparisonResult.recommendations.summary}</p>
                )}

                {comparisonResult.recommendations.next_steps?.map((step, idx) => (
                  <div
                    key={idx}
                    className={`p-3 rounded border-l-4 ${step.priority === 'high' ? 'bg-red-500/10 border-red-500' :
                      step.priority === 'medium' ? 'bg-yellow-500/10 border-yellow-500' :
                        'bg-green-500/10 border-green-500'
                      }`}
                  >
                    <p className="text-sm font-medium text-white">{step.action}</p>
                    <p className="text-xs text-slate-400 mt-1">{step.expected_impact}</p>
                  </div>
                ))}

                {comparisonResult.recommendations.optimal_config && (
                  <div className="p-4 bg-slate-950 rounded">
                    <p className="text-sm font-medium text-white mb-2">Optimal Configuration</p>
                    <pre className="text-xs text-slate-300">
                      {JSON.stringify(comparisonResult.recommendations.optimal_config, null, 2)}
                    </pre>
                  </div>
                )}
              </CardContent>
            </Card>
          )}
        </>
      )}
    </div>
  );
}
