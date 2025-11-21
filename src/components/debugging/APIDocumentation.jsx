import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Code, FileCode, Terminal } from 'lucide-react';

export default function APIDocumentation() {
  const endpoints = [
    {
      name: 'Analyze Agent Logs',
      method: 'POST',
      path: '/api/analyzeAgentLogs',
      description: 'Analyze a failed run to identify root cause and get fix recommendations',
      request: {
        run_id: 'string (required) - ID of the failed run to analyze'
      },
      response: {
        success: 'boolean',
        data: {
          root_cause: 'string',
          category: 'enum: config | network | timeout | logic | resource | external',
          severity: 'enum: low | medium | high | critical',
          evidence: 'string[]',
          fix_steps: 'string[]',
          prevention: 'string[]'
        }
      },
      example: `// Node.js / JavaScript
const response = await fetch('/api/analyzeAgentLogs', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ run_id: 'run_123' })
});
const result = await response.json();

// Python
import requests
response = requests.post('/api/analyzeAgentLogs', 
  json={'run_id': 'run_123'})
result = response.json()`
    },
    {
      name: 'Generate Refactoring Suggestions',
      method: 'POST',
      path: '/api/generateRefactoringSuggestions',
      description: 'Get AI-powered optimization suggestions for an agent',
      request: {
        agent_id: 'string (required) - ID of the agent to analyze',
        metric_limit: 'number (optional, default: 100, max: 200) - Number of metrics to analyze'
      },
      response: {
        success: 'boolean',
        data: {
          suggestions: [{
            category: 'enum: performance | reliability | cost | config',
            priority: 'enum: high | medium | low',
            title: 'string',
            description: 'string',
            expected_impact: 'string',
            implementation: 'string'
          }],
          overall_assessment: 'string'
        }
      },
      example: `// Node.js / JavaScript
const response = await fetch('/api/generateRefactoringSuggestions', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ 
    agent_id: 'agent_456',
    metric_limit: 150 
  })
});
const result = await response.json();

// cURL
curl -X POST /api/generateRefactoringSuggestions \\
  -H "Content-Type: application/json" \\
  -d '{"agent_id": "agent_456", "metric_limit": 150}'`
    },
    {
      name: 'Start Debug Session',
      method: 'POST',
      path: '/api/startDebugSession',
      description: 'Get step-by-step debugging guidance for a described issue',
      request: {
        issue_description: 'string (required, min: 10 chars) - Detailed description of the issue'
      },
      response: {
        success: 'boolean',
        data: {
          diagnosis: 'string',
          steps: [{
            step_number: 'number',
            title: 'string',
            action: 'string',
            what_to_look_for: 'string',
            expected_outcome: 'string',
            if_unexpected: 'string'
          }],
          diagnostic_questions: 'string[]',
          common_pitfalls: 'string[]'
        },
        session_id: 'string'
      },
      example: `// Node.js / JavaScript
const response = await fetch('/api/startDebugSession', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ 
    issue_description: 'Agent keeps timing out when processing PDFs larger than 5MB'
  })
});
const result = await response.json();

// Python with session tracking
session = requests.Session()
response = session.post('/api/startDebugSession',
  json={'issue_description': 'Agent timeout issue...'})
session_id = response.json()['session_id']`
    }
  ];

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-white mb-2">API Documentation</h2>
        <p className="text-slate-400">Integrate AI debugging capabilities into your workflows</p>
      </div>

      <Card className="bg-slate-900 border-slate-800">
        <CardHeader>
          <CardTitle className="text-white">Authentication</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <p className="text-sm text-slate-300">
            All API endpoints require authentication via session cookies. Ensure your requests include valid session credentials.
          </p>
          <div className="p-3 bg-slate-950 rounded border border-slate-800 font-mono text-xs text-slate-300">
            # Include credentials in fetch<br/>
            fetch(url, {'{'}credentials: 'include'{'}'})
          </div>
        </CardContent>
      </Card>

      <Tabs defaultValue="logs" className="w-full">
        <TabsList className="grid w-full grid-cols-3 bg-slate-800">
          <TabsTrigger value="logs">Log Analysis</TabsTrigger>
          <TabsTrigger value="refactor">Refactoring</TabsTrigger>
          <TabsTrigger value="debug">Debug Wizard</TabsTrigger>
        </TabsList>

        {endpoints.map((endpoint, idx) => (
          <TabsContent key={idx} value={['logs', 'refactor', 'debug'][idx]} className="mt-6">
            <Card className="bg-slate-900 border-slate-800">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="text-white">{endpoint.name}</CardTitle>
                  <Badge className="bg-blue-600">{endpoint.method}</Badge>
                </div>
                <p className="text-sm text-slate-400 mt-2">{endpoint.description}</p>
                <div className="mt-3 p-2 bg-slate-950 rounded border border-slate-800">
                  <code className="text-xs text-blue-400">{endpoint.path}</code>
                </div>
              </CardHeader>
              <CardContent className="space-y-6">
                <div>
                  <h4 className="text-sm font-semibold text-white mb-3 flex items-center gap-2">
                    <FileCode className="w-4 h-4" />
                    Request Body
                  </h4>
                  <div className="p-4 bg-slate-950 rounded border border-slate-800">
                    <pre className="text-xs text-slate-300 whitespace-pre-wrap">
                      {JSON.stringify(endpoint.request, null, 2)}
                    </pre>
                  </div>
                </div>

                <div>
                  <h4 className="text-sm font-semibold text-white mb-3 flex items-center gap-2">
                    <Code className="w-4 h-4" />
                    Response
                  </h4>
                  <div className="p-4 bg-slate-950 rounded border border-slate-800">
                    <pre className="text-xs text-slate-300 whitespace-pre-wrap">
                      {JSON.stringify(endpoint.response, null, 2)}
                    </pre>
                  </div>
                </div>

                <div>
                  <h4 className="text-sm font-semibold text-white mb-3 flex items-center gap-2">
                    <Terminal className="w-4 h-4" />
                    Example Usage
                  </h4>
                  <div className="p-4 bg-slate-950 rounded border border-slate-800">
                    <pre className="text-xs text-slate-300 whitespace-pre-wrap">
                      {endpoint.example}
                    </pre>
                  </div>
                </div>

                <div className="pt-4 border-t border-slate-800">
                  <h4 className="text-sm font-semibold text-white mb-3">Error Codes</h4>
                  <div className="space-y-2">
                    {[
                      { code: 'UNAUTHORIZED', status: 401, message: 'Missing or invalid authentication' },
                      { code: 'VALIDATION_ERROR', status: 422, message: 'Invalid request parameters' },
                      { code: 'NOT_FOUND', status: 404, message: 'Resource not found' },
                      { code: 'SERVER_ERROR', status: 500, message: 'Internal server error', retryable: true }
                    ].map((err, i) => (
                      <div key={i} className="flex items-center justify-between p-2 bg-slate-950 rounded text-xs">
                        <div className="flex items-center gap-3">
                          <Badge variant="outline" className="font-mono">{err.status}</Badge>
                          <code className="text-red-400">{err.code}</code>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="text-slate-400">{err.message}</span>
                          {err.retryable && (
                            <Badge className="bg-orange-500/20 text-orange-400">Retryable</Badge>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        ))}
      </Tabs>

      <Card className="bg-slate-900 border-slate-800">
        <CardHeader>
          <CardTitle className="text-white">Rate Limits</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <p className="text-sm text-slate-300">
            API endpoints are rate limited to ensure fair usage:
          </p>
          <ul className="space-y-2 text-sm text-slate-400">
            <li className="flex items-center gap-2">
              <span className="text-blue-400">•</span>
              100 requests per hour per user
            </li>
            <li className="flex items-center gap-2">
              <span className="text-blue-400">•</span>
              500 requests per hour per organization
            </li>
            <li className="flex items-center gap-2">
              <span className="text-blue-400">•</span>
              Rate limit headers included in responses: X-RateLimit-Limit, X-RateLimit-Remaining
            </li>
          </ul>
        </CardContent>
      </Card>
    </div>
  );
}