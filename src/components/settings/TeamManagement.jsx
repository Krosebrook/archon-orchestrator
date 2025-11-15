import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { TeamMember } from '@/entities/TeamMember';
import { UserPlus, MoreHorizontal, Crown, Shield, Eye, Wrench } from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { format } from 'date-fns';

const roleIcons = {
  owner: Crown,
  admin: Shield,
  operator: Wrench,
  viewer: Eye,
};

const roleColors = {
  owner: 'bg-purple-500/20 text-purple-400 border-purple-500/30',
  admin: 'bg-red-500/20 text-red-400 border-red-500/30',
  operator: 'bg-blue-500/20 text-blue-400 border-blue-500/30',
  viewer: 'bg-slate-500/20 text-slate-400 border-slate-500/30',
};

const statusColors = {
  active: 'bg-green-500/20 text-green-400 border-green-500/30',
  pending: 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30',
  suspended: 'bg-red-500/20 text-red-400 border-red-500/30',
};

export default function TeamManagement() {
  const [teamMembers, setTeamMembers] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showInviteForm, setShowInviteForm] = useState(false);
  const [inviteForm, setInviteForm] = useState({
    email: '',
    full_name: '',
    role: 'viewer',
  });

  useEffect(() => {
    loadTeamMembers();
  }, []);

  const loadTeamMembers = async () => {
    setIsLoading(true);
    try {
      const members = await TeamMember.list('-created_date');
      setTeamMembers(members);
    } catch (error) {
      console.error("Failed to load team members:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleInvite = async (e) => {
    e.preventDefault();
    try {
      await TeamMember.create({
        ...inviteForm,
        org_id: 'org_acme',
        invited_at: new Date().toISOString(),
      });
      setInviteForm({ email: '', full_name: '', role: 'viewer' });
      setShowInviteForm(false);
      loadTeamMembers();
    } catch (error) {
      console.error("Failed to invite team member:", error);
    }
  };

  const changeRole = async (memberId, newRole) => {
    try {
      await TeamMember.update(memberId, { role: newRole });
      loadTeamMembers();
    } catch (error) {
      console.error("Failed to change role:", error);
    }
  };

  const suspendMember = async (memberId) => {
    try {
      await TeamMember.update(memberId, { status: 'suspended' });
      loadTeamMembers();
    } catch (error) {
      console.error("Failed to suspend member:", error);
    }
  };

  return (
    <div className="space-y-6">
      <Card className="bg-slate-900 border-slate-800">
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="text-white">Team Members</CardTitle>
          <Button onClick={() => setShowInviteForm(!showInviteForm)} className="bg-blue-600 hover:bg-blue-700">
            <UserPlus className="w-4 h-4 mr-2" />
            Invite Member
          </Button>
        </CardHeader>
        <CardContent>
          {showInviteForm && (
            <Card className="mb-6 bg-slate-800 border-slate-700">
              <CardHeader>
                <CardTitle className="text-white text-lg">Invite New Member</CardTitle>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleInvite} className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label className="text-slate-400">Email Address</Label>
                      <Input
                        type="email"
                        value={inviteForm.email}
                        onChange={(e) => setInviteForm({...inviteForm, email: e.target.value})}
                        className="bg-slate-700 border-slate-600 text-white"
                        required
                      />
                    </div>
                    <div>
                      <Label className="text-slate-400">Full Name</Label>
                      <Input
                        value={inviteForm.full_name}
                        onChange={(e) => setInviteForm({...inviteForm, full_name: e.target.value})}
                        className="bg-slate-700 border-slate-600 text-white"
                        required
                      />
                    </div>
                  </div>
                  <div>
                    <Label className="text-slate-400">Role</Label>
                    <Select value={inviteForm.role} onValueChange={(value) => setInviteForm({...inviteForm, role: value})}>
                      <SelectTrigger className="bg-slate-700 border-slate-600 text-white">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent className="bg-slate-800 border-slate-700">
                        <SelectItem value="viewer">Viewer - Read-only access</SelectItem>
                        <SelectItem value="operator">Operator - Can run workflows</SelectItem>
                        <SelectItem value="admin">Admin - Full management access</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="flex justify-end gap-2">
                    <Button type="button" variant="outline" onClick={() => setShowInviteForm(false)}>
                      Cancel
                    </Button>
                    <Button type="submit">Send Invitation</Button>
                  </div>
                </form>
              </CardContent>
            </Card>
          )}

          <div className="rounded-lg border border-slate-700 bg-slate-800">
            <Table>
              <TableHeader>
                <TableRow className="border-b-slate-700">
                  <TableHead className="text-slate-400">Member</TableHead>
                  <TableHead className="text-slate-400">Role</TableHead>
                  <TableHead className="text-slate-400">Status</TableHead>
                  <TableHead className="text-slate-400">Last Active</TableHead>
                  <TableHead><span className="sr-only">Actions</span></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {teamMembers.map((member) => {
                  const RoleIcon = roleIcons[member.role];
                  return (
                    <TableRow key={member.id} className="border-b-slate-700">
                      <TableCell>
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 bg-slate-700 rounded-full flex items-center justify-center">
                            <span className="text-white text-sm font-medium">
                              {member.full_name.charAt(0).toUpperCase()}
                            </span>
                          </div>
                          <div>
                            <div className="text-white font-medium">{member.full_name}</div>
                            <div className="text-slate-400 text-sm">{member.email}</div>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline" className={`${roleColors[member.role]} capitalize flex items-center gap-1 w-fit`}>
                          <RoleIcon className="w-3 h-3" />
                          {member.role}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline" className={`${statusColors[member.status]} capitalize`}>
                          {member.status}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-slate-400">
                        {member.last_active ? format(new Date(member.last_active), 'MMM d, yyyy') : 'Never'}
                      </TableCell>
                      <TableCell>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon" className="text-slate-400 hover:text-white">
                              <MoreHorizontal className="w-4 h-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent className="bg-slate-800 border-slate-700">
                            <DropdownMenuItem onClick={() => changeRole(member.id, 'admin')}>
                              Change to Admin
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => changeRole(member.id, 'operator')}>
                              Change to Operator
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => changeRole(member.id, 'viewer')}>
                              Change to Viewer
                            </DropdownMenuItem>
                            <DropdownMenuItem 
                              onClick={() => suspendMember(member.id)}
                              className="text-red-400 focus:text-red-400"
                            >
                              Suspend Member
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}