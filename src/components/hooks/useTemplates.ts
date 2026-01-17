/**
 * @fileoverview Templates Hook
 * @description React hook for managing template data with proper loading states
 * @version 1.0.0
 */

import { useState, useEffect, useCallback } from 'react';
import { templateService } from '@/components/services/TemplateService';
import { toast } from 'sonner';

export function useTemplates() {
  const [templates, setTemplates] = useState([]);
  const [recentUsage, setRecentUsage] = useState([]);
  const [reviews, setReviews] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [filters, setFilters] = useState({});

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

  useEffect(() => {
    loadTemplates();
  }, [loadTemplates]);

  const getTemplateRating = useCallback(
    (templateId) => {
      return templateService.calculateRating(reviews, templateId);
    },
    [reviews]
  );

  const applyFilters = useCallback((newFilters) => {
    setFilters(newFilters);
  }, []);

  const filteredTemplates = templateService.applyFilters(templates, filters);

  const featuredTemplates = filteredTemplates.filter((t) => t.is_featured);

  const popularTemplates = [...filteredTemplates]
    .sort((a, b) => (b.usage_count || 0) - (a.usage_count || 0))
    .slice(0, 6);

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