import React, { useState, useEffect } from 'react';
import { Agent, AgentMetric, SkillInstallation, SkillReview, Run } from '@/entities/all';
import { Card } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { BarChart3, DollarSign, MessageSquare, TrendingUp } from 'lucide-react';
import AgentPerformanceMetrics from '../components/analytics/AgentPerformanceMetrics';
import AgentCostAnalysis from '../components/analytics/AgentCostAnalysis';
import AgentFeedbackAnalysis from '../components/analytics/AgentFeedbackAnalysis';
import AgentOptimizationPredictions from '../components/analytics/AgentOptimizationPredictions';
import AIInsightsAssistant from '../components/analytics/AIInsightsAssistant';
import PredictiveAnomalyDetector from '../components/analytics/PredictiveAnomalyDetector';
import AIOptimizationSuggestions from '../components/analytics/AIOptimizationSuggestions';

export default function AgentAnalytics() {
  const [agents, setAgents] = useState([]);
  const [metrics, setMetrics] = useState([]);
  const [runs, setRuns] = useState([]);
  const [installations, setInstallations] = useState([]);
  const [reviews, setReviews] = useState([]);
  const [selectedAgent, setSelectedAgent] = useState('all');
  const [timeRange, setTimeRange] = useState('30d');
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const [agentData, metricData, runData, installData, reviewData] = await Promise.all([
        Agent.list(),
        AgentMetric.filter({}, '-timestamp', 1000),
        Run.filter({}, '-started_at', 500),
        SkillInstallation.list(),
        SkillReview.list()
      ]);
      setAgents(agentData);
      setMetrics(metricData);
      setRuns(runData);
      setInstallations(installData);
      setReviews(reviewData);
    } catch (error) {
      console.error('Failed to load analytics data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const filteredMetrics = selectedAgent === 'all' 
    ? metrics 
    : metrics.filter(m => m.agent_id === selectedAgent);

  const filteredRuns = selectedAgent === 'all'
    ? runs
    : runs.filter(r => r.agent_id === selectedAgent);

  if (isLoading) {
    return (
      <div className="text-center py-12 text-slate-400">
        Loading analytics...
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-white mb-2">Agent Analytics</h1>
          <p className="text-slate-400">Comprehensive insights into agent performance and optimization</p>
        </div>
        <div className="flex gap-3">
          <Select value={selectedAgent} onValueChange={setSelectedAgent}>
            <SelectTrigger className="w-48 bg-slate-900 border-slate-700 text-white">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Agents</SelectItem>
              {agents.map(agent => (
                <SelectItem key={agent.id} value={agent.id}>{agent.name}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select value={timeRange} onValueChange={setTimeRange}>
            <SelectTrigger className="w-40 bg-slate-900 border-slate-700 text-white">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="7d">Last 7 days</SelectItem>
              <SelectItem value="30d">Last 30 days</SelectItem>
              <SelectItem value="90d">Last 90 days</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <Tabs defaultValue="performance" className="w-full">
        <TabsList className="bg-slate-800 grid grid-cols-4 w-full">
          <TabsTrigger value="performance" className="flex items-center gap-2">
            <BarChart3 className="w-4 h-4" />
            Performance
          </TabsTrigger>
          <TabsTrigger value="costs" className="flex items-center gap-2">
            <DollarSign className="w-4 h-4" />
            Cost Analysis
          </TabsTrigger>
          <TabsTrigger value="feedback" className="flex items-center gap-2">
            <MessageSquare className="w-4 h-4" />
            Feedback
          </TabsTrigger>
          <TabsTrigger value="optimization" className="flex items-center gap-2">
            <TrendingUp className="w-4 h-4" />
            Optimization
          </TabsTrigger>
        </TabsList>

        <TabsContent value="performance" className="mt-6">
          <AgentPerformanceMetrics 
            agents={agents}
            metrics={filteredMetrics}
            runs={filteredRuns}
            timeRange={timeRange}
          />
        </TabsContent>

        <TabsContent value="costs" className="mt-6">
          <AgentCostAnalysis
            agents={agents}
            metrics={filteredMetrics}
            installations={installations}
            selectedAgent={selectedAgent}
            timeRange={timeRange}
          />
        </TabsContent>

        <TabsContent value="feedback" className="mt-6">
          <AgentFeedbackAnalysis
            agents={agents}
            reviews={reviews}
            installations={installations}
            selectedAgent={selectedAgent}
          />
        </TabsContent>

        <TabsContent value="optimization" className="mt-6">
          <AgentOptimizationPredictions
            agents={agents}
            metrics={filteredMetrics}
            runs={filteredRuns}
            selectedAgent={selectedAgent}
          />
        </TabsContent>
      </Tabs>
    </div>
  );
}