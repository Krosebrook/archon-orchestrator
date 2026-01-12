import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Loader2 } from 'lucide-react';

export default function ConfigurationModal({ open, onOpenChange, integration, onSave }) {
  const [configValues, setConfigValues] = useState({});
  const [isSaving, setIsSaving] = useState(false);

  const handleSave = async () => {
    setIsSaving(true);
    try {
      await onSave(configValues);
    } finally {
      setIsSaving(false);
    }
  };

  const schema = integration?.config_schema || {};

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="bg-slate-900 border-slate-800 text-white max-w-md">
        <DialogHeader>
          <DialogTitle>Configure {integration?.name}</DialogTitle>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {Object.entries(schema).map(([key, field]) => (
            <div key={key} className="space-y-2">
              <Label className="text-slate-300">
                {field.label || key}
                {field.required && <span className="text-red-400 ml-1">*</span>}
              </Label>
              {field.type === 'select' ? (
                <select
                  value={configValues[key] || ''}
                  onChange={(e) => setConfigValues({ ...configValues, [key]: e.target.value })}
                  className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-white"
                >
                  <option value="">Select...</option>
                  {field.options?.map(opt => (
                    <option key={opt} value={opt}>{opt}</option>
                  ))}
                </select>
              ) : (
                <Input
                  type={field.type === 'password' ? 'password' : 'text'}
                  value={configValues[key] || ''}
                  onChange={(e) => setConfigValues({ ...configValues, [key]: e.target.value })}
                  placeholder={field.placeholder}
                  className="bg-slate-950 border-slate-700 text-white"
                />
              )}
              {field.description && (
                <p className="text-xs text-slate-400">{field.description}</p>
              )}
            </div>
          ))}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} className="border-slate-700">
            Cancel
          </Button>
          <Button onClick={handleSave} disabled={isSaving} className="bg-blue-600 hover:bg-blue-700">
            {isSaving ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Saving...
              </>
            ) : (
              'Save & Install'
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}