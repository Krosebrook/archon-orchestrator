import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Sparkles, Loader2, CheckCircle2 } from 'lucide-react';
import { base44 } from '@/api/base44Client';
import { toast } from 'sonner';

export default function AIConnectorAssistant({ onApplySuggestions }) {
  const [description, setDescription] = useState('');
  const [apiDocs, setApiDocs] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [suggestions, setSuggestions] = useState(null);

  const handleGenerate = async () => {
    if (!description.trim()) {
      toast.error('Please provide an API description');
      return;
    }

    setIsGenerating(true);
    try {
      const result = await base44.functions.invoke('generateConnectorDefinition', {
        description: description.trim(),
        apiDocumentation: apiDocs.trim() || null,
      });

      if (result.data?.success) {
        setSuggestions(result.data.data);
        toast.success('AI generated connector definition successfully!');
      } else {
        throw new Error('Failed to generate definition');
      }
    } catch (error) {
      toast.error('Failed to generate definition: ' + error.message);
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Sparkles className="w-5 h-5 text-purple-400" />
          AI Connector Assistant
        </CardTitle>
        <CardDescription>
          Describe your API and let AI generate the connector definition for you
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div>
          <label className="text-sm font-medium mb-2 block">
            API Description *
          </label>
          <Textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Describe the API you want to integrate. For example: 'GitHub API for managing repositories, issues, and pull requests. Uses REST with OAuth2 authentication.'"
            rows={4}
            className="bg-slate-800 border-slate-700"
          />
        </div>

        <div>
          <label className="text-sm font-medium mb-2 block">
            API Documentation (Optional)
          </label>
          <Textarea
            value={apiDocs}
            onChange={(e) => setApiDocs(e.target.value)}
            placeholder="Paste API documentation, example requests/responses, or OpenAPI specs to improve accuracy"
            rows={6}
            className="bg-slate-800 border-slate-700 font-mono text-xs"
          />
        </div>

        <Button
          onClick={handleGenerate}
          disabled={isGenerating || !description.trim()}
          className="w-full bg-purple-600 hover:bg-purple-700"
        >
          {isGenerating ? (
            <>
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              Generating...
            </>
          ) : (
            <>
              <Sparkles className="w-4 h-4 mr-2" />
              Generate Connector Definition
            </>
          )}
        </Button>

        {suggestions && (
          <div className="space-y-4 pt-4 border-t border-slate-700">
            <div className="space-y-2">
              <h4 className="font-semibold text-white">AI Suggestions</h4>
              
              <div className="space-y-2">
                <div>
                  <span className="text-sm text-slate-400">Name:</span>
                  <span className="ml-2 text-white">{suggestions.name}</span>
                </div>
                <div>
                  <span className="text-sm text-slate-400">Provider:</span>
                  <span className="ml-2 text-white">{suggestions.provider}</span>
                </div>
                <div>
                  <span className="text-sm text-slate-400">Category:</span>
                  <Badge className="ml-2">{suggestions.category}</Badge>
                </div>
                <div>
                  <span className="text-sm text-slate-400">Authentication:</span>
                  <Badge variant="outline" className="ml-2">{suggestions.auth_type}</Badge>
                </div>
                {suggestions.auth_reasoning && (
                  <div className="text-sm text-slate-400 italic">
                    Reasoning: {suggestions.auth_reasoning}
                  </div>
                )}
              </div>

              <div className="mt-4">
                <div className="text-sm text-slate-400 mb-2">
                  Generated Operations: {suggestions.operations?.length || 0}
                </div>
                <div className="space-y-2 max-h-64 overflow-y-auto">
                  {suggestions.operations?.map((op, idx) => (
                    <div key={idx} className="bg-slate-800 p-3 rounded-lg text-sm">
                      <div className="font-medium text-white">{op.name}</div>
                      <div className="text-slate-400 text-xs">
                        {op.method} {op.endpoint}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <Button
              onClick={() => onApplySuggestions(suggestions)}
              className="w-full bg-green-600 hover:bg-green-700"
            >
              <CheckCircle2 className="w-4 h-4 mr-2" />
              Apply AI Suggestions
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}