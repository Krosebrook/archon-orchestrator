# 🤖 GitHub Copilot Agent — Feature-to-PR Template

> **Optimized for GitHub Copilot agents on github.com and in VS Code**  
> Execute as ONE autonomous PR with full context awareness

---

## 🎯 Mission Statement

**Feature:** `[REQUIRED: Specific feature name]`  
**Outcome:** `[REQUIRED: 1-2 sentences describing user-visible impact]`  
**Scope Level:** `[SELECT ONE: 🔵 Small | 🟢 Medium | 🔴 Large]`

> ⚠️ **STOP**: If any `[REQUIRED]` field above contains placeholders, **ASK** for clarification before proceeding.

---

## 🧭 Core Principles

### 1. **Context-First Execution**
- Always begin with **Step 0: Context Scan**
- Use existing repo patterns (don't invent new ones)
- Respect `.github/copilot-instructions.md` and related docs

### 2. **Clarify Before Coding**
- If **anything** is ambiguous → **Ask up to 5 targeted questions**
- Questions should be:
  - ✅ Specific and actionable
  - ✅ Necessary to prevent rework
  - ❌ Not about trivial naming or formatting

### 3. **Reviewable Changes**
- **One PR only** — no "Part 1 of 3"
- Keep diffs focused and logical
- If scope expands significantly → **Ask** if it should be split

### 4. **Quality Gates Match Scope**
- 🔵 **Small** (bug fixes, typos, minor tweaks): Tests + docs + build passes
- 🟢 **Medium** (new features, API endpoints): All 🔵 + edge cases + security review + integration tests
- 🔴 **Large** (architecture changes, new services): All 🟢 + ADR + observability + performance testing + rollback plan

---

## 📋 Scope-Adaptive Requirements

### 🔵 Small Changes (Bug fixes, config updates, minor improvements)
- [ ] **Tests**: Added or updated for changed behavior (if test infrastructure exists)
- [ ] **Docs**: Updated if user-visible behavior changes
- [ ] **Build**: `npm run build`, `npm run lint` pass (note: build may have known issues)
- [ ] **Verification**: Manual testing documented in PR

### 🟢 Medium Features (New components, API endpoints, UI flows)
All 🔵 requirements plus:
- [ ] **Edge Cases**: Null/empty/invalid inputs handled gracefully
- [ ] **Error Handling**: No silent failures; user-friendly messages
- [ ] **Security Review**: Input validation, authorization checks if applicable
- [ ] **Integration Tests**: If repo has test infrastructure (currently being developed)
- [ ] **Accessibility** (if frontend): ARIA labels, keyboard navigation, focus management
- [ ] **Loading/Error States** (if UI): Skeleton loaders, error boundaries

### 🔴 Large Features (Architecture changes, new services, major refactors)
All 🟢 requirements plus:
- [ ] **Architecture Decision Record (ADR)**: Document why this approach
- [ ] **Observability**: Logging, metrics, tracing added
- [ ] **Performance**: Load tested; no N+1 queries; caching strategy documented
- [ ] **Backward Compatibility**: Migration path for existing users/data
- [ ] **Rollback Plan**: Feature flags or clean revert strategy
- [ ] **Security Deep Dive**: Threat model, secrets management, dependency audit
- [ ] **Documentation**: README, API docs, runbooks updated

---

## 🔄 Required Workflow

### **Step 0: Context Scan** *(Must do first)*

Run these checks and document findings:

#### 0.1 — Repository Configuration
```bash
# Build/test/lint commands
Check: package.json, Makefile, .github/workflows/*
Find: How to build, test, lint, and run locally
```

**Archon Orchestrator Commands:**
```bash
npm run dev        # Development server (Vite)
npm run build      # Production build (may have known issues)
npm run lint       # ESLint check
npm run lint:fix   # Auto-fix ESLint issues
npm run typecheck  # TypeScript type checking
npm run preview    # Preview production build
```

#### 0.2 — Existing Patterns
For each of these, find **1-2 example files** to use as templates:

| Pattern | What to Find | Where to Look |
|---------|--------------|---------------|
| **Auth** | Base44 authentication with createClientFromRequest | Backend functions (functions/*.ts) |
| **Validation** | Zod schemas, manual checks | src/components/core/validation/schemas.ts.jsx |
| **Error Handling** | Try/catch, error boundaries, toast notifications | Components with API calls |
| **Logging** | Audit logging with Base44 | functions/*.ts (AuditLogger pattern) |
| **State Management** | React Context, TanStack Query | src/components/contexts/*.jsx |
| **Styling** | Tailwind CSS utility classes | All component files |
| **Testing** | Currently being developed | See TESTING.md for plans |

#### 0.3 — Find Reference Implementation
- **For new API endpoint** → Find most similar existing function in `functions/*.ts`
- **For new UI component** → Find most similar existing component in `src/components/` or `src/pages/`
- **For new utility function** → Find similar utility in `src/components/utils/`
- **List 2-3 files** to use as structural templates

#### 0.4 — CI/CD Constraints
```bash
# Check for:
# - Currently no GitHub Actions workflows in .github/workflows/
# - No branch protection rules configured yet
# - No CODEOWNERS file
# - No signed commits requirement
```

**📝 OUTPUT**: Post a summary of findings before proceeding to Step 1

---

### **Step 1: Plan** *(Post before major edits)*

Create a brief plan with:

#### 1.1 — Files to Change
```
- src/components/NewFeature.jsx (NEW)
- src/api/feature-endpoint.js (MODIFY)
- src/hooks/useFeature.js (NEW)
- README.md (MODIFY - document new feature)
- package.json (MODIFY - add dependency X)
```

#### 1.2 — Implementation Strategy
- What's the high-level approach?
- What existing patterns/components will you reuse?
- Any new dependencies needed? Why?

#### 1.3 — Test Plan
```
Unit Tests:
- Test A validates input handling
- Test B validates success path
- Test C validates error cases

Integration Tests (if applicable):
- Test D validates end-to-end flow

Note: Testing infrastructure is being developed. Manual testing may be required.
```

#### 1.4 — Rollback Plan
- How to safely revert if issues arise?
- Feature flag? Database migration rollback? Simple git revert?

#### 1.5 — Risk Assessment
- **Risk Level**: [Low/Medium/High]
- **Known Risks**: [List 1-3]
- **Mitigations**: [How you'll address each]

**📝 OUTPUT**: Wait for approval/feedback before proceeding to implementation

---

### **Step 2: Implement**

#### Code Quality Checklist
- [ ] Follow existing code style (ESLint config)
- [ ] Use TypeScript types for backend functions (.ts files)
- [ ] Use JSDoc comments for frontend (migration to TypeScript planned)
- [ ] Keep functions small and single-purpose
- [ ] Extract magic numbers to named constants
- [ ] No hardcoded credentials or secrets
- [ ] Defensive: Check for null/undefined before using

#### Security Checklist
- [ ] **Input Validation**: Validate all user inputs at trust boundaries
- [ ] **Authorization**: Server-side checks for protected operations (Base44 RBAC)
- [ ] **Output Encoding**: Escape user content in UI to prevent XSS
- [ ] **Secrets**: Use environment variables, never commit tokens
- [ ] **Dependencies**: Check for known vulnerabilities (`npm audit`)

#### Performance Checklist
- [ ] No unnecessary re-renders (React: useMemo, useCallback)
- [ ] No N+1 queries (batch database calls)
- [ ] Lazy load heavy components/images
- [ ] Add loading states for async operations

---

### **Step 3: Tests**

#### Test Coverage Requirements
- **🔵 Small**: At least 1 test proving the fix works (if test infrastructure exists)
- **🟢 Medium**: Success path + 2-3 edge cases + 1-2 error cases
- **🔴 Large**: All happy paths + comprehensive edge cases + performance tests

**Note**: Testing infrastructure is currently being developed. See [TESTING.md](../TESTING.md) and [KNOWN_ISSUES.md](../KNOWN_ISSUES.md) for current status.

#### Test Quality Checklist
- [ ] Tests are deterministic (no random data, no real timers)
- [ ] Tests are isolated (no shared state between tests)
- [ ] Tests document behavior (readable test names)
- [ ] Mock external dependencies (APIs, databases)
- [ ] Use repo's existing test patterns and utilities (when available)

#### Example Test Structure (Planned - Vitest)
```javascript
describe('NewFeature', () => {
  describe('Success Cases', () => {
    it('should handle valid input correctly', () => {
      // Arrange, Act, Assert
    });
  });

  describe('Edge Cases', () => {
    it('should handle empty input gracefully', () => {});
    it('should handle maximum length input', () => {});
  });

  describe('Error Cases', () => {
    it('should display error message on API failure', () => {});
  });
});
```

---

### **Step 4: Documentation**

#### Required Documentation
- [ ] **README.md**: Update if feature is user-visible or changes setup
- [ ] **Code Comments**: Explain "why" not "what" (what is obvious from code)
- [ ] **API Docs**: Update [AGENTS.md](../AGENTS.md) or [API.md](../API.md) if backend function changes
- [ ] **Inline Examples**: Add usage examples for complex APIs
- [ ] **Migration Guide**: If breaking change, explain how to upgrade

#### Optional Documentation (if applicable)
- [ ] **ADR**: Architecture Decision Record for significant architectural choices
- [ ] **CHANGELOG.md**: Add entry (maintained in repo)
- [ ] **Runbook**: For ops-heavy features (monitoring, incidents)
- [ ] **Diagrams**: Architecture or sequence diagrams for complex flows

---

### **Step 5: PR Description**

Use this template for your pull request:

```markdown
## 📝 Summary
[2-3 sentences: what changed and why]

## 🎯 Related Issue
Closes #[issue-number]
[Or: No related issue — this is a proactive improvement]

## 🔧 Changes Made

### Added
- [List new files, features, or capabilities]

### Modified
- [List changed files and what changed]

### Removed
- [List deleted files or deprecated features]

## ✅ Verification

### Local Testing
```bash
# Build
npm run build

# Lint
npm run lint

# Type check
npm run typecheck

# Manual testing
npm run dev
# Then: [describe manual test steps]
```

### Expected Output
```
✓ All tests pass (X passing) - or "Tests pending infrastructure setup"
✓ Build succeeds (or note known build issues)
✓ Lint passes with 0 errors
✓ Type check passes
```

## 🔒 Security Review

- [ ] **CodeQL**: [Passed / N/A / Not yet run]
- [ ] **Dependency Scan**: [No new vulnerabilities / X new vulnerabilities - justified because...]
- [ ] **Secret Scanning**: [Passed / N/A]
- [ ] **Manual Review**: [Describe any security-sensitive changes]

## ⚖️ Risk Assessment

**Risk Level**: [🟢 Low / 🟡 Medium / 🔴 High]

**Potential Risks**:
1. [Risk 1]
2. [Risk 2]

**Mitigations**:
1. [Mitigation for Risk 1]
2. [Mitigation for Risk 2]

**Rollback Plan**:
[Describe how to safely revert these changes]

## 📸 Screenshots / Demo
[If UI change: Add before/after screenshots or GIF]
[If API change: Add example requests/responses]

## ✨ Additional Context
[Any other information reviewers should know]

---

## Reviewer Checklist
- [ ] Code follows repo conventions
- [ ] Tests are comprehensive (or infrastructure limitation noted)
- [ ] Documentation is updated
- [ ] No security concerns
- [ ] Performance is acceptable
- [ ] Changes are backward compatible (or migration path is clear)
```

---

## 🚨 Troubleshooting Guide

| Problem | Solution |
|---------|----------|
| **Build fails with missing entities/all** | Known issue - see KNOWN_ISSUES.md. This may not block your PR if unrelated to your changes. |
| **CI fails on unrelated tests** | Document in PR; consider if your change could have side effects |
| **Merge conflicts appear** | Rebase onto latest main: `git pull --rebase origin main` |
| **Scope grows during implementation** | **STOP** and ask: "This is expanding to include X. Should this be a separate PR?" |
| **No existing test infrastructure** | Note in PR: "Tests pending infrastructure setup. Manual testing completed." |
| **Dependency unavailable in tests** | Mock it; document in "Known Limitations" |
| **Performance concern** | Measure with profiler; document findings; add performance test |
| **Security vulnerability in new dep** | **Ask**: "Dependency X has vulnerability Y. Acceptable risk or find alternative?" |
| **ESLint warnings** | Run `npm run lint:fix` to auto-fix. Some warnings are being cleaned up gradually. |

---

## 📊 Stack-Specific Guidance

### 🎨 Frontend (React + Vite + Tailwind)

**Tech Stack:**
- React 18.2
- Vite 6.1 (build tool)
- Tailwind CSS 3.4
- Radix UI (component primitives)
- TanStack Query (data fetching)
- React Router (routing)

**Additional Requirements:**
- [ ] **Accessibility**: Semantic HTML, ARIA labels, keyboard navigation
- [ ] **Responsive Design**: Test mobile, tablet, desktop
- [ ] **Loading States**: Skeletons, spinners, or progress indicators
- [ ] **Error Boundaries**: Catch and display React errors gracefully
- [ ] **Performance**: Monitor bundle size, lazy load heavy components

**Testing:**
- [ ] **Component tests**: Vitest + React Testing Library (being set up)
- [ ] **Visual regression**: Storybook (planned)
- [ ] **E2E tests**: Playwright (planned for critical flows)

**Patterns to Follow:**
- Use Radix UI primitives from `src/components/ui/`
- Follow Tailwind utility-first styling
- Use TanStack Query for data fetching
- Use React Context for global state
- Follow existing component structure in `src/components/` and `src/pages/`

---

### ⚙️ Backend (Deno + TypeScript + Base44)

**Tech Stack:**
- Deno 1.40+
- TypeScript 5.8
- Base44 SDK 0.8.4+ (serverless functions - note: package.json specifies ^0.8.3)
- Base44 database (built-in ORM)

**Additional Requirements:**
- [ ] **API Documentation**: Update AGENTS.md with function signature
- [ ] **Authentication**: Use `createClientFromRequest` pattern
- [ ] **Authorization**: Implement RBAC checks with Base44
- [ ] **Audit Logging**: Log all mutating operations
- [ ] **Error Handling**: Return consistent error format with trace_id
- [ ] **Idempotency**: POST/PUT operations should be safe to retry

**Testing:**
- [ ] **Unit tests**: Pure business logic
- [ ] **Integration tests**: API endpoints with test database
- [ ] **Contract tests**: Verify API contracts

**Patterns to Follow:**
```typescript
// Note: package.json specifies ^0.8.3 (allows any 0.8.x >= 0.8.3)
// Existing functions use 0.8.4 - match this pattern for consistency
import { createClientFromRequest } from 'npm:@base44/sdk@0.8.4';

Deno.serve(async (req) => {
  const trace_id = crypto.randomUUID();
  
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    
    // Validate inputs
    if (!input.required_field) {
      return Response.json({
        code: 'VALIDATION_ERROR',
        message: 'Missing required field',
        trace_id
      }, { status: 400 });
    }
    
    // Business logic here
    
    // Audit log for mutating operations
    await base44.asServiceRole.entities.Audit.create({
      entity_type: 'entity_name',
      entity_id: 'id',
      action: 'create',
      actor: user.email,
      metadata: {},
      org_id: user.organization.id
    });
    
    return Response.json({ success: true, data: {...} });
  } catch (error) {
    return Response.json({
      code: 'ERROR',
      message: error.message,
      trace_id
    }, { status: 500 });
  }
});
```

---

## 🎯 Scope Definition Template

### ✅ In Scope
- [Specific feature/component/capability 1]
- [Specific feature/component/capability 2]
- [Specific feature/component/capability 3]

### ❌ Explicitly Out of Scope
- [Related feature that's NOT included]
- [Edge case that will be handled separately]
- [Refactor that's deferred to future PR]

### 🔮 Future Work (Mentioned for context)
- [Follow-up PR idea 1]
- [Follow-up PR idea 2]

---

## 📚 Repository-Specific Context

### This Repository: `Krosebrook/archon-orchestrator`

**Tech Stack:**
- **Frontend**: React 18 + Vite 6 + TypeScript 5.8 + Tailwind CSS + Radix UI
- **Backend**: Base44 SDK (50+ serverless Deno/TypeScript functions)
- **State**: React Context + TanStack Query
- **Routing**: React Router 6
- **Database**: Base44 (PostgreSQL-based with ORM)

**Key Patterns:**
- **Auth**: Base44 authentication (`createClientFromRequest` in backend)
- **Validation**: Zod schemas (backend), manual checks (frontend migration in progress)
- **Styling**: Tailwind utility classes with custom theme
- **Components**: Radix UI primitives + custom wrappers in `src/components/ui/`
- **Data Fetching**: TanStack Query with Base44 SDK

**Known Constraints:**
- ⚠️ **Testing infrastructure being developed**: Vitest planned, manual testing currently required
- ⚠️ **Frontend TypeScript migration in progress**: Some files are .jsx, migration to .tsx ongoing
- ⚠️ **Build may have known issues**: See KNOWN_ISSUES.md for details
- ⚠️ **100+ ESLint warnings**: Ongoing cleanup, run `npm run lint:fix` for auto-fixes

**Build Commands:**
```bash
npm run dev        # Development server (http://localhost:5173)
npm run build      # Production build (may have known issues with entities/all)
npm run lint       # ESLint check
npm run lint:fix   # Auto-fix ESLint issues
npm run typecheck  # TypeScript type checking
npm run preview    # Preview production build
```

**Required Reading** (check these first):
- `.github/copilot-instructions.md` (this file)
- `AGENTS.md` (backend function documentation)
- `API.md` (API reference)
- `ARCHITECTURE.md` (system architecture)
- `CONTRIBUTING.md` (contribution guidelines)
- `KNOWN_ISSUES.md` (current limitations)
- `TESTING.md` (testing strategy)
- `SECURITY.md` (security guidelines)

**Helpful Context:**
- 46 application pages
- 334 React components
- 50+ backend functions (Deno/TypeScript)
- ~9,400+ lines of code
- Focus on AI agent orchestration, governance, and collaboration

---

## 🚀 Execution Checklist

Before starting:
- [ ] All `[REQUIRED]` fields are filled
- [ ] Scope level (🔵/🟢/🔴) is selected
- [ ] I understand what success looks like

During execution:
- [ ] Completed Step 0: Context Scan
- [ ] Posted Step 1: Plan and received approval
- [ ] Followed existing repo patterns
- [ ] Added appropriate tests (or noted infrastructure limitation)
- [ ] Updated documentation
- [ ] Created comprehensive PR description

Before submitting PR:
- [ ] All tests pass locally (or noted infrastructure limitation)
- [ ] Build succeeds (or known issues documented)
- [ ] Lint passes (`npm run lint`)
- [ ] Type check passes (`npm run typecheck`)
- [ ] Manually tested the feature
- [ ] Reviewed own code changes
- [ ] No secrets or credentials in code
- [ ] PR description is complete

---

## ✨ Example: Good vs. Ambiguous Feature Definitions

### ❌ Too Ambiguous
```
Feature: Add search
Outcome: Users can search
```
**Why bad**: What can they search? Where? What happens with results?

### ✅ Good Definition
```
Feature: Agent search with filters
Outcome: Users can search agents by name/capability and filter by 
provider, status, and cost. Results display in real-time with 
highlighting.

Scope Level: 🟢 Medium

Acceptance Criteria:
- [ ] Search input with debounced API calls (300ms)
- [ ] Filter by provider (dropdown), status (checkbox), cost range (slider)
- [ ] Results update in real-time as user types
- [ ] Search terms are highlighted in results
- [ ] "No results" state with helpful message
- [ ] Works on mobile (responsive)
```

---

## 🎓 Agent Learning Notes

### Common Pitfalls to Avoid
1. **Don't guess patterns** — always check existing code first
2. **Don't skip Step 0** — context scan prevents rework
3. **Don't over-engineer** — match existing complexity level
4. **Don't ignore build failures** — but note known issues from KNOWN_ISSUES.md
5. **Don't mix concerns** — one PR = one logical change

### Signs You Should Ask Questions
- Multiple ways to implement something and no clear "right" way
- Security implications you're unsure about
- Performance impact that's hard to estimate
- Breaking changes that might affect users
- Scope that feels too large for one PR

### Signs You're on the Right Track
- Your plan closely mirrors an existing feature
- You're reusing existing components/utilities
- Tests are passing locally (or infrastructure limitation noted)
- Code diff is focused and readable
- You can explain the rollback plan clearly

---

## 📞 Need Help?

If stuck or unsure:
1. **Check documentation**: README, AGENTS.md, API.md, ARCHITECTURE.md, KNOWN_ISSUES.md
2. **Look for similar code**: Find reference implementation in existing components/functions
3. **Ask specific questions**: "Should I use pattern A or B?" not "What should I do?"
4. **Propose a solution**: "I'm planning X because Y. Thoughts?" gets faster feedback

---

**Version**: 1.0  
**Last Updated**: 2025-12-30  
**Optimized for**: GitHub Copilot agents (github.com + VS Code)  
**Repository**: Krosebrook/archon-orchestrator
