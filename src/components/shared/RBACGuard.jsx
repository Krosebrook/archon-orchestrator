
import { Badge } from '@/components/ui/badge';
import { Lock } from 'lucide-react';
import { useAuth } from '@/components/contexts/AuthContext'; // Corrected import path

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
