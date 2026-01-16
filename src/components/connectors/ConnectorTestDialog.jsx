import { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { base44 } from '@/api/base44Client';
import { Play, Loader2, CheckCircle2, XCircle, Copy } from 'lucide-react';
import { toast } from 'sonner';

export default function ConnectorTestDialog({ connector, open, onClose }) {
  const [selectedOperation, setSelectedOperation] = useState(connector.operations?.[0] || null);
  const [inputData, setInputData] = useState('{}');
  const [credentials, setCredentials] = useState('');
  const [isTesting, setIsTesting] = useState(false);
  const [testResult, setTestResult] = useState(null);

  const handleTest = async () => {
    if (!selectedOperation) {
      toast.error('Please select an operation');
      return;
    }

    try {
      setIsTesting(true);
      setTestResult(null);

      const parsedInput = JSON.parse(inputData);
      const parsedCreds = credentials ? JSON.parse(credentials) : {};

      const result = await base44.functions.invoke('invokeConnector', {
        connector_id: connector.id,
        operation_id: selectedOperation.id,
        input: parsedInput,
        credentials: parsedCreds,
      });

      setTestResult({
        success: result.data?.success || false,
        data: result.data?.data || result.data,
        error: result.data?.error,
        latency: result.data?.latency_ms,
      });

      if (result.data?.success) {
        toast.success('Operation executed successfully');
      } else {
        toast.error('Operation failed: ' + (result.data?.error || 'Unknown error'));
      }
    } catch (error) {
      setTestResult({
        success: false,
        error: error.message,
      });
      toast.error('Test failed: ' + error.message);
    } finally {
      setIsTesting(false);
    }
  };

  const copyToClipboard = (text) => {
    navigator.clipboard.writeText(text);
    toast.success('Copied to clipboard');
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto bg-slate-900 border-slate-800">
        <DialogHeader>
          <DialogTitle className="text-white">Test Connector Operations</DialogTitle>
          <DialogDescription>
            Test your connector operations with sample data to verify functionality
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* Operation Selection */}
          <div>
            <Label>Select Operation</Label>
            <Select
              value={selectedOperation?.id}
              onValueChange={(value) => {
                const op = connector.operations.find((o) => o.id === value);
                setSelectedOperation(op);
                setInputData(JSON.stringify(op?.input_schema || {}, null, 2));
                setTestResult(null);
              }}
            >
              <SelectTrigger className="bg-slate-800 border-slate-700">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {connector.operations?.map((op) => (
                  <SelectItem key={op.id} value={op.id}>
                    {op.name} ({op.method})
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {selectedOperation && (
            <>
              {/* Operation Details */}
              <Card className="bg-slate-800 border-slate-700">
                <CardContent className="pt-4">
                  <div className="space-y-2 text-sm">
                    <div>
                      <span className="text-slate-400">Method:</span>
                      <Badge className="ml-2">{selectedOperation.method}</Badge>
                    </div>
                    <div>
                      <span className="text-slate-400">Endpoint:</span>
                      <code className="ml-2 text-white font-mono">{selectedOperation.endpoint}</code>
                    </div>
                    {selectedOperation.description && (
                      <div>
                        <span className="text-slate-400">Description:</span>
                        <p className="text-white mt-1">{selectedOperation.description}</p>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>

              {/* Credentials */}
              <div>
                <Label>Authentication Credentials (JSON)</Label>
                <Textarea
                  value={credentials}
                  onChange={(e) => setCredentials(e.target.value)}
                  placeholder='{"api_key": "your-api-key"}'
                  rows={3}
                  className="font-mono text-sm bg-slate-800 border-slate-700"
                />
              </div>

              {/* Input Data */}
              <div>
                <Label>Input Data (JSON)</Label>
                <Textarea
                  value={inputData}
                  onChange={(e) => setInputData(e.target.value)}
                  rows={8}
                  className="font-mono text-sm bg-slate-800 border-slate-700"
                />
              </div>

              {/* Test Button */}
              <Button
                onClick={handleTest}
                disabled={isTesting}
                className="w-full bg-blue-600 hover:bg-blue-700"
              >
                {isTesting ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Testing...
                  </>
                ) : (
                  <>
                    <Play className="w-4 h-4 mr-2" />
                    Run Test
                  </>
                )}
              </Button>

              {/* Test Results */}
              {testResult && (
                <Card
                  className={`${
                    testResult.success
                      ? 'bg-green-900/20 border-green-800'
                      : 'bg-red-900/20 border-red-800'
                  }`}
                >
                  <CardContent className="pt-4">
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-2">
                        {testResult.success ? (
                          <CheckCircle2 className="w-5 h-5 text-green-400" />
                        ) : (
                          <XCircle className="w-5 h-5 text-red-400" />
                        )}
                        <span className="font-semibold text-white">
                          {testResult.success ? 'Test Passed' : 'Test Failed'}
                        </span>
                      </div>
                      {testResult.latency && (
                        <Badge variant="outline">{testResult.latency}ms</Badge>
                      )}
                    </div>

                    {testResult.error && (
                      <div className="mb-3">
                        <p className="text-sm text-red-300 font-medium mb-1">Error:</p>
                        <pre className="text-xs text-red-200 bg-red-950/50 p-2 rounded overflow-x-auto">
                          {testResult.error}
                        </pre>
                      </div>
                    )}

                    {testResult.data && (
                      <div>
                        <div className="flex items-center justify-between mb-1">
                          <p className="text-sm text-slate-300 font-medium">Response:</p>
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => copyToClipboard(JSON.stringify(testResult.data, null, 2))}
                            className="h-7"
                          >
                            <Copy className="w-3 h-3 mr-1" />
                            Copy
                          </Button>
                        </div>
                        <pre className="text-xs text-slate-200 bg-slate-950/50 p-3 rounded overflow-x-auto max-h-64">
                          {JSON.stringify(testResult.data, null, 2)}
                        </pre>
                      </div>
                    )}
                  </CardContent>
                </Card>
              )}
            </>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}