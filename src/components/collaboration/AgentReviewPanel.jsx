/**
 * @fileoverview Agent Review Panel
 * @description Allows agents to review and comment on each other's outputs
 * @version 1.0.0
 */

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { ThumbsUp, ThumbsDown, MessageSquare, CheckCircle2, XCircle, AlertTriangle } from 'lucide-react';
import { base44 } from '@/api/base44Client';
import { toast } from 'sonner';
import { format } from 'date-fns';

export default function AgentReviewPanel({ runId, agentId, output }) {
  const [reviews, setReviews] = useState([]);
  const [comment, setComment] = useState('');
  const [rating, setRating] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    loadReviews();
  }, [runId, agentId]);

  const loadReviews = async () => {
    try {
      const collaborations = await base44.entities.AgentCollaboration.filter({
        collaboration_type: 'peer_review',
      });
      
      const relevantReviews = collaborations.filter(c => 
        c.shared_context?.reviewed_agent_id === agentId &&
        c.shared_context?.run_id === runId
      );
      
      setReviews(relevantReviews);
    } catch (error) {
      console.error('Failed to load reviews:', error);
    }
  };

  const submitReview = async () => {
    if (!rating || !comment.trim()) {
      toast.error('Please provide both rating and comment');
      return;
    }

    setIsSubmitting(true);
    try {
      const user = await base44.auth.me();
      
      await base44.entities.AgentCollaboration.create({
        agent_ids: [agentId],
        collaboration_type: 'peer_review',
        shared_context: {
          reviewed_agent_id: agentId,
          run_id: runId,
          rating,
          comment,
          output_snapshot: output,
          reviewer: user.email,
          timestamp: new Date().toISOString(),
        },
        status: 'completed',
        org_id: user.organization?.id || 'org_acme',
      });

      toast.success('Review submitted successfully');
      setComment('');
      setRating(null);
      loadReviews();
    } catch (error) {
      console.error('Failed to submit review:', error);
      toast.error('Failed to submit review');
    } finally {
      setIsSubmitting(false);
    }
  };

  const getRatingIcon = (ratingValue) => {
    switch (ratingValue) {
      case 'approve':
        return <CheckCircle2 className="w-4 h-4 text-green-400" />;
      case 'reject':
        return <XCircle className="w-4 h-4 text-red-400" />;
      case 'needs_revision':
        return <AlertTriangle className="w-4 h-4 text-yellow-400" />;
      default:
        return null;
    }
  };

  const getRatingColor = (ratingValue) => {
    switch (ratingValue) {
      case 'approve':
        return 'bg-green-600';
      case 'reject':
        return 'bg-red-600';
      case 'needs_revision':
        return 'bg-yellow-600';
      default:
        return 'bg-slate-600';
    }
  };

  return (
    <Card className="bg-slate-900 border-slate-800">
      <CardHeader>
        <CardTitle className="text-white flex items-center gap-2">
          <MessageSquare className="w-5 h-5 text-blue-400" />
          Peer Reviews ({reviews.length})
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-3">
          {reviews.map((review, idx) => (
            <div key={idx} className="p-4 bg-slate-950 rounded-lg border border-slate-800">
              <div className="flex items-start justify-between mb-2">
                <div className="flex items-center gap-2">
                  {getRatingIcon(review.shared_context.rating)}
                  <Badge className={getRatingColor(review.shared_context.rating)}>
                    {review.shared_context.rating?.replace('_', ' ').toUpperCase()}
                  </Badge>
                </div>
                <span className="text-xs text-slate-500">
                  {format(new Date(review.created_date), 'MMM dd, HH:mm')}
                </span>
              </div>
              <p className="text-sm text-slate-300">{review.shared_context.comment}</p>
              <p className="text-xs text-slate-500 mt-2">
                Reviewed by: {review.shared_context.reviewer}
              </p>
            </div>
          ))}
          
          {reviews.length === 0 && (
            <div className="text-center py-8 text-slate-500">
              No reviews yet
            </div>
          )}
        </div>

        <div className="border-t border-slate-800 pt-4">
          <h4 className="text-sm font-medium text-white mb-3">Submit Review</h4>
          
          <div className="flex gap-2 mb-3">
            <Button
              onClick={() => setRating('approve')}
              variant={rating === 'approve' ? 'default' : 'outline'}
              size="sm"
              className={rating === 'approve' ? 'bg-green-600' : 'border-slate-700'}
            >
              <ThumbsUp className="w-4 h-4 mr-1" />
              Approve
            </Button>
            <Button
              onClick={() => setRating('needs_revision')}
              variant={rating === 'needs_revision' ? 'default' : 'outline'}
              size="sm"
              className={rating === 'needs_revision' ? 'bg-yellow-600' : 'border-slate-700'}
            >
              <AlertTriangle className="w-4 h-4 mr-1" />
              Needs Revision
            </Button>
            <Button
              onClick={() => setRating('reject')}
              variant={rating === 'reject' ? 'default' : 'outline'}
              size="sm"
              className={rating === 'reject' ? 'bg-red-600' : 'border-slate-700'}
            >
              <ThumbsDown className="w-4 h-4 mr-1" />
              Reject
            </Button>
          </div>

          <Textarea
            value={comment}
            onChange={(e) => setComment(e.target.value)}
            placeholder="Add your review comments..."
            className="bg-slate-950 border-slate-700 text-white resize-none h-24 mb-3"
          />

          <Button
            onClick={submitReview}
            disabled={isSubmitting || !rating || !comment.trim()}
            className="w-full bg-blue-600 hover:bg-blue-700"
          >
            <MessageSquare className="w-4 h-4 mr-2" />
            Submit Review
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}