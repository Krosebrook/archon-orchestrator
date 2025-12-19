/**
 * @fileoverview Template Rating Hook
 * @description Hook for managing template ratings and reviews
 * @version 1.0.0
 */

import { useState, useCallback } from 'react';
import { templateService } from '@/components/services/TemplateService';
import { useAuth } from '@/components/contexts/AuthContext';
import { toast } from 'sonner';

interface UseTemplateRatingReturn {
  isSubmitting: boolean;
  submitRating: (templateId: string, rating: number, comment: string) => Promise<boolean>;
}

/**
 * Hook for submitting template ratings
 */
export function useTemplateRating(): UseTemplateRatingReturn {
  const { user, organization } = useAuth();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const submitRating = useCallback(
    async (templateId: string, rating: number, comment: string): Promise<boolean> => {
      if (!user?.email || !organization?.id) {
        toast.error('Authentication required');
        return false;
      }

      setIsSubmitting(true);
      try {
        const result = await templateService.createReview({
          template_id: templateId,
          user_email: user.email,
          rating,
          comment,
          org_id: organization.id,
        });

        if (result.ok) {
          toast.success('Rating submitted');
          return true;
        } else {
          toast.error(result.error?.message || 'Failed to submit rating');
          return false;
        }
      } catch (error) {
        console.error('[useTemplateRating] Submit error:', error);
        toast.error('Failed to submit rating');
        return false;
      } finally {
        setIsSubmitting(false);
      }
    },
    [user?.email, organization?.id]
  );

  return {
    isSubmitting,
    submitRating,
  };
}