import { useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { handleError } from '../utils/api-client';
import { createAuditLog, AuditActions, AuditEntities } from '../utils/audit-logger';
import { validateWorkflowName } from '../utils/validation';
import { toast } from 'sonner';

export function useCreateWorkflow() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (workflowData) => {
      const validation = validateWorkflowName(workflowData.name);
      if (!validation.valid) {
        throw new Error(validation.error);
      }
      
      const result = await base44.entities.Workflow.create(workflowData);
      
      // Audit log
      const user = await base44.auth.me();
      await base44.entities.Audit.create(createAuditLog(
        AuditActions.CREATE,
        AuditEntities.WORKFLOW,
        result.id,
        { after: result }
      ));
      
      return result;
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['workflows']);
      toast.success('Workflow created successfully');
    },
    onError: (error) => {
      handleError(error);
    }
  });
}

export function useUpdateWorkflow() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ id, data, previousData }) => {
      const validation = validateWorkflowName(data.name);
      if (!validation.valid) {
        throw new Error(validation.error);
      }
      
      const result = await base44.entities.Workflow.update(id, data);
      
      // Audit log
      await base44.entities.Audit.create(createAuditLog(
        AuditActions.UPDATE,
        AuditEntities.WORKFLOW,
        id,
        { before: previousData, after: result }
      ));
      
      return result;
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['workflows']);
      toast.success('Workflow updated successfully');
    },
    onError: (error) => {
      handleError(error);
    }
  });
}

export function useDeleteWorkflow() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ id, workflow }) => {
      await base44.entities.Workflow.delete(id);
      
      // Audit log
      await base44.entities.Audit.create(createAuditLog(
        AuditActions.DELETE,
        AuditEntities.WORKFLOW,
        id,
        { before: workflow }
      ));
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['workflows']);
      toast.success('Workflow deleted successfully');
    },
    onError: (error) => {
      handleError(error);
    }
  });
}