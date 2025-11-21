import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Send, Bot, ArrowRight } from 'lucide-react';
import { base44 } from '@/api/base44Client';
import { toast } from 'sonner';
import { format } from 'date-fns';

export default function InterAgentMessenger({ agents, collaborations }) {
  const [messages, setMessages] = useState([]);
  const [fromAgent, setFromAgent] = useState('');
  const [toAgent, setToAgent] = useState('');
  const [message, setMessage] = useState('');
  const [sending, setSending] = useState(false);

  const sendMessage = async (e) => {
    e.preventDefault();
    if (!fromAgent || !toAgent || !message) {
      toast.error('Please select agents and enter a message');
      return;
    }

    setSending(true);
    try {
      const user = await base44.auth.me();
      const newMessage = {
        id: Date.now().toString(),
        from_agent_id: fromAgent,
        to_agent_id: toAgent,
        content: message,
        timestamp: new Date().toISOString(),
        delivered: true
      };

      // Store in agent memory
      const fromAgentData = agents.find(a => a.id === fromAgent);
      const toAgentData = agents.find(a => a.id === toAgent);
      
      await base44.entities.AgentMemory.create({
        agent_id: toAgent,
        memory_type: 'short_term',
        content: {
          type: 'inter_agent_message',
          from: fromAgentData?.name,
          message: message
        },
        context: `Message from ${fromAgentData?.name}`,
        importance: 70,
        tags: ['communication', 'collaboration'],
        org_id: user.organization.id
      });

      setMessages([...messages, newMessage]);
      setMessage('');
      toast.success('Message sent');
    } catch (error) {
      toast.error('Failed to send message');
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      <Card className="bg-slate-900 border-slate-800 lg:col-span-2">
        <CardHeader>
          <CardTitle className="text-white">Message Thread</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3 mb-4 max-h-96 overflow-y-auto">
            {messages.length === 0 ? (
              <p className="text-slate-400 text-sm text-center py-12">
                No messages yet. Send a message to start agent communication.
              </p>
            ) : (
              messages.map(msg => {
                const fromAgentData = agents.find(a => a.id === msg.from_agent_id);
                const toAgentData = agents.find(a => a.id === msg.to_agent_id);
                
                return (
                  <div key={msg.id} className="p-4 bg-slate-950 rounded-lg border border-slate-800">
                    <div className="flex items-center gap-2 mb-2">
                      <Bot className="w-4 h-4 text-blue-400" />
                      <span className="text-sm font-medium text-white">{fromAgentData?.name}</span>
                      <ArrowRight className="w-4 h-4 text-slate-400" />
                      <Bot className="w-4 h-4 text-purple-400" />
                      <span className="text-sm font-medium text-white">{toAgentData?.name}</span>
                    </div>
                    <p className="text-sm text-slate-300">{msg.content}</p>
                    <p className="text-xs text-slate-500 mt-2">
                      {format(new Date(msg.timestamp), 'MMM d, HH:mm:ss')}
                    </p>
                  </div>
                );
              })
            )}
          </div>
        </CardContent>
      </Card>

      <Card className="bg-slate-900 border-slate-800">
        <CardHeader>
          <CardTitle className="text-white">Send Message</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={sendMessage} className="space-y-4">
            <div>
              <label className="text-sm text-slate-400 mb-2 block">From Agent</label>
              <Select value={fromAgent} onValueChange={setFromAgent}>
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
              <label className="text-sm text-slate-400 mb-2 block">To Agent</label>
              <Select value={toAgent} onValueChange={setToAgent}>
                <SelectTrigger className="bg-slate-800 border-slate-700">
                  <SelectValue placeholder="Select agent" />
                </SelectTrigger>
                <SelectContent className="bg-slate-900 border-slate-800">
                  {agents.filter(a => a.id !== fromAgent).map(agent => (
                    <SelectItem key={agent.id} value={agent.id}>{agent.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <label className="text-sm text-slate-400 mb-2 block">Message</label>
              <Input
                value={message}
                onChange={e => setMessage(e.target.value)}
                placeholder="Enter message content..."
                className="bg-slate-800 border-slate-700"
              />
            </div>

            <Button type="submit" disabled={sending} className="w-full bg-blue-600 hover:bg-blue-700">
              <Send className="w-4 h-4 mr-2" />
              {sending ? 'Sending...' : 'Send Message'}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}