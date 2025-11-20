import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { AgentMetric, Alert, Agent } from '@/entities/all';
import { base44 } from '@/api/base44Client';
import { AlertTriangle, TrendingUp, Activity, CheckCircle } from 'lucide-react';
import { toast } from 'sonner';
import { formatDistanceToNow } from 'date-fns';

export default function AgentAnomalyDetection() {
  const [anomalies, setAnomalies] = useState([]);
  const [agents, setAgents] = useState([]);
  const [isAnalyzing, setIsAnalyzing] = useState(false);

  useEffect(() => {
    loadData();
    const interval = setInterval(loadData, 30000); // Check every 30 seconds
    return () => clearInterval(interval);
  }, []);

  const loadData = async () => {
    try {
      const [agentData, alertData] = await Promise.all([
        Agent.list(),
        Alert.filter({ status: 'active', category: 'agent_performance' }, '-created_date', 20)
      ]);
      setAgents(agentData);
      setAnomalies(alertData);
    } catch (error) {
      console.error('Failed to load anomaly data:', error);
    }
  };

  const analyzeAnomalies = async () => {
    setIsAnalyzing(true);
    try {
      const user = await base44.auth.me();
      const metrics = await AgentMetric.filter({}, '-timestamp', 200);
      
      const agentGroups = {};
      metrics.forEach(m => {
        if (!agentGroups[m.agent_id]) agentGroups[m.agent_id] = [];
        agentGroups[m.agent_id].push(m);
      });

      const newAnomalies = [];

      for (const [agentId, agentMetrics] of Object.entries(agentGroups)) {
        const recent = agentMetrics.slice(0, 20);
        const historical = agentMetrics.slice(20, 100);

        if (historical.length < 10) continue;

        const agent = agents.find(a => a.id === agentId);
        if (!agent) continue;

        // Calculate baselines
        const avgLatency = historical.reduce((s, m) => s + (m.latency_ms || 0), 0) / historical.length;
        const avgCpu = historical.reduce((s, m) => s + (m.cpu_usage_percent || 0), 0) / historical.length;
        const avgMemory = historical.reduce((s, m) => s + (m.memory_mb || 0), 0) / historical.length;
        const baselineErrorRate = historical.filter(m => m.status === 'error').length / historical.length;

        // Check recent metrics for anomalies
        const recentLatency = recent.reduce((s, m) => s + (m.latency_ms || 0), 0) / recent.length;
        const recentCpu = recent.reduce((s, m) => s + (m.cpu_usage_percent || 0), 0) / recent.length;
        const recentMemory = recent.reduce((s, m) => s + (m.memory_mb || 0), 0) / recent.length;
        const recentErrorRate = recent.filter(m => m.status === 'error').length / recent.length;

        // Detect anomalies (>50% deviation or critical thresholds)
        if (recentLatency > avgLatency * 1.5 && recentLatency > 1000) {
          newAnomalies.push({
            agent_id: agentId,
            agent_name: agent.name,
            type: 'high_latency',
            severity: 'high',
            message: `Latency spike: ${Math.round(recentLatency)}ms (baseline: ${Math.round(avgLatency)}ms)`,
            metric_value: recentLatency
          });
        }

        if (recentCpu > 85) {
          newAnomalies.push({
            agent_id: agentId,
            agent_name: agent.name,
            type: 'high_cpu',
            severity: recentCpu > 95 ? 'critical' : 'high',
            message: `High CPU usage: ${Math.round(recentCpu)}%`,
            metric_value: recentCpu
          });
        }

        if (recentMemory > avgMemory * 1.5 && recentMemory > 500) {
          newAnomalies.push({
            agent_id: agentId,
            agent_name: agent.name,
            type: 'memory_leak',
            severity: 'medium',
            message: `Memory increase: ${Math.round(recentMemory)}MB (baseline: ${Math.round(avgMemory)}MB)`,
            metric_value: recentMemory
          });
        }

        if (recentErrorRate > baselineErrorRate * 2 && recentErrorRate > 0.1) {
          newAnomalies.push({
            agent_id: agentId,
            agent_name: agent.name,
            type: 'error_spike',
            severity: 'critical',
            message: `Error rate increased: ${(recentErrorRate * 100).toFixed(1)}% (baseline: ${(baselineErrorRate * 100).toFixed(1)}%)`,
            metric_value: recentErrorRate * 100
          });
        }
      }

      // Create alerts for new anomalies
      for (const anomaly of newAnomalies) {
        await Alert.create({
          severity: anomaly.severity,
          category: 'agent_performance',
          message: `${anomaly.agent_name}: ${anomaly.message}`,
          entity_type: 'agent',
          entity_id: anomaly.agent_id,
          status: 'active',
          metadata: {
            type: anomaly.type,
            metric_value: anomaly.metric_value
          },
          org_id: user.organization.id
        });
      }

      if (newAnomalies.length > 0) {
        toast.warning(`Detected ${newAnomalies.length} anomalies`);
      } else {
        toast.success('No anomalies detected');
      }

      loadData();
    } catch (error) {
      console.error('Anomaly analysis failed:', error);
      toast.error('Failed to analyze anomalies');
    } finally {
      setIsAnalyzing(false);
    }
  };

  const resolveAnomaly = async (alertId) => {
    try {
      await Alert.update(alertId, { status: 'resolved' });
      toast.success('Anomaly resolved');
      loadData();
    } catch (error) {
      console.error('Failed to resolve anomaly:', error);
      toast.error('Failed to resolve anomaly');
    }
  };

  const severityColors = {
    critical: 'bg-red-500/20 text-red-400 border-red-500/30',
    high: 'bg-orange-500/20 text-orange-400 border-orange-500/30',
    medium: 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30',
    low: 'bg-blue-500/20 text-blue-400 border-blue-500/30'
  };

  return (
    <Card className="bg-slate-900 border-slate-800">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="text-white flex items-center gap-2">
            <AlertTriangle className="w-5 h-5 text-orange-400" />
            Agent Anomaly Detection
          </CardTitle>
          <Button
            onClick={analyzeAnomalies}
            disabled={isAnalyzing}
            size="sm"
            className="bg-orange-600 hover:bg-orange-700"
          >
            {isAnalyzing ? (
              <>
                <Activity className="w-3 h-3 mr-2 animate-spin" />
                Analyzing...
              </>
            ) : (
              <>
                <TrendingUp className="w-3 h-3 mr-2" />
                Analyze Now
              </>
            )}
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        {anomalies.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-8 text-center">
            <CheckCircle className="w-12 h-12 text-green-400 mb-3" />
            <div className="text-slate-400">No active anomalies detected</div>
            <div className="text-xs text-slate-500 mt-1">All agents performing within normal parameters</div>
          </div>
        ) : (
          <div className="space-y-3">
            {anomalies.map(anomaly => (
              <div key={anomaly.id} className="p-4 bg-slate-950 rounded-lg border border-slate-800">
                <div className="flex items-start justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <Badge variant="outline" className={severityColors[anomaly.severity]}>
                      {anomaly.severity}
                    </Badge>
                    <span className="text-xs text-slate-500">
                      {formatDistanceToNow(new Date(anomaly.created_date), { addSuffix: true })}
                    </span>
                  </div>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => resolveAnomaly(anomaly.id)}
                    className="text-green-400 hover:text-green-300 h-6 text-xs"
                  >
                    <CheckCircle className="w-3 h-3 mr-1" />
                    Resolve
                  </Button>
                </div>
                <p className="text-sm text-white">{anomaly.message}</p>
                {anomaly.metadata?.type && (
                  <div className="mt-2">
                    <Badge variant="outline" className="bg-slate-800 text-slate-400 border-slate-700 text-xs">
                      {anomaly.metadata.type.replace('_', ' ')}
                    </Badge>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}