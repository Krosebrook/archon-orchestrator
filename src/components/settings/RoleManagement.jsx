import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Shield, Crown, Settings, Eye, AlertTriangle } from 'lucide-react';
import { base44 } from '@/api/base44Client';
import { toast } from 'sonner';

const ROLE_CONFIG = {
  owner: {
    icon: Crown,
    color: 'text-yellow-400',
    badge: 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30',
    description: 'Full system access, billing, and org management'
  },
  admin: {
    icon: Shield,
    color: 'text-red-400',
    badge: 'bg-red-500/20 text-red-400 border-red-500/30',
    description: 'Manage agents, workflows, policies, and team members'
  },
  operator: {
    icon: Settings,
    color: 'text-blue-400',
    badge: 'bg-blue-500/20 text-blue-400 border-blue-500/30',
    description: 'Execute workflows, view runs, manage approvals'
  },
  viewer: {
    icon: Eye,
    color: 'text-slate-400',
    badge: 'bg-slate-500/20 text-slate-400 border-slate-500/30',
    description: 'Read-only access to dashboard and reports'
  }
};

const PERMISSIONS_MATRIX = {
  'agent.create': ['owner', 'admin'],
  'agent.edit': ['owner', 'admin'],
  'agent.delete': ['owner', 'admin'],
  'agent.view': ['owner', 'admin', 'operator', 'viewer'],
  'workflow.create': ['owner', 'admin'],
  'workflow.edit': ['owner', 'admin', 'operator'],
  'workflow.delete': ['owner', 'admin'],
  'workflow.run': ['owner', 'admin', 'operator'],
  'workflow.view': ['owner', 'admin', 'operator', 'viewer'],
  'policy.create': ['owner', 'admin'],
  'policy.edit': ['owner', 'admin'],
  'policy.delete': ['owner'],
  'policy.view': ['owner', 'admin', 'operator', 'viewer'],
  'team.invite': ['owner', 'admin'],
  'team.manage': ['owner', 'admin'],
  'billing.view': ['owner'],
  'billing.manage': ['owner']
};

export default function RoleManagement() {
  const [members, setMembers] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadMembers();
  }, []);

  const loadMembers = async () => {
    setIsLoading(true);
    try {
      const data = await base44.entities.TeamMember.list();
      setMembers(data);
    } catch (error) {
      console.error('Failed to load team members:', error);
      toast.error('Failed to load team members');
    } finally {
      setIsLoading(false);
    }
  };

  const updateRole = async (memberId, newRole) => {
    try {
      await base44.entities.TeamMember.update(memberId, { role: newRole });
      toast.success('Role updated successfully');
      loadMembers();
    } catch (error) {
      console.error('Failed to update role:', error);
      toast.error('Failed to update role');
    }
  };

  return (
    <div className="space-y-6">
      <Card className="bg-slate-900 border-slate-800">
        <CardHeader>
          <CardTitle className="text-white">Role Definitions</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {Object.entries(ROLE_CONFIG).map(([role, config]) => {
              const Icon = config.icon;
              return (
                <div key={role} className="p-4 bg-slate-950 rounded-lg border border-slate-800">
                  <div className="flex items-center gap-3 mb-2">
                    <Icon className={`w-5 h-5 ${config.color}`} />
                    <Badge variant="outline" className={config.badge}>
                      {role.toUpperCase()}
                    </Badge>
                  </div>
                  <p className="text-sm text-slate-400">{config.description}</p>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>

      <Card className="bg-slate-900 border-slate-800">
        <CardHeader>
          <CardTitle className="text-white">Team Members</CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="text-center py-8 text-slate-400">Loading...</div>
          ) : members.length === 0 ? (
            <div className="text-center py-8 text-slate-400">No team members found</div>
          ) : (
            <div className="space-y-3">
              {members.map((member) => {
                const roleConfig = ROLE_CONFIG[member.role] || ROLE_CONFIG.viewer;
                const Icon = roleConfig.icon;
                
                return (
                  <div
                    key={member.id}
                    className="flex items-center justify-between p-4 bg-slate-950 rounded-lg border border-slate-800"
                  >
                    <div className="flex items-center gap-4">
                      <div className="w-10 h-10 rounded-full bg-slate-800 flex items-center justify-center">
                        <Icon className={`w-5 h-5 ${roleConfig.color}`} />
                      </div>
                      <div>
                        <div className="text-white font-medium">{member.full_name}</div>
                        <div className="text-sm text-slate-400">{member.email}</div>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <Badge
                        variant="outline"
                        className={`${roleConfig.badge} ${member.status !== 'active' ? 'opacity-50' : ''}`}
                      >
                        {member.role}
                      </Badge>
                      <Select value={member.role} onValueChange={(newRole) => updateRole(member.id, newRole)}>
                        <SelectTrigger className="w-32 bg-slate-800 border-slate-700">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent className="bg-slate-800 border-slate-700">
                          {Object.keys(ROLE_CONFIG).map((role) => (
                            <SelectItem key={role} value={role}>
                              {role.charAt(0).toUpperCase() + role.slice(1)}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>

      <Card className="bg-slate-900 border-slate-800">
        <CardHeader>
          <CardTitle className="text-white">Permissions Matrix</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-slate-800">
                  <th className="text-left text-slate-400 pb-3 pr-4">Permission</th>
                  {Object.keys(ROLE_CONFIG).map((role) => (
                    <th key={role} className="text-center text-slate-400 pb-3 px-2">
                      {role.charAt(0).toUpperCase() + role.slice(1)}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {Object.entries(PERMISSIONS_MATRIX).map(([permission, allowedRoles]) => (
                  <tr key={permission} className="border-b border-slate-800/50">
                    <td className="py-3 pr-4 text-slate-300">{permission}</td>
                    {Object.keys(ROLE_CONFIG).map((role) => (
                      <td key={role} className="py-3 px-2 text-center">
                        {allowedRoles.includes(role) ? (
                          <div className="inline-block w-5 h-5 rounded bg-green-500/20 border border-green-500/30 flex items-center justify-center">
                            <div className="w-2 h-2 rounded-full bg-green-500" />
                          </div>
                        ) : (
                          <div className="inline-block w-5 h-5 rounded bg-slate-800 border border-slate-700" />
                        )}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      <Card className="bg-orange-900/20 border-orange-800/30">
        <CardContent className="p-4">
          <div className="flex items-start gap-3">
            <AlertTriangle className="w-5 h-5 text-orange-400 mt-0.5" />
            <div>
              <div className="text-orange-400 font-medium mb-1">Role Change Audit</div>
              <p className="text-sm text-orange-300/80">
                All role changes are logged in the audit trail. Only owners and admins can modify roles.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}