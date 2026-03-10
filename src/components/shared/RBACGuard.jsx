/**
 * @fileoverview RBAC Guard Component
 * @description Permission-based access control component that conditionally renders
 * children based on user permissions.
 * 
 * @module shared/RBACGuard
 * @version 2.0.0
 * 
 * @example
 * <RBACGuard permission="workflow.edit">
 *   <EditButton />
 * </RBACGuard>
 * 
 * <RBACGuard permission="admin.view" fallback={<UpgradePrompt />}>
 *   <AdminPanel />
 * </RBACGuard>
 */

import React from 'react';
import { Badge } from '@/components/ui/badge';
import { Lock } from 'lucide-react';
import { useAuth } from '@/components/contexts/AuthContext';
import { getRoleDisplayName } from '@/components/shared/constants/rbac';

/** Maps permission strings to human-readable labels */
const PERMISSION_LABELS = {
  'agent.create': 'Agent creation access',
  'agent.view': 'Agent view access',
  'agent.edit': 'Agent editing access',
  'agent.delete': 'Agent deletion access',
  'agent.run': 'Agent execution access',
  'workflow.create': 'Workflow creation access',
  'workflow.view': 'Workflow view access',
  'workflow.edit': 'Workflow editing access',
  'workflow.delete': 'Workflow deletion access',
  'workflow.run': 'Workflow execution access',
  'policy.create': 'Policy creation access',
  'policy.view': 'Policy view access',
  'policy.edit': 'Policy editing access',
  'policy.delete': 'Policy deletion access',
  'approval.view': 'Approval view access',
  'approval.approve': 'Approval authority',
  'team.view': 'Team view access',
  'team.invite': 'Team invite access',
  'team.remove': 'Team management access',
  'team.edit': 'Team editing access',
  'settings.view': 'Settings view access',
  'settings.edit': 'Settings management access',
  'audit.view': 'Audit log access',
  'audit.export': 'Audit export access',
  'billing.view': 'Billing view access',
  'billing.manage': 'Billing management access',
  'skill.view': 'Skill marketplace access',
  'skill.install': 'Skill installation access',
  'skill.publish': 'Skill publishing access',
  'skill.purchase': 'Skill purchase access',
  'integration.view': 'Integration view access',
  'integration.install': 'Integration installation access',
  'integration.configure': 'Integration configuration access',
  'integration.delete': 'Integration deletion access',
};

/**
 * Guard component that renders children only if user has required permission.
 * @param {Object} props
 * @param {React.ReactNode} props.children - Content to render if authorized
 * @param {string} props.permission - Required permission (e.g., 'workflow.edit')
 * @param {React.ReactNode} [props.fallback] - Content to render if unauthorized
 * @param {boolean} [props.showLockMessage=true] - Whether to show default lock message
 * @returns {React.ReactNode}
 */
export function RBACGuard({ 
  children, 
  permission, 
  fallback = null,
  showLockMessage = true 
}) {
  const { role, hasPermission } = useAuth();
  const hasAccess = hasPermission(permission);
  
  if (!hasAccess) {
    if (fallback) return fallback;
    
    if (showLockMessage) {
      return (
        <div className="flex flex-col items-center justify-center h-full text-center p-8 bg-slate-900/50 border border-slate-800 rounded-lg">
          <Lock className="w-12 h-12 text-slate-600 mb-4" />
          <h3 className="text-xl font-bold text-white">Access Restricted</h3>
          <p className="text-slate-400 mt-2 mb-4">
            You do not have permission to view this page or perform this action.
          </p>
          <Badge variant="outline" className="text-md bg-red-900/50 border-red-500/30 text-red-300">
            Required: {permission || 'elevated privileges'}
          </Badge>
          <Badge variant="outline" className="text-md mt-2 bg-green-900/50 border-green-500/30 text-green-300">
            Your Role: {role}
          </Badge>
        </div>
      );
    }
    
    return null;
  }
  
  return children;
}