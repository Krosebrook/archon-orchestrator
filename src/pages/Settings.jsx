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
import ProfileSettings from '../components/settings/ProfileSettings';
import PreferencesSettings from '../components/settings/PreferencesSettings';
import SecuritySettings from '../components/settings/SecuritySettings';

export default function Settings() {
  return (
    <div>
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-white">Settings</h1>
        <p className="text-slate-400">Manage your organization, team, security, and preferences</p>
      </div>

      <Tabs defaultValue="profile" className="w-full">
        <TabsList className="grid w-full grid-cols-9 bg-slate-800 text-slate-400">
          <TabsTrigger value="profile">Profile</TabsTrigger>
          <TabsTrigger value="preferences">Preferences</TabsTrigger>
          <TabsTrigger value="api">API & Security</TabsTrigger>
          <TabsTrigger value="general">General</TabsTrigger>
          <TabsTrigger value="team">Team</TabsTrigger>
          <TabsTrigger value="roles">Roles</TabsTrigger>
          <TabsTrigger value="automation">Automation</TabsTrigger>
          <TabsTrigger value="scheduling">Scheduling</TabsTrigger>
          <TabsTrigger value="security">Secrets</TabsTrigger>
        </TabsList>

        <TabsContent value="profile" className="mt-6">
          <ProfileSettings />
        </TabsContent>

        <TabsContent value="preferences" className="mt-6">
          <PreferencesSettings />
        </TabsContent>

        <TabsContent value="api" className="mt-6">
          <SecuritySettings />
        </TabsContent>

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