import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { Users, Send, ThumbsUp, ThumbsDown, Loader2, Brain } from 'lucide-react';
import { base44 } from '@/api/base44Client';
import { toast } from 'sonner';
import { format } from 'date-fns';

export default function CollaborationCanvas({ collaborationId }) {
  const [collaboration, setCollaboration] = useState(null);
  const [message, setMessage] = useState('');
  const [isSending, setIsSending] = useState(false);

  useEffect(() => {
    if (collaborationId) {
      loadCollaboration();
      const interval = setInterval(loadCollaboration, 3000);
      return () => clearInterval(interval);
    }
  }, [collaborationId]);

  const loadCollaboration = async () => {
    try {
      const data = await base44.entities.AgentCollaboration.filter({ id: collaborationId });
      if (data.length > 0) {
        setCollaboration(data[0]);
      }
    } catch (error) {
      console.error('Failed to load collaboration:', error);
    }
  };

  const sendMessage = async () => {
    if (!message.trim()) return;
    
    setIsSending(true);
    try {
      const user = await base44.auth.me();
      const updatedContext = {
        ...collaboration.shared_context,
        messages: [
          ...(collaboration.shared_context?.messages || []),
          {
            role: 'human',
            user: user.email,
            content: message,
            timestamp: new Date().toISOString()
          }
        ]
      };

      await base44.entities.AgentCollaboration.update(collaborationId, {
        shared_context: updatedContext
      });

      setMessage('');
      loadCollaboration();
    } catch (error) {
      console.error('Failed to send message:', error);
      toast.error('Failed to send message');
    } finally {
      setIsSending(false);
    }
  };

  const voteOnDecision = async (decisionIdx, vote) => {
    try {
      const decisions = [...collaboration.decisions];
      decisions[decisionIdx] = {
        ...decisions[decisionIdx],
        votes: [...(decisions[decisionIdx].votes || []), vote]
      };

      await base44.entities.AgentCollaboration.update(collaborationId, { decisions });
      toast.success('Vote recorded');
      loadCollaboration();
    } catch (error) {
      console.error('Failed to vote:', error);
      toast.error('Failed to vote');
    }
  };

  if (!collaboration) {
    return (
      <Card className="bg-slate-900 border-slate-800">
        <CardContent className="p-8 text-center text-slate-400">
          <Loader2 className="w-8 h-8 animate-spin mx-auto mb-2" />
          Loading collaboration...
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="bg-slate-900 border-slate-800 h-[600px] flex flex-col">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="text-white flex items-center gap-2">
            <Users className="w-5 h-5" />
            {collaboration.name}
          </CardTitle>
          <Badge variant="outline" className={
            collaboration.state === 'active' ? 'bg-green-500/20 text-green-400 border-green-500/30' :
            collaboration.state === 'completed' ? 'bg-blue-500/20 text-blue-400 border-blue-500/30' :
            'bg-slate-500/20 text-slate-400 border-slate-500/30'
          }>
            {collaboration.state}
          </Badge>
        </div>
        <div className="text-xs text-slate-400">
          Strategy: {collaboration.strategy} • {collaboration.participant_agents?.length || 0} agents
        </div>
      </CardHeader>
      
      <CardContent className="flex-1 flex flex-col overflow-hidden">
        <div className="flex-1 overflow-y-auto space-y-3 mb-4">
          {collaboration.shared_context?.messages?.map((msg, idx) => (
            <div key={idx} className={`flex gap-3 ${msg.role === 'human' ? 'justify-end' : 'justify-start'}`}>
              <div className={`max-w-[80%] ${msg.role === 'human' ? 'order-2' : 'order-1'}`}>
                <div className={`p-3 rounded-lg ${
                  msg.role === 'human' 
                    ? 'bg-blue-600 text-white' 
                    : 'bg-slate-950 border border-slate-800'
                }`}>
                  <div className="flex items-center gap-2 mb-1">
                    {msg.role !== 'human' && <Brain className="w-3 h-3 text-purple-400" />}
                    <span className="text-xs font-medium">{msg.user || msg.agent_id}</span>
                  </div>
                  <p className="text-sm">{msg.content}</p>
                  <div className="text-xs opacity-70 mt-1">
                    {format(new Date(msg.timestamp), 'h:mm a')}
                  </div>
                </div>
              </div>
            </div>
          ))}

          {collaboration.decisions?.map((decision, idx) => (
            <div key={idx} className="p-3 bg-purple-900/20 rounded-lg border border-purple-800/30">
              <div className="flex items-start justify-between mb-2">
                <div>
                  <div className="text-sm text-purple-300 font-medium mb-1">Decision Point</div>
                  <p className="text-sm text-slate-300">{decision.decision}</p>
                  <div className="text-xs text-slate-500 mt-1">
                    By {decision.agent_id} • Confidence: {Math.round((decision.confidence || 0) * 100)}%
                  </div>
                </div>
              </div>
              {collaboration.strategy === 'consensus' && collaboration.state === 'active' && (
                <div className="flex gap-2 mt-2">
                  <Button
                    size="sm"
                    onClick={() => voteOnDecision(idx, 'approve')}
                    className="bg-green-600 hover:bg-green-700"
                  >
                    <ThumbsUp className="w-3 h-3 mr-1" />
                    Approve
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => voteOnDecision(idx, 'reject')}
                    className="border-red-700 text-red-400 hover:bg-red-900/20"
                  >
                    <ThumbsDown className="w-3 h-3 mr-1" />
                    Reject
                  </Button>
                </div>
              )}
            </div>
          ))}
        </div>

        <div className="flex gap-2">
          <Textarea
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            placeholder="Type your message or provide guidance..."
            className="bg-slate-800 border-slate-700 resize-none"
            rows={2}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                sendMessage();
              }
            }}
          />
          <Button
            onClick={sendMessage}
            disabled={isSending || !message.trim()}
            className="bg-blue-600 hover:bg-blue-700"
          >
            {isSending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}