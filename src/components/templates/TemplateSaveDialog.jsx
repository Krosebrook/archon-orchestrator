import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { base44 } from '@/api/base44Client';
import { toast } from 'sonner';
import { Save, Tag } from 'lucide-react';

const CATEGORIES = [
  { value: 'agent_prompt', label: 'Agent Prompt' },
  { value: 'workflow', label: 'Workflow' },
  { value: 'customer_service', label: 'Customer Service' },
  { value: 'data_processing', label: 'Data Processing' },
  { value: 'content_generation', label: 'Content Generation' },
  { value: 'automation', label: 'Automation' },
];

export default function TemplateSaveDialog({ open, onOpenChange, initialData, onSaved }) {
  const [form, setForm] = useState({
    name: initialData?.name || '',
    description: initialData?.description || '',
    category: initialData?.category || 'agent_prompt',
    tags: initialData?.tags?.join(', ') || '',
    content: initialData?.content || '',
    version: initialData?.version || '1.0.0',
    change_notes: '',
  });
  const [saving, setSaving] = useState(false);

  const handleSave = async () => {
    if (!form.name.trim()) { toast.error('Name is required'); return; }
    if (!form.content.trim()) { toast.error('Content/prompt is required'); return; }
    setSaving(true);
    try {
      const payload = {
        name: form.name.trim(),
        description: form.description.trim(),
        category: form.category,
        tags: form.tags.split(',').map(t => t.trim()).filter(Boolean),
        spec: { content: form.content, version: form.version, change_notes: form.change_notes },
        version: form.version,
        is_featured: false,
        is_marketplace: false,
        status: 'active',
      };
      if (initialData?.id) {
        await base44.entities.WorkflowTemplate.update(initialData.id, payload);
        toast.success('Template updated!');
      } else {
        await base44.entities.WorkflowTemplate.create(payload);
        toast.success('Template saved!');
      }
      onSaved?.();
      onOpenChange(false);
    } catch (e) {
      toast.error('Failed to save template');
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="bg-slate-900 border-slate-700 text-white max-w-xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Save className="w-5 h-5 text-purple-400" />
            {initialData?.id ? 'Update Template' : 'Save as Template'}
          </DialogTitle>
        </DialogHeader>
        <div className="space-y-4 py-2">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1">
              <Label className="text-slate-300">Name *</Label>
              <Input value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
                placeholder="My Agent Template" className="bg-slate-800 border-slate-600 text-white" />
            </div>
            <div className="space-y-1">
              <Label className="text-slate-300">Version</Label>
              <Input value={form.version} onChange={e => setForm(f => ({ ...f, version: e.target.value }))}
                placeholder="1.0.0" className="bg-slate-800 border-slate-600 text-white" />
            </div>
          </div>
          <div className="space-y-1">
            <Label className="text-slate-300">Category</Label>
            <Select value={form.category} onValueChange={v => setForm(f => ({ ...f, category: v }))}>
              <SelectTrigger className="bg-slate-800 border-slate-600 text-white">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {CATEGORIES.map(c => <SelectItem key={c.value} value={c.value}>{c.label}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1">
            <Label className="text-slate-300">Description</Label>
            <Input value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
              placeholder="What does this template do?" className="bg-slate-800 border-slate-600 text-white" />
          </div>
          <div className="space-y-1">
            <Label className="text-slate-300">Prompt / Content *</Label>
            <Textarea value={form.content} onChange={e => setForm(f => ({ ...f, content: e.target.value }))}
              placeholder="Paste your agent prompt or workflow spec here..."
              rows={5} className="bg-slate-800 border-slate-600 text-white font-mono text-sm" />
          </div>
          <div className="space-y-1">
            <Label className="text-slate-300 flex items-center gap-1"><Tag className="w-3 h-3" /> Tags (comma-separated)</Label>
            <Input value={form.tags} onChange={e => setForm(f => ({ ...f, tags: e.target.value }))}
              placeholder="ai, customer-service, gpt-4" className="bg-slate-800 border-slate-600 text-white" />
          </div>
          {initialData?.id && (
            <div className="space-y-1">
              <Label className="text-slate-300">Change Notes</Label>
              <Input value={form.change_notes} onChange={e => setForm(f => ({ ...f, change_notes: e.target.value }))}
                placeholder="What changed in this version?" className="bg-slate-800 border-slate-600 text-white" />
            </div>
          )}
        </div>
        <DialogFooter>
          <Button variant="ghost" onClick={() => onOpenChange(false)} className="text-slate-400">Cancel</Button>
          <Button onClick={handleSave} disabled={saving} className="bg-purple-600 hover:bg-purple-700">
            {saving ? 'Saving...' : (initialData?.id ? 'Update' : 'Save Template')}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}