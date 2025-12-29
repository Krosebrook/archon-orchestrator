import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Bug,
  Play,
  FileJson,
  Code,
  Activity,
  Download,
  RefreshCw,
  Terminal,
  ChevronDown,
  ChevronUp,
} from 'lucide-react';
import { toast } from 'sonner';

/**
 * Connector Development Tools
 * Local testing and debugging interface
 */
export default function ConnectorDevTools({ connector }) {
  const [testRequest, setTestRequest] = useState({
    operation: '',
    params: '{}',
    credentials: '{}',
  });
  const [testResult, setTestResult] = useState(null);
  const [logs, setLogs] = useState([]);
  const [metrics, setMetrics] = useState(null);
  const [expandedLog, setExpandedLog] = useState(null);

  const runTest = async () => {
    setLogs([]);
    setTestResult(null);
    
    try {
      const params = JSON.parse(testRequest.params);
      const credentials = JSON.parse(testRequest.credentials);

      const startTime = performance.now();
      
      // Simulate connector execution with logging
      addLog('info', `Starting operation: ${testRequest.operation}`);
      
      // In real implementation, would call actual connector
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      const duration = performance.now() - startTime;
      
      addLog('info', `Completed in ${duration.toFixed(2)}ms`);
      
      setTestResult({
        success: true,
        data: { message: 'Test successful', duration },
      });
      
      setMetrics({
        duration,
        requestSize: new Blob([testRequest.params]).size,
        responseSize: 256,
      });
      
      toast.success('Test completed successfully');
    } catch (error) {
      addLog('error', error.message);
      setTestResult({
        success: false,
        error: error.message,
      });
      toast.error('Test failed');
    }
  };

  const addLog = (level, message, data = {}) => {
    setLogs(prev => [...prev, {
      id: Date.now() + Math.random(),
      timestamp: new Date().toISOString(),
      level,
      message,
      data,
    }]);
  };

  const exportLogs = () => {
    const content = JSON.stringify(logs, null, 2);
    const blob = new Blob([content], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `connector-logs-${Date.now()}.json`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success('Logs exported');
  };

  const levelColors = {
    info: 'text-blue-400',
    warn: 'text-yellow-400',
    error: 'text-red-400',
    success: 'text-green-400',
  };

  return (
    <div className="space-y-4">
      <Card className="bg-slate-900 border-slate-800">
        <CardHeader>
          <CardTitle className="text-white flex items-center gap-2">
            <Bug className="w-5 h-5 text-purple-400" />
            Connector Development Tools
          </CardTitle>
          <p className="text-sm text-slate-400">
            Test and debug your connector locally
          </p>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="test">
            <TabsList className="bg-slate-800">
              <TabsTrigger value="test">
                <Play className="w-4 h-4 mr-2" />
                Test
              </TabsTrigger>
              <TabsTrigger value="logs">
                <Terminal className="w-4 h-4 mr-2" />
                Logs ({logs.length})
              </TabsTrigger>
              <TabsTrigger value="metrics">
                <Activity className="w-4 h-4 mr-2" />
                Metrics
              </TabsTrigger>
              <TabsTrigger value="transform">
                <RefreshCw className="w-4 h-4 mr-2" />
                Transform
              </TabsTrigger>
            </TabsList>

            <TabsContent value="test" className="space-y-4">
              <div>
                <Label>Operation</Label>
                <Input
                  value={testRequest.operation}
                  onChange={(e) => setTestRequest({ ...testRequest, operation: e.target.value })}
                  placeholder="list_items"
                  className="bg-slate-800 border-slate-700"
                />
              </div>

              <div>
                <Label>Parameters (JSON)</Label>
                <Textarea
                  value={testRequest.params}
                  onChange={(e) => setTestRequest({ ...testRequest, params: e.target.value })}
                  placeholder='{"limit": 10}'
                  className="bg-slate-800 border-slate-700 font-mono text-xs"
                  rows={4}
                />
              </div>

              <div>
                <Label>Credentials (JSON)</Label>
                <Textarea
                  value={testRequest.credentials}
                  onChange={(e) => setTestRequest({ ...testRequest, credentials: e.target.value })}
                  placeholder='{"api_key": "test-key"}'
                  className="bg-slate-800 border-slate-700 font-mono text-xs"
                  rows={3}
                />
              </div>

              <Button onClick={runTest} className="w-full bg-blue-600">
                <Play className="w-4 h-4 mr-2" />
                Run Test
              </Button>

              {testResult && (
                <div className={`p-4 rounded-lg ${testResult.success ? 'bg-green-900/20 border border-green-700' : 'bg-red-900/20 border border-red-700'}`}>
                  <div className="flex items-center justify-between mb-2">
                    <span className="font-medium">
                      {testResult.success ? '✓ Success' : '✗ Failed'}
                    </span>
                  </div>
                  <pre className="text-xs text-slate-300 overflow-x-auto">
                    {JSON.stringify(testResult.success ? testResult.data : { error: testResult.error }, null, 2)}
                  </pre>
                </div>
              )}
            </TabsContent>

            <TabsContent value="logs" className="space-y-2">
              <div className="flex justify-between items-center mb-4">
                <span className="text-sm text-slate-400">
                  {logs.length} log entries
                </span>
                <div className="flex gap-2">
                  <Button size="sm" variant="outline" onClick={() => setLogs([])}>
                    Clear
                  </Button>
                  <Button size="sm" variant="outline" onClick={exportLogs}>
                    <Download className="w-3 h-3 mr-1" />
                    Export
                  </Button>
                </div>
              </div>

              <div className="space-y-1 max-h-96 overflow-y-auto">
                {logs.map((log) => (
                  <div key={log.id} className="bg-slate-800 rounded p-2">
                    <div 
                      className="flex items-center justify-between cursor-pointer"
                      onClick={() => setExpandedLog(expandedLog === log.id ? null : log.id)}
                    >
                      <div className="flex items-center gap-2">
                        <Badge className={`${levelColors[log.level]} bg-transparent border-current`}>
                          {log.level}
                        </Badge>
                        <span className="text-xs text-slate-300">{log.message}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-xs text-slate-500">
                          {new Date(log.timestamp).toLocaleTimeString()}
                        </span>
                        {Object.keys(log.data).length > 0 && (
                          expandedLog === log.id ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />
                        )}
                      </div>
                    </div>
                    {expandedLog === log.id && Object.keys(log.data).length > 0 && (
                      <pre className="mt-2 text-xs text-slate-400 overflow-x-auto">
                        {JSON.stringify(log.data, null, 2)}
                      </pre>
                    )}
                  </div>
                ))}
              </div>
            </TabsContent>

            <TabsContent value="metrics">
              {metrics ? (
                <div className="grid grid-cols-3 gap-4">
                  <Card className="bg-slate-800 border-slate-700">
                    <CardContent className="pt-6">
                      <div className="text-center">
                        <div className="text-2xl font-bold text-white">
                          {metrics.duration.toFixed(2)}ms
                        </div>
                        <div className="text-sm text-slate-400">Duration</div>
                      </div>
                    </CardContent>
                  </Card>
                  <Card className="bg-slate-800 border-slate-700">
                    <CardContent className="pt-6">
                      <div className="text-center">
                        <div className="text-2xl font-bold text-white">
                          {metrics.requestSize}B
                        </div>
                        <div className="text-sm text-slate-400">Request Size</div>
                      </div>
                    </CardContent>
                  </Card>
                  <Card className="bg-slate-800 border-slate-700">
                    <CardContent className="pt-6">
                      <div className="text-center">
                        <div className="text-2xl font-bold text-white">
                          {metrics.responseSize}B
                        </div>
                        <div className="text-sm text-slate-400">Response Size</div>
                      </div>
                    </CardContent>
                  </Card>
                </div>
              ) : (
                <div className="text-center py-12 text-slate-400">
                  Run a test to see metrics
                </div>
              )}
            </TabsContent>

            <TabsContent value="transform">
              <TransformTool />
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
}

function TransformTool() {
  const [input, setInput] = useState('');
  const [output, setOutput] = useState('');
  const [transformType, setTransformType] = useState('xml-to-json');

  const transform = () => {
    try {
      // Simulate transformation (would use DataTransformer in real implementation)
      if (transformType === 'xml-to-json') {
        setOutput(JSON.stringify({ transformed: 'xml-to-json' }, null, 2));
      } else if (transformType === 'json-to-xml') {
        setOutput('<?xml version="1.0"?><root>...</root>');
      } else if (transformType === 'csv-to-json') {
        setOutput(JSON.stringify([{ col1: 'val1', col2: 'val2' }], null, 2));
      }
      toast.success('Transformation complete');
    } catch (error) {
      toast.error('Transformation failed');
      setOutput(`Error: ${error.message}`);
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex gap-2">
        {['xml-to-json', 'json-to-xml', 'csv-to-json', 'flatten'].map((type) => (
          <Button
            key={type}
            size="sm"
            variant={transformType === type ? 'default' : 'outline'}
            onClick={() => setTransformType(type)}
          >
            {type}
          </Button>
        ))}
      </div>

      <div>
        <Label>Input</Label>
        <Textarea
          value={input}
          onChange={(e) => setInput(e.target.value)}
          className="bg-slate-800 border-slate-700 font-mono text-xs"
          rows={6}
        />
      </div>

      <Button onClick={transform} className="w-full bg-purple-600">
        <RefreshCw className="w-4 h-4 mr-2" />
        Transform
      </Button>

      <div>
        <Label>Output</Label>
        <Textarea
          value={output}
          readOnly
          className="bg-slate-950 border-slate-700 font-mono text-xs"
          rows={6}
        />
      </div>
    </div>
  );
}