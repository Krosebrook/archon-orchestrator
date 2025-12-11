/**
 * @fileoverview RBAC Configuration
 * @description Role-Based Access Control permissions matrix following
 * Archon canonical governance model with strict permission enforcement.
 * 
 * @module shared/constants/rbac
 * @version 2.0.0
 */

/**
 * User roles in the system
 * @readonly
 * @enum {string}
 */
export const Roles = Object.freeze({
  OWNER: 'owner',
  ADMIN: 'admin',
  OPERATOR: 'operator',
  VIEWER: 'viewer'
});

/**
 * Permission namespace constants
 * @readonly
 */
export const PermissionNamespaces = Object.freeze({
  AGENT: 'agent',
  WORKFLOW: 'workflow',
  POLICY: 'policy',
  APPROVAL: 'approval',
  TEAM: 'team',
  SETTINGS: 'settings',
  AUDIT: 'audit',
  BILLING: 'billing',
  SKILL: 'skill',
  INTEGRATION: 'integration'
});

/**
 * Permission actions
 * @readonly
 */
export const PermissionActions = Object.freeze({
  CREATE: 'create',
  VIEW: 'view',
  EDIT: 'edit',
  DELETE: 'delete',
  RUN: 'run',
  APPROVE: 'approve',
  EXPORT: 'export',
  MANAGE: 'manage',
  INVITE: 'invite',
  REMOVE: 'remove'
});

/**
 * Complete permissions matrix
 * Maps permission strings to allowed roles
 * @readonly
 */
export const Permissions = Object.freeze({
  // Agent permissions
  'agent.create': [Roles.OWNER, Roles.ADMIN],
  'agent.view': [Roles.OWNER, Roles.ADMIN, Roles.OPERATOR, Roles.VIEWER],
  'agent.edit': [Roles.OWNER, Roles.ADMIN],
  'agent.delete': [Roles.OWNER, Roles.ADMIN],
  'agent.run': [Roles.OWNER, Roles.ADMIN, Roles.OPERATOR],
  
  // Workflow permissions
  'workflow.create': [Roles.OWNER, Roles.ADMIN, Roles.OPERATOR],
  'workflow.view': [Roles.OWNER, Roles.ADMIN, Roles.OPERATOR, Roles.VIEWER],
  'workflow.edit': [Roles.OWNER, Roles.ADMIN, Roles.OPERATOR],
  'workflow.delete': [Roles.OWNER, Roles.ADMIN],
  'workflow.run': [Roles.OWNER, Roles.ADMIN, Roles.OPERATOR],
  
  // Policy permissions
  'policy.create': [Roles.OWNER, Roles.ADMIN],
  'policy.view': [Roles.OWNER, Roles.ADMIN, Roles.OPERATOR, Roles.VIEWER],
  'policy.edit': [Roles.OWNER, Roles.ADMIN],
  'policy.delete': [Roles.OWNER],
  
  // Approval permissions
  'approval.view': [Roles.OWNER, Roles.ADMIN, Roles.OPERATOR],
  'approval.approve': [Roles.OWNER, Roles.ADMIN],
  
  // Team permissions
  'team.view': [Roles.OWNER, Roles.ADMIN, Roles.OPERATOR, Roles.VIEWER],
  'team.invite': [Roles.OWNER, Roles.ADMIN],
  'team.remove': [Roles.OWNER, Roles.ADMIN],
  'team.edit': [Roles.OWNER, Roles.ADMIN],
  
  // Settings permissions
  'settings.view': [Roles.OWNER, Roles.ADMIN],
  'settings.edit': [Roles.OWNER],
  
  // Audit permissions
  'audit.view': [Roles.OWNER, Roles.ADMIN],
  'audit.export': [Roles.OWNER, Roles.ADMIN],
  
  // Billing permissions
  'billing.view': [Roles.OWNER],
  'billing.manage': [Roles.OWNER],
  
  // Skill marketplace permissions
  'skill.view': [Roles.OWNER, Roles.ADMIN, Roles.OPERATOR, Roles.VIEWER],
  'skill.install': [Roles.OWNER, Roles.ADMIN, Roles.OPERATOR],
  'skill.publish': [Roles.OWNER, Roles.ADMIN],
  'skill.purchase': [Roles.OWNER, Roles.ADMIN],
  
  // Integration permissions
  'integration.view': [Roles.OWNER, Roles.ADMIN, Roles.OPERATOR, Roles.VIEWER],
  'integration.install': [Roles.OWNER, Roles.ADMIN],
  'integration.configure': [Roles.OWNER, Roles.ADMIN],
  'integration.delete': [Roles.OWNER, Roles.ADMIN]
});

/**
 * Role hierarchy for permission inheritance
 * Higher roles inherit permissions from lower roles
 * @readonly
 */
export const RoleHierarchy = Object.freeze([
  Roles.OWNER,
  Roles.ADMIN,
  Roles.OPERATOR,
  Roles.VIEWER
]);

/**
 * Check if a role has a specific permission
 * @param {string} role - User role
 * @param {string} permission - Permission string (e.g., 'workflow.edit')
 * @returns {boolean}
 */
export function hasPermission(role, permission) {
  if (!permission) return true;
  
  const allowedRoles = Permissions[permission];
  if (!allowedRoles) {
    console.warn(`[RBAC] Unknown permission: ${permission}`);
    return false;
  }
  
  return allowedRoles.includes(role);
}

/**
 * Get all permissions for a role
 * @param {string} role - User role
 * @returns {string[]} Array of permission strings
 */
export function getRolePermissions(role) {
  return Object.entries(Permissions)
    .filter(([_, roles]) => roles.includes(role))
    .map(([permission]) => permission);
}

/**
 * Check if role can perform action on namespace
 * @param {string} role - User role
 * @param {string} namespace - Permission namespace
 * @param {string} action - Permission action
 * @returns {boolean}
 */
export function can(role, namespace, action) {
  const permission = `${namespace}.${action}`;
  return hasPermission(role, permission);
}

/**
 * Guard function that throws if permission is missing
 * @param {string} role - User role
 * @param {string} permission - Required permission
 * @param {string} [resource] - Resource being accessed
 * @throws {Error} If permission is not granted
 */
export function guard(role, permission, resource = 'resource') {
  if (!hasPermission(role, permission)) {
    throw new Error(
      `Permission denied: Role '${role}' does not have '${permission}' permission for ${resource}`
    );
  }
}

/**
 * Get role display name
 * @param {string} role - Role constant
 * @returns {string} Human-readable name
 */
export function getRoleDisplayName(role) {
  const displayNames = {
    [Roles.OWNER]: 'Owner',
    [Roles.ADMIN]: 'Administrator',
    [Roles.OPERATOR]: 'Operator',
    [Roles.VIEWER]: 'Viewer'
  };
  return displayNames[role] || role;
}

/**
 * Get role description
 * @param {string} role - Role constant
 * @returns {string} Role description
 */
export function getRoleDescription(role) {
  const descriptions = {
    [Roles.OWNER]: 'Full access including billing and settings',
    [Roles.ADMIN]: 'Manage agents, approve actions, view audits',
    [Roles.OPERATOR]: 'Run workflows, create resources, execute agents',
    [Roles.VIEWER]: 'Read-only access to agents and workflows'
  };
  return descriptions[role] || 'No description available';
}