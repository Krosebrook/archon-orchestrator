import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  DollarSign,
  TrendingUp,
  AlertTriangle,
  Lightbulb,
  Plus,
  RefreshCw,
  CheckCircle2,
  XCircle,
  Loader2,
} from 'lucide-react';
import BudgetManager from '../components/cost/BudgetManager';
import CostForecastChart from '../components/cost/CostForecastChart';
import OptimizationRecommendations from '../components/cost/OptimizationRecommendations';
import { toast } from 'sonner';

export default function CostManagement() {
  const [budgets, setBudgets] = useState([]);
  const [forecasts, setForecasts] = useState([]);
  const [recommendations, setRecommendations] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isGenerating, setIsGenerating] = useState(false);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setIsLoading(true);
      const [budgetData, forecastData, recData] = await Promise.all([
        base44.entities.Budget.list('-created_date'),
        base44.entities.CostForecast.filter({}, '-forecast_date', 10),
        base44.entities.CostOptimizationRecommendation.filter({ status: { $ne: 'dismissed' } }, '-created_date', 50),
      ]);
      
      setBudgets(budgetData);
      setForecasts(forecastData);
      setRecommendations(recData);
    } catch (error) {
      console.error('Failed to load cost data:', error);
      toast.error('Failed to load cost management data');
    } finally {
      setIsLoading(false);
    }
  };

  const generateForecast = async () => {
    setIsGenerating(true);
    try {
      const response = await base44.functions.invoke('forecastCosts', {
        scope: 'organization',
        forecast_period: '30_days',
        lookback_days: 30,
      });

      if (response.success) {
        toast.success('Cost forecast generated successfully');
        loadData();
      }
    } catch (error) {
      console.error('Forecast generation failed:', error);
      toast.error('Failed to generate forecast');
    } finally {
      setIsGenerating(false);
    }
  };

  const generateOptimizations = async () => {
    setIsGenerating(true);
    try {
      const response = await base44.functions.invoke('generateCostOptimizations', {
        scope: 'organization',
        lookback_days: 30,
      });

      if (response.success) {
        toast.success(`Generated ${response.recommendations.length} optimization recommendations`);
        loadData();
      }
    } catch (error) {
      console.error('Optimization generation failed:', error);
      toast.error('Failed to generate optimizations');
    } finally {
      setIsGenerating(false);
    }
  };

  const totalBudget = budgets
    .filter(b => b.status === 'active')
    .reduce((sum, b) => sum + b.limit_cents, 0);
  
  const totalSpend = budgets
    .filter(b => b.status === 'active')
    .reduce((sum, b) => sum + b.current_spend_cents, 0);

  const potentialSavings = recommendations
    .filter(r => r.status === 'new' || r.status === 'reviewing')
    .reduce((sum, r) => sum + (r.estimated_savings_cents || 0), 0);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-8 h-8 animate-spin text-blue-500" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-white flex items-center gap-3">
            <DollarSign className="w-8 h-8 text-green-400" />
            Cost Management
          </h1>
          <p className="text-slate-400 mt-2">
            Monitor budgets, forecast spending, and optimize AI costs
          </p>
        </div>
        <div className="flex gap-2">
          <Button
            onClick={generateForecast}
            disabled={isGenerating}
            variant="outline"
            className="border-blue-600 text-blue-400"
          >
            {isGenerating ? (
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
            ) : (
              <TrendingUp className="w-4 h-4 mr-2" />
            )}
            Generate Forecast
          </Button>
          <Button
            onClick={generateOptimizations}
            disabled={isGenerating}
            className="bg-purple-600 hover:bg-purple-700"
          >
            {isGenerating ? (
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
            ) : (
              <Lightbulb className="w-4 h-4 mr-2" />
            )}
            Analyze Optimizations
          </Button>
        </div>
      </div>

      {/* Overview Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="bg-slate-900 border-slate-800">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-400">Total Budget</p>
                <p className="text-2xl font-bold text-white mt-1">
                  ${(totalBudget / 100).toFixed(2)}
                </p>
              </div>
              <DollarSign className="w-8 h-8 text-green-400" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-slate-900 border-slate-800">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-400">Current Spend</p>
                <p className="text-2xl font-bold text-white mt-1">
                  ${(totalSpend / 100).toFixed(2)}
                </p>
                <p className="text-xs text-slate-500 mt-1">
                  {totalBudget > 0 ? `${((totalSpend / totalBudget) * 100).toFixed(0)}% used` : 'N/A'}
                </p>
              </div>
              <TrendingUp className={`w-8 h-8 ${totalSpend > totalBudget * 0.8 ? 'text-red-400' : 'text-blue-400'}`} />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-slate-900 border-slate-800">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-400">Potential Savings</p>
                <p className="text-2xl font-bold text-white mt-1">
                  ${(potentialSavings / 100).toFixed(2)}
                </p>
                <p className="text-xs text-slate-500 mt-1">
                  {recommendations.filter(r => r.status === 'new').length} recommendations
                </p>
              </div>
              <Lightbulb className="w-8 h-8 text-purple-400" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-slate-900 border-slate-800">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-400">Budget Alerts</p>
                <p className="text-2xl font-bold text-white mt-1">
                  {budgets.filter(b => b.status === 'exceeded').length}
                </p>
                <p className="text-xs text-slate-500 mt-1">
                  {budgets.filter(b => b.status === 'active').length} active budgets
                </p>
              </div>
              <AlertTriangle className="w-8 h-8 text-yellow-400" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Main Content Tabs */}
      <Tabs defaultValue="budgets" className="space-y-4">
        <TabsList className="bg-slate-800">
          <TabsTrigger value="budgets">
            <DollarSign className="w-4 h-4 mr-2" />
            Budgets
          </TabsTrigger>
          <TabsTrigger value="forecasts">
            <TrendingUp className="w-4 h-4 mr-2" />
            Forecasts
          </TabsTrigger>
          <TabsTrigger value="optimizations">
            <Lightbulb className="w-4 h-4 mr-2" />
            Optimizations
          </TabsTrigger>
        </TabsList>

        <TabsContent value="budgets">
          <BudgetManager budgets={budgets} onRefresh={loadData} />
        </TabsContent>

        <TabsContent value="forecasts">
          <CostForecastChart forecasts={forecasts} onRefresh={loadData} />
        </TabsContent>

        <TabsContent value="optimizations">
          <OptimizationRecommendations recommendations={recommendations} onRefresh={loadData} />
        </TabsContent>
      </Tabs>
    </div>
  );
}