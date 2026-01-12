import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { base44 } from '@/api/base44Client';
import { toast } from 'sonner';

export default function PipelineForm({ open, onOpenChange, pipeline, agents, onSave }) {
  const [formData, setFormData] = useState({
    name: '',
    agent_id: '',
    trigger: 'manual',
    stages: [
      { name: 'Lint', type: 'lint', order: 1 },
      { name: 'Test', type: 'test', order: 2 },
      { name: 'Build', type: 'build', order: 3 }
    ],
    enabled: true,
    org_id: 'org_acme'
  });

  useEffect(() => {
    if (pipeline) {
      setFormData(pipeline);
    }
  }, [pipeline]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (pipeline) {
        await base44.entities.CIPipeline.update(pipeline.id, formData);
        toast.success('Pipeline updated');
      } else {
        await base44.entities.CIPipeline.create(formData);
        toast.success('Pipeline created');
      }
      onOpenChange(false);
      onSave();
    } catch (error) {
      toast.error('Failed to save pipeline');
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="bg-slate-900 border-slate-800 text-white sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>{pipeline ? 'Edit Pipeline' : 'Create Pipeline'}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label>Pipeline Name</Label>
            <Input
              value={formData.name}
              onChange={e => setFormData({ ...formData, name: e.target.value })}
              className="bg-slate-800 border-slate-700"
              required
            />
          </div>

          <div>
            <Label>Agent</Label>
            <Select value={formData.agent_id} onValueChange={v => setFormData({ ...formData, agent_id: v })}>
              <SelectTrigger className="bg-slate-800 border-slate-700">
                <SelectValue placeholder="Select agent" />
              </SelectTrigger>
              <SelectContent className="bg-slate-900 border-slate-800">
                {agents.map(agent => (
                  <SelectItem key={agent.id} value={agent.id}>{agent.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label>Trigger</Label>
            <Select value={formData.trigger} onValueChange={v => setFormData({ ...formData, trigger: v })}>
              <SelectTrigger className="bg-slate-800 border-slate-700">
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="bg-slate-900 border-slate-800">
                <SelectItem value="manual">Manual</SelectItem>
                <SelectItem value="commit">On Commit</SelectItem>
                <SelectItem value="schedule">Scheduled</SelectItem>
                <SelectItem value="webhook">Webhook</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)} className="border-slate-700">
              Cancel
            </Button>
            <Button type="submit" className="bg-blue-600 hover:bg-blue-700">
              {pipeline ? 'Update' : 'Create'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}