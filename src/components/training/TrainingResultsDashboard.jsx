import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Award,
  TrendingUp,
  FileText,
  Download,
  RefreshCw,
  Loader2,
  CheckCircle,
  AlertTriangle,
  Star,
  Clock,
  Zap
} from 'lucide-react';
import { evaluateTrainingResults } from '@/functions/evaluateTrainingResults';
import { generateTrainingReport } from '@/functions/generateTrainingReport';
import { toast } from 'sonner';
import { handleError } from '../utils/api-client';
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Legend,
  RadialBarChart,
  RadialBar
} from 'recharts';

/**
 * Training Results Dashboard Component
 *
 * Comprehensive view of training results including:
 * - Performance evaluation
 * - Quality grades
 * - Strengths/weaknesses analysis
 * - Actionable recommendations
 * - Report generation
 */
export default function TrainingResultsDashboard({ job, agent, onRefresh }) {
  const [evaluation, setEvaluation] = useState(null);
  const [isEvaluating, setIsEvaluating] = useState(false);
  const [isGeneratingReport, setIsGeneratingReport] = useState(false);
  const [activeTab, setActiveTab] = useState('overview');

  // Load evaluation on mount
  useEffect(() => {
    if (job?.id && job.status === 'completed' && !evaluation) {
      evaluateResults();
    }
  }, [job?.id, job?.status]);

  // Evaluate training results
  const evaluateResults = async () => {
    if (!job?.id) return;

    setIsEvaluating(true);
    try {
      const { data: result } = await evaluateTrainingResults({
        job_id: job.id,
        evaluation_criteria: ['accuracy', 'precision', 'recall', 'f1_score', 'latency', 'consistency']
      });

      setEvaluation(result);
    } catch (error) {
      handleError(error);
    } finally {
      setIsEvaluating(false);
    }
  };

  // Generate and download report
  const downloadReport = async (format) => {
    setIsGeneratingReport(true);
    try {
      const { data: result } = await generateTrainingReport({
        job_id: job.id,
        report_type: 'single_job',
        include_sections: ['summary', 'metrics', 'charts', 'recommendations', 'cost_analysis'],
        format
      });

      // Download the report
      const blob = new Blob([result.content], {
        type: format === 'json' ? 'application/json' :
          format === 'markdown' ? 'text/markdown' : 'text/html'
      });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `training-report-${job.id.slice(0, 8)}.${format === 'markdown' ? 'md' : format}`;
      a.click();
      URL.revokeObjectURL(url);

      toast.success('Report downloaded');
    } catch (error) {
      handleError(error);
    } finally {
      setIsGeneratingReport(false);
    }
  };

  // Grade color mapping
  const gradeColors = {
    A: 'bg-green-500',
    B: 'bg-blue-500',
    C: 'bg-yellow-500',
    D: 'bg-orange-500',
    F: 'bg-red-500'
  };

  // Score gauge data
  const scoreGaugeData = evaluation ? [{
    name: 'Score',
    value: evaluation.evaluation?.overall_score || 0,
    fill: evaluation.evaluation?.overall_score >= 80 ? '#22c55e' :
      evaluation.evaluation?.overall_score >= 60 ? '#3b82f6' :
        evaluation.evaluation?.overall_score >= 40 ? '#f59e0b' : '#ef4444'
  }] : [];

  // Metric scores chart data
  const metricScoresData = evaluation?.evaluation?.metric_scores ?
    Object.entries(evaluation.evaluation.metric_scores).map(([key, value]) => ({
      metric: key.replace(/_/g, ' '),
      score: typeof value === 'number' ? value * 100 : 0
    })) : [];

  // Analysis status colors
  const analysisStatusColors = {
    converged: 'text-green-400',
    converging: 'text-blue-400',
    not_converged: 'text-yellow-400',
    diverging: 'text-red-400',
    none: 'text-green-400',
    low: 'text-blue-400',
    moderate: 'text-yellow-400',
    high: 'text-red-400'
  };

  if (job?.status !== 'completed') {
    return (
      <Card className="bg-slate-900 border-slate-800">
        <CardContent className="py-12 text-center">
          <Clock className="w-12 h-12 text-slate-500 mx-auto mb-4" />
          <p className="text-slate-400">Results will be available once training is completed</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header with Grade */}
      <Card className="bg-slate-900 border-slate-800">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-white flex items-center gap-2">
                <Award className="w-5 h-5 text-yellow-400" />
                Training Results
              </CardTitle>
              <CardDescription>{agent?.name || 'Agent'} - Job {job.id.slice(0, 8)}</CardDescription>
            </div>
            <div className="flex items-center gap-4">
              {evaluation?.evaluation?.quality_grade && (
                <div className={`w-16 h-16 rounded-full ${gradeColors[evaluation.evaluation.quality_grade]} flex items-center justify-center`}>
                  <span className="text-3xl font-bold text-white">{evaluation.evaluation.quality_grade}</span>
                </div>
              )}
              <Button
                variant="outline"
                size="sm"
                onClick={evaluateResults}
                disabled={isEvaluating}
              >
                {isEvaluating ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <RefreshCw className="w-4 h-4" />
                )}
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="p-4 bg-slate-950 rounded-lg text-center">
              <p className="text-xs text-slate-500 mb-1">Final Accuracy</p>
              <p className="text-2xl font-bold text-green-400">
                {job.results?.final_accuracy ? `${(job.results.final_accuracy * 100).toFixed(1)}%` : '--'}
              </p>
            </div>
            <div className="p-4 bg-slate-950 rounded-lg text-center">
              <p className="text-xs text-slate-500 mb-1">Final Loss</p>
              <p className="text-2xl font-bold text-blue-400">
                {job.results?.final_loss?.toFixed(4) || '--'}
              </p>
            </div>
            <div className="p-4 bg-slate-950 rounded-lg text-center">
              <p className="text-xs text-slate-500 mb-1">Training Time</p>
              <p className="text-2xl font-bold text-purple-400">
                {job.results?.total_training_time_ms ?
                  `${Math.round(job.results.total_training_time_ms / 60000)}m` : '--'}
              </p>
            </div>
            <div className="p-4 bg-slate-950 rounded-lg text-center">
              <p className="text-xs text-slate-500 mb-1">Overall Score</p>
              <p className="text-2xl font-bold text-yellow-400">
                {evaluation?.evaluation?.overall_score || '--'}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Detailed Results */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-4 bg-slate-800">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="analysis">Analysis</TabsTrigger>
          <TabsTrigger value="recommendations">Recommendations</TabsTrigger>
          <TabsTrigger value="export">Export</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="mt-6 space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Score Gauge */}
            <Card className="bg-slate-900 border-slate-800">
              <CardHeader>
                <CardTitle className="text-white text-sm">Performance Score</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={200}>
                  <RadialBarChart
                    cx="50%"
                    cy="50%"
                    innerRadius="60%"
                    outerRadius="100%"
                    barSize={20}
                    data={scoreGaugeData}
                    startAngle={180}
                    endAngle={0}
                  >
                    <RadialBar
                      minAngle={15}
                      background
                      clockWise
                      dataKey="value"
                    />
                  </RadialBarChart>
                </ResponsiveContainer>
                <div className="text-center -mt-8">
                  <p className="text-4xl font-bold text-white">
                    {evaluation?.evaluation?.overall_score || 0}
                  </p>
                  <p className="text-slate-400">out of 100</p>
                </div>
              </CardContent>
            </Card>

            {/* Metric Scores */}
            <Card className="bg-slate-900 border-slate-800">
              <CardHeader>
                <CardTitle className="text-white text-sm">Metric Breakdown</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={250}>
                  <BarChart data={metricScoresData} layout="vertical">
                    <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                    <XAxis type="number" domain={[0, 100]} stroke="#94a3b8" />
                    <YAxis dataKey="metric" type="category" stroke="#94a3b8" width={80} fontSize={10} />
                    <Tooltip
                      contentStyle={{ backgroundColor: '#1e293b', border: '1px solid #334155' }}
                    />
                    <Bar dataKey="score" fill="#3b82f6" radius={4} />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>

          {/* Summary */}
          {evaluation?.evaluation?.summary && (
            <Card className="bg-slate-900 border-slate-800">
              <CardHeader>
                <CardTitle className="text-white text-sm">Summary</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-slate-300">{evaluation.evaluation.summary}</p>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="analysis" className="mt-6 space-y-6">
          {/* Convergence Analysis */}
          {evaluation?.analysis && (
            <Card className="bg-slate-900 border-slate-800">
              <CardHeader>
                <CardTitle className="text-white text-sm">Training Analysis</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div className="p-3 bg-slate-950 rounded">
                    <p className="text-xs text-slate-500">Convergence</p>
                    <p className={`text-lg font-semibold capitalize ${analysisStatusColors[evaluation.analysis.convergence_status]}`}>
                      {evaluation.analysis.convergence_status?.replace(/_/g, ' ')}
                    </p>
                  </div>
                  <div className="p-3 bg-slate-950 rounded">
                    <p className="text-xs text-slate-500">Overfitting Risk</p>
                    <p className={`text-lg font-semibold capitalize ${analysisStatusColors[evaluation.analysis.overfitting_risk]}`}>
                      {evaluation.analysis.overfitting_risk}
                    </p>
                  </div>
                  <div className="p-3 bg-slate-950 rounded">
                    <p className="text-xs text-slate-500">Underfitting Risk</p>
                    <p className={`text-lg font-semibold capitalize ${analysisStatusColors[evaluation.analysis.underfitting_risk]}`}>
                      {evaluation.analysis.underfitting_risk}
                    </p>
                  </div>
                  <div className="p-3 bg-slate-950 rounded">
                    <p className="text-xs text-slate-500">Training Efficiency</p>
                    <p className="text-lg font-semibold text-white">
                      {evaluation.analysis.training_efficiency?.toFixed(0) || '--'}%
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Strengths */}
          {evaluation?.strengths?.length > 0 && (
            <Card className="bg-slate-900 border-slate-800">
              <CardHeader>
                <CardTitle className="text-white text-sm flex items-center gap-2">
                  <CheckCircle className="w-4 h-4 text-green-400" />
                  Strengths
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2">
                  {evaluation.strengths.map((strength, idx) => (
                    <li key={idx} className="flex items-start gap-2 text-sm text-slate-300">
                      <Star className="w-4 h-4 text-green-400 shrink-0 mt-0.5" />
                      {strength}
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>
          )}

          {/* Weaknesses */}
          {evaluation?.weaknesses?.length > 0 && (
            <Card className="bg-slate-900 border-slate-800">
              <CardHeader>
                <CardTitle className="text-white text-sm flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4 text-yellow-400" />
                  Areas for Improvement
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2">
                  {evaluation.weaknesses.map((weakness, idx) => (
                    <li key={idx} className="flex items-start gap-2 text-sm text-slate-300">
                      <AlertTriangle className="w-4 h-4 text-yellow-400 shrink-0 mt-0.5" />
                      {weakness}
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>
          )}

          {/* Training Efficiency */}
          <Card className="bg-slate-900 border-slate-800">
            <CardHeader>
              <CardTitle className="text-white text-sm flex items-center gap-2">
                <Zap className="w-4 h-4 text-yellow-400" />
                Training Efficiency
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="p-3 bg-slate-950 rounded">
                  <p className="text-xs text-slate-500">Samples/Second</p>
                  <p className="text-lg font-semibold text-white">
                    {evaluation?.training_efficiency?.samples_per_second?.toFixed(1) || '--'}
                  </p>
                </div>
                <div className="p-3 bg-slate-950 rounded">
                  <p className="text-xs text-slate-500">Epochs to Best</p>
                  <p className="text-lg font-semibold text-white">
                    {evaluation?.training_efficiency?.epochs_to_best || '--'}
                  </p>
                </div>
                <div className="p-3 bg-slate-950 rounded">
                  <p className="text-xs text-slate-500">Early Stopping</p>
                  <p className="text-lg font-semibold text-white">
                    {evaluation?.training_efficiency?.early_stopping_triggered ? 'Yes' : 'No'}
                  </p>
                </div>
                <div className="p-3 bg-slate-950 rounded">
                  <p className="text-xs text-slate-500">Checkpoints</p>
                  <p className="text-lg font-semibold text-white">
                    {evaluation?.training_efficiency?.checkpoint_count || 0}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="recommendations" className="mt-6">
          <Card className="bg-slate-900 border-slate-800">
            <CardHeader>
              <CardTitle className="text-white text-sm">Actionable Recommendations</CardTitle>
            </CardHeader>
            <CardContent>
              {evaluation?.recommendations?.length > 0 ? (
                <div className="space-y-4">
                  {evaluation.recommendations.map((rec, idx) => (
                    <div
                      key={idx}
                      className={`p-4 rounded-lg border-l-4 ${rec.priority === 'high' ? 'bg-red-500/10 border-red-500' :
                        rec.priority === 'medium' ? 'bg-yellow-500/10 border-yellow-500' :
                          'bg-green-500/10 border-green-500'
                        }`}
                    >
                      <div className="flex items-center justify-between mb-2">
                        <Badge className={
                          rec.priority === 'high' ? 'bg-red-500/20 text-red-400' :
                            rec.priority === 'medium' ? 'bg-yellow-500/20 text-yellow-400' :
                              'bg-green-500/20 text-green-400'
                        }>
                          {rec.priority} priority
                        </Badge>
                        <Badge variant="outline">{rec.category}</Badge>
                      </div>
                      <p className="text-white font-medium mb-1">{rec.recommendation}</p>
                      <p className="text-sm text-slate-400">{rec.expected_impact}</p>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 text-slate-400">
                  <FileText className="w-8 h-8 mx-auto mb-2 opacity-50" />
                  <p>Run evaluation to generate recommendations</p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="export" className="mt-6">
          <Card className="bg-slate-900 border-slate-800">
            <CardHeader>
              <CardTitle className="text-white text-sm">Export Training Report</CardTitle>
              <CardDescription>Download a comprehensive report of this training run</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <Button
                  onClick={() => downloadReport('json')}
                  disabled={isGeneratingReport}
                  variant="outline"
                  className="h-24 flex flex-col items-center justify-center gap-2"
                >
                  {isGeneratingReport ? <Loader2 className="w-6 h-6 animate-spin" /> : <Download className="w-6 h-6" />}
                  <span>JSON Format</span>
                  <span className="text-xs text-slate-400">Structured data</span>
                </Button>
                <Button
                  onClick={() => downloadReport('markdown')}
                  disabled={isGeneratingReport}
                  variant="outline"
                  className="h-24 flex flex-col items-center justify-center gap-2"
                >
                  {isGeneratingReport ? <Loader2 className="w-6 h-6 animate-spin" /> : <FileText className="w-6 h-6" />}
                  <span>Markdown</span>
                  <span className="text-xs text-slate-400">Documentation</span>
                </Button>
                <Button
                  onClick={() => downloadReport('html')}
                  disabled={isGeneratingReport}
                  variant="outline"
                  className="h-24 flex flex-col items-center justify-center gap-2"
                >
                  {isGeneratingReport ? <Loader2 className="w-6 h-6 animate-spin" /> : <FileText className="w-6 h-6" />}
                  <span>HTML Report</span>
                  <span className="text-xs text-slate-400">Shareable</span>
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
