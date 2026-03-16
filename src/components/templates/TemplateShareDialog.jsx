import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { base44 } from '@/api/base44Client';
import { toast } from 'sonner';
import { Share2, Copy, Globe, Lock } from 'lucide-react';

export default function TemplateShareDialog({ open, onOpenChange, template, onUpdated }) {
  const [isPublic, setIsPublic] = useState(template?.is_marketplace ?? false);
  const [saving, setSaving] = useState(false);

  const shareUrl = `${window.location.origin}/Templates?template=${template?.id}`;

  const handleCopy = () => {
    navigator.clipboard.writeText(shareUrl);
    toast.success('Link copied to clipboard!');
  };

  const handleTogglePublic = async (value) => {
    setIsPublic(value);
    setSaving(true);
    try {
      await base44.entities.WorkflowTemplate.update(template.id, { is_marketplace: value });
      toast.success(value ? 'Template is now public in the marketplace' : 'Template is now private');
      onUpdated?.();
    } catch {
      toast.error('Failed to update sharing settings');
      setIsPublic(!value);
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="bg-slate-900 border-slate-700 text-white max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Share2 className="w-5 h-5 text-green-400" />
            Share Template
          </DialogTitle>
        </DialogHeader>
        <div className="space-y-6 py-2">
          <div className="flex items-center justify-between p-4 rounded-lg bg-slate-800 border border-slate-700">
            <div className="flex items-center gap-3">
              {isPublic ? <Globe className="w-5 h-5 text-green-400" /> : <Lock className="w-5 h-5 text-slate-400" />}
              <div>
                <div className="text-white font-medium">{isPublic ? 'Public' : 'Private'}</div>
                <div className="text-xs text-slate-400">
                  {isPublic ? 'Visible in the template marketplace' : 'Only accessible within your org'}
                </div>
              </div>
            </div>
            <Switch checked={isPublic} onCheckedChange={handleTogglePublic} disabled={saving} />
          </div>

          <div className="space-y-2">
            <Label className="text-slate-300">Direct Link</Label>
            <div className="flex gap-2">
              <Input value={shareUrl} readOnly className="bg-slate-800 border-slate-600 text-slate-300 text-sm" />
              <Button onClick={handleCopy} variant="outline" className="border-slate-600 shrink-0">
                <Copy className="w-4 h-4" />
              </Button>
            </div>
          </div>

          <div className="p-3 rounded-lg bg-slate-800 border border-slate-700 text-xs text-slate-400">
            <strong className="text-slate-300">Template:</strong> {template?.name}<br />
            <strong className="text-slate-300">Version:</strong> {template?.version || '1.0.0'}<br />
            <strong className="text-slate-300">Category:</strong> {template?.category}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}