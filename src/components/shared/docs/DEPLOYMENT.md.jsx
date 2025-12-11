/**
 * @fileoverview Deployment Documentation
 * @module shared/docs/DEPLOYMENT
 */

export const DEPLOYMENT_DOC = `
# Archon Deployment Guide

> Production deployment following Archon canonical standards

## Environment Variables

### Required
\`\`\`bash
BASE44_APP_ID=your-app-id
OPENAI_API_KEY=sk-proj-...
ANTHROPIC_API_KEY=sk-ant-...
\`\`\`

### Optional
\`\`\`bash
HELICONE_API_KEY=sk-helicone-...
NEXT_PUBLIC_ENABLE_TELEMETRY=true
NEXT_PUBLIC_ENABLE_ANALYTICS=true
\`\`\`

## Pre-Deployment Checklist

- [ ] Tests passing
- [ ] Performance budgets met (LCP < 2.5s)
- [ ] Security scan clean
- [ ] Rollback plan documented

## Deployment Process

1. **Validate** - \`npm run validate:env\`
2. **Test** - \`npm run test && npm run test:e2e\`
3. **Deploy Staging** - \`npm run deploy:staging\`
4. **Smoke Test** - \`npm run test:smoke\`
5. **Deploy Production** - \`npm run deploy:production\`

## Monitoring

- Error Rate: < 1%
- P95 Latency: < 300ms (non-AI), < 1500ms (AI)
- LCP: < 2.5s

## Rollback

\`\`\`bash
npm run rollback:production
npm run verify:production
\`\`\`
`;

export default DEPLOYMENT_DOC;