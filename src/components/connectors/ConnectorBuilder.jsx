import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Code, Save, Zap } from 'lucide-react';
import { toast } from 'sonner';
import ConnectorDevTools from './ConnectorDevTools';

/**
 * Interactive Connector Builder
 * UI for building custom connectors with SDK
 */
export default function ConnectorBuilder() {
  const [connector, setConnector] = useState({
    name: '',
    description: '',
    provider: 'custom',
    category: 'custom',
    auth_type: 'api_key',
    operations: [],
  });

  const [currentOperation, setCurrentOperation] = useState({
    id: '',
    name: '',
    method: 'GET',
    endpoint: '',
    description: '',
  });

  const [_testResult, _setTestResult] = useState(null);
  const [generatedCode, setGeneratedCode] = useState('');

  const addOperation = () => {
    if (!currentOperation.id || !currentOperation.name) {
      toast.error('Operation ID and name are required');
      return;
    }

    setConnector({
      ...connector,
      operations: [...connector.operations, currentOperation],
    });

    setCurrentOperation({
      id: '',
      name: '',
      method: 'GET',
      endpoint: '',
      description: '',
    });

    toast.success('Operation added');
  };

  const generateConnectorCode = () => {
    const code = `import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';
import { APIClient, RetryHandler } from '@/components/connectors/ConnectorSDK';

/**
 * ${connector.name} Connector
 * ${connector.description}
 */
Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    
    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { operation, installation_id, params } = await req.json();
    
    const installations = await base44.asServiceRole.entities.ConnectorInstallation.filter({
      id: installation_id,
      org_id: user.organization.id,
      status: 'active',
    });

    if (!installations.length) {
      return Response.json({ error: 'Installation not found' }, { status: 404 });
    }

    const installation = installations[0];
    const credentials = JSON.parse(atob(installation.credentials_encrypted));

    // Initialize API client
    const client = new APIClient({
      baseURL: 'https://api.${connector.provider}.com',
      credentials: credentials,
    });

    let result;
    switch (operation) {
${connector.operations.map(op => `      case '${op.id}':
        result = await ${op.id}(client, params);
        break;`).join('\n')}
      default:
        return Response.json({ error: \`Unknown operation: \${operation}\` }, { status: 400 });
    }

    await base44.asServiceRole.entities.ConnectorInstallation.update(installation_id, {
      last_used: new Date().toISOString(),
      usage_count: (installation.usage_count || 0) + 1,
    });

    return Response.json({ success: true, data: result });

  } catch (error) {
    console.error('${connector.name} connector error:', error);
    return Response.json({ 
      error: error.message,
      trace_id: \`ERROR_\${Date.now()}\`,
    }, { status: 500 });
  }
});

${connector.operations.map(op => `
async function ${op.id}(client, params = {}) {
  return await RetryHandler.retry(async () => {
    return await client.${op.method.toLowerCase()}('${op.endpoint}', params);
  });
}`).join('\n')}
`;

    setGeneratedCode(code);
    toast.success('Code generated');
  };

  const _testConnector = async () => {
    _setTestResult({ status: 'testing' });
    
    // Simulate test
    setTimeout(() => {
      _setTestResult({
        status: 'success',
        tests: [
          { name: 'Connection Test', passed: true, duration: 123 },
          { name: 'Authentication', passed: true, duration: 456 },
          ...connector.operations.map(op => ({
            name: `Operation: ${op.name}`,
            passed: Math.random() > 0.2,
            duration: Math.floor(Math.random() * 1000),
          })),
        ],
      });
    }, 2000);
  };

  return (
    <div className="space-y-6">
      <Card className="bg-slate-900 border-slate-800">
        <CardHeader>
          <CardTitle className="text-white flex items-center gap-2">
            <Zap className="w-5 h-5 text-purple-400" />
            Custom Connector Builder
          </CardTitle>
          <p className="text-sm text-slate-400">
            Build your own connector using the Archon SDK
          </p>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="basic">
            <TabsList className="bg-slate-800">
              <TabsTrigger value="basic">Basic Info</TabsTrigger>
              <TabsTrigger value="operations">Operations</TabsTrigger>
              <TabsTrigger value="code">Generated Code</TabsTrigger>
              <TabsTrigger value="test">Test</TabsTrigger>
            </TabsList>

            <TabsContent value="basic" className="space-y-4">
              <div>
                <Label>Connector Name</Label>
                <Input
                  value={connector.name}
                  onChange={(e) => setConnector({ ...connector, name: e.target.value })}
                  placeholder="My Custom Connector"
                  className="bg-slate-800 border-slate-700"
                />
              </div>

              <div>
                <Label>Description</Label>
                <Textarea
                  value={connector.description}
                  onChange={(e) => setConnector({ ...connector, description: e.target.value })}
                  placeholder="Describe what your connector does"
                  className="bg-slate-800 border-slate-700"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Category</Label>
                  <Select
                    value={connector.category}
                    onValueChange={(value) => setConnector({ ...connector, category: value })}
                  >
                    <SelectTrigger className="bg-slate-800 border-slate-700">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="bg-slate-800 border-slate-700">
                      <SelectItem value="custom">Custom</SelectItem>
                      <SelectItem value="crm">CRM</SelectItem>
                      <SelectItem value="communication">Communication</SelectItem>
                      <SelectItem value="project_management">Project Management</SelectItem>
                      <SelectItem value="analytics">Analytics</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label>Authentication Type</Label>
                  <Select
                    value={connector.auth_type}
                    onValueChange={(value) => setConnector({ ...connector, auth_type: value })}
                  >
                    <SelectTrigger className="bg-slate-800 border-slate-700">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="bg-slate-800 border-slate-700">
                      <SelectItem value="api_key">API Key</SelectItem>
                      <SelectItem value="oauth2">OAuth 2.0</SelectItem>
                      <SelectItem value="basic">Basic Auth</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </TabsContent>

            <TabsContent value="operations" className="space-y-4">
              <Card className="bg-slate-800 border-slate-700">
                <CardHeader>
                  <CardTitle className="text-sm">Add Operation</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="grid grid-cols-2 gap-3">
                    <Input
                      placeholder="Operation ID (e.g., list_users)"
                      value={currentOperation.id}
                      onChange={(e) => setCurrentOperation({ ...currentOperation, id: e.target.value })}
                      className="bg-slate-900 border-slate-600"
                    />
                    <Input
                      placeholder="Display Name"
                      value={currentOperation.name}
                      onChange={(e) => setCurrentOperation({ ...currentOperation, name: e.target.value })}
                      className="bg-slate-900 border-slate-600"
                    />
                  </div>

                  <div className="grid grid-cols-3 gap-3">
                    <Select
                      value={currentOperation.method}
                      onValueChange={(value) => setCurrentOperation({ ...currentOperation, method: value })}
                    >
                      <SelectTrigger className="bg-slate-900 border-slate-600">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent className="bg-slate-900">
                        <SelectItem value="GET">GET</SelectItem>
                        <SelectItem value="POST">POST</SelectItem>
                        <SelectItem value="PUT">PUT</SelectItem>
                        <SelectItem value="DELETE">DELETE</SelectItem>
                      </SelectContent>
                    </Select>

                    <Input
                      placeholder="Endpoint (e.g., /users)"
                      value={currentOperation.endpoint}
                      onChange={(e) => setCurrentOperation({ ...currentOperation, endpoint: e.target.value })}
                      className="bg-slate-900 border-slate-600 col-span-2"
                    />
                  </div>

                  <Button onClick={addOperation} className="w-full bg-blue-600">
                    Add Operation
                  </Button>
                </CardContent>
              </Card>

              <div className="space-y-2">
                {connector.operations.map((op, idx) => (
                  <div key={idx} className="p-3 bg-slate-800 rounded flex items-center justify-between">
                    <div>
                      <span className="text-white font-medium">{op.name}</span>
                      <Badge className="ml-2">{op.method}</Badge>
                      <span className="text-sm text-slate-400 ml-2">{op.endpoint}</span>
                    </div>
                  </div>
                ))}
              </div>
            </TabsContent>

            <TabsContent value="code">
              {!generatedCode ? (
                <div className="text-center py-12">
                  <Code className="w-16 h-16 mx-auto mb-4 text-slate-600" />
                  <p className="text-slate-400 mb-4">Generate connector code</p>
                  <Button onClick={generateConnectorCode} className="bg-purple-600">
                    <Zap className="w-4 h-4 mr-2" />
                    Generate Code
                  </Button>
                </div>
              ) : (
                <div>
                  <pre className="bg-slate-950 p-4 rounded text-xs text-slate-300 overflow-x-auto max-h-96">
                    {generatedCode}
                  </pre>
                  <div className="flex gap-2 mt-4">
                    <Button className="bg-green-600">
                      <Save className="w-4 h-4 mr-2" />
                      Save Connector
                    </Button>
                    <Button variant="outline">
                      Copy Code
                    </Button>
                  </div>
                </div>
              )}
            </TabsContent>

            <TabsContent value="test">
              <ConnectorDevTools connector={connector} />
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
}