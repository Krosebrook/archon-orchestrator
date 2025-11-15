import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { PlusCircle, Play, Settings, Download } from 'lucide-react';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';

export default function QuickActions() {
  const actions = [
    {
      title: 'Create Agent',
      description: 'Set up a new AI agent',
      icon: PlusCircle,
      path: 'Agents',
      color: 'bg-blue-500/10 border-blue-500/20 hover:bg-blue-500/20',
      iconColor: 'text-blue-400',
    },
    {
      title: 'Design Workflow',
      description: 'Build an automated process',
      icon: Play,
      path: 'WorkflowDetail',
      color: 'bg-green-500/10 border-green-500/20 hover:bg-green-500/20',
      iconColor: 'text-green-400',
    },
    {
      title: 'Export Data',
      description: 'Download analytics',
      icon: Download,
      path: 'Settings',
      color: 'bg-purple-500/10 border-purple-500/20 hover:bg-purple-500/20',
      iconColor: 'text-purple-400',
    },
    {
      title: 'Configure Policies',
      description: 'Manage governance rules',
      icon: Settings,
      path: 'Governance',
      color: 'bg-orange-500/10 border-orange-500/20 hover:bg-orange-500/20',
      iconColor: 'text-orange-400',
    },
  ];

  return (
    <Card className="bg-slate-900 border-slate-800">
      <CardHeader>
        <CardTitle className="text-lg font-semibold text-white">Quick Actions</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {actions.map((action) => (
            <Link key={action.title} to={createPageUrl(action.path)}>
              <Button
                variant="outline"
                className={`w-full h-auto p-4 flex flex-col items-start gap-2 ${action.color} border text-left`}
              >
                <div className="flex items-center gap-3 w-full">
                  <action.icon className={`w-5 h-5 ${action.iconColor}`} />
                  <div>
                    <p className="font-medium text-white">{action.title}</p>
                    <p className="text-xs text-slate-400 font-normal">{action.description}</p>
                  </div>
                </div>
              </Button>
            </Link>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}