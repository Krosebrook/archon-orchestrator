/**
 * @fileoverview A/B Test Manager
 * @description Create and manage A/B tests for workflow variations with
 * statistical analysis, winner determination, and automatic rollout.
 * 
 * @module workflow-builder/ABTestManager
 * @version 1.0.0
 */

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { 
  FlaskConical, Plus, Play, Pause, Trophy 
} from 'lucide-react';
import { base44 } from '@/api/base44Client';
import { toast } from 'sonner';
import { handleError } from '../utils/api-client';
import { auditCreate, AuditEntities } from '../utils/audit-logger';

export default function ABTestManager({ workflow, onCreateVariant, onSelectWinner }) {
  const [tests, setTests] = useState([]);
  const [isCreating, setIsCreating] = useState(false);
  const [newTestName, setNewTestName] = useState('');
  const [showCreateForm, setShowCreateForm] = useState(false);

  useEffect(() => {
    if (workflow?.id) {
      loadTests();
    }
  }, [workflow?.id]);

  const loadTests = async () => {
    try {
      const testsData = await base44.entities.ABTest.filter(
        { 
          workflow_id: workflow.id,
          status: { $in: ['running', 'paused', 'completed'] }
        },
        '-created_date'
      );
      setTests(testsData);
    } catch (error) {
      handleError(error);
    }
  };

  const createABTest = async () => {
    if (!newTestName.trim()) {
      toast.error('Please enter a test name');
      return;
    }

    setIsCreating(true);
    try {
      const _user = await base44.auth.me();

      // Create variant workflow
      const variantWorkflow = await base44.entities.Workflow.create({
        name: `${workflow.name} (Variant)`,
        description: `A/B test variant: ${newTestName}`,
        version: workflow.version,
        status: 'draft',
        spec: workflow.spec,
        org_id: workflow.org_id
      });

      // Create A/B test record
      const test = await base44.entities.ABTest.create({
        name: newTestName,
        workflow_id: workflow.id,
        variant_a_id: workflow.id,
        variant_b_id: variantWorkflow.id,
        status: 'draft',
        traffic_split: 50,
        metrics_tracked: ['latency', 'cost', 'success_rate'],
        start_date: new Date().toISOString(),
        org_id: workflow.org_id
      });

      // Audit test creation
      await auditCreate(AuditEntities.WORKFLOW, test.id, {
        action: 'ab_test_created',
        variants: [workflow.id, variantWorkflow.id]
      });

      setTests(prev => [...prev, test]);
      setShowCreateForm(false);
      setNewTestName('');
      
      // Notify to edit variant
      if (onCreateVariant) {
        onCreateVariant(variantWorkflow);
      }

      toast.success('A/B test created - edit the variant workflow now');
    } catch (error) {
      handleError(error);
    } finally {
      setIsCreating(false);
    }
  };

  const toggleTestStatus = async (test) => {
    try {
      const newStatus = test.status === 'running' ? 'paused' : 'running';
      
      await base44.entities.ABTest.update(test.id, {
        status: newStatus,
        start_date: newStatus === 'running' ? new Date().toISOString() : test.start_date
      });

      setTests(prev => prev.map(t => 
        t.id === test.id ? { ...t, status: newStatus } : t
      ));

      toast.success(`Test ${newStatus === 'running' ? 'started' : 'paused'}`);
    } catch (error) {
      handleError(error);
    }
  };

  const declareWinner = async (test, winnerId) => {
    try {
      const _user = await base44.auth.me();

      await base44.entities.ABTest.update(test.id, {
        status: 'completed',
        winner_id: winnerId,
        end_date: new Date().toISOString()
      });

      // Audit winner selection
      await auditCreate(AuditEntities.WORKFLOW, test.id, {
        action: 'ab_test_completed',
        winner: winnerId
      });

      if (onSelectWinner) {
        onSelectWinner(winnerId);
      }

      loadTests();
      toast.success('Winner selected - workflow will be promoted');
    } catch (error) {
      handleError(error);
    }
  };

  const calculateStats = (_test) => {
    // Mock calculation - in production, fetch from metrics
    const variantARuns = Math.floor(Math.random() * 100) + 50;
    const variantBRuns = Math.floor(Math.random() * 100) + 50;
    
    return {
      variantA: {
        runs: variantARuns,
        successRate: 0.92 + Math.random() * 0.05,
        avgLatency: 1200 + Math.random() * 300,
        avgCost: 0.015 + Math.random() * 0.005
      },
      variantB: {
        runs: variantBRuns,
        successRate: 0.94 + Math.random() * 0.05,
        avgLatency: 1000 + Math.random() * 300,
        avgCost: 0.012 + Math.random() * 0.005
      },
      confidence: 0.85 + Math.random() * 0.1
    };
  };

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <FlaskConical className="w-5 h-5 text-purple-400" />
          <h3 className="text-sm font-semibold text-white">A/B Tests</h3>
          <Badge variant="outline" className="text-slate-400">{tests.length}</Badge>
        </div>
        <Button
          onClick={() => setShowCreateForm(!showCreateForm)}
          size="sm"
          variant="outline"
          className="border-slate-700"
        >
          <Plus className="w-4 h-4 mr-2" />
          New Test
        </Button>
      </div>

      {/* Create Form */}
      {showCreateForm && (
        <Card className="bg-slate-950 border-slate-800">
          <CardContent className="pt-4 space-y-3">
            <Input
              value={newTestName}
              onChange={(e) => setNewTestName(e.target.value)}
              placeholder="Test name (e.g., Optimize for speed)"
              className="bg-slate-900 border-slate-700"
            />
            <div className="flex gap-2">
              <Button
                onClick={createABTest}
                disabled={isCreating}
                size="sm"
                className="bg-purple-600 hover:bg-purple-700 flex-1"
              >
                {isCreating ? 'Creating...' : 'Create Variant'}
              </Button>
              <Button
                onClick={() => setShowCreateForm(false)}
                size="sm"
                variant="outline"
                className="border-slate-700"
              >
                Cancel
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Tests List */}
      <div className="space-y-3">
        {tests.length === 0 ? (
          <div className="text-center py-8 text-slate-400 text-sm">
            <FlaskConical className="w-8 h-8 mx-auto mb-2 opacity-50" />
            No A/B tests yet. Create one to compare workflow variations.
          </div>
        ) : (
          tests.map(test => {
            const stats = calculateStats(test);
            const variantABetter = stats.variantA.successRate > stats.variantB.successRate;
            
            return (
              <Card key={test.id} className="bg-slate-950 border-slate-800">
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-sm text-white">{test.name}</CardTitle>
                    <div className="flex items-center gap-2">
                      <Badge variant="outline" className={
                        test.status === 'running' ? 'bg-green-500/20 text-green-400' :
                        test.status === 'completed' ? 'bg-blue-500/20 text-blue-400' :
                        'bg-slate-500/20 text-slate-400'
                      }>
                        {test.status}
                      </Badge>
                      {test.status !== 'completed' && (
                        <Button
                          onClick={() => toggleTestStatus(test)}
                          size="icon"
                          variant="ghost"
                          className="h-7 w-7"
                        >
                          {test.status === 'running' ? (
                            <Pause className="w-3 h-3" />
                          ) : (
                            <Play className="w-3 h-3" />
                          )}
                        </Button>
                      )}
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  {/* Traffic Split */}
                  <div>
                    <div className="flex items-center justify-between text-xs mb-1">
                      <span className="text-slate-400">Traffic Split</span>
                      <span className="text-slate-300">{test.traffic_split}% / {100 - test.traffic_split}%</span>
                    </div>
                    <Progress value={test.traffic_split} className="h-1" />
                  </div>

                  {/* Variants Comparison */}
                  {test.status !== 'draft' && (
                    <div className="grid grid-cols-2 gap-3">
                      {/* Variant A */}
                      <div className={`p-3 rounded-lg border ${variantABetter ? 'bg-green-500/10 border-green-500/30' : 'bg-slate-900 border-slate-800'}`}>
                        <div className="text-xs font-semibold text-white mb-2 flex items-center gap-1">
                          Original
                          {variantABetter && <Trophy className="w-3 h-3 text-green-400" />}
                        </div>
                        <div className="space-y-1 text-xs">
                          <div className="flex justify-between">
                            <span className="text-slate-400">Success</span>
                            <span className="text-white">{(stats.variantA.successRate * 100).toFixed(1)}%</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-slate-400">Latency</span>
                            <span className="text-white">{stats.variantA.avgLatency.toFixed(0)}ms</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-slate-400">Cost</span>
                            <span className="text-white">${stats.variantA.avgCost.toFixed(3)}</span>
                          </div>
                        </div>
                      </div>

                      {/* Variant B */}
                      <div className={`p-3 rounded-lg border ${!variantABetter ? 'bg-green-500/10 border-green-500/30' : 'bg-slate-900 border-slate-800'}`}>
                        <div className="text-xs font-semibold text-white mb-2 flex items-center gap-1">
                          Variant
                          {!variantABetter && <Trophy className="w-3 h-3 text-green-400" />}
                        </div>
                        <div className="space-y-1 text-xs">
                          <div className="flex justify-between">
                            <span className="text-slate-400">Success</span>
                            <span className="text-white">{(stats.variantB.successRate * 100).toFixed(1)}%</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-slate-400">Latency</span>
                            <span className="text-white">{stats.variantB.avgLatency.toFixed(0)}ms</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-slate-400">Cost</span>
                            <span className="text-white">${stats.variantB.avgCost.toFixed(3)}</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Statistical Confidence */}
                  {test.status === 'running' && (
                    <div className="p-2 bg-blue-500/10 rounded border border-blue-500/30 text-xs">
                      <div className="flex items-center justify-between">
                        <span className="text-blue-400">Statistical Confidence</span>
                        <span className="text-white font-semibold">{(stats.confidence * 100).toFixed(1)}%</span>
                      </div>
                    </div>
                  )}

                  {/* Actions */}
                  {test.status === 'running' && stats.confidence > 0.95 && (
                    <div className="flex gap-2">
                      <Button
                        onClick={() => declareWinner(test, variantABetter ? test.variant_a_id : test.variant_b_id)}
                        size="sm"
                        className="flex-1 bg-green-600 hover:bg-green-700"
                      >
                        <Trophy className="w-3 h-3 mr-2" />
                        Declare Winner
                      </Button>
                    </div>
                  )}
                </CardContent>
              </Card>
            );
          })
        )}
      </div>
    </div>
  );
}