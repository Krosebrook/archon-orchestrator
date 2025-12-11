/**
 * @fileoverview Contributing Documentation
 * @module shared/docs/CONTRIBUTING
 */

export const CONTRIBUTING_DOC = `
# Contributing to Archon

> Development guidelines following Archon canonical standards

## Quick Start

\`\`\`bash
git clone https://github.com/your-org/archon.git
npm install
cp .env.example .env
npm run dev
\`\`\`

## Branch Strategy

Format: \`{type}/{scope}\`
- \`feat/\` - Features
- \`fix/\` - Bug fixes
- \`chore/\` - Maintenance
- \`docs/\` - Documentation

## Code Standards

- TypeScript \`strict: true\`
- ESLint clean
- Prettier formatted
- 80% test coverage

## Quality Gates (Hard Fails)

✅ TypeScript compilation
✅ Linting
✅ Unit tests (80% coverage)
✅ E2E smoke tests
✅ Security scan
✅ Bundle size < 180KB

## PR Process

1. ≤ 400 LOC per PR
2. Self-review first
3. 2 approvals required
4. Squash and merge

## Commit Format

\`\`\`
<type>(<scope>): <subject>
\`\`\`

Example:
\`\`\`
feat(agent): add memory management
\`\`\`

## Testing

\`\`\`bash
npm run test            # Unit tests
npm run test:e2e        # E2E tests
npm run test:coverage   # With coverage
\`\`\`

## Performance Budgets

- API (non-AI): < 300ms P95
- API (AI): < 1500ms P95
- Initial load: < 180KB gzip
- LCP: < 2.5s
`;

export default CONTRIBUTING_DOC;