/**
 * @fileoverview Template Service Layer
 * @description Centralized service for template operations with proper error handling
 * @version 1.0.0
 */

import { base44 } from '@/api/base44Client';
import type {
  WorkflowTemplate,
  TemplateUsage,
  TemplateReview,
  TemplateRatingData,
  TemplateFilters,
  CreateTemplateDTO,
  UpdateTemplateDTO,
  ServiceResult,
} from '@/components/types/template';

/**
 * Template Service - handles all template-related operations
 * Implements repository pattern with proper error handling
 */
export class TemplateService {
  /**
   * Fetch all templates with optional sorting
   */
  async listTemplates(sortBy = '-usage_count', limit?: number): Promise<ServiceResult<WorkflowTemplate[]>> {
    try {
      const templates = await base44.entities.WorkflowTemplate.list(sortBy, limit);
      return {
        ok: true,
        value: templates as WorkflowTemplate[],
      };
    } catch (error) {
      return this.handleError(error, 'LIST_TEMPLATES_FAILED');
    }
  }

  /**
   * Fetch filtered templates
   */
  async filterTemplates(
    filters: Record<string, unknown>,
    sortBy = '-usage_count',
    limit?: number
  ): Promise<ServiceResult<WorkflowTemplate[]>> {
    try {
      const templates = await base44.entities.WorkflowTemplate.filter(filters, sortBy, limit);
      return {
        ok: true,
        value: templates as WorkflowTemplate[],
      };
    } catch (error) {
      return this.handleError(error, 'FILTER_TEMPLATES_FAILED');
    }
  }

  /**
   * Fetch single template by ID
   */
  async getTemplate(id: string): Promise<ServiceResult<WorkflowTemplate>> {
    try {
      const templates = await base44.entities.WorkflowTemplate.filter({ id });
      if (!templates || templates.length === 0) {
        return {
          ok: false,
          error: {
            code: 'TEMPLATE_NOT_FOUND',
            message: 'Template not found',
            hint: `No template found with id: ${id}`,
            retryable: false,
          },
        };
      }
      return {
        ok: true,
        value: templates[0] as WorkflowTemplate,
      };
    } catch (error) {
      return this.handleError(error, 'GET_TEMPLATE_FAILED');
    }
  }

  /**
   * Create new template
   */
  async createTemplate(data: CreateTemplateDTO): Promise<ServiceResult<WorkflowTemplate>> {
    try {
      const template = await base44.entities.WorkflowTemplate.create(data);
      return {
        ok: true,
        value: template as WorkflowTemplate,
      };
    } catch (error) {
      return this.handleError(error, 'CREATE_TEMPLATE_FAILED');
    }
  }

  /**
   * Update existing template
   */
  async updateTemplate(id: string, data: UpdateTemplateDTO): Promise<ServiceResult<WorkflowTemplate>> {
    try {
      const template = await base44.entities.WorkflowTemplate.update(id, data);
      return {
        ok: true,
        value: template as WorkflowTemplate,
      };
    } catch (error) {
      return this.handleError(error, 'UPDATE_TEMPLATE_FAILED');
    }
  }

  /**
   * Delete template
   */
  async deleteTemplate(id: string): Promise<ServiceResult<void>> {
    try {
      await base44.entities.WorkflowTemplate.delete(id);
      return {
        ok: true,
      };
    } catch (error) {
      return this.handleError(error, 'DELETE_TEMPLATE_FAILED');
    }
  }

  /**
   * Increment template usage count
   */
  async incrementUsage(templateId: string, currentCount: number): Promise<ServiceResult<WorkflowTemplate>> {
    try {
      const template = await base44.entities.WorkflowTemplate.update(templateId, {
        usage_count: currentCount + 1,
      });
      return {
        ok: true,
        value: template as WorkflowTemplate,
      };
    } catch (error) {
      return this.handleError(error, 'INCREMENT_USAGE_FAILED');
    }
  }

