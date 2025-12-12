/**
 * @fileoverview Approvals Hook
 * @description React hook for managing deployment approvals.
 */

import { useState, useEffect, useCallback } from 'react';
import { approvalService } from '@/components/services/ApprovalService';
import { useAuth } from '@/components/contexts/AuthContext';
import { toast } from 'sonner';

/**
 * Hook for managing deployment approvals.
 * 
 * @param {Object} options - Configuration options
 * @param {string} [options.status] - Filter by status
 * @param {string} [options.workflow_id] - Filter by workflow
 * @param {boolean} [options.autoRefresh] - Auto-refresh enabled
 * @param {number} [options.refreshInterval] - Refresh interval in ms
 */
export function useApprovals(options = {}) {
  const { user, hasPermission } = useAuth();
  const [requests, setRequests] = useState([]);
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

  const approve = useCallback(async (requestId, comments) => {
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

  const reject = useCallback(async (requestId, comments) => {
    if (!canApprove) {
      toast.error('You do not have permission to reject deployments');
      return false;
    }

    if (!comments || !comments.trim()) {
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