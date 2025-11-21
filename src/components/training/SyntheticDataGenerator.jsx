import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Target, Loader2, FileText } from 'lucide-react';
import { generateSyntheticTrainingData } from '@/functions/generateSyntheticTrainingData';
import { toast } from 'sonner';
import { handleError } from '../utils/api-client';

export default function SyntheticDataGenerator({ modules, onRefresh }) {
  const [selectedModule, setSelectedModule] = useState('');
  const [sampleCount, setSampleCount] = useState(10);
  const [difficulty, setDifficulty] = useState('medium');
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedData, setGeneratedData] = useState(null);

  const generateData = async () => {
    if (!selectedModule) {
      toast.error('Please select a training module');
      return;
    }

    setIsGenerating(true);
    try {
      const { data: result } = await generateSyntheticTrainingData({
        module_id: selectedModule,
        sample_count: sampleCount,
        difficulty
      });

      setGeneratedData(result);
      toast.success(`Generated ${result.scenarios.length} training scenarios`);
      onRefresh();
    } catch (error) {
      handleError(error);
    } finally {
      setIsGenerating(false);
    }
  };

  const difficultyColors = {
    easy: 'bg-green-500/20 text-green-400',
    medium: 'bg-yellow-500/20 text-yellow-400',
    hard: 'bg-orange-500/20 text-orange-400',
    expert: 'bg-red-500/20 text-red-400'
  };

  return (
    <div className="space-y-6">
      <Card className="bg-slate-900 border-slate-800">
        <CardHeader>
          <CardTitle className="text-white">Generate Synthetic Training Data</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-sm text-slate-400">
            Create diverse, realistic training scenarios to help your agent practice specific skills.
          </p>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Select value={selectedModule} onValueChange={setSelectedModule}>
              <SelectTrigger className="bg-slate-800 border-slate-700">
                <SelectValue placeholder="Select module" />
              </SelectTrigger>
              <SelectContent className="bg-slate-900 border-slate-800">
                {modules.filter(m => m.status === 'active').map(module => (
                  <SelectItem key={module.id} value={module.id}>
                    {module.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Input
              type="number"
              min={1}
              max={50}
              value={sampleCount}
              onChange={e => setSampleCount(parseInt(e.target.value))}
              placeholder="Sample count"
              className="bg-slate-800 border-slate-700"
            />

            <Select value={difficulty} onValueChange={setDifficulty}>
              <SelectTrigger className="bg-slate-800 border-slate-700">
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="bg-slate-900 border-slate-800">
                <SelectItem value="easy">Easy</SelectItem>
                <SelectItem value="medium">Medium</SelectItem>
                <SelectItem value="hard">Hard</SelectItem>
                <SelectItem value="expert">Expert</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <Button
            onClick={generateData}
            disabled={isGenerating || !selectedModule}
            className="w-full bg-blue-600 hover:bg-blue-700"
          >
            {isGenerating ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Generating...
              </>
            ) : (
              <>
                <Target className="w-4 h-4 mr-2" />
                Generate Training Data
              </>
            )}
          </Button>
        </CardContent>
      </Card>

      {generatedData && (
        <Card className="bg-slate-900 border-slate-800">
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="text-white">Generated Scenarios</CardTitle>
              <div className="flex items-center gap-2">
                <Badge className="bg-blue-500/20 text-blue-400">
                  Diversity: {(generatedData.diversity_score * 100).toFixed(0)}%
                </Badge>
                <Badge className="bg-purple-500/20 text-purple-400">
                  {generatedData.scenarios.length} scenarios
                </Badge>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            {generatedData.coverage_analysis && (
              <div className="p-3 bg-slate-950 rounded border border-slate-800">
                <p className="text-sm text-slate-300">{generatedData.coverage_analysis}</p>
              </div>
            )}

            <div className="space-y-3 max-h-96 overflow-y-auto">
              {generatedData.scenarios.map((scenario, idx) => (
                <Card key={idx} className="bg-slate-950 border-slate-800">
                  <CardContent className="pt-4">
                    <div className="flex items-start justify-between mb-3">
                      <h4 className="text-sm font-semibold text-white">Scenario {idx + 1}</h4>
                      <Badge variant="outline" className={difficultyColors[scenario.difficulty]}>
                        {scenario.difficulty}
                      </Badge>
                    </div>

                    <div className="space-y-2 text-sm">
                      <div>
                        <p className="text-xs text-slate-500 mb-1">Input:</p>
                        <p className="text-slate-300">{scenario.input}</p>
                      </div>

                      <div>
                        <p className="text-xs text-slate-500 mb-1">Expected Output:</p>
                        <p className="text-slate-300">{scenario.expected_output}</p>
                      </div>

                      {scenario.tags?.length > 0 && (
                        <div className="flex flex-wrap gap-1 pt-2">
                          {scenario.tags.map((tag, i) => (
                            <Badge key={i} variant="outline" className="text-xs">
                              {tag}
                            </Badge>
                          ))}
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}