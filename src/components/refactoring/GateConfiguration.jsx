import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Plus, Save, Loader2 } from 'lucide-react';
import { base44 } from '@/api/base44Client';
import { toast } from 'sonner';

export default function GateConfiguration({ pipelineId, onSave }) {
  const [showForm, setShowForm] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [policies, setPolicies] = useState([]);
  const [gateData, setGateData] = useState({
    name: '',
    gate_type: 'approval',
    criteria: {},
    required_approvers: [],
    auto_approve_conditions: {},
    timeout_minutes: 60
  });

  React.useEffect(() => {
    loadPolicies();
  }, []);

  const loadPolicies = async () => {
    try {
      const data = await base44.entities.RefactorPolicy.list();
      setPolicies(data);
    } catch (error) {
      console.error('Failed to load policies:', error);
    }
  };

  const saveGate = async () => {
    setIsSaving(true);
    try {
      const user = await base44.auth.me();
      await base44.entities.CIGate.create({
        ...gateData,
        pipeline_id: pipelineId,
        org_id: user.organization?.id || 'org_default'
      });
      toast.success('Gate created');
      setShowForm(false);
      setGateData({
        name: '',
        gate_type: 'approval',
        criteria: {},
        required_approvers: [],
        auto_approve_conditions: {},
        timeout_minutes: 60
      });
      onSave?.();
    } catch (error) {
      console.error('Failed to create gate:', error);
      toast.error('Failed to create gate');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <Card className="bg-slate-900 border-slate-800">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="text-white">Gate Configuration</CardTitle>
          <Button
            size="sm"
            onClick={() => setShowForm(!showForm)}
            className="bg-blue-600 hover:bg-blue-700"
          >
            <Plus className="w-4 h-4 mr-1" />
            Add Gate
          </Button>
        </div>
      </CardHeader>
      {showForm && (
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label className="text-slate-300">Gate Name</Label>
            <Input
              value={gateData.name}
              onChange={(e) => setGateData({...gateData, name: e.target.value})}
              className="bg-slate-800 border-slate-700"
              placeholder="e.g., Security Approval"
            />
          </div>

          <div className="space-y-2">
            <Label className="text-slate-300">Gate Type</Label>
            <Select value={gateData.gate_type} onValueChange={(value) => setGateData({...gateData, gate_type: value})}>
              <SelectTrigger className="bg-slate-800 border-slate-700">
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="bg-slate-800 border-slate-700">
                <SelectItem value="approval">Approval</SelectItem>
                <SelectItem value="test">Test</SelectItem>
                <SelectItem value="security">Security</SelectItem>
                <SelectItem value="performance">Performance</SelectItem>
                <SelectItem value="policy">Policy</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {gateData.gate_type === 'test' && (
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label className="text-slate-300">Min Coverage %</Label>
                <Input
                  type="number"
                  placeholder="80"
                  className="bg-slate-800 border-slate-700"
                  onChange={(e) => setGateData({
                    ...gateData,
                    criteria: {...gateData.criteria, min_coverage: parseInt(e.target.value)}
                  })}
                />
              </div>
              <div className="space-y-2">
                <Label className="text-slate-300">Min Pass Count</Label>
                <Input
                  type="number"
                  placeholder="10"
                  className="bg-slate-800 border-slate-700"
                  onChange={(e) => setGateData({
                    ...gateData,
                    criteria: {...gateData.criteria, min_tests_passed: parseInt(e.target.value)}
                  })}
                />
              </div>
            </div>
          )}

          {gateData.gate_type === 'performance' && (
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label className="text-slate-300">Max Latency (ms)</Label>
                <Input
                  type="number"
                  placeholder="1000"
                  className="bg-slate-800 border-slate-700"
                  onChange={(e) => setGateData({
                    ...gateData,
                    criteria: {...gateData.criteria, max_latency_ms: parseInt(e.target.value)}
                  })}
                />
              </div>
              <div className="space-y-2">
                <Label className="text-slate-300">Min Throughput (rps)</Label>
                <Input
                  type="number"
                  placeholder="100"
                  className="bg-slate-800 border-slate-700"
                  onChange={(e) => setGateData({
                    ...gateData,
                    criteria: {...gateData.criteria, min_throughput_rps: parseInt(e.target.value)}
                  })}
                />
              </div>
            </div>
          )}

          {gateData.gate_type === 'policy' && (
            <div className="space-y-2">
              <Label className="text-slate-300">Select Policy</Label>
              <Select 
                onValueChange={(value) => setGateData({
                  ...gateData,
                  criteria: {...gateData.criteria, policy_id: value}
                })}
              >
                <SelectTrigger className="bg-slate-800 border-slate-700">
                  <SelectValue placeholder="Choose policy" />
                </SelectTrigger>
                <SelectContent className="bg-slate-800 border-slate-700">
                  {policies.map(policy => (
                    <SelectItem key={policy.id} value={policy.id}>{policy.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          {gateData.gate_type === 'approval' && (
            <div className="space-y-2">
              <Label className="text-slate-300">Required Approvers (emails)</Label>
              <Input
                placeholder="user@example.com"
                className="bg-slate-800 border-slate-700"
                onChange={(e) => setGateData({
                  ...gateData,
                  required_approvers: e.target.value.split(',').map(s => s.trim())
                })}
              />
            </div>
          )}

          <div className="space-y-2">
            <Label className="text-slate-300">Timeout (minutes)</Label>
            <Input
              type="number"
              value={gateData.timeout_minutes}
              onChange={(e) => setGateData({...gateData, timeout_minutes: parseInt(e.target.value)})}
              className="bg-slate-800 border-slate-700"
            />
          </div>

          <Button 
            onClick={saveGate}
            disabled={isSaving}
            className="w-full bg-green-600 hover:bg-green-700"
          >
            {isSaving ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" />Saving...</> : <><Save className="w-4 h-4 mr-2" />Save Gate</>}
          </Button>
        </CardContent>
      )}
    </Card>
  );
}