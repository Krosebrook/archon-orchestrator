/**
 * @fileoverview Joint Decision Maker
 * @description Facilitates multi-agent decision making with voting
 * @version 1.0.0
 */

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Vote, CheckCircle, XCircle, Clock, Users } from 'lucide-react';
import { base44 } from '@/api/base44Client';
import { toast } from 'sonner';

export default function JointDecisionMaker({ decisionId, participatingAgents, onDecisionComplete }) {
  const [decision, setDecision] = useState(null);
  const [votes, setVotes] = useState([]);
  const [myVote, setMyVote] = useState(null);
  const [reasoning, setReasoning] = useState('');
  const [isVoting, setIsVoting] = useState(false);

  useEffect(() => {
    loadDecision();
  }, [decisionId]);

  const loadDecision = async () => {
    try {
      const collaborations = await base44.entities.AgentCollaboration.filter({
        id: decisionId,
      });
      
      if (collaborations.length > 0) {
        setDecision(collaborations[0]);
        setVotes(collaborations[0].shared_context?.votes || []);
      }
    } catch (error) {
      console.error('Failed to load decision:', error);
    }
  };

  const submitVote = async (voteValue) => {
    if (!reasoning.trim()) {
      toast.error('Please provide reasoning for your vote');
      return;
    }

    setIsVoting(true);
    try {
      const user = await base44.auth.me();
      
      const newVote = {
        voter: user.email,
        vote: voteValue,
        reasoning,
        timestamp: new Date().toISOString(),
      };

      const updatedVotes = [...votes, newVote];
      
      // Calculate if decision is complete
      const requiredVotes = participatingAgents.length;
      const approveVotes = updatedVotes.filter(v => v.vote === 'approve').length;
      const rejectVotes = updatedVotes.filter(v => v.vote === 'reject').length;
      
      let status = 'active';
      let outcome = null;
      
      if (approveVotes > requiredVotes / 2) {
        status = 'completed';
        outcome = 'approved';
      } else if (rejectVotes > requiredVotes / 2) {
        status = 'completed';
        outcome = 'rejected';
      }

      await base44.entities.AgentCollaboration.update(decisionId, {
        shared_context: {
          ...decision.shared_context,
          votes: updatedVotes,
          outcome,
        },
        status,
      });

      setMyVote(voteValue);
      setReasoning('');
      toast.success('Vote submitted successfully');
      loadDecision();
      
      if (outcome) {
        onDecisionComplete?.(outcome);
      }
    } catch (error) {
      console.error('Failed to submit vote:', error);
      toast.error('Failed to submit vote');
    } finally {
      setIsVoting(false);
    }
  };

  const calculateProgress = () => {
    const totalRequired = participatingAgents.length;
    const currentVotes = votes.length;
    return (currentVotes / totalRequired) * 100;
  };

  const getVoteStats = () => {
    const approve = votes.filter(v => v.vote === 'approve').length;
    const reject = votes.filter(v => v.vote === 'reject').length;
    const abstain = votes.filter(v => v.vote === 'abstain').length;
    return { approve, reject, abstain };
  };

  const stats = getVoteStats();
  const outcome = decision?.shared_context?.outcome;

  return (
    <Card className="bg-slate-900 border-slate-800">
      <CardHeader>
        <CardTitle className="text-white flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Vote className="w-5 h-5 text-purple-400" />
            Joint Decision
          </div>
          {outcome && (
            <Badge className={outcome === 'approved' ? 'bg-green-600' : 'bg-red-600'}>
              {outcome === 'approved' ? (
                <>
                  <CheckCircle className="w-3 h-3 mr-1" />
                  Approved
                </>
              ) : (
                <>
                  <XCircle className="w-3 h-3 mr-1" />
                  Rejected
                </>
              )}
            </Badge>
          )}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="p-4 bg-slate-950 rounded-lg">
          <h4 className="text-sm font-medium text-white mb-2">Decision Context</h4>
          <p className="text-sm text-slate-300">
            {decision?.shared_context?.description || 'Multi-agent decision pending'}
          </p>
        </div>

        <div>
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm text-slate-400">Voting Progress</span>
            <span className="text-sm text-slate-400">
              {votes.length} / {participatingAgents.length} votes
            </span>
          </div>
          <Progress value={calculateProgress()} className="h-2" />
        </div>

        <div className="grid grid-cols-3 gap-4">
          <div className="p-3 bg-green-500/10 rounded-lg border border-green-500/20">
            <div className="flex items-center gap-2 mb-1">
              <CheckCircle className="w-4 h-4 text-green-400" />
              <span className="text-xs text-slate-400">Approve</span>
            </div>
            <div className="text-2xl font-bold text-green-400">{stats.approve}</div>
          </div>
          <div className="p-3 bg-red-500/10 rounded-lg border border-red-500/20">
            <div className="flex items-center gap-2 mb-1">
              <XCircle className="w-4 h-4 text-red-400" />
              <span className="text-xs text-slate-400">Reject</span>
            </div>
            <div className="text-2xl font-bold text-red-400">{stats.reject}</div>
          </div>
          <div className="p-3 bg-slate-800 rounded-lg border border-slate-700">
            <div className="flex items-center gap-2 mb-1">
              <Clock className="w-4 h-4 text-slate-400" />
              <span className="text-xs text-slate-400">Abstain</span>
            </div>
            <div className="text-2xl font-bold text-slate-400">{stats.abstain}</div>
          </div>
        </div>

        {votes.length > 0 && (
          <div>
            <h4 className="text-sm font-medium text-white mb-2">Vote History</h4>
            <div className="space-y-2 max-h-48 overflow-y-auto">
              {votes.map((vote, idx) => (
                <div key={idx} className="p-3 bg-slate-950 rounded border border-slate-800">
                  <div className="flex items-center justify-between mb-1">
                    <Badge className={
                      vote.vote === 'approve' ? 'bg-green-600' :
                      vote.vote === 'reject' ? 'bg-red-600' : 'bg-slate-600'
                    }>
                      {vote.vote}
                    </Badge>
                    <span className="text-xs text-slate-500">{vote.voter}</span>
                  </div>
                  <p className="text-xs text-slate-400">{vote.reasoning}</p>
                </div>
              ))}
            </div>
          </div>
        )}

        {!outcome && !myVote && (
          <div className="border-t border-slate-800 pt-4">
            <h4 className="text-sm font-medium text-white mb-3">Cast Your Vote</h4>
            
            <Textarea
              value={reasoning}
              onChange={(e) => setReasoning(e.target.value)}
              placeholder="Explain your reasoning..."
              className="bg-slate-950 border-slate-700 text-white resize-none h-24 mb-3"
            />

            <div className="flex gap-2">
              <Button
                onClick={() => submitVote('approve')}
                disabled={isVoting || !reasoning.trim()}
                className="flex-1 bg-green-600 hover:bg-green-700"
              >
                <CheckCircle className="w-4 h-4 mr-2" />
                Approve
              </Button>
              <Button
                onClick={() => submitVote('reject')}
                disabled={isVoting || !reasoning.trim()}
                className="flex-1 bg-red-600 hover:bg-red-700"
              >
                <XCircle className="w-4 h-4 mr-2" />
                Reject
              </Button>
              <Button
                onClick={() => submitVote('abstain')}
                disabled={isVoting}
                variant="outline"
                className="flex-1 border-slate-700"
              >
                <Clock className="w-4 h-4 mr-2" />
                Abstain
              </Button>
            </div>
          </div>
        )}

        {myVote && !outcome && (
          <div className="p-4 bg-blue-500/10 border border-blue-500/20 rounded-lg">
            <p className="text-sm text-blue-400">
              You voted: <strong>{myVote}</strong>. Waiting for other agents...
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}