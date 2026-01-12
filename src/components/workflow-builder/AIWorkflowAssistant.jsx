/**
 * @fileoverview AI Workflow Assistant
 * @description Conversational AI that helps users design workflows from natural language,
 * suggests optimizations, and generates sub-workflows automatically.
 * 
 * @module workflow-builder/AIWorkflowAssistant
 * @version 1.0.0
 */

import { useState, useRef, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Sparkles, Send, Loader2, Wand2 } from 'lucide-react';
import { base44 } from '@/api/base44Client';
import { toast } from 'sonner';
import { handleError } from '../utils/api-client';
import { auditCreate, AuditEntities } from '../utils/audit-logger';

export default function AIWorkflowAssistant({ agents, skills, onWorkflowGenerated, currentWorkflow }) {
  const [messages, setMessages] = useState([
    {
      role: 'assistant',
      content: 'Hi! I can help you design workflows. Describe what you want to automate, and I\'ll generate a workflow for you.',
      timestamp: new Date().toISOString()
    }
  ]);
  const [input, setInput] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const scrollRef = useRef(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const generateWorkflow = async (userRequest) => {
    setIsGenerating(true);
    
    const userMessage = {
      role: 'user',
      content: userRequest,
      timestamp: new Date().toISOString()
    };
    setMessages(prev => [...prev, userMessage]);
    setInput('');

    try {
      const user = await base44.auth.me();
      
      const context = {
        available_agents: agents.map(a => ({
          name: a.name,
          capabilities: a.config?.capabilities || [],
          provider: a.config?.provider
        })),
        available_skills: skills.map(s => ({
          name: s.name,
          category: s.category,
          description: s.description
        })),
        current_workflow: currentWorkflow ? {
          nodes: currentWorkflow.spec?.nodes?.length || 0,
          strategy: currentWorkflow.spec?.collaboration_strategy
        } : null
      };

      const result = await base44.integrations.Core.InvokeLLM({
        prompt: `You are an expert workflow designer. The user wants: "${userRequest}"

Available resources:
${JSON.stringify(context, null, 2)}

Generate a workflow specification that:
1. Uses available agents/skills where possible
2. Follows best practices for agent collaboration
3. Includes proper error handling and fallbacks
4. Is optimized for cost and latency

Return a workflow with:
- Clear, descriptive node labels
- Proper dependencies between nodes
- Configuration for each node
- Estimated cost and duration
- Explanation of the design choices`,
        response_json_schema: {
          type: "object",
          properties: {
            explanation: { type: "string" },
            workflow: {
              type: "object",
              properties: {
                name: { type: "string" },
                description: { type: "string" },
                nodes: {
                  type: "array",
                  items: {
                    type: "object",
                    properties: {
                      id: { type: "string" },
                      type: { type: "string" },
                      label: { type: "string" },
                      config: { type: "object" },
                      position: { 
                        type: "object",
                        properties: {
                          x: { type: "number" },
                          y: { type: "number" }
                        }
                      }
                    }
                  }
                },
                edges: {
                  type: "array",
                  items: {
                    type: "object",
                    properties: {
                      from: { type: "string" },
                      to: { type: "string" }
                    }
                  }
                },
                collaboration_strategy: { type: "string" }
              }
            },
            estimated_cost_cents: { type: "number" },
            estimated_duration_sec: { type: "number" },
            optimization_tips: { type: "array", items: { type: "string" } }
          }
        }
      });

      const assistantMessage = {
        role: 'assistant',
        content: result.explanation,
        workflow: result.workflow,
        metadata: {
          estimated_cost: result.estimated_cost_cents,
          estimated_duration: result.estimated_duration_sec,
          tips: result.optimization_tips
        },
        timestamp: new Date().toISOString()
      };
      
      setMessages(prev => [...prev, assistantMessage]);

      // Audit workflow generation
      await auditCreate(AuditEntities.WORKFLOW, 'ai_generated', {
        request: userRequest.substring(0, 200),
        node_count: result.workflow?.nodes?.length || 0
      });

      toast.success('Workflow generated!');
    } catch (error) {
      handleError(error);
      setMessages(prev => [...prev, {
        role: 'assistant',
        content: 'Sorry, I encountered an error generating the workflow. Please try rephrasing your request.',
        timestamp: new Date().toISOString()
      }]);
    } finally {
      setIsGenerating(false);
    }
  };

  const handleApplyWorkflow = (workflow) => {
    onWorkflowGenerated(workflow);
    toast.success('Workflow applied to canvas');
  };

  return (
    <Card className="bg-slate-900 border-slate-800 flex flex-col h-full">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-white text-sm">
          <Sparkles className="w-4 h-4 text-purple-400" />
          AI Workflow Assistant
        </CardTitle>
      </CardHeader>
      <CardContent className="flex-1 flex flex-col p-0">
        {/* Messages */}
        <ScrollArea className="flex-1 px-4" ref={scrollRef}>
          <div className="space-y-3 py-4">
            {messages.map((msg, idx) => (
              <div key={idx} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                <div className={`max-w-[85%] ${msg.role === 'user' ? 'bg-blue-600 text-white' : 'bg-slate-800 text-slate-200'} rounded-lg p-3`}>
                  <p className="text-sm whitespace-pre-wrap">{msg.content}</p>
                  
                  {msg.workflow && (
                    <div className="mt-3 pt-3 border-t border-slate-700 space-y-2">
                      <div className="flex items-center justify-between">
                        <Badge variant="outline" className="bg-purple-500/20 text-purple-400">
                          {msg.workflow.nodes?.length || 0} nodes
                        </Badge>
                        {msg.metadata?.estimated_cost && (
                          <span className="text-xs text-slate-400">
                            ~${(msg.metadata.estimated_cost / 100).toFixed(2)}
                          </span>
                        )}
                      </div>
                      <Button
                        onClick={() => handleApplyWorkflow(msg.workflow)}
                        size="sm"
                        className="w-full bg-purple-600 hover:bg-purple-700"
                      >
                        <Wand2 className="w-4 h-4 mr-2" />
                        Apply to Canvas
                      </Button>
                      {msg.metadata?.tips?.length > 0 && (
                        <div className="text-xs text-slate-400 mt-2">
                          <div className="font-semibold mb-1">Optimization Tips:</div>
                          <ul className="space-y-1 list-disc list-inside">
                            {msg.metadata.tips.map((tip, i) => (
                              <li key={i}>{tip}</li>
                            ))}
                          </ul>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>
            ))}
            {isGenerating && (
              <div className="flex justify-start">
                <div className="bg-slate-800 rounded-lg p-3">
                  <Loader2 className="w-4 h-4 animate-spin text-purple-400" />
                </div>
              </div>
            )}
          </div>
        </ScrollArea>

        {/* Input */}
        <div className="p-4 border-t border-slate-800">
          <div className="flex gap-2">
            <Input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && !isGenerating && input.trim() && generateWorkflow(input)}
              placeholder="Describe your workflow..."
              className="bg-slate-950 border-slate-700 text-sm"
              disabled={isGenerating}
            />
            <Button
              onClick={() => generateWorkflow(input)}
              disabled={isGenerating || !input.trim()}
              size="icon"
              className="bg-purple-600 hover:bg-purple-700"
            >
              <Send className="w-4 h-4" />
            </Button>
          </div>
          <p className="text-xs text-slate-500 mt-2">
            Try: "Create a customer support workflow with sentiment analysis"
          </p>
        </div>
      </CardContent>
    </Card>
  );
}