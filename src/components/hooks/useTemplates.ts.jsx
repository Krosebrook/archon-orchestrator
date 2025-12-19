/**
 * @fileoverview Templates Hook
 * @description React hook for managing template data with proper loading states
 * @version 1.0.0
 */

import { useState, useEffect, useCallback } from 'react';
import { templateService } from '@/components/services/TemplateService';
import type {
  WorkflowTemplate,
  TemplateUsage,
  TemplateReview,
  TemplateRatingData,
  TemplateFilters,
} from '@/components/types/template';
import { toast } from 'sonner';

interface UseTemplatesReturn {
  templates: WorkflowTemplate[];
  recentUsage: TemplateUsage[];
  reviews: TemplateReview[];
  isLoading: boolean;
  error: Error | null;
  filteredTemplates: WorkflowTemplate[];
  featuredTemplates: WorkflowTemplate[];
  popularTemplates: WorkflowTemplate[];
  recentlyUsedTemplates: WorkflowTemplate[];
  getTemplateRating: (templateId: string) => TemplateRatingData;
  refresh: () => Promise<void>;
  applyFilters: (filters: TemplateFilters) => void;
}

/**
 * Hook for managing template data and operations
 */
export function useTemplates(): UseTemplatesReturn {
  const [templates, setTemplates] = useState<WorkflowTemplate[]>([]);
  const [recentUsage, setRecentUsage] = useState<TemplateUsage[]>([]);
  const [reviews, setReviews] = useState<TemplateReview[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const [filters, setFilters] = useState<TemplateFilters>({});

  /**
   * Load all template data
   */
  const loadTemplates = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      const [templateResult, usageResult, reviewResult] = await Promise.all([
        templateService.listTemplates('-usage_count'),
        templateService.listUsage('-created_date', 50),
        templateService.listReviews(),
      ]);

      if (!templateResult.ok) {
        throw new Error(templateResult.error?.message || 'Failed to load templates');
      }
      if (!usageResult.ok) {
        throw new Error(usageResult.error?.message || 'Failed to load usage data');
      }
      if (!reviewResult.ok) {
        throw new Error(reviewResult.error?.message || 'Failed to load reviews');
      }

      setTemplates(templateResult.value || []);
      setRecentUsage(usageResult.value || []);
      setReviews(reviewResult.value || []);
    } catch (err) {
      const error = err instanceof Error ? err : new Error('Unknown error');
      setError(error);
      console.error('[useTemplates] Load error:', error);
      toast.error('Failed to load templates');
    } finally {
      setIsLoading(false);
    }
  }, []);

  /**
   * Initial load
   */
  useEffect(() => {
    loadTemplates();
  }, [loadTemplates]);

  /**
   * Calculate rating for a template
   */
  const getTemplateRating = useCallback(
    (templateId: string): TemplateRatingData => {
      return templateService.calculateRating(reviews, templateId);
    },
    [reviews]
  );

  /**
   * Apply filters to templates
   */
  const applyFilters = useCallback((newFilters: TemplateFilters) => {
    setFilters(newFilters);
  }, []);

  /**
   * Filtered templates based on current filters
   */
  const filteredTemplates = templateService.applyFilters(templates, filters);

  /**
   * Featured templates
   */
  const featuredTemplates = filteredTemplates.filter((t) => t.is_featured);

  /**
   * Popular templates (top 6 by usage)
   */
  const popularTemplates = [...filteredTemplates]
    .sort((a, b) => (b.usage_count || 0) - (a.usage_count || 0))
    .slice(0, 6);

  /**
   * Recently used templates (top 6)
   */
  const recentTemplateIds = [...new Set(recentUsage.map((u) => u.template_id))].slice(0, 6);
  const recentlyUsedTemplates = templates.filter((t) => recentTemplateIds.includes(t.id));

  return {
    templates,
    recentUsage,
    reviews,
    isLoading,
    error,
    filteredTemplates,
    featuredTemplates,
    popularTemplates,
    recentlyUsedTemplates,
    getTemplateRating,
    refresh: loadTemplates,
    applyFilters,
  };
}