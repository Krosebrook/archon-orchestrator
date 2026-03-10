import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Shield, Activity, Brain } from 'lucide-react';
import RBACPolicyEditor from '../components/dashboard/RBACPolicyEditor';
import LiveEventFeed from '../components/dashboard/LiveEventFeed';
import AgentAnalyticsPanel from '../components/dashboard/AgentAnalyticsPanel';

export default function OrgDashboard() {
  return (
    <div className="space-y-6 max-w-6xl mx-auto">
      <div>
        <h1 className="text-3xl font-bold text-white mb-1">Org Dashboard</h1>
        <p className="text-slate-400 text-sm">RBAC policy management, live event stream, and agent analytics</p>
      </div>

      <Tabs defaultValue="analytics">
        <TabsList className="bg-slate-800 border border-slate-700">
          <TabsTrigger value="analytics" className="gap-2 text-sm">
            <Brain className="w-4 h-4" /> Analytics
          </TabsTrigger>
          <TabsTrigger value="events" className="gap-2 text-sm">
            <Activity className="w-4 h-4" /> Live Events
          </TabsTrigger>
          <TabsTrigger value="rbac" className="gap-2 text-sm">
            <Shield className="w-4 h-4" /> RBAC Policies
          </TabsTrigger>
        </TabsList>

        <TabsContent value="analytics" className="mt-4">
          <AgentAnalyticsPanel />
        </TabsContent>

        <TabsContent value="events" className="mt-4">
          <LiveEventFeed />
        </TabsContent>

        <TabsContent value="rbac" className="mt-4">
          <RBACPolicyEditor />
        </TabsContent>
      </Tabs>
    </div>
  );
}