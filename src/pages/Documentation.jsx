import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ScrollArea } from '@/components/ui/scroll-area';
import ReactMarkdown from 'react-markdown';
import { 
  BookOpen, 
  Code, 
  Shield, 
  Zap, 
  Database,
  GitBranch,
  AlertCircle,
  CheckCircle2
} from 'lucide-react';
import { ARCHITECTURE_DOC } from '../components/shared/docs/ARCHITECTURE.md';

const QuickRefCard = ({ title, icon: Icon, items, color = 'blue' }) => (
  <Card className="bg-slate-800/50 border-slate-700">
    <CardHeader className="pb-3">
      <CardTitle className="text-lg flex items-center gap-2">
        <Icon className={`w-5 h-5 text-${color}-400`} />
        {title}
      </CardTitle>
    </CardHeader>
    <CardContent>
      <div className="space-y-2">
        {items.map((item, idx) => (
          <div key={idx} className="flex items-start gap-2 text-sm">
            <CheckCircle2 className="w-4 h-4 text-green-400 mt-0.5 flex-shrink-0" />
            <span className="text-slate-300">{item}</span>
          </div>
        ))}
      </div>
    </CardContent>
  </Card>
);

const ApiRefCard = ({ module, functions }) => (
  <Card className="bg-slate-800/50 border-slate-700">
    <CardHeader className="pb-3">
      <CardTitle className="text-base font-mono text-blue-400">
        @/components/utils/{module}
      </CardTitle>
    </CardHeader>
    <CardContent>
      <div className="space-y-3">
        {functions.map((fn, idx) => (
          <div key={idx} className="border-l-2 border-slate-600 pl-3">
            <code className="text-sm text-green-400">{fn.name}</code>
            <p className="text-xs text-slate-400 mt-1">{fn.desc}</p>
          </div>
        ))}
      </div>
    </CardContent>
  </Card>
);

