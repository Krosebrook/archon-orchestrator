/**
 * @fileoverview Agent Performance Monitor
 * @description Real-time performance monitoring with alerting
 * @version 1.0.0
 */

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Activity, Bell, TrendingUp, TrendingDown, AlertTriangle, CheckCircle2 } from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { base44 } from '@/api/base44Client';
import { toast } from 'sonner';

export default function PerformanceMonitor({ agentId, onAlertCreated }) {
  const [metrics, setMetrics] = useState([]);
  const [alerts, setAlerts] = useState([]);
  const [thresholds, setThresholds] = useState({
    latency_ms: 5000,
    error_rate: 10,
    cost_per_hour: 5.0,
  });
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadMetrics();
    loadAlerts();
    
    const interval = setInterval(() => {
      loadMetrics();
      checkThresholds();
    }, 10000);
    
    return () => clearInterval(interval);
  }, [agentId]);

  const loadMetrics = async () => {
    try {
      const metricsData = await base44.entities.AgentMetric.filter(
        agentId ? { agent_id: agentId } : {},
        '-timestamp',
        100
      );
      setMetrics(metricsData || []);
    } catch (error) {
      console.error('Failed to load metrics:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const loadAlerts = async () => {
    try {
      const alertsData = await base44.entities.Alert.filter({
        entity_type: 'agent',
        entity_id: agentId,
      });
      setAlerts(alertsData || []);
    } catch (error) {
      console.error('Failed to load alerts:', error);
    }
  };

  const checkThresholds = async () => {
    if (metrics.length === 0) return;

    const recent = metrics.slice(0, 10);
    const avgLatency = recent.reduce((sum, m) => sum + (m.latency_ms || 0), 0) / recent.length;
    const errorCount = recent.filter(m => m.status === 'error').length;
    const errorRate = (errorCount / recent.length) * 100;
    const totalCost = recent.reduce((sum, m) => sum + (m.cost_cents || 0), 0) / 100;
    const costPerHour = (totalCost / recent.length) * 360; // Estimate

    const violations = [];
    
    if (avgLatency > thresholds.latency_ms) {
      violations.push({
        type: 'latency',
        message: `Average latency ${Math.round(avgLatency)}ms exceeds threshold ${thresholds.latency_ms}ms`,
        severity: 'warning',
      });
    }
    
    if (errorRate > thresholds.error_rate) {
      violations.push({
        type: 'error_rate',
        message: `Error rate ${errorRate.toFixed(1)}% exceeds threshold ${thresholds.error_rate}%`,
        severity: 'critical',
      });
    }
    
    if (costPerHour > thresholds.cost_per_hour) {
      violations.push({
        type: 'cost',
        message: `Projected cost $${costPerHour.toFixed(2)}/hour exceeds threshold $${thresholds.cost_per_hour}/hour`,
        severity: 'warning',
      });
    }

    for (const violation of violations) {
      await createAlert(violation);
    }
  };

  const createAlert = async (violation) => {
    try {
      const user = await base44.auth.me();
      const existingAlert = alerts.find(
        a => a.alert_type === violation.type && a.status === 'active'
      );

      if (existingAlert) return;

      await base44.entities.Alert.create({
        entity_type: 'agent',
        entity_id: agentId,
        alert_type: violation.type,
        severity: violation.severity,
        message: violation.message,
        status: 'active',
        org_id: user.organization?.id || 'org_acme',
      });

      toast.error(violation.message, { duration: 5000 });
      loadAlerts();
      onAlertCreated?.();
    } catch (error) {
      console.error('Failed to create alert:', error);
    }
  };

  const acknowledgeAlert = async (alertId) => {
    try {
      await base44.entities.Alert.update(alertId, { status: 'acknowledged' });
      toast.success('Alert acknowledged');
      loadAlerts();
    } catch (error) {
      console.error('Failed to acknowledge alert:', error);
      toast.error('Failed to acknowledge alert');
    }
  };

  const calculateStats = () => {
    if (metrics.length === 0) {
      return { avgLatency: 0, errorRate: 0, successRate: 0, totalCost: 0 };
    }

    const avgLatency = metrics.reduce((sum, m) => sum + (m.latency_ms || 0), 0) / metrics.length;
    const errors = metrics.filter(m => m.status === 'error').length;
    const errorRate = (errors / metrics.length) * 100;
    const successRate = 100 - errorRate;
    const totalCost = metrics.reduce((sum, m) => sum + (m.cost_cents || 0), 0) / 100;

    return { avgLatency: Math.round(avgLatency), errorRate: errorRate.toFixed(1), successRate: successRate.toFixed(1), totalCost: totalCost.toFixed(2) };
  };

  const chartData = metrics.slice(0, 20).reverse().map((m, idx) => ({
    time: idx,
    latency: m.latency_ms || 0,
    cost: (m.cost_cents || 0) / 100,
  }));

  const stats = calculateStats();
  const activeAlerts = alerts.filter(a => a.status === 'active');

  return (
    <div className="space-y-4">
      <Card className="bg-slate-900 border-slate-800">
        <CardHeader>
          <CardTitle className="text-white flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Activity className="w-5 h-5 text-green-400" />
              Performance Monitor
            </div>
            <Badge className={activeAlerts.length > 0 ? 'bg-red-600' : 'bg-green-600'}>
              {activeAlerts.length} Active Alerts
            </Badge>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="p-3 bg-slate-950 rounded-lg">
              <div className="text-xs text-slate-400 mb-1">Avg Latency</div>
              <div className="text-xl font-bold text-white">{stats.avgLatency}ms</div>
              <div className="flex items-center gap-1 text-xs text-slate-500 mt-1">
                {stats.avgLatency > thresholds.latency_ms ? (
                  <>
                    <TrendingUp className="w-3 h-3 text-red-400" />
                    <span className="text-red-400">Above threshold</span>
                  </>
                ) : (
                  <>
                    <CheckCircle2 className="w-3 h-3 text-green-400" />
                    <span className="text-green-400">Healthy</span>
                  </>
                )}
              </div>
            </div>

            <div className="p-3 bg-slate-950 rounded-lg">
              <div className="text-xs text-slate-400 mb-1">Success Rate</div>
              <div className="text-xl font-bold text-white">{stats.successRate}%</div>
              <div className="flex items-center gap-1 text-xs text-slate-500 mt-1">
                {parseFloat(stats.errorRate) > thresholds.error_rate ? (
                  <>
                    <TrendingDown className="w-3 h-3 text-red-400" />
                    <span className="text-red-400">High errors</span>
                  </>
                ) : (
                  <>
                    <CheckCircle2 className="w-3 h-3 text-green-400" />
                    <span className="text-green-400">Healthy</span>
                  </>
                )}
              </div>
            </div>

            <div className="p-3 bg-slate-950 rounded-lg">
              <div className="text-xs text-slate-400 mb-1">Total Cost</div>
              <div className="text-xl font-bold text-white">${stats.totalCost}</div>
              <div className="text-xs text-slate-500 mt-1">Last 100 requests</div>
            </div>

            <div className="p-3 bg-slate-950 rounded-lg">
              <div className="text-xs text-slate-400 mb-1">Total Requests</div>
              <div className="text-xl font-bold text-white">{metrics.length}</div>
              <div className="text-xs text-slate-500 mt-1">Monitoring period</div>
            </div>
          </div>

          <div className="h-48">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                <XAxis dataKey="time" stroke="#94a3b8" hide />
                <YAxis stroke="#94a3b8" />
                <Tooltip
                  contentStyle={{ backgroundColor: '#1e293b', border: '1px solid #334155' }}
                  labelStyle={{ color: '#94a3b8' }}
                />
                <Line type="monotone" dataKey="latency" stroke="#3b82f6" strokeWidth={2} dot={false} />
              </LineChart>
            </ResponsiveContainer>
          </div>

          <div className="border-t border-slate-800 pt-4">
            <h4 className="text-sm font-medium text-white mb-3">Alert Thresholds</h4>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              <div>
                <label className="text-xs text-slate-400 mb-1 block">Max Latency (ms)</label>
                <Input
                  type="number"
                  value={thresholds.latency_ms}
                  onChange={(e) => setThresholds({ ...thresholds, latency_ms: parseInt(e.target.value) })}
                  className="bg-slate-950 border-slate-700 text-white h-8"
                />
              </div>
              <div>
                <label className="text-xs text-slate-400 mb-1 block">Max Error Rate (%)</label>
                <Input
                  type="number"
                  value={thresholds.error_rate}
                  onChange={(e) => setThresholds({ ...thresholds, error_rate: parseInt(e.target.value) })}
                  className="bg-slate-950 border-slate-700 text-white h-8"
                />
              </div>
              <div>
                <label className="text-xs text-slate-400 mb-1 block">Max Cost/Hour ($)</label>
                <Input
                  type="number"
                  step="0.1"
                  value={thresholds.cost_per_hour}
                  onChange={(e) => setThresholds({ ...thresholds, cost_per_hour: parseFloat(e.target.value) })}
                  className="bg-slate-950 border-slate-700 text-white h-8"
                />
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {activeAlerts.length > 0 && (
        <Card className="bg-slate-900 border-red-800">
          <CardHeader>
            <CardTitle className="text-white flex items-center gap-2">
              <Bell className="w-5 h-5 text-red-400" />
              Active Alerts
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {activeAlerts.map((alert) => (
                <div key={alert.id} className="p-3 bg-red-500/10 border border-red-500/20 rounded-lg">
                  <div className="flex items-start justify-between">
                    <div className="flex items-start gap-2">
                      <AlertTriangle className="w-4 h-4 text-red-400 mt-0.5" />
                      <div>
                        <p className="text-sm font-medium text-white">{alert.message}</p>
                        <p className="text-xs text-slate-400 mt-1">
                          Type: {alert.alert_type} • Severity: {alert.severity}
                        </p>
                      </div>
                    </div>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => acknowledgeAlert(alert.id)}
                      className="border-red-700 text-red-400 hover:bg-red-900"
                    >
                      Acknowledge
                    </Button>
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