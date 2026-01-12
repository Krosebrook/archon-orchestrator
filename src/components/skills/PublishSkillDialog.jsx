import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Skill } from '@/entities/all';
import { base44 } from '@/api/base44Client';
import { toast } from 'sonner';
import { Code, DollarSign, Shield } from 'lucide-react';

export default function PublishSkillDialog({ open, onOpenChange, onPublish }) {
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    category: 'tool',
    version: '1.0.0',
    tags: '',
    pricing_model: 'free',
    amount_cents: 0,
    spec_type: 'function',
    code: '',
    parameters: '{}',
    timeout_ms: 5000,
    max_memory_mb: 128
  });
  const [isPublishing, setIsPublishing] = useState(false);

  const handlePublish = async () => {
    if (!formData.name || !formData.description) {
      toast.error('Please fill in required fields');
      return;
    }

    setIsPublishing(true);
    try {
      const user = await base44.auth.me();

      let parameters = {};
      try {
        parameters = JSON.parse(formData.parameters);
      } catch (e) {
        toast.error('Invalid JSON for parameters');
        setIsPublishing(false);
        return;
      }

      await Skill.create({
        name: formData.name,
        description: formData.description,
        category: formData.category,
        author_email: user.email,
        author_name: user.full_name || user.email,
        version: formData.version,
        spec: {
          type: formData.spec_type,
          code: formData.code,
          parameters,
          permissions: []
        },
        pricing: {
          model: formData.pricing_model,
          amount_cents: formData.amount_cents
        },
        is_public: true,
        tags: formData.tags.split(',').map(t => t.trim()).filter(Boolean),
        sandbox_config: {
          timeout_ms: formData.timeout_ms,
          max_memory_mb: formData.max_memory_mb,
          allowed_apis: []
        },
        org_id: user.organization.id
      });

      toast.success('Skill published successfully');
      onPublish?.();
      onOpenChange(false);
      
      // Reset form
      setFormData({
        name: '',
        description: '',
        category: 'tool',
        version: '1.0.0',
        tags: '',
        pricing_model: 'free',
        amount_cents: 0,
        spec_type: 'function',
        code: '',
        parameters: '{}',
        timeout_ms: 5000,
        max_memory_mb: 128
      });
    } catch (error) {
      console.error('Failed to publish skill:', error);
      toast.error('Failed to publish skill');
    } finally {
      setIsPublishing(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="bg-slate-900 border-slate-800 text-white max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-xl">Publish a New Skill</DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label className="text-slate-300">Skill Name *</Label>
              <Input
                value={formData.name}
                onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                placeholder="e.g., Web Scraper"
                className="bg-slate-950 border-slate-700 text-white"
              />
            </div>
            <div>
              <Label className="text-slate-300">Version *</Label>
              <Input
                value={formData.version}
                onChange={(e) => setFormData(prev => ({ ...prev, version: e.target.value }))}
                placeholder="1.0.0"
                className="bg-slate-950 border-slate-700 text-white"
              />
            </div>
          </div>

          <div>
            <Label className="text-slate-300">Description *</Label>
            <Textarea
              value={formData.description}
              onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
              placeholder="Describe what your skill does..."
              className="bg-slate-950 border-slate-700 text-white"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label className="text-slate-300">Category *</Label>
              <Select value={formData.category} onValueChange={(val) => setFormData(prev => ({ ...prev, category: val }))}>
                <SelectTrigger className="bg-slate-950 border-slate-700 text-white">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="tool">Tool</SelectItem>
                  <SelectItem value="integration">Integration</SelectItem>
                  <SelectItem value="llm_capability">LLM Capability</SelectItem>
                  <SelectItem value="data_processor">Data Processor</SelectItem>
                  <SelectItem value="api_connector">API Connector</SelectItem>
                  <SelectItem value="custom">Custom</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label className="text-slate-300">Tags (comma-separated)</Label>
              <Input
                value={formData.tags}
                onChange={(e) => setFormData(prev => ({ ...prev, tags: e.target.value }))}
                placeholder="scraping, data, automation"
                className="bg-slate-950 border-slate-700 text-white"
              />
            </div>
          </div>

          <div className="border-t border-slate-800 pt-6">
            <div className="flex items-center gap-2 mb-4">
              <DollarSign className="w-5 h-5 text-green-400" />
              <h3 className="text-lg font-semibold text-white">Pricing</h3>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label className="text-slate-300">Pricing Model</Label>
                <Select value={formData.pricing_model} onValueChange={(val) => setFormData(prev => ({ ...prev, pricing_model: val }))}>
                  <SelectTrigger className="bg-slate-950 border-slate-700 text-white">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="free">Free</SelectItem>
                    <SelectItem value="one_time">One-time Purchase</SelectItem>
                    <SelectItem value="subscription">Subscription</SelectItem>
                    <SelectItem value="usage_based">Usage-based</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              {formData.pricing_model !== 'free' && (
                <div>
                  <Label className="text-slate-300">Price (USD)</Label>
                  <Input
                    type="number"
                    value={formData.amount_cents / 100}
                    onChange={(e) => setFormData(prev => ({ ...prev, amount_cents: Math.round(parseFloat(e.target.value || 0) * 100) }))}
                    placeholder="9.99"
                    className="bg-slate-950 border-slate-700 text-white"
                  />
                </div>
              )}
            </div>
          </div>

          <div className="border-t border-slate-800 pt-6">
            <div className="flex items-center gap-2 mb-4">
              <Code className="w-5 h-5 text-blue-400" />
              <h3 className="text-lg font-semibold text-white">Implementation</h3>
            </div>
            <div className="space-y-4">
              <div>
                <Label className="text-slate-300">Spec Type</Label>
                <Select value={formData.spec_type} onValueChange={(val) => setFormData(prev => ({ ...prev, spec_type: val }))}>
                  <SelectTrigger className="bg-slate-950 border-slate-700 text-white">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="function">Function</SelectItem>
                    <SelectItem value="api">API</SelectItem>
                    <SelectItem value="llm_prompt">LLM Prompt</SelectItem>
                    <SelectItem value="integration">Integration</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label className="text-slate-300">Code / Configuration</Label>
                <Textarea
                  value={formData.code}
                  onChange={(e) => setFormData(prev => ({ ...prev, code: e.target.value }))}
                  placeholder="// Your skill implementation..."
                  className="bg-slate-950 border-slate-700 text-white font-mono min-h-32"
                />
              </div>
              <div>
                <Label className="text-slate-300">Parameters (JSON)</Label>
                <Textarea
                  value={formData.parameters}
                  onChange={(e) => setFormData(prev => ({ ...prev, parameters: e.target.value }))}
                  placeholder='{"url": {"type": "string", "required": true}}'
                  className="bg-slate-950 border-slate-700 text-white font-mono"
                />
              </div>
            </div>
          </div>

          <div className="border-t border-slate-800 pt-6">
            <div className="flex items-center gap-2 mb-4">
              <Shield className="w-5 h-5 text-purple-400" />
              <h3 className="text-lg font-semibold text-white">Security Settings</h3>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label className="text-slate-300">Timeout (ms)</Label>
                <Input
                  type="number"
                  value={formData.timeout_ms}
                  onChange={(e) => setFormData(prev => ({ ...prev, timeout_ms: parseInt(e.target.value || 5000) }))}
                  className="bg-slate-950 border-slate-700 text-white"
                />
              </div>
              <div>
                <Label className="text-slate-300">Max Memory (MB)</Label>
                <Input
                  type="number"
                  value={formData.max_memory_mb}
                  onChange={(e) => setFormData(prev => ({ ...prev, max_memory_mb: parseInt(e.target.value || 128) }))}
                  className="bg-slate-950 border-slate-700 text-white"
                />
              </div>
            </div>
          </div>

          <div className="flex gap-3 pt-4">
            <Button
              variant="outline"
              onClick={() => onOpenChange(false)}
              className="flex-1 bg-slate-800 border-slate-700"
            >
              Cancel
            </Button>
            <Button
              onClick={handlePublish}
              disabled={isPublishing}
              className="flex-1 bg-blue-600 hover:bg-blue-700"
            >
              {isPublishing ? 'Publishing...' : 'Publish Skill'}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}