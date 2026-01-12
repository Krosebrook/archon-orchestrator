import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Terminal, Copy } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';

const CLI_COMMANDS = [
  {
    title: 'Install CLI',
    command: 'npm install -g @archon/cli',
    description: 'Install Archon CLI globally'
  },
  {
    title: 'Login',
    command: 'archon login --api-key YOUR_API_KEY --org YOUR_ORG_ID',
    description: 'Authenticate with your credentials'
  },
  {
    title: 'List Workflows',
    command: 'archon workflows list',
    description: 'View all workflows in your organization'
  },
  {
    title: 'Deploy Workflow',
    command: 'archon workflows deploy ./workflow.json --name "My Workflow"',
    description: 'Deploy workflow from JSON file'
  },
  {
    title: 'Run Pipeline',
    command: 'archon pipelines run --workflow WORKFLOW_ID --pipeline PIPELINE_ID',
    description: 'Execute CI/CD pipeline'
  },
  {
    title: 'Watch Run',
    command: 'archon runs watch RUN_ID',
    description: 'Monitor run execution in real-time'
  },
  {
    title: 'Rollback',
    command: 'archon rollback --workflow WORKFLOW_ID --version 1.0.0 --reason "Bug fix"',
    description: 'Revert to previous version'
  },
  {
    title: 'View Logs',
    command: 'archon logs --workflow WORKFLOW_ID --since 1h --follow',
    description: 'Stream workflow execution logs'
  }
];

export default function CLIInstructions() {
  const copyCommand = (command) => {
    navigator.clipboard.writeText(command);
    toast.success('Command copied to clipboard');
  };

  return (
    <Card className="bg-slate-900 border-slate-800">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Terminal className="w-5 h-5" />
          CLI Usage
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="p-3 bg-blue-500/10 border border-blue-500/30 rounded-lg">
          <p className="text-sm text-slate-300">
            Use the Archon CLI to manage workflows, run pipelines, and monitor deployments from your terminal.
          </p>
        </div>

        <div className="space-y-3">
          {CLI_COMMANDS.map((cmd, idx) => (
            <div key={idx} className="space-y-2">
              <div className="flex items-center justify-between">
                <Badge variant="outline">{cmd.title}</Badge>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => copyCommand(cmd.command)}
                  className="text-slate-400 hover:text-white"
                >
                  <Copy className="w-4 h-4" />
                </Button>
              </div>
              <div className="bg-slate-950 rounded-lg p-3 font-mono text-sm text-green-400 border border-slate-800">
                {cmd.command}
              </div>
              <p className="text-xs text-slate-400">{cmd.description}</p>
            </div>
          ))}
        </div>

        <div className="pt-4 border-t border-slate-800">
          <h4 className="font-medium mb-2 text-sm">Get Your API Key</h4>
          <p className="text-sm text-slate-400 mb-3">
            Generate an API key in Settings → API Keys to authenticate the CLI.
          </p>
          <Button variant="outline" size="sm" className="border-slate-700">
            Go to Settings
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}