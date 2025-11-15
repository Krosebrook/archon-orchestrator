import React from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Key, Download } from 'lucide-react';
import TeamManagement from '../components/settings/TeamManagement';
import SecretManager from '../components/settings/SecretManager';
import ScheduleManager from '../components/scheduling/ScheduleManager';
import RoleManagement from '../components/settings/RoleManagement';
import WorkflowAutomationManager from '../components/automation/WorkflowAutomationManager';
import RefactorScheduler from '../components/refactoring/RefactorScheduler';

export default function Settings() {
  return (
    <div>
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-white">Settings</h1>
        <p className="text-slate-400">Manage your organization, team, security, and preferences</p>
      </div>

      <Tabs defaultValue="general" className="w-full">
        <TabsList className="grid w-full grid-cols-7 bg-slate-800 text-slate-400">
          <TabsTrigger value="general">General</TabsTrigger>
          <TabsTrigger value="team">Team</TabsTrigger>
          <TabsTrigger value="roles">Roles</TabsTrigger>
          <TabsTrigger value="automation">Automation</TabsTrigger>
          <TabsTrigger value="scheduling">Scheduling</TabsTrigger>
          <TabsTrigger value="notifications">Notifications</TabsTrigger>
          <TabsTrigger value="security">Security</TabsTrigger>
        </TabsList>

        <TabsContent value="general" className="mt-6">
          <Card className="bg-slate-900 border-slate-800">
            <CardHeader>
              <CardTitle className="text-white">Organization Settings</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <label className="text-sm text-slate-400 mb-2 block">Organization Name</label>
                <Input defaultValue="Archon Enterprise" className="bg-slate-800 border-slate-700" />
              </div>
              <div>
                <label className="text-sm text-slate-400 mb-2 block">Plan</label>
                <div className="flex items-center gap-3">
                  <Badge className="bg-purple-500/20 text-purple-400 border-purple-500/30">Enterprise</Badge>
                  <span className="text-sm text-slate-400">Unlimited agents, workflows, and runs</span>
                </div>
              </div>
              <Button className="bg-blue-600 hover:bg-blue-700">Save Changes</Button>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="team" className="mt-6">
          <TeamManagement />
        </TabsContent>

        <TabsContent value="roles" className="mt-6">
          <RoleManagement />
        </TabsContent>

        <TabsContent value="automation" className="mt-6">
          <div className="space-y-6">
            <WorkflowAutomationManager />
            <RefactorScheduler />
          </div>
        </TabsContent>

        <TabsContent value="scheduling" className="mt-6">
          <ScheduleManager />
        </TabsContent>

        <TabsContent value="notifications" className="mt-6">
          <Card className="bg-slate-900 border-slate-800">
            <CardHeader>
              <CardTitle className="text-white">Notification Preferences</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {[
                { label: 'Workflow Failures', description: 'Get notified when workflows fail' },
                { label: 'Cost Alerts', description: 'Alert when spending exceeds thresholds' },
                { label: 'Approval Requests', description: 'Notify for pending approvals' },
                { label: 'Weekly Reports', description: 'Receive weekly activity summaries' }
              ].map((item) => (
                <div key={item.label} className="flex items-center justify-between p-4 bg-slate-950 rounded-lg border border-slate-800">
                  <div>
                    <div className="text-white font-medium">{item.label}</div>
                    <div className="text-sm text-slate-400">{item.description}</div>
                  </div>
                  <Switch defaultChecked />
                </div>
              ))}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="security" className="mt-6">
          <div className="space-y-6">
            <SecretManager />
            <Card className="bg-slate-900 border-slate-800">
              <CardHeader>
                <CardTitle className="text-white">Data Export</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-slate-400 mb-4">
                  Export all your organization data including workflows, runs, and audit logs
                </p>
                <Button variant="outline" className="border-slate-700">
                  <Download className="w-4 h-4 mr-2" />
                  Export All Data
                </Button>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}