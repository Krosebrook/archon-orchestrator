import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { SkillReview } from '@/entities/all';
import { base44 } from '@/api/base44Client';
import { Star, ThumbsUp } from 'lucide-react';
import { toast } from 'sonner';
import { formatDistanceToNow } from 'date-fns';

export default function SkillReviews({ skillId, reviews, onRefresh }) {
  const [rating, setRating] = useState(0);
  const [reviewText, setReviewText] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async () => {
    if (rating === 0) {
      toast.error('Please select a rating');
      return;
    }

    setIsSubmitting(true);
    try {
      const user = await base44.auth.me();

      await SkillReview.create({
        skill_id: skillId,
        rating,
        review_text: reviewText,
        reviewer_email: user.email,
        reviewer_name: user.full_name || user.email,
        verified_purchase: false,
        org_id: user.organization.id
      });

      toast.success('Review submitted successfully');
      setRating(0);
      setReviewText('');
      onRefresh?.();
    } catch (error) {
      console.error('Failed to submit review:', error);
      toast.error('Failed to submit review');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleHelpful = async (reviewId) => {
    try {
      const review = reviews.find(r => r.id === reviewId);
      await SkillReview.update(reviewId, {
        helpful_count: (review.helpful_count || 0) + 1
      });
      toast.success('Thank you for your feedback');
      onRefresh?.();
    } catch (error) {
      console.error('Failed to mark helpful:', error);
    }
  };

  return (
    <div className="space-y-6">
      <Card className="bg-slate-900 border-slate-800">
        <CardHeader>
          <CardTitle className="text-white">Write a Review</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <label className="text-sm text-slate-400 mb-2 block">Your Rating</label>
            <div className="flex gap-2">
              {[1, 2, 3, 4, 5].map(star => (
                <button
                  key={star}
                  onClick={() => setRating(star)}
                  className="transition-colors"
                >
                  <Star
                    className={`w-8 h-8 ${
                      star <= rating
                        ? 'text-yellow-400 fill-current'
                        : 'text-slate-600'
                    }`}
                  />
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="text-sm text-slate-400 mb-2 block">Your Review (Optional)</label>
            <Textarea
              value={reviewText}
              onChange={(e) => setReviewText(e.target.value)}
              placeholder="Share your experience with this skill..."
              className="bg-slate-950 border-slate-700 text-white min-h-24"
            />
          </div>

          <Button
            onClick={handleSubmit}
            disabled={isSubmitting || rating === 0}
            className="bg-blue-600 hover:bg-blue-700"
          >
            {isSubmitting ? 'Submitting...' : 'Submit Review'}
          </Button>
        </CardContent>
      </Card>

      <Card className="bg-slate-900 border-slate-800">
        <CardHeader>
          <CardTitle className="text-white">User Reviews ({reviews.length})</CardTitle>
        </CardHeader>
        <CardContent>
          {reviews.length === 0 ? (
            <p className="text-slate-400 text-center py-8">No reviews yet. Be the first to review!</p>
          ) : (
            <div className="space-y-4">
              {reviews.map(review => (
                <div key={review.id} className="p-4 bg-slate-950 rounded-lg">
                  <div className="flex items-start justify-between mb-2">
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <span className="font-medium text-white">{review.reviewer_name}</span>
                        {review.verified_purchase && (
                          <Badge variant="outline" className="bg-green-500/20 text-green-400 border-green-500/30 text-xs">
                            Verified
                          </Badge>
                        )}
                      </div>
                      <div className="flex items-center gap-2">
                        <div className="flex">
                          {[1, 2, 3, 4, 5].map(star => (
                            <Star
                              key={star}
                              className={`w-4 h-4 ${
                                star <= review.rating
                                  ? 'text-yellow-400 fill-current'
                                  : 'text-slate-600'
                              }`}
                            />
                          ))}
                        </div>
                        <span className="text-xs text-slate-500">
                          {formatDistanceToNow(new Date(review.created_date), { addSuffix: true })}
                        </span>
                      </div>
                    </div>
                  </div>
                  
                  {review.review_text && (
                    <p className="text-slate-300 text-sm mb-3">{review.review_text}</p>
                  )}

                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleHelpful(review.id)}
                    className="text-slate-400 hover:text-white"
                  >
                    <ThumbsUp className="w-3 h-3 mr-1" />
                    Helpful ({review.helpful_count || 0})
                  </Button>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}