
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Download, Key, Bell, Shield } from 'lucide-react';
import TeamManagement from '../components/settings/TeamManagement';
import ScheduleManager from '../components/scheduling/ScheduleManager';
import SecretManager from '../components/settings/SecretManager'; // Import new component

export default function Settings() {
  return (
    <div>
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-white">Settings</h1>
        <p className="text-slate-400">Configure your organization and system preferences.</p>
      </div>

      <Tabs defaultValue="general" className="w-full">
        <TabsList className="grid w-full grid-cols-6 bg-slate-800 text-slate-400">
          <TabsTrigger value="general" className="data-[state=active]:bg-slate-900 data-[state=active]:text-white">General</TabsTrigger>
          <TabsTrigger value="team" className="data-[state=active]:bg-slate-900 data-[state=active]:text-white">Team</TabsTrigger>
          <TabsTrigger value="api" className="data-[state=active]:bg-slate-900 data-[state=active]:text-white">API Keys</TabsTrigger>
          <TabsTrigger value="scheduling" className="data-[state=active]:bg-slate-900 data-[state=active]:text-white">Scheduling</TabsTrigger>
          <TabsTrigger value="notifications" className="data-[state=active]:bg-slate-900 data-[state=active]:text-white">Notifications</TabsTrigger>
          <TabsTrigger value="security" className="data-[state=active]:bg-slate-900 data-[state=active]:text-white">Security</TabsTrigger>
        </TabsList>

        <TabsContent value="general" className="mt-6">
          <Card className="bg-slate-900 border-slate-800">
            <CardHeader>
              <CardTitle className="text-white">Organization Settings</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-slate-400">Organization Name</Label>
                  <Input value="Acme Inc." className="bg-slate-800 border-slate-700 text-white mt-1" />
                </div>
                <div>
                  <Label className="text-slate-400">Plan</Label>
                  <Input value="Enterprise" disabled className="bg-slate-800 border-slate-700 text-slate-400 mt-1" />
                </div>
              </div>
              <div className="flex justify-end">
                <Button>Save Changes</Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="team" className="mt-6">
          <TeamManagement />
        </TabsContent>

        <TabsContent value="api" className="mt-6">
          <div className="space-y-6">
            <Card className="bg-slate-900 border-slate-800">
              <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle className="text-white flex items-center gap-2">
                  <Key className="w-5 h-5" />
                  API Keys
                </CardTitle>
                <Button variant="outline">Generate New Key</Button>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="p-4 bg-slate-800 rounded-lg">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="font-mono text-white">ak_prod_••••••••••••••••</p>
                        <p className="text-sm text-slate-400">Production Key - Created Dec 1, 2024</p>
                      </div>
                      <Button variant="destructive" size="sm">Revoke</Button>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
        
        <TabsContent value="scheduling" className="mt-6">
          <ScheduleManager />
        </TabsContent>

        <TabsContent value="notifications" className="mt-6">
          <Card className="bg-slate-900 border-slate-800">
            <CardHeader>
              <CardTitle className="text-white flex items-center gap-2">
                <Bell className="w-5 h-5" />
                Notification Preferences
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-white font-medium">Workflow Failures</p>
                    <p className="text-sm text-slate-400">Get notified when workflows fail</p>
                  </div>
                  <Switch defaultChecked />
                </div>
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-white font-medium">Cost Alerts</p>
                    <p className="text-sm text-slate-400">Alert when spending exceeds thresholds</p>
                  </div>
                  <Switch defaultChecked />
                </div>
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-white font-medium">Weekly Reports</p>
                    <p className="text-sm text-slate-400">Receive weekly usage summaries</p>
                  </div>
                  <Switch />
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="security" className="mt-6">
          <div className="space-y-6">
            <SecretManager /> {/* Add Secret Manager */}
            <Card className="bg-slate-900 border-slate-800">
              <CardHeader>
                <CardTitle className="text-white flex items-center gap-2">
                  <Shield className="w-5 h-5" />
                  Export Data
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-white font-medium">Download All Data</p>
                    <p className="text-sm text-slate-400">Export runs, agents, workflows, and audit logs</p>
                  </div>
                  <Button variant="outline">
                    <Download className="mr-2 h-4 w-4" />
                    Export
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
