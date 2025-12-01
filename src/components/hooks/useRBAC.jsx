/**
 * @fileoverview RBAC Permission Hook
 * @description Role-based access control with permission checking and guards.
 * 
 * @module hooks/useRBAC
 * @version 2.0.0
 * 
 * @example
 * const { hasPermission, guard, isAdmin } = useRBAC();
 * 
 * if (!hasPermission('workflow.edit')) {
 *   return <AccessDenied />;
 * }
 * 
 * const handleDelete = () => {
 *   guard('workflow.delete', 'delete this workflow');
 *   // proceed...
 * };
 */

import { useAuth } from '../contexts/AuthContext';
import { Permissions } from '../shared/constants';

// Use centralized permissions
const PERMISSIONS = Permissions;

export function useRBAC() {
  const { role } = useAuth();

  const hasPermission = (permission) => {
    if (!permission) return true;
    const allowed = PERMISSIONS[permission];
    if (!allowed) {
      console.warn(`Unknown permission: ${permission}`);
      return false;
    }
    return allowed.includes(role);
  };

  const guard = (permission, action = 'perform this action') => {
    if (!hasPermission(permission)) {
      throw new Error(`You don't have permission to ${action}`);
    }
  };

  return {
    role,
    hasPermission,
    guard,
    isOwner: role === 'owner',
    isAdmin: role === 'admin' || role === 'owner',
    canMutate: role !== 'viewer'
  };
}