  /**
   * List template usage records
   */
  async listUsage(sortBy = '-created_date', limit = 50): Promise<ServiceResult<TemplateUsage[]>> {
    try {
      const usage = await base44.entities.TemplateUsage.list(sortBy, limit);
      return {
        ok: true,
        value: usage as TemplateUsage[],
      };
    } catch (error) {
      return this.handleError(error, 'LIST_USAGE_FAILED');
    }
  }

  /**
   * Create usage record
   */
  async createUsage(data: {
    template_id: string;
    user_email: string;
    workflow_id: string;
    org_id: string;
  }): Promise<ServiceResult<TemplateUsage>> {
    try {
      const usage = await base44.entities.TemplateUsage.create(data);
      return {
        ok: true,
        value: usage as TemplateUsage,
      };
    } catch (error) {
      return this.handleError(error, 'CREATE_USAGE_FAILED');
    }
  }

  /**
   * List all reviews
   */
  async listReviews(): Promise<ServiceResult<TemplateReview[]>> {
    try {
      const reviews = await base44.entities.TemplateReview.list();
      return {
        ok: true,
        value: reviews as TemplateReview[],
      };
    } catch (error) {
      return this.handleError(error, 'LIST_REVIEWS_FAILED');
    }
  }

  /**
   * Create template review
   */
  async createReview(data: {
    template_id: string;
    user_email: string;
    rating: number;
    comment: string;
    org_id: string;
  }): Promise<ServiceResult<TemplateReview>> {
    try {
      const review = await base44.entities.TemplateReview.create(data);
      return {
        ok: true,
        value: review as TemplateReview,
      };
    } catch (error) {
      return this.handleError(error, 'CREATE_REVIEW_FAILED');
    }
  }

  /**
   * Calculate rating for a template
   */
  calculateRating(reviews: TemplateReview[], templateId: string): TemplateRatingData {
    const templateReviews = reviews.filter((r) => r.template_id === templateId);
    if (templateReviews.length === 0) {
      return { average: 0, count: 0 };
    }
    const sum = templateReviews.reduce((acc, r) => acc + r.rating, 0);
    return {
      average: sum / templateReviews.length,
      count: templateReviews.length,
    };
  }

  /**
   * Apply client-side filters to template list
   */
  applyFilters(templates: WorkflowTemplate[], filters: TemplateFilters): WorkflowTemplate[] {
    return templates.filter((t) => {
      // Search query filter
      if (filters.searchQuery) {
        const query = filters.searchQuery.toLowerCase();
        const matchesSearch =
          t.name.toLowerCase().includes(query) ||
          t.description.toLowerCase().includes(query) ||
          t.tags?.some((tag) => tag.toLowerCase().includes(query));
        if (!matchesSearch) return false;
      }

      // Category filter
      if (filters.category && filters.category !== 'all') {
        if (t.category !== filters.category) return false;
      }

      // Complexity filter
      if (filters.complexity && filters.complexity !== 'all') {
        if (t.complexity !== filters.complexity) return false;
      }

      // Featured filter
      if (filters.featured !== undefined) {
        if (t.is_featured !== filters.featured) return false;
      }

      // Rating filter
      if (filters.minRating !== undefined) {
        if ((t.rating || 0) < filters.minRating) return false;
      }

      return true;
    });
  }

  /**
   * Centralized error handler
   * @private
   */
  private handleError<T>(error: unknown, code: string): ServiceResult<T> {
    console.error(`[TemplateService] ${code}:`, error);

    const message = error instanceof Error ? error.message : 'An unknown error occurred';
    const isNetworkError = message.includes('fetch') || message.includes('network');

    return {
      ok: false,
      error: {
        code,
        message,
        hint: isNetworkError ? 'Please check your internet connection and try again' : undefined,
        retryable: isNetworkError,
        trace_id: `${code}_${Date.now()}`,
      },
    };
  }
}

// Singleton instance
export const templateService = new TemplateService();