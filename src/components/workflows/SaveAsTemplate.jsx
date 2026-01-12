import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { BookTemplate, Loader2 } from 'lucide-react';
import { base44 } from '@/api/base44Client';
import { toast } from 'sonner';

const CATEGORIES = ['automation', 'data-processing', 'customer-support', 'analytics', 'integration'];
const COMPLEXITY = ['beginner', 'intermediate', 'advanced'];

export default function SaveAsTemplate({ workflow, open, onOpenChange }) {
  const [formData, setFormData] = useState({
    name: workflow?.name || '',
    description: workflow?.description || '',
    category: 'automation',
    complexity: 'intermediate',
    tags: '',
    use_cases: ''
  });
  const [isSaving, setIsSaving] = useState(false);

  const saveTemplate = async () => {
    setIsSaving(true);
    try {
      const user = await base44.auth.me();
      await base44.entities.WorkflowTemplate.create({
        name: formData.name,
        description: formData.description,
        category: formData.category,
        complexity: formData.complexity,
        tags: formData.tags.split(',').map(t => t.trim()).filter(Boolean),
        use_cases: formData.use_cases.split(',').map(u => u.trim()).filter(Boolean),
        spec: workflow.spec,
        usage_count: 0,
        org_id: user.organization?.id || 'org_default'
      });

      toast.success('Template saved successfully');
      onOpenChange(false);
    } catch (error) {
      console.error('Failed to save template:', error);
      toast.error('Failed to save template');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="bg-slate-900 border-slate-800 text-white max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <BookTemplate className="w-5 h-5" />
            Save as Template
          </DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div className="space-y-2">
            <Label>Template Name</Label>
            <Input
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              placeholder="e.g., Customer Feedback Analysis"
              className="bg-slate-800 border-slate-700"
            />
          </div>

          <div className="space-y-2">
            <Label>Description</Label>
            <Textarea
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              placeholder="Describe what this template does..."
              className="bg-slate-800 border-slate-700 resize-none"
              rows={3}
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <Label>Category</Label>
              <Select value={formData.category} onValueChange={(v) => setFormData({ ...formData, category: v })}>
                <SelectTrigger className="bg-slate-800 border-slate-700">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-slate-800 border-slate-700">
                  {CATEGORIES.map(cat => (
                    <SelectItem key={cat} value={cat} className="capitalize">
                      {cat.replace('-', ' ')}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Complexity</Label>
              <Select value={formData.complexity} onValueChange={(v) => setFormData({ ...formData, complexity: v })}>
                <SelectTrigger className="bg-slate-800 border-slate-700">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-slate-800 border-slate-700">
                  {COMPLEXITY.map(comp => (
                    <SelectItem key={comp} value={comp} className="capitalize">
                      {comp}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-2">
            <Label>Tags (comma-separated)</Label>
            <Input
              value={formData.tags}
              onChange={(e) => setFormData({ ...formData, tags: e.target.value })}
              placeholder="e.g., nlp, sentiment, automation"
              className="bg-slate-800 border-slate-700"
            />
          </div>

          <div className="space-y-2">
            <Label>Use Cases (comma-separated)</Label>
            <Input
              value={formData.use_cases}
              onChange={(e) => setFormData({ ...formData, use_cases: e.target.value })}
              placeholder="e.g., Customer feedback, Support tickets"
              className="bg-slate-800 border-slate-700"
            />
          </div>

          <Button
            onClick={saveTemplate}
            disabled={isSaving || !formData.name}
            className="w-full bg-blue-600 hover:bg-blue-700"
          >
            {isSaving ? (
              <><Loader2 className="w-4 h-4 mr-2 animate-spin" />Saving...</>
            ) : (
              <><BookTemplate className="w-4 h-4 mr-2" />Save Template</>
            )}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}