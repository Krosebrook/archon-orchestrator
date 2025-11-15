import { useState, useEffect } from 'react';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { Check, X } from 'lucide-react';

export default function WorkflowSpecEditor({ spec, onSave }) {
  const [currentSpec, setCurrentSpec] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    try {
      setCurrentSpec(JSON.stringify(spec, null, 2));
      setError('');
    } catch (e) {
      setCurrentSpec('{}');
      setError('Invalid initial JSON spec.');
    }
  }, [spec]);

  const handleSave = () => {
    try {
      const parsedSpec = JSON.parse(currentSpec);
      setError('');
      onSave(parsedSpec);
    } catch (e) {
      setError('Invalid JSON format. Please correct it before saving.');
    }
  };

  return (
    <div className="space-y-4">
      <Label htmlFor="spec-editor" className="text-lg font-semibold text-white">Workflow Specification (JSON)</Label>
      <Textarea
        id="spec-editor"
        value={currentSpec}
        onChange={(e) => setCurrentSpec(e.target.value)}
        className={`
          font-mono bg-slate-950 border-slate-700 rounded-md p-4 h-96
          text-sm leading-6 text-white whitespace-pre-wrap
          focus-visible:ring-blue-500
          ${error ? 'border-red-500' : 'border-slate-700'}
        `}
        placeholder="Enter your workflow JSON specification here..."
      />
      {error && (
        <div className="flex items-center gap-2 text-sm text-red-400">
          <X className="w-4 h-4" />
          <span>{error}</span>
        </div>
      )}
      <div className="flex justify-end">
        <Button onClick={handleSave} className="bg-blue-600 hover:bg-blue-700 text-white">
          <Check className="mr-2 h-4 w-4" />
          Save Specification
        </Button>
      </div>
    </div>
  );
}