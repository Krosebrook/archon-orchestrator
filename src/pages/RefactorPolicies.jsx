import { useState, useEffect } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { base44 } from '@/api/base44Client';
import { Shield, Plus } from 'lucide-react';
import { toast } from 'sonner';
import PolicyEditor from '../components/refactoring/PolicyEditor';
import PolicyList from '../components/refactoring/PolicyList';
import PolicySimulator from '../components/refactoring/PolicySimulator';
import AIPolicySuggestions from '../components/refactoring/AIPolicySuggestions';

export default function RefactorPolicies() {
  const [policies, setPolicies] = useState([]);
  const [showEditor, setShowEditor] = useState(false);
  const [editingPolicy, setEditingPolicy] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadPolicies();
  }, []);

  const loadPolicies = async () => {
    setIsLoading(true);
    try {
      const data = await base44.entities.RefactorPolicy.list();
      setPolicies(data);
    } catch (error) {
      console.error('Failed to load policies:', error);
      toast.error('Failed to load policies');
    } finally {
      setIsLoading(false);
    }
  };

  const handleCreatePolicy = () => {
    setEditingPolicy(null);
    setShowEditor(true);
  };

  const handleEditPolicy = (policy) => {
    setEditingPolicy(policy);
    setShowEditor(true);
  };

  const handleSavePolicy = async (policyData) => {
    try {
      const user = await base44.auth.me();
      
      if (editingPolicy) {
        await base44.entities.RefactorPolicy.update(editingPolicy.id, policyData);
        toast.success('Policy updated');
      } else {
        await base44.entities.RefactorPolicy.create({
          ...policyData,
          org_id: user.organization?.id || 'org_default'
        });
        toast.success('Policy created');
      }
      
      setShowEditor(false);
      setEditingPolicy(null);
      loadPolicies();
    } catch (error) {
      console.error('Failed to save policy:', error);
      toast.error('Failed to save policy');
    }
  };

  const handleApplySuggestion = async (suggestedPolicy) => {
    await handleSavePolicy(suggestedPolicy);
  };

  const stats = {
    total: policies.length,
    active: policies.filter(p => p.enabled).length,
    violations: policies.reduce((sum, p) => sum + (p.violations || 0), 0),
    strict: policies.filter(p => p.enforcement === 'strict').length
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-white mb-2 flex items-center gap-3">
            <Shield className="w-8 h-8 text-green-400" />
            Refactoring Policy Engine
          </h1>
          <p className="text-slate-400">Define and enforce refactoring rules and guardrails</p>
        </div>
        <Button onClick={handleCreatePolicy} className="bg-green-600 hover:bg-green-700">
          <Plus className="w-4 h-4 mr-2" />
          New Policy
        </Button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="bg-slate-900 border-slate-800">
          <CardContent className="pt-6">
            <div className="text-sm text-slate-400 mb-2">Total Policies</div>
            <div className="text-3xl font-bold text-white">{stats.total}</div>
          </CardContent>
        </Card>

        <Card className="bg-slate-900 border-slate-800">
          <CardContent className="pt-6">
            <div className="text-sm text-slate-400 mb-2">Active</div>
            <div className="text-3xl font-bold text-green-400">{stats.active}</div>
          </CardContent>
        </Card>

        <Card className="bg-slate-900 border-slate-800">
          <CardContent className="pt-6">
            <div className="text-sm text-slate-400 mb-2">Violations</div>
            <div className="text-3xl font-bold text-red-400">{stats.violations}</div>
          </CardContent>
        </Card>

        <Card className="bg-slate-900 border-slate-800">
          <CardContent className="pt-6">
            <div className="text-sm text-slate-400 mb-2">Strict Mode</div>
            <div className="text-3xl font-bold text-purple-400">{stats.strict}</div>
          </CardContent>
        </Card>
      </div>

      {showEditor ? (
        <PolicyEditor
          policy={editingPolicy}
          onSave={handleSavePolicy}
          onCancel={() => {
            setShowEditor(false);
            setEditingPolicy(null);
          }}
        />
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-6">
            <AIPolicySuggestions onApplySuggestion={handleApplySuggestion} />
            <PolicyList
              policies={policies}
              onEdit={handleEditPolicy}
              onRefresh={loadPolicies}
            />
          </div>
          <div>
            <PolicySimulator policies={policies} />
          </div>
        </div>
      )}
    </div>
  );
}