import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Shield, PlayCircle, CheckCircle2, XCircle } from 'lucide-react';
import { toast } from 'sonner';
import { runRLSTests } from '../components/security/RLSTestSuite';

export default function SecurityTests() {
  const [testResults, setTestResults] = useState(null);
  const [isRunning, setIsRunning] = useState(false);

  const handleRunTests = async () => {
    setIsRunning(true);
    setTestResults(null);
    toast.info('Running RLS test suite...');

    try {
      const report = await runRLSTests();
      setTestResults(report);
      
      if (report.summary.failed === 0) {
        toast.success('All tests passed!');
      } else {
        toast.error(`${report.summary.failed} tests failed`);
      }
    } catch (error) {
      toast.error('Test suite failed: ' + error.message);
    } finally {
      setIsRunning(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div>
        <h1 className="text-3xl font-bold mb-2">Security Testing</h1>
        <p className="text-slate-400">Run penetration tests for multi-tenant isolation</p>
      </div>

      <Card className="bg-slate-900 border-slate-800">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="w-5 h-5" />
            RLS Policy Validation
          </CardTitle>
          <CardDescription>
            Tests Row-Level Security policies to ensure proper org isolation
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Button
            onClick={handleRunTests}
            disabled={isRunning}
            className="bg-green-600 hover:bg-green-700"
            size="lg"
          >
            <PlayCircle className="w-4 h-4 mr-2" />
            {isRunning ? 'Running Tests...' : 'Run Security Tests'}
          </Button>
        </CardContent>
      </Card>

      {testResults && (
        <>
          <Card className="bg-slate-900 border-slate-800">
            <CardHeader>
              <CardTitle>Test Summary</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-4 gap-4">
                <div className="text-center">
                  <div className="text-3xl font-bold">{testResults.summary.total}</div>
                  <div className="text-sm text-slate-400">Total Tests</div>
                </div>
                <div className="text-center">
                  <div className="text-3xl font-bold text-green-500">{testResults.summary.passed}</div>
                  <div className="text-sm text-slate-400">Passed</div>
                </div>
                <div className="text-center">
                  <div className="text-3xl font-bold text-red-500">{testResults.summary.failed}</div>
                  <div className="text-sm text-slate-400">Failed</div>
                </div>
                <div className="text-center">
                  <div className="text-3xl font-bold">{testResults.summary.successRate}</div>
                  <div className="text-sm text-slate-400">Success Rate</div>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-slate-900 border-slate-800">
            <CardHeader>
              <CardTitle>Test Results</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {testResults.tests.map((test, idx) => (
                <div
                  key={idx}
                  className="flex items-start gap-3 p-4 bg-slate-800 rounded-lg border border-slate-700"
                >
                  {test.passed ? (
                    <CheckCircle2 className="w-5 h-5 text-green-500 flex-shrink-0 mt-0.5" />
                  ) : (
                    <XCircle className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
                  )}
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <h4 className="font-medium">{test.name}</h4>
                      <Badge variant={test.passed ? 'default' : 'destructive'}>
                        {test.passed ? 'PASS' : 'FAIL'}
                      </Badge>
                    </div>
                    <p className="text-sm text-slate-400">{test.details}</p>
                    <p className="text-xs text-slate-500 mt-1">
                      {new Date(test.timestamp).toLocaleString()}
                    </p>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>
        </>
      )}

      <Card className="bg-slate-900 border-slate-800">
        <CardContent className="pt-6">
          <div className="flex gap-3">
            <div className="text-blue-500">
              <Shield className="w-5 h-5" />
            </div>
            <div>
              <h4 className="font-medium mb-1">About RLS Testing</h4>
              <p className="text-sm text-slate-400">
                Row-Level Security (RLS) policies enforce multi-tenant isolation at the database
                level. These tests verify that users can only access data within their organization
                and that cross-org queries are properly blocked. Run these tests regularly to
                ensure security policies remain effective.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}