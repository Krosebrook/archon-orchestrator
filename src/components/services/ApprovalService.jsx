/**
 * @fileoverview Approval Service
 * @description Service layer for deployment approval workflows.
 */

import { base44 } from '@/api/base44Client';
import { APIError, ErrorCodes } from '../utils/api-client';

/**
 * Approval Service - handles deployment approval workflows.
 */
export class ApprovalService {
  /**
   * Create a new approval request.
   */
  async createApprovalRequest(params) {
    try {
      const expires_at = params.expires_in_hours
        ? new Date(Date.now() + params.expires_in_hours * 60 * 60 * 1000).toISOString()
        : undefined;

      const request = await base44.entities.ApprovalRequest.create({
        workflow_id: params.workflow_id,
        pipeline_id: params.pipeline_id,
        version: params.version,
        environment: params.environment,
        requested_by: params.requested_by,
        status: 'pending',
        comments: params.comments,
        expires_at,
        org_id: params.org_id
      });

      return { ok: true, value: request };
    } catch (_error) {
      return { 
        ok: false, 
        error: new APIError(
          ErrorCodes.SERVER_ERROR,
          'Failed to create approval request',
          { context: { workflow_id: params.workflow_id } }
        )
      };
    }
  }

  /**
   * List approval requests with filters.
   */
  async listApprovalRequests(filters = {}) {
    try {
      const queryFilters = {};
      if (filters.status) queryFilters.status = filters.status;
      if (filters.workflow_id) queryFilters.workflow_id = filters.workflow_id;
      if (filters.environment) queryFilters.environment = filters.environment;

      const requests = await base44.entities.ApprovalRequest.filter(
        queryFilters,
        '-created_date',
        filters.limit || 50
      );

      return { ok: true, value: requests };
    } catch (_error) {
      return { 
        ok: false, 
        error: new APIError(
          ErrorCodes.SERVER_ERROR,
          'Failed to list approval requests',
          { context: { filters } }
        )
      };
    }
  }

  /**
   * Get approval request by ID.
   */
  async getApprovalRequest(requestId) {
    try {
      const [request] = await base44.entities.ApprovalRequest.filter({ id: requestId });
      
      if (!request) {
        return { 
          ok: false, 
          error: new APIError(ErrorCodes.NOT_FOUND, 'Approval request not found')
        };
      }

      return { ok: true, value: request };
    } catch (_error) {
      return { 
        ok: false, 
        error: new APIError(
          ErrorCodes.SERVER_ERROR,
          'Failed to get approval request',
          { context: { requestId } }
        )
      };
    }
  }

  /**
   * Approve or reject a request.
   */
  async processApproval(params) {
    try {
      const response = await base44.functions.invoke('approveDeployment', params);
      return { ok: true, value: response };
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to process approval';
      return { 
        ok: false, 
        error: new APIError(
          ErrorCodes.SERVER_ERROR,
          message,
          { context: { request_id: params.request_id, action: params.action } }
        )
      };
    }
  }

  /**
   * Check if a request has expired.
   */
  isExpired(request) {
    if (!request.expires_at) return false;
    return new Date(request.expires_at) < new Date();
  }

  /**
   * Auto-expire old pending requests.
   */
  async expireOldRequests() {
    const result = await this.listApprovalRequests({ status: 'pending' });
    
    if (!result.ok) {
      return result;
    }

    const requests = result.value;
    let expired_count = 0;

    for (const request of requests) {
      if (this.isExpired(request)) {
        await base44.entities.ApprovalRequest.update(request.id, { status: 'expired' });
        expired_count++;
      }
    }

    return { ok: true, value: { expired_count } };
  }
}

// Singleton instance
export const approvalService = new ApprovalService();