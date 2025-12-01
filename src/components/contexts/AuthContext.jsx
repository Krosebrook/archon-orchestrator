/**
 * @fileoverview Authentication Context
 * @description Provides authentication state and RBAC permissions throughout the app.
 * In production, this would integrate with Clerk or another auth provider.
 * 
 * @module contexts/AuthContext
 * @version 2.0.0
 * 
 * @example
 * // In a component
 * const { user, role, hasPermission, isLoading } = useAuth();
 * 
 * if (hasPermission('workflow.edit')) {
 *   // show edit controls
 * }
 */

import React, { createContext, useContext, useState, useEffect, useMemo, useCallback } from 'react';
import { Loader2 } from 'lucide-react';
import { Permissions } from '../shared/constants';

/** @type {React.Context<AuthContextValue|null>} */
const AuthContext = createContext(null);

/**
 * Mock user data for development. In production, this comes from JWT/API.
 * @readonly
 */
const MOCK_USER_DATA = Object.freeze({
  'owner': {
    user: { fullName: 'Alex Williams', email: 'alex@acme.com' },
    organization: { id: 'org_acme', name: 'Acme Inc.' },
    role: 'owner',
  },
  'admin': {
    user: { fullName: 'Sam Rivera', email: 'sam@acme.com' },
    organization: { id: 'org_acme', name: 'Acme Inc.' },
    role: 'admin',
  },
  'operator': {
    user: { fullName: 'Casey Jordan', email: 'casey@acme.com' },
    organization: { id: 'org_acme', name: 'Acme Inc.' },
    role: 'operator',
  },
  'viewer': {
    user: { fullName: 'Jamie Bell', email: 'jamie@acme.com' },
    organization: { id: 'org_acme', name: 'Acme Inc.' },
    role: 'viewer',
  },
});

// Use centralized permissions from constants
const RBAC_PERMISSIONS = Permissions;

/**
 * Authentication Provider component.
 * @param {Object} props
 * @param {React.ReactNode} props.children - Child components
 * @returns {React.ReactElement}
 */
export function AuthProvider({ children }) {
  const [currentUser, setCurrentUser] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [role, setRole] = useState('operator');

  useEffect(() => {
    // Simulate fetching user data on app load
    // In production: integrate with Clerk/Auth0/etc.
    const timer = setTimeout(() => {
      setCurrentUser(MOCK_USER_DATA[role]);
      setIsLoading(false);
    }, 500);
    
    return () => clearTimeout(timer);
  }, [role]);

  /**
   * Check if current user has a specific permission.
   * @param {string} permission - Permission to check
   * @returns {boolean}
   */
  const hasPermission = useCallback((permission) => {
    if (!permission) return true;
    const allowedRoles = RBAC_PERMISSIONS[permission];
    if (!allowedRoles) {
      console.warn(`[RBAC] Unknown permission: ${permission}`);
      return false;
    }
    return allowedRoles.includes(currentUser?.role);
  }, [currentUser?.role]);
  
  /**
   * Switch to a different role (development only).
   * @param {string} newRole - Role to switch to
   */
  const switchRole = useCallback((newRole) => {
    if (MOCK_USER_DATA[newRole]) {
      setIsLoading(true);
      setRole(newRole);
    }
  }, []);

  /**
   * Guard function that throws if permission is missing.
   * @param {string} permission - Required permission
   * @param {string} [action] - Human-readable action description
   * @throws {Error} If permission is not granted
   */
  const guard = useCallback((permission, action = 'perform this action') => {
    if (!hasPermission(permission)) {
      throw new Error(`Permission denied: You don't have permission to ${action}`);
    }
  }, [hasPermission]);

  const value = useMemo(() => ({
    ...currentUser,
    isLoading,
    hasPermission,
    switchRole,
    guard,
    // Convenience flags
    isOwner: currentUser?.role === 'owner',
    isAdmin: ['owner', 'admin'].includes(currentUser?.role),
    canMutate: currentUser?.role !== 'viewer',
  }), [currentUser, isLoading, hasPermission, switchRole, guard]);

  if (isLoading) {
    return (
      <div className="flex h-screen w-full items-center justify-center bg-slate-950">
        <Loader2 className="h-8 w-8 animate-spin text-blue-500" />
      </div>
    );
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

/**
 * Hook to access authentication context.
 * @returns {AuthContextValue}
 * @throws {Error} If used outside of AuthProvider
 * 
 * @example
 * const { user, role, hasPermission, guard, isAdmin } = useAuth();
 */
export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined || context === null) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

/**
 * @typedef {Object} AuthContextValue
 * @property {Object} user - Current user object
 * @property {Object} organization - Current organization
 * @property {string} role - Current role (owner|admin|operator|viewer)
 * @property {boolean} isLoading - Whether auth is loading
 * @property {(permission: string) => boolean} hasPermission - Permission checker
 * @property {(newRole: string) => void} switchRole - Role switcher (dev only)
 * @property {(permission: string, action?: string) => void} guard - Permission guard
 * @property {boolean} isOwner - Is owner role
 * @property {boolean} isAdmin - Is admin or owner
 * @property {boolean} canMutate - Can perform mutations
 */