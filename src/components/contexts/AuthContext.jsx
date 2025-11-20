import React, { createContext, useContext, useState, useEffect } from 'react';
import { Loader2 } from 'lucide-react';

const AuthContext = createContext(null);

// In a real app, this data would come from a decoded JWT or an API call
const MOCK_USER_DATA = {
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
};

const PERMISSIONS = {
  'agent.create': ['owner', 'admin'],
  'agent.edit': ['owner', 'admin'],
  'agent.delete': ['owner', 'admin'],
  'agent.view': ['owner', 'admin', 'operator', 'viewer'],
  'workflow.create': ['owner', 'admin', 'operator'],
  'workflow.edit': ['owner', 'admin', 'operator'],
  'workflow.delete': ['owner', 'admin'],
  'workflow.view': ['owner', 'admin', 'operator', 'viewer'],
  'workflow.run': ['owner', 'admin', 'operator'],
  'policy.create': ['owner', 'admin'],
  'policy.edit': ['owner', 'admin'],
  'policy.view': ['owner', 'admin', 'operator', 'viewer'],
  'team.invite': ['owner', 'admin'],
  'team.remove': ['owner', 'admin'],
  'team.view': ['owner', 'admin', 'operator', 'viewer'],
  'billing.manage': ['owner'],
};

export function AuthProvider({ children }) {
  const [currentUser, setCurrentUser] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [role, setRole] = useState('operator'); // Default role

  useEffect(() => {
    // Simulate fetching user data on app load
    setTimeout(() => {
      setCurrentUser(MOCK_USER_DATA[role]);
      setIsLoading(false);
    }, 500);
  }, [role]);

  const hasPermission = (permission) => {
    if (!permission) return true; // No permission required
    const allowedRoles = PERMISSIONS[permission];
    return allowedRoles && allowedRoles.includes(currentUser?.role);
  };
  
  const switchRole = (newRole) => {
      if (MOCK_USER_DATA[newRole]) {
          setIsLoading(true);
          setRole(newRole);
      }
  }

  const value = {
    ...currentUser,
    isLoading,
    hasPermission,
    switchRole,
  };

  if (isLoading) {
    return (
      <div className="flex h-screen w-full items-center justify-center bg-slate-950">
        <Loader2 className="h-8 w-8 animate-spin text-blue-500" />
      </div>
    );
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};