import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { GraduationCap, Loader2, Play, Pause, Archive } from 'lucide-react';
import { analyzeSuccessfulRuns } from '@/functions/analyzeSuccessfulRuns';
import { toast } from 'sonner';
import { handleError } from '../utils/api-client';
import { format } from 'date-fns';

export default function TrainingModuleManager({ agents, modules, onRefresh }) {
  const [selectedAgent, setSelectedAgent] = useState('');
  const [isAnalyzing, setIsAnalyzing] = useState(false);

  const createTrainingModule = async () => {
    if (!selectedAgent) {
      toast.error('Please select an agent');
      return;
    }

    setIsAnalyzing(true);
    try {
      const { data: result } = await analyzeSuccessfulRuns({
        agent_id: selectedAgent,
        run_limit: 50,
        min_success_rate: 0.7
      });

      toast.success('Training module created successfully');
      onRefresh();
    } catch (error) {
      handleError(error);
    } finally {
      setIsAnalyzing(false);
    }
  };

  const statusColors = {
    draft: 'bg-slate-500/20 text-slate-400',
    active: 'bg-green-500/20 text-green-400',
    paused: 'bg-yellow-500/20 text-yellow-400',
    completed: 'bg-blue-500/20 text-blue-400',
    archived: 'bg-gray-500/20 text-gray-400'
  };

  const typeLabels = {
    success_pattern: 'Success Patterns',
    synthetic_data: 'Synthetic Data',
    feedback_driven: 'Feedback-Driven',
    performance_optimization: 'Performance'
  };

  return (
    <div className="space-y-6">
      <Card className="bg-slate-900 border-slate-800">
        <CardHeader>
          <CardTitle className="text-white">Create Training Module</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-sm text-slate-400">
            Analyze successful runs to create a training module that helps your agent learn from its best performances.
          </p>
          <div className="flex gap-4">
            <Select value={selectedAgent} onValueChange={setSelectedAgent}>
              <SelectTrigger className="bg-slate-800 border-slate-700 flex-1">
                <SelectValue placeholder="Select an agent to train" />
              </SelectTrigger>
              <SelectContent className="bg-slate-900 border-slate-800">
                {agents.map(agent => (
                  <SelectItem key={agent.id} value={agent.id}>
                    {agent.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Button
              onClick={createTrainingModule}
              disabled={isAnalyzing || !selectedAgent}
              className="bg-purple-600 hover:bg-purple-700"
            >
              {isAnalyzing ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Analyzing...
                </>
              ) : (
                <>
                  <GraduationCap className="w-4 h-4 mr-2" />
                  Create Module
                </>
              )}
            </Button>
          </div>
        </CardContent>
      </Card>

      <div className="grid gap-4">
        {modules.map(module => {
          const agent = agents.find(a => a.id === module.agent_id);
          return (
            <Card key={module.id} className="bg-slate-900 border-slate-800">
              <CardContent className="pt-6">
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <h3 className="text-white font-semibold mb-1">{module.name}</h3>
                    <p className="text-sm text-slate-400">{agent?.name}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge variant="outline" className={statusColors[module.status]}>
                      {module.status}
                    </Badge>
                    <Badge variant="outline" className="bg-blue-500/20 text-blue-400">
                      {typeLabels[module.training_type]}
                    </Badge>
                  </div>
                </div>

                {module.description && (
                  <p className="text-sm text-slate-300 mb-4">{module.description}</p>
                )}

                {module.learning_objectives?.length > 0 && (
                  <div className="mb-4">
                    <p className="text-xs font-semibold text-slate-400 mb-2">Learning Objectives:</p>
                    <div className="flex flex-wrap gap-2">
                      {module.learning_objectives.map((obj, idx) => (
                        <Badge key={idx} variant="outline" className="text-xs">
                          {obj}
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}

                {module.success_metrics && (
                  <div className="grid grid-cols-3 gap-4 p-3 bg-slate-950 rounded">
                    <div>
                      <p className="text-xs text-slate-500">Baseline</p>
                      <p className="text-lg font-semibold text-white">
                        {module.success_metrics.baseline_score?.toFixed(1)}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs text-slate-500">Current</p>
                      <p className="text-lg font-semibold text-blue-400">
                        {module.success_metrics.current_score?.toFixed(1)}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs text-slate-500">Target</p>
                      <p className="text-lg font-semibold text-green-400">
                        {module.success_metrics.target_score?.toFixed(1)}
                      </p>
                    </div>
                  </div>
                )}

                <div className="flex items-center justify-between mt-4 pt-4 border-t border-slate-800">
                  <div className="text-xs text-slate-500">
                    {module.iterations || 0} iterations • Last trained: {module.last_trained ? format(new Date(module.last_trained), 'MMM d, yyyy') : 'Never'}
                  </div>
                  <div className="flex gap-2">
                    {module.status === 'active' && (
                      <Button size="sm" variant="outline">
                        <Pause className="w-3 h-3 mr-1" />
                        Pause
                      </Button>
                    )}
                    {module.status === 'paused' && (
                      <Button size="sm" className="bg-green-600">
                        <Play className="w-3 h-3 mr-1" />
                        Resume
                      </Button>
                    )}
                    <Button size="sm" variant="outline">
                      <Archive className="w-3 h-3 mr-1" />
                      Archive
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}