export default function Documentation() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-white mb-2">Documentation</h1>
        <p className="text-slate-400">Platform architecture, API reference, and best practices</p>
      </div>

      <Tabs defaultValue="overview" className="space-y-4">
        <TabsList className="bg-slate-800">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="api">API Reference</TabsTrigger>
          <TabsTrigger value="architecture">Architecture</TabsTrigger>
          <TabsTrigger value="security">Security</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <QuickRefCard
              title="Error Handling"
              icon={AlertCircle}
              color="red"
              items={[
                'Circuit breaker pattern (5 failures → open)',
                'Exponential backoff with jitter',
                'Request deduplication (5s TTL)',
                'Correlation ID propagation',
                'Structured error taxonomy'
              ]}
            />
            <QuickRefCard
              title="Validation"
              icon={Shield}
              color="green"
              items={[
                'XSS prevention (HTML escaping)',
                'Prompt injection detection (20+ patterns)',
                'Zod-like schema validation',
                'Sliding window rate limiting',
                'PII redaction in audits'
              ]}
            />
            <QuickRefCard
              title="Performance"
              icon={Zap}
              color="yellow"
              items={[
                'Budget: 300ms API, 1.5s AI calls',
                'LRU cache with TTL',
                'Request batching',
                'Web Vitals monitoring',
                'Metrics collection (p50, p95, p99)'
              ]}
            />
            <QuickRefCard
              title="RBAC"
              icon={Shield}
              color="purple"
              items={[
                'Owner → Admin → Operator → Viewer',
                'Permission guards on all routes',
                'useRBAC hook for UI checks',
                'Audit logging for all mutations',
                'Org-scoped data (RLS)'
              ]}
            />
            <QuickRefCard
              title="AI Reasoning"
              icon={Code}
              color="cyan"
              items={[
                'Chain-of-Thought prompting',
                'Dual-path analysis with arbiter',
                'Prompt compression',
                'Cost estimation',
                'Output validation'
              ]}
            />
            <QuickRefCard
              title="Audit Trail"
              icon={Database}
              color="orange"
              items={[
                'SHA-256 integrity hashing',
                'Automatic PII redaction',
                'Batch processing (10 entries)',
                'Session/correlation tracking',
                'CSV/JSON export'
              ]}
            />
          </div>
        </TabsContent>

        <TabsContent value="api" className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <ApiRefCard
              module="api-client"
              functions={[
                { name: 'apiRequest(fn, options)', desc: 'Full-featured request with retry, circuit breaker, deduplication' },
                { name: 'withRetry(fn, config)', desc: 'Retry with exponential backoff and jitter' },
                { name: 'getCircuitBreaker(name)', desc: 'Get/create circuit breaker instance' },
                { name: 'handleError(error, options)', desc: 'Normalize and display error' },
                { name: 'deduplicateRequest(key, fn)', desc: 'Deduplicate concurrent requests' }
              ]}
            />
            <ApiRefCard
              module="validation"
              functions={[
                { name: 'sanitizeInput(input, options)', desc: 'XSS-safe input sanitization' },
                { name: 'detectPromptInjection(input)', desc: 'Check for prompt injection attacks' },
                { name: 'Schema.string/number/object()', desc: 'Zod-like schema builders' },
                { name: 'validate(schema, value)', desc: 'Validate data against schema' },
                { name: 'checkRateLimit(key, limit)', desc: 'Sliding window rate limiter' }
              ]}
            />
            <ApiRefCard
              module="audit-logger"
              functions={[
                { name: 'auditCreate(entity, id, data)', desc: 'Log entity creation' },
                { name: 'auditUpdate(entity, id, before, after)', desc: 'Log entity update with diff' },
                { name: 'auditDelete(entity, id, data)', desc: 'Log entity deletion' },
                { name: 'auditCritical(action, entity, id)', desc: 'Immediate critical event log' },
                { name: 'redactSensitiveData(data)', desc: 'Remove PII from data' }
              ]}
            />
            <ApiRefCard
              module="performance"
              functions={[
                { name: 'measurePerformance(name, fn, opts)', desc: 'Measure against budget' },
                { name: 'memoize(fn, options)', desc: 'LRU memoization with TTL' },
                { name: 'debounce(fn, delay, options)', desc: 'Advanced debounce' },
                { name: 'observeWebVitals(callback)', desc: 'LCP, FID, CLS monitoring' },
                { name: 'createBatcher(batchFn)', desc: 'Request batching' }
              ]}
            />
            <ApiRefCard
              module="cot-reasoning"
              functions={[
                { name: 'executeCoTReasoning(task, opts)', desc: 'Run chain-of-thought analysis' },
                { name: 'executeDualPathReasoning(task)', desc: 'Conservative + optimistic paths' },
                { name: 'compressPrompt(prompt)', desc: 'Reduce prompt tokens' },
                { name: 'validateCoTOutput(output)', desc: 'Validate reasoning output' },
                { name: 'estimateCoTCost(taskLen, ctxLen)', desc: 'Estimate LLM cost' }
              ]}
            />
            <ApiRefCard
              module="../hooks/useRBAC"
              functions={[
                { name: 'useRBAC()', desc: 'Hook returning role, hasPermission, guard' },
                { name: 'hasPermission(perm)', desc: 'Check if user has permission' },
                { name: 'guard(perm, action)', desc: 'Throw if no permission' },
                { name: 'isAdmin', desc: 'Boolean: owner or admin role' },
                { name: 'canMutate', desc: 'Boolean: not viewer role' }
              ]}
            />
          </div>
        </TabsContent>

        <TabsContent value="architecture">
          <Card className="bg-slate-800/50 border-slate-700">
            <CardContent className="p-6">
              <ScrollArea className="h-[600px]">
                <div className="prose prose-invert prose-sm max-w-none">
                  <ReactMarkdown>{ARCHITECTURE_DOC}</ReactMarkdown>
                </div>
              </ScrollArea>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="security" className="space-y-4">
          <Card className="bg-slate-800/50 border-slate-700">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Shield className="w-5 h-5 text-green-400" />
                Security Checklist
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <h4 className="text-sm font-semibold text-white mb-3">Input Protection</h4>
                  <div className="space-y-2">
                    {[
                      'XSS sanitization on all user inputs',
                      'Prompt injection detection (20+ patterns)',
                      'Schema validation at boundaries',
                      'Rate limiting per user/operation',
                      'Null byte removal'
                    ].map((item, idx) => (
                      <div key={idx} className="flex items-center gap-2 text-sm">
                        <Badge className="bg-green-500/20 text-green-400">✓</Badge>
                        <span className="text-slate-300">{item}</span>
                      </div>
                    ))}
                  </div>
                </div>
                <div>
                  <h4 className="text-sm font-semibold text-white mb-3">Data Protection</h4>
                  <div className="space-y-2">
                    {[
                      'RLS on all entities (org_id scoped)',
                      'PII redaction in audit logs',
                      'SHA-256 audit integrity hashing',
                      'No secrets in client code',
                      'HTTPS enforced'
                    ].map((item, idx) => (
                      <div key={idx} className="flex items-center gap-2 text-sm">
                        <Badge className="bg-green-500/20 text-green-400">✓</Badge>
                        <span className="text-slate-300">{item}</span>
                      </div>
                    ))}
                  </div>
                </div>
                <div>
                  <h4 className="text-sm font-semibold text-white mb-3">Access Control</h4>
                  <div className="space-y-2">
                    {[
                      'RBAC with 4 role levels',
                      'Permission guards on mutations',
                      'Audit logging for all changes',
                      'Session tracking',
                      'Correlation ID propagation'
                    ].map((item, idx) => (
                      <div key={idx} className="flex items-center gap-2 text-sm">
                        <Badge className="bg-green-500/20 text-green-400">✓</Badge>
                        <span className="text-slate-300">{item}</span>
                      </div>
                    ))}
                  </div>
                </div>
                <div>
                  <h4 className="text-sm font-semibold text-white mb-3">Resilience</h4>
                  <div className="space-y-2">
                    {[
                      'Circuit breaker pattern',
                      'Exponential backoff retry',
                      'Request deduplication',
                      'Graceful error handling',
                      'Error boundary components'
                    ].map((item, idx) => (
                      <div key={idx} className="flex items-center gap-2 text-sm">
                        <Badge className="bg-green-500/20 text-green-400">✓</Badge>
                        <span className="text-slate-300">{item}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}