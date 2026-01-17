/**
 * @fileoverview Template Service Layer
 * @description Centralized service for template operations with proper error handling
 * @version 1.0.0
 */

import { base44 } from '@/api/base44Client';

/**
 * Template Service - handles all template-related operations
 */
export class TemplateService {
  async listTemplates(sortBy = '-usage_count', limit) {
    try {
      const templates = await base44.entities.WorkflowTemplate.list(sortBy, limit);
      return {
        ok: true,
        value: templates,
      };
    } catch (error) {
      return this.handleError(error, 'LIST_TEMPLATES_FAILED');
    }
  }

  async filterTemplates(filters, sortBy = '-usage_count', limit) {
    try {
      const templates = await base44.entities.WorkflowTemplate.filter(filters, sortBy, limit);
      return {
        ok: true,
        value: templates,
      };
    } catch (error) {
      return this.handleError(error, 'FILTER_TEMPLATES_FAILED');
    }
  }

  async getTemplate(id) {
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
        value: templates[0],
      };
    } catch (error) {
      return this.handleError(error, 'GET_TEMPLATE_FAILED');
    }
  }

  async createTemplate(data) {
    try {
      const template = await base44.entities.WorkflowTemplate.create(data);
      return {
        ok: true,
        value: template,
      };
    } catch (error) {
      return this.handleError(error, 'CREATE_TEMPLATE_FAILED');
    }
  }

  async updateTemplate(id, data) {
    try {
      const template = await base44.entities.WorkflowTemplate.update(id, data);
      return {
        ok: true,
        value: template,
      };
    } catch (error) {
      return this.handleError(error, 'UPDATE_TEMPLATE_FAILED');
    }
  }

  async deleteTemplate(id) {
    try {
      await base44.entities.WorkflowTemplate.delete(id);
      return {
        ok: true,
      };
    } catch (error) {
      return this.handleError(error, 'DELETE_TEMPLATE_FAILED');
    }
  }

  async incrementUsage(templateId, currentCount) {
    try {
      const template = await base44.entities.WorkflowTemplate.update(templateId, {
        usage_count: currentCount + 1,
      });
      return {
        ok: true,
        value: template,
      };
    } catch (error) {
      return this.handleError(error, 'INCREMENT_USAGE_FAILED');
    }
  }

  async listUsage(sortBy = '-created_date', limit = 50) {
    try {
      const usage = await base44.entities.TemplateUsage.list(sortBy, limit);
      return {
        ok: true,
        value: usage,
      };
    } catch (error) {
      return this.handleError(error, 'LIST_USAGE_FAILED');
    }
  }

  async createUsage(data) {
    try {
      const usage = await base44.entities.TemplateUsage.create(data);
      return {
        ok: true,
        value: usage,
      };
    } catch (error) {
      return this.handleError(error, 'CREATE_USAGE_FAILED');
    }
  }

  async listReviews() {
    try {
      const reviews = await base44.entities.TemplateReview.list();
      return {
        ok: true,
        value: reviews,
      };
    } catch (error) {
      return this.handleError(error, 'LIST_REVIEWS_FAILED');
    }
  }

  async createReview(data) {
    try {
      const review = await base44.entities.TemplateReview.create(data);
      return {
        ok: true,
        value: review,
      };
    } catch (error) {
      return this.handleError(error, 'CREATE_REVIEW_FAILED');
    }
  }

  calculateRating(reviews, templateId) {
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

  applyFilters(templates, filters) {
    return templates.filter((t) => {
      if (filters.searchQuery) {
        const query = filters.searchQuery.toLowerCase();
        const matchesSearch =
          t.name.toLowerCase().includes(query) ||
          t.description.toLowerCase().includes(query) ||
          t.tags?.some((tag) => tag.toLowerCase().includes(query));
        if (!matchesSearch) return false;
      }

      if (filters.category && filters.category !== 'all') {
        if (t.category !== filters.category) return false;
      }

      if (filters.complexity && filters.complexity !== 'all') {
        if (t.complexity !== filters.complexity) return false;
      }

      if (filters.featured !== undefined) {
        if (t.is_featured !== filters.featured) return false;
      }

      if (filters.minRating !== undefined) {
        if ((t.rating || 0) < filters.minRating) return false;
      }

      return true;
    });
  }

  handleError(error, code) {
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

export const templateService = new TemplateService();