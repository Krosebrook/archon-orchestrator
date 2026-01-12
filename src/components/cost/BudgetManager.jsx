import { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Plus, AlertTriangle, CheckCircle2, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { Progress } from '@/components/ui/progress';

export default function BudgetManager({ budgets, onRefresh }) {
  const [createDialogOpen, setCreateDialogOpen] = useState(false);

  return (
    <div className="space-y-4">
      <Card className="bg-slate-900 border-slate-800">
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="text-white">Budget Management</CardTitle>
            <Dialog open={createDialogOpen} onOpenChange={setCreateDialogOpen}>
              <DialogTrigger asChild>
                <Button className="bg-green-600 hover:bg-green-700">
                  <Plus className="w-4 h-4 mr-2" />
                  Create Budget
                </Button>
              </DialogTrigger>
              <DialogContent className="bg-slate-900 border-slate-800 text-white max-w-2xl">
                <DialogHeader>
                  <DialogTitle>Create Budget</DialogTitle>
                  <DialogDescription className="text-slate-400">
                    Set spending limits for agents, workflows, or organization-wide
                  </DialogDescription>
                </DialogHeader>
                <CreateBudgetForm
                  onSuccess={() => {
                    setCreateDialogOpen(false);
                    onRefresh();
                  }}
                />
              </DialogContent>
            </Dialog>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {budgets.map((budget) => (
              <BudgetCard key={budget.id} budget={budget} onRefresh={onRefresh} />
            ))}
            {budgets.length === 0 && (
              <div className="text-center py-8 text-slate-400">
                No budgets configured yet
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

function BudgetCard({ budget, onRefresh }) {
  const usagePercent = (budget.current_spend_cents / budget.limit_cents) * 100;
  
  const statusConfig = {
    active: { color: 'text-green-400', icon: CheckCircle2, bg: 'bg-green-900/20' },
    paused: { color: 'text-slate-400', icon: AlertTriangle, bg: 'bg-slate-800' },
    exceeded: { color: 'text-red-400', icon: AlertTriangle, bg: 'bg-red-900/20' },
    archived: { color: 'text-slate-500', icon: CheckCircle2, bg: 'bg-slate-800' },
  };

  const config = statusConfig[budget.status];
  const StatusIcon = config.icon;

  return (
    <div className={`p-4 rounded-lg ${config.bg} border border-slate-700`}>
      <div className="flex items-start justify-between mb-3">
        <div>
          <div className="flex items-center gap-2">
            <h3 className="font-medium text-white">{budget.name}</h3>
            <span className="text-xs px-2 py-0.5 rounded bg-slate-800 text-slate-300">
              {budget.scope}
            </span>
            <span className="text-xs px-2 py-0.5 rounded bg-slate-800 text-slate-300">
              {budget.period}
            </span>
          </div>
          <div className="text-sm text-slate-400 mt-1">
            {budget.enforce_hard_limit && (
              <span className="text-red-400 text-xs">Hard limit enforced • </span>
            )}
            {new Date(budget.period_start).toLocaleDateString()} - {new Date(budget.period_end).toLocaleDateString()}
          </div>
        </div>
        <StatusIcon className={`w-5 h-5 ${config.color}`} />
      </div>

      <div className="space-y-2">
        <div className="flex items-center justify-between text-sm">
          <span className="text-slate-400">Spend</span>
          <span className="text-white font-medium">
            ${(budget.current_spend_cents / 100).toFixed(2)} / ${(budget.limit_cents / 100).toFixed(2)}
          </span>
        </div>
        <Progress 
          value={Math.min(usagePercent, 100)} 
          className="h-2"
          indicatorClassName={usagePercent > 100 ? 'bg-red-500' : usagePercent > 80 ? 'bg-yellow-500' : 'bg-green-500'}
        />
        <div className="text-xs text-slate-500">
          {usagePercent.toFixed(1)}% used
        </div>
      </div>

      {budget.alert_thresholds && budget.alert_thresholds.some(t => t.alerted) && (
        <div className="mt-3 p-2 bg-yellow-900/20 border border-yellow-700/50 rounded text-xs text-yellow-400">
          <AlertTriangle className="w-3 h-3 inline mr-1" />
          Alert thresholds triggered
        </div>
      )}
    </div>
  );
}

function CreateBudgetForm({ onSuccess }) {
  const [formData, setFormData] = useState({
    name: '',
    scope: 'organization',
    scope_id: null,
    period: 'monthly',
    limit_cents: 10000,
    enforce_hard_limit: false,
  });
  const [isCreating, setIsCreating] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsCreating(true);

    try {
      const user = await base44.auth.me();
      
      const now = new Date();
      const periodEnd = new Date(now);
      if (formData.period === 'daily') {
        periodEnd.setDate(periodEnd.getDate() + 1);
      } else if (formData.period === 'weekly') {
        periodEnd.setDate(periodEnd.getDate() + 7);
      } else if (formData.period === 'monthly') {
        periodEnd.setMonth(periodEnd.getMonth() + 1);
      } else if (formData.period === 'yearly') {
        periodEnd.setFullYear(periodEnd.getFullYear() + 1);
      }

      await base44.entities.Budget.create({
        name: formData.name,
        scope: formData.scope,
        scope_id: formData.scope_id,
        period: formData.period,
        limit_cents: formData.limit_cents,
        current_spend_cents: 0,
        period_start: now.toISOString(),
        period_end: periodEnd.toISOString(),
        enforce_hard_limit: formData.enforce_hard_limit,
        status: 'active',
        org_id: user.organization.id,
      });

      toast.success('Budget created successfully');
      onSuccess();
    } catch (error) {
      console.error('Failed to create budget:', error);
      toast.error('Failed to create budget');
    } finally {
      setIsCreating(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <Label>Budget Name</Label>
        <Input
          value={formData.name}
          onChange={(e) => setFormData({ ...formData, name: e.target.value })}
          placeholder="Q1 2024 AI Budget"
          className="bg-slate-800 border-slate-700"
          required
        />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label>Scope</Label>
          <Select
            value={formData.scope}
            onValueChange={(value) => setFormData({ ...formData, scope: value })}
          >
            <SelectTrigger className="bg-slate-800 border-slate-700">
              <SelectValue />
            </SelectTrigger>
            <SelectContent className="bg-slate-800 border-slate-700">
              <SelectItem value="organization">Organization-wide</SelectItem>
              <SelectItem value="agent">Per Agent</SelectItem>
              <SelectItem value="workflow">Per Workflow</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div>
          <Label>Period</Label>
          <Select
            value={formData.period}
            onValueChange={(value) => setFormData({ ...formData, period: value })}
          >
            <SelectTrigger className="bg-slate-800 border-slate-700">
              <SelectValue />
            </SelectTrigger>
            <SelectContent className="bg-slate-800 border-slate-700">
              <SelectItem value="daily">Daily</SelectItem>
              <SelectItem value="weekly">Weekly</SelectItem>
              <SelectItem value="monthly">Monthly</SelectItem>
              <SelectItem value="yearly">Yearly</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <div>
        <Label>Budget Limit ($)</Label>
        <Input
          type="number"
          step="0.01"
          value={formData.limit_cents / 100}
          onChange={(e) => setFormData({ ...formData, limit_cents: Math.round(parseFloat(e.target.value) * 100) })}
          placeholder="100.00"
          className="bg-slate-800 border-slate-700"
          required
        />
      </div>

      <div className="flex items-center gap-2">
        <input
          type="checkbox"
          id="enforce"
          checked={formData.enforce_hard_limit}
          onChange={(e) => setFormData({ ...formData, enforce_hard_limit: e.target.checked })}
          className="w-4 h-4"
        />
        <Label htmlFor="enforce" className="cursor-pointer">
          Enforce hard limit (block executions when exceeded)
        </Label>
      </div>

      <div className="flex justify-end gap-2 pt-4">
        <Button type="submit" disabled={isCreating} className="bg-green-600 hover:bg-green-700">
          {isCreating && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
          Create Budget
        </Button>
      </div>
    </form>
  );
}