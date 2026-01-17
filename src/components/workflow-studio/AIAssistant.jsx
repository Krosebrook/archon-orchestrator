import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Sparkles, Send, Loader2, Lightbulb } from 'lucide-react';
import { base44 } from '@/api/base44Client';
import { toast } from 'sonner';
import ReactMarkdown from 'react-markdown';

export default function AIAssistant({ agents, workflows, _onRefresh }) {
  const [query, setQuery] = useState('');
  const [_response, _setResponse] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [conversationHistory, setConversationHistory] = useState([]);

  const suggestedQueries = [
    'Create a workflow for processing customer feedback with sentiment analysis',
    'What is the best agent sequence for data validation and transformation?',
    'How can I optimize my workflow costs?',
    'Design a multi-agent collaboration for document processing'
  ];

  const handleQuery = async () => {
    if (!query.trim()) {
      toast.error('Please enter a query');
      return;
    }

    setIsLoading(true);
    const userMessage = { role: 'user', content: query };
    setConversationHistory(prev => [...prev, userMessage]);

    try {
      const context = {
        available_agents: agents.map(a => ({
          name: a.name,
          provider: a.config.provider,
          model: a.config.model,
          capabilities: a.config.capabilities || []
        })),
        existing_workflows: workflows.map(w => ({
          name: w.name,
          description: w.description
        }))
      };

      const result = await base44.integrations.Core.InvokeLLM({
        prompt: `You are an expert AI workflow orchestration assistant for the Archon platform.

Context:
${JSON.stringify(context, null, 2)}

User Query: ${query}

Provide detailed, actionable guidance. If suggesting a workflow:
- Specify the agent sequence with reasoning
- Include error handling and retry logic
- Consider cost optimization
- Mention observability considerations

Format your response in markdown.`,
        add_context_from_internet: false
      });

      const assistantMessage = { role: 'assistant', content: result };
      setConversationHistory(prev => [...prev, assistantMessage]);
      setResponse(result);
      setQuery('');
    } catch (error) {
      console.error('AI query failed:', error);
      toast.error('Failed to get AI response');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      <div className="lg:col-span-2 space-y-4">
        <Card className="bg-slate-900 border-slate-800">
          <CardHeader>
            <CardTitle className="text-white flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-purple-400" />
              AI Workflow Assistant
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Textarea
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Ask me anything about workflow orchestration, agent sequencing, or optimizations..."
                className="min-h-[120px] bg-slate-950 border-slate-700 text-white"
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && e.ctrlKey) {
                    handleQuery();
                  }
                }}
              />
              <Button 
                onClick={handleQuery} 
                disabled={isLoading || !query.trim()}
                className="w-full bg-purple-600 hover:bg-purple-700"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Processing...
                  </>
                ) : (
                  <>
                    <Send className="w-4 h-4 mr-2" />
                    Ask AI Assistant
                  </>
                )}
              </Button>
            </div>

            {conversationHistory.length > 0 && (
              <div className="space-y-3 mt-6">
                {conversationHistory.map((msg, idx) => (
                  <div
                    key={idx}
                    className={`p-4 rounded-lg ${
                      msg.role === 'user'
                        ? 'bg-blue-500/10 border border-blue-500/30'
                        : 'bg-slate-950 border border-slate-800'
                    }`}
                  >
                    <div className="text-xs text-slate-400 mb-2">
                      {msg.role === 'user' ? 'You' : 'AI Assistant'}
                    </div>
                    {msg.role === 'user' ? (
                      <p className="text-sm text-slate-200">{msg.content}</p>
                    ) : (
                      <ReactMarkdown className="text-sm text-slate-300 prose prose-sm prose-invert max-w-none">
                        {msg.content}
                      </ReactMarkdown>
                    )}
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      <div className="space-y-4">
        <Card className="bg-slate-900 border-slate-800">
          <CardHeader>
            <CardTitle className="text-white flex items-center gap-2 text-sm">
              <Lightbulb className="w-4 h-4 text-yellow-400" />
              Suggested Queries
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {suggestedQueries.map((sq, idx) => (
              <button
                key={idx}
                onClick={() => setQuery(sq)}
                className="w-full text-left p-3 rounded-lg bg-slate-950 border border-slate-800 hover:border-purple-500/50 transition-colors text-sm text-slate-300"
              >
                {sq}
              </button>
            ))}
          </CardContent>
        </Card>

        <Card className="bg-slate-900 border-slate-800">
          <CardHeader>
            <CardTitle className="text-white text-sm">Quick Stats</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs text-slate-400">Available Agents</span>
              <Badge variant="outline">{agents.length}</Badge>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-xs text-slate-400">Total Workflows</span>
              <Badge variant="outline">{workflows.length}</Badge>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-xs text-slate-400">Queries Today</span>
              <Badge variant="outline">{conversationHistory.length}</Badge>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}