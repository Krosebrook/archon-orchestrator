/**
 * @fileoverview Approvals Hook
 * @description React hook for managing deployment approvals.
 */

import { useState, useEffect, useCallback } from 'react';
import { approvalService } from '../services/ApprovalService';
import type { ApprovalRequest, UUID } from '../shared/types/domain';
import { useAuth } from '../contexts/AuthContext';
import { toast } from 'sonner';

interface UseApprovalsOptions {
  status?: 'pending' | 'approved' | 'rejected' | 'expired';
  workflow_id?: UUID;
  autoRefresh?: boolean;
  refreshInterval?: number;
}

/**
 * Hook for managing deployment approvals.
 * 
 * @example
 * const { requests, approve, reject, loading, refresh } = useApprovals({ 
 *   status: 'pending',
 *   autoRefresh: true 
 * });
 */
export function useApprovals(options: UseApprovalsOptions = {}) {
  const { user, hasPermission } = useAuth();
  const [requests, setRequests] = useState<ApprovalRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState(false);

  const canApprove = hasPermission('workflow.approve');

  const loadRequests = useCallback(async () => {
    setLoading(true);
    try {
      const result = await approvalService.listApprovalRequests({
        status: options.status,
        workflow_id: options.workflow_id,
        limit: 50
      });

      if (result.ok) {
        setRequests(result.value);
      } else {
        console.error('[Approvals] Failed to load:', result.error);
        toast.error('Failed to load approvals');
      }
    } catch (error) {
      console.error('[Approvals] Error:', error);
    } finally {
      setLoading(false);
    }
  }, [options.status, options.workflow_id]);

  useEffect(() => {
    loadRequests();

    if (options.autoRefresh !== false) {
      const interval = setInterval(loadRequests, options.refreshInterval || 30000);
      return () => clearInterval(interval);
    }
  }, [loadRequests, options.autoRefresh, options.refreshInterval]);

  const approve = useCallback(async (requestId: UUID, comments?: string) => {
    if (!canApprove) {
      toast.error('You do not have permission to approve deployments');
      return false;
    }

    setProcessing(true);
    try {
      const result = await approvalService.processApproval({
        request_id: requestId,
        action: 'approve',
        comments
      });

      if (result.ok) {
        toast.success('Deployment approved');
        await loadRequests();
        return true;
      } else {
        toast.error(result.error.message);
        return false;
      }
    } catch (error) {
      console.error('[Approvals] Approve error:', error);
      toast.error('Failed to approve deployment');
      return false;
    } finally {
      setProcessing(false);
    }
  }, [canApprove, loadRequests]);

  const reject = useCallback(async (requestId: UUID, comments: string) => {
    if (!canApprove) {
      toast.error('You do not have permission to reject deployments');
      return false;
    }

    if (!comments.trim()) {
      toast.error('Please provide a reason for rejection');
      return false;
    }

    setProcessing(true);
    try {
      const result = await approvalService.processApproval({
        request_id: requestId,
        action: 'reject',
        comments
      });

      if (result.ok) {
        toast.success('Deployment rejected');
        await loadRequests();
        return true;
      } else {
        toast.error(result.error.message);
        return false;
      }
    } catch (error) {
      console.error('[Approvals] Reject error:', error);
      toast.error('Failed to reject deployment');
      return false;
    } finally {
      setProcessing(false);
    }
  }, [canApprove, loadRequests]);

  return {
    requests,
    loading,
    processing,
    canApprove,
    approve,
    reject,
    refresh: loadRequests
  };
}