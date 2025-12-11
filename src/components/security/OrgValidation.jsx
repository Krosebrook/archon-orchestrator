/**
 * @fileoverview Organization Validation Utilities
 * @description Multi-tenant isolation helpers for frontend validation.
 * Backend RLS policies provide the actual security layer.
 * 
 * @module components/security/OrgValidation
 * @version 1.0.0
 */

import { base44 } from '@/api/base44Client';
import { APIError, ErrorCodes, ErrorSeverity } from '../shared/constants';
import { auditCritical } from '../utils/audit-logger';

/**
 * Validates user has access to specified organization.
 * 
 * @param {Object} user - Authenticated user
 * @param {string} orgId - Target organization ID
 * @throws {APIError} FORBIDDEN if user lacks access
 */
export function validateOrgMembership(user, orgId) {
  if (!user || !user.organization) {
    throw new APIError(
      ErrorCodes.UNAUTHORIZED,
      'Authentication required',
      { severity: ErrorSeverity.MEDIUM }
    );
  }

  const hasAccess = user.organization.id === orgId || ['admin', 'owner'].includes(user.role);
  
  if (!hasAccess) {
    throw new APIError(
      ErrorCodes.FORBIDDEN,
      'Organization access denied',
      {
        hint: 'You do not have access to this organization',
        severity: ErrorSeverity.MEDIUM,
        context: {
          user_id: user.id,
          requested_org_id: orgId,
          user_org_id: user.organization.id
        }
      }
    );
  }
}

/**
 * Gets user's role within organization.
 */
export function getUserOrgRole(user, orgId) {
  if (['admin', 'owner'].includes(user.role)) {
    return user.role;
  }
  
  if (user.organization?.id === orgId) {
    return user.organization.role || 'viewer';
  }
  
  return 'viewer';
}

/**
 * Checks if user is admin/owner in org.
 */
export function isOrgAdmin(user, orgId) {
  if (['admin', 'owner'].includes(user.role)) {
    return true;
  }
  
  if (user.organization?.id === orgId) {
    return ['admin', 'owner'].includes(user.organization.role);
  }
  
  return false;
}

/**
 * Checks if user can mutate resources in org.
 */
export function canMutate(user, orgId) {
  const role = getUserOrgRole(user, orgId);
  return ['owner', 'admin', 'operator'].includes(role);
}

/**
 * React hook for org validation in components.
 */
export function useOrgValidation(orgId) {
  const [user, setUser] = React.useState(null);
  const [isValidating, setIsValidating] = React.useState(true);
  const [hasAccess, setHasAccess] = React.useState(false);

  React.useEffect(() => {
    const validate = async () => {
      try {
        const currentUser = await base44.auth.me();
        setUser(currentUser);
        
        if (orgId) {
          validateOrgMembership(currentUser, orgId);
          setHasAccess(true);
        }
      } catch (error) {
        setHasAccess(false);
        console.error('[OrgValidation] Access denied:', error);
      } finally {
        setIsValidating(false);
      }
    };

    validate();
  }, [orgId]);

  return {
    user,
    hasAccess,
    isValidating,
    isAdmin: user ? isOrgAdmin(user, orgId) : false,
    canMutate: user ? canMutate(user, orgId) : false
  };
}