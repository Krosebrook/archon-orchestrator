import { useAuth } from '../contexts/AuthContext';

const PERMISSIONS = {
  'workflow.view': ['owner', 'admin', 'operator', 'viewer'],
  'workflow.create': ['owner', 'admin', 'operator'],
  'workflow.edit': ['owner', 'admin', 'operator'],
  'workflow.delete': ['owner', 'admin'],
  'workflow.run': ['owner', 'admin', 'operator'],
  'agent.view': ['owner', 'admin', 'operator', 'viewer'],
  'agent.create': ['owner', 'admin'],
  'agent.edit': ['owner', 'admin'],
  'agent.delete': ['owner', 'admin'],
  'policy.view': ['owner', 'admin', 'operator', 'viewer'],
  'policy.create': ['owner', 'admin'],
  'policy.edit': ['owner', 'admin'],
  'policy.delete': ['owner'],
  'approval.view': ['owner', 'admin', 'operator'],
  'approval.approve': ['owner', 'admin'],
  'settings.view': ['owner', 'admin'],
  'settings.edit': ['owner'],
  'audit.view': ['owner', 'admin'],
  'audit.export': ['owner', 'admin']
};

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