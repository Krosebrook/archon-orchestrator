import React, { useState, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Progress } from '@/components/ui/progress';
import {
  Database,
  Upload,
  FileText,
  Plus,
  Trash2,
  Download,
  CheckCircle,
  AlertTriangle,
  Loader2,
  Eye,
  Filter,
  Shuffle
} from 'lucide-react';
import { toast } from 'sonner';

/**
 * Training Dataset Manager Component
 *
 * Manages training data including:
 * - Manual data entry
 * - File upload (JSON/CSV)
 * - Data validation
 * - Data splitting (train/validation)
 * - Quality scoring
 * - Data augmentation options
 */
export default function TrainingDatasetManager({
  onDataChange,
  initialData = [],
  validationSplit = 0.2,
  onValidationSplitChange
}) {
  const [examples, setExamples] = useState(initialData);
  const [newExample, setNewExample] = useState({ input: '', expected_output: '', feedback: 'correct' });
  const [isValidating, setIsValidating] = useState(false);
  const [validationResults, setValidationResults] = useState(null);
  const [dataSource, setDataSource] = useState('manual');
  const [useAugmentation, setUseAugmentation] = useState(false);
  const [filterText, setFilterText] = useState('');

  // Quality metrics
  const qualityMetrics = React.useMemo(() => {
    if (examples.length === 0) return null;

    const avgInputLength = examples.reduce((sum, e) => sum + (e.input?.length || 0), 0) / examples.length;
    const avgOutputLength = examples.reduce((sum, e) => sum + (e.expected_output?.length || 0), 0) / examples.length;
    const correctCount = examples.filter(e => e.feedback === 'correct').length;
    const hasEmptyInputs = examples.some(e => !e.input?.trim());
    const hasEmptyOutputs = examples.some(e => !e.expected_output?.trim());

    const qualityScore = Math.round(
      ((correctCount / examples.length) * 40) +
      (hasEmptyInputs ? 0 : 30) +
      (hasEmptyOutputs ? 0 : 30)
    );

    return {
      totalExamples: examples.length,
      trainingSamples: Math.floor(examples.length * (1 - validationSplit)),
      validationSamples: Math.ceil(examples.length * validationSplit),
      avgInputLength: Math.round(avgInputLength),
      avgOutputLength: Math.round(avgOutputLength),
      correctCount,
      qualityScore,
      hasIssues: hasEmptyInputs || hasEmptyOutputs
    };
  }, [examples, validationSplit]);

  // Add new example
  const addExample = useCallback(() => {
    if (!newExample.input.trim()) {
      toast.error('Input is required');
      return;
    }

    const updatedExamples = [...examples, { ...newExample, id: crypto.randomUUID() }];
    setExamples(updatedExamples);
    onDataChange?.(updatedExamples);
    setNewExample({ input: '', expected_output: '', feedback: 'correct' });
    toast.success('Example added');
  }, [examples, newExample, onDataChange]);

  // Remove example
  const removeExample = useCallback((id) => {
    const updatedExamples = examples.filter(e => e.id !== id);
    setExamples(updatedExamples);
    onDataChange?.(updatedExamples);
  }, [examples, onDataChange]);

  // Handle file upload
  const handleFileUpload = useCallback(async (event) => {
    const file = event.target.files?.[0];
    if (!file) return;

    try {
      const text = await file.text();
      let parsed;

      if (file.name.endsWith('.json')) {
        parsed = JSON.parse(text);
        if (!Array.isArray(parsed)) {
          parsed = parsed.examples || parsed.data || [parsed];
        }
      } else if (file.name.endsWith('.csv')) {
        // Simple CSV parsing
        const lines = text.split('\n');
        const headers = lines[0].split(',').map(h => h.trim().toLowerCase());
        parsed = lines.slice(1).filter(l => l.trim()).map(line => {
          const values = line.split(',');
          const obj = {};
          headers.forEach((h, i) => {
            obj[h] = values[i]?.trim() || '';
          });
          return obj;
        });
      } else {
        throw new Error('Unsupported file format. Use JSON or CSV.');
      }

      // Normalize field names
      const normalized = parsed.map(item => ({
        id: crypto.randomUUID(),
        input: item.input || item.prompt || item.question || '',
        expected_output: item.expected_output || item.output || item.answer || item.response || '',
        feedback: item.feedback || 'correct'
      }));

      const updatedExamples = [...examples, ...normalized];
      setExamples(updatedExamples);
      onDataChange?.(updatedExamples);
      toast.success(`Imported ${normalized.length} examples`);
    } catch (error) {
      toast.error(`Failed to import: ${error.message}`);
    }

    // Reset input
    event.target.value = '';
  }, [examples, onDataChange]);

  // Validate data
  const validateData = useCallback(async () => {
    setIsValidating(true);
    try {
      // Simulate validation (in production, call backend)
      await new Promise(resolve => setTimeout(resolve, 1000));

      const issues = [];
      const validExamples = [];

      examples.forEach((ex, idx) => {
        const exIssues = [];

        if (!ex.input?.trim()) {
          exIssues.push('Empty input');
        }
        if (!ex.expected_output?.trim()) {
          exIssues.push('Empty output');
        }
        if (ex.input?.length < 10) {
          exIssues.push('Input too short');
        }

        if (exIssues.length > 0) {
          issues.push({ index: idx, id: ex.id, issues: exIssues });
        } else {
          validExamples.push(ex);
        }
      });

      setValidationResults({
        valid: issues.length === 0,
        totalChecked: examples.length,
        validCount: validExamples.length,
        issues
      });

      if (issues.length === 0) {
        toast.success('All examples validated successfully');
      } else {
        toast.warning(`Found ${issues.length} issues`);
      }
    } catch (error) {
      toast.error('Validation failed');
    } finally {
      setIsValidating(false);
    }
  }, [examples]);

  // Export data
  const exportData = useCallback(() => {
    const data = JSON.stringify({ examples }, null, 2);
    const blob = new Blob([data], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'training-data.json';
    a.click();
    URL.revokeObjectURL(url);
    toast.success('Data exported');
  }, [examples]);

  // Shuffle data
  const shuffleData = useCallback(() => {
    const shuffled = [...examples].sort(() => Math.random() - 0.5);
    setExamples(shuffled);
    onDataChange?.(shuffled);
    toast.success('Data shuffled');
  }, [examples, onDataChange]);

  // Filter examples
  const filteredExamples = filterText
    ? examples.filter(e =>
      e.input?.toLowerCase().includes(filterText.toLowerCase()) ||
      e.expected_output?.toLowerCase().includes(filterText.toLowerCase())
    )
    : examples;

  return (
    <div className="space-y-6">
      {/* Quality Overview */}
      <Card className="bg-slate-900 border-slate-800">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-white flex items-center gap-2">
                <Database className="w-5 h-5 text-blue-400" />
                Training Dataset
              </CardTitle>
              <CardDescription>
                Manage and validate your training data
              </CardDescription>
            </div>
            {qualityMetrics && (
              <div className="flex items-center gap-4">
                <div className="text-right">
                  <p className="text-xs text-slate-500">Quality Score</p>
                  <p className={`text-2xl font-bold ${qualityMetrics.qualityScore >= 80 ? 'text-green-400' :
                    qualityMetrics.qualityScore >= 50 ? 'text-yellow-400' : 'text-red-400'
                    }`}>
                    {qualityMetrics.qualityScore}%
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-xs text-slate-500">Examples</p>
                  <p className="text-2xl font-bold text-white">{qualityMetrics.totalExamples}</p>
                </div>
              </div>
            )}
          </div>
        </CardHeader>
        <CardContent>
          {qualityMetrics && (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
              <div className="p-3 bg-slate-950 rounded">
                <p className="text-xs text-slate-500">Training</p>
                <p className="text-lg font-semibold text-blue-400">{qualityMetrics.trainingSamples}</p>
              </div>
              <div className="p-3 bg-slate-950 rounded">
                <p className="text-xs text-slate-500">Validation</p>
                <p className="text-lg font-semibold text-purple-400">{qualityMetrics.validationSamples}</p>
              </div>
              <div className="p-3 bg-slate-950 rounded">
                <p className="text-xs text-slate-500">Avg Input Length</p>
                <p className="text-lg font-semibold text-white">{qualityMetrics.avgInputLength}</p>
              </div>
              <div className="p-3 bg-slate-950 rounded">
                <p className="text-xs text-slate-500">Correct Labels</p>
                <p className="text-lg font-semibold text-green-400">{qualityMetrics.correctCount}</p>
              </div>
            </div>
          )}

          {/* Data Split Slider */}
          <div className="mb-4">
            <Label className="text-slate-300">Validation Split: {Math.round(validationSplit * 100)}%</Label>
            <input
              type="range"
              min="0.1"
              max="0.4"
              step="0.05"
              value={validationSplit}
              onChange={(e) => onValidationSplitChange?.(parseFloat(e.target.value))}
              className="w-full mt-2"
            />
          </div>

          {qualityMetrics?.hasIssues && (
            <div className="p-3 bg-yellow-500/10 border border-yellow-500/30 rounded mb-4 flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-yellow-400" />
              <span className="text-sm text-yellow-300">Some examples have missing data</span>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Data Entry / Import */}
      <Card className="bg-slate-900 border-slate-800">
        <CardHeader>
          <CardTitle className="text-white">Add Training Data</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex gap-4 mb-4">
            <Button
              variant={dataSource === 'manual' ? 'default' : 'outline'}
              onClick={() => setDataSource('manual')}
              className={dataSource === 'manual' ? 'bg-blue-600' : ''}
            >
              <FileText className="w-4 h-4 mr-2" />
              Manual Entry
            </Button>
            <Button
              variant={dataSource === 'upload' ? 'default' : 'outline'}
              onClick={() => setDataSource('upload')}
              className={dataSource === 'upload' ? 'bg-blue-600' : ''}
            >
              <Upload className="w-4 h-4 mr-2" />
              Upload File
            </Button>
          </div>

          {dataSource === 'manual' ? (
            <div className="space-y-4">
              <div>
                <Label className="text-slate-300">Input / Prompt</Label>
                <Textarea
                  value={newExample.input}
                  onChange={(e) => setNewExample({ ...newExample, input: e.target.value })}
                  placeholder="Enter the input prompt or scenario..."
                  className="bg-slate-800 border-slate-700 mt-1"
                  rows={3}
                />
              </div>
              <div>
                <Label className="text-slate-300">Expected Output</Label>
                <Textarea
                  value={newExample.expected_output}
                  onChange={(e) => setNewExample({ ...newExample, expected_output: e.target.value })}
                  placeholder="Enter the expected response..."
                  className="bg-slate-800 border-slate-700 mt-1"
                  rows={3}
                />
              </div>
              <div className="flex items-center gap-4">
                <div className="flex-1">
                  <Label className="text-slate-300">Feedback</Label>
                  <Select
                    value={newExample.feedback}
                    onValueChange={(v) => setNewExample({ ...newExample, feedback: v })}
                  >
                    <SelectTrigger className="bg-slate-800 border-slate-700 mt-1">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="bg-slate-900 border-slate-800">
                      <SelectItem value="correct">Correct</SelectItem>
                      <SelectItem value="partial">Partial</SelectItem>
                      <SelectItem value="incorrect">Incorrect</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <Button
                  onClick={addExample}
                  className="bg-green-600 hover:bg-green-700 mt-6"
                >
                  <Plus className="w-4 h-4 mr-2" />
                  Add Example
                </Button>
              </div>
            </div>
          ) : (
            <div className="border-2 border-dashed border-slate-700 rounded-lg p-8 text-center">
              <Upload className="w-12 h-12 text-slate-500 mx-auto mb-4" />
              <p className="text-slate-400 mb-4">Upload JSON or CSV file with training examples</p>
              <input
                type="file"
                accept=".json,.csv"
                onChange={handleFileUpload}
                className="hidden"
                id="file-upload"
              />
              <label htmlFor="file-upload">
                <Button asChild className="bg-blue-600 hover:bg-blue-700">
                  <span>Choose File</span>
                </Button>
              </label>
              <p className="text-xs text-slate-500 mt-4">
                Expected fields: input/prompt, expected_output/output/answer
              </p>
            </div>
          )}

          {/* Augmentation Option */}
          <div className="flex items-center justify-between p-3 bg-slate-950 rounded">
            <div>
              <p className="text-sm font-medium text-white">Data Augmentation</p>
              <p className="text-xs text-slate-400">Generate variations of examples to improve training</p>
            </div>
            <Switch checked={useAugmentation} onCheckedChange={setUseAugmentation} />
          </div>
        </CardContent>
      </Card>

      {/* Examples List */}
      {examples.length > 0 && (
        <Card className="bg-slate-900 border-slate-800">
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="text-white">Examples ({filteredExamples.length})</CardTitle>
              <div className="flex items-center gap-2">
                <div className="relative">
                  <Filter className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
                  <Input
                    placeholder="Filter..."
                    value={filterText}
                    onChange={(e) => setFilterText(e.target.value)}
                    className="pl-9 bg-slate-800 border-slate-700 w-40"
                  />
                </div>
                <Button variant="outline" size="sm" onClick={shuffleData}>
                  <Shuffle className="w-4 h-4 mr-1" />
                  Shuffle
                </Button>
                <Button variant="outline" size="sm" onClick={validateData} disabled={isValidating}>
                  {isValidating ? (
                    <Loader2 className="w-4 h-4 mr-1 animate-spin" />
                  ) : (
                    <CheckCircle className="w-4 h-4 mr-1" />
                  )}
                  Validate
                </Button>
                <Button variant="outline" size="sm" onClick={exportData}>
                  <Download className="w-4 h-4 mr-1" />
                  Export
                </Button>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            {validationResults && !validationResults.valid && (
              <div className="p-3 bg-red-500/10 border border-red-500/30 rounded mb-4">
                <p className="text-sm text-red-400 font-medium">
                  {validationResults.issues.length} validation issues found
                </p>
              </div>
            )}

            <div className="space-y-3 max-h-96 overflow-y-auto">
              {filteredExamples.map((example, idx) => (
                <div
                  key={example.id || idx}
                  className="p-4 bg-slate-950 rounded border border-slate-800 hover:border-slate-700 transition-colors"
                >
                  <div className="flex items-start justify-between mb-2">
                    <Badge variant="outline" className={
                      example.feedback === 'correct' ? 'bg-green-500/20 text-green-400' :
                        example.feedback === 'partial' ? 'bg-yellow-500/20 text-yellow-400' :
                          'bg-red-500/20 text-red-400'
                    }>
                      {example.feedback}
                    </Badge>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => removeExample(example.id)}
                      className="text-red-400 hover:text-red-300"
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <p className="text-xs text-slate-500 mb-1">Input</p>
                      <p className="text-slate-300 line-clamp-2">{example.input}</p>
                    </div>
                    <div>
                      <p className="text-xs text-slate-500 mb-1">Expected Output</p>
                      <p className="text-slate-300 line-clamp-2">{example.expected_output}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
