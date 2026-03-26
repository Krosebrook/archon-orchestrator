# INT Engineering — PR Governance Policy

**Version:** 1.0  
**Status:** Active  
**Owner:** Platform Engineering / AppSec  
**Effective Date:** 2026-03-26  
**Last Reviewed:** 2026-03-26  
**Next Review:** 2026-09-26

---

## Table of Contents

1. [Purpose](#1-purpose)
2. [Scope](#2-scope)
3. [Branch Protection Rules](#3-branch-protection-rules)
4. [CODEOWNERS Guidance](#4-codeowners-guidance)
5. [Merge Requirements](#5-merge-requirements)
6. [PR Hygiene Standards](#6-pr-hygiene-standards)
7. [Security Review Requirements](#7-security-review-requirements)
8. [Automated Governance (CI/CD)](#8-automated-governance-cicd)
9. [Rollout Plan](#9-rollout-plan)
10. [Enforcement & Exceptions](#10-enforcement--exceptions)
11. [References](#11-references)

---

## 1. Purpose

This policy establishes the standards and automated controls governing pull requests (PRs) in the `archon-orchestrator` repository. The goals are to:

- **Maintain code quality** through consistent review standards
- **Reduce security risk** by ensuring security-sensitive changes are reviewed by qualified personnel
- **Accelerate review cycles** through clear expectations and automation
- **Provide an auditable record** of all changes to production systems

---

## 2. Scope

This policy applies to:

- All engineers with write access to `Krosebrook/archon-orchestrator`
- All pull requests targeting the `main` and `develop` branches
- External contributors submitting pull requests from forks
- Automated bots and CI/CD systems creating PRs

---

## 3. Branch Protection Rules

The following rules **must** be enforced on the `main` branch via GitHub branch protection settings.

| Rule | Setting | Rationale |
|------|---------|-----------|
| **Required approving reviews** | 1 minimum | Ensures at least one peer has reviewed the change |
| **Dismiss stale reviews** | Enabled | Forces re-review after new commits are pushed |
| **Require CODEOWNERS review** | Enabled | Ensures domain experts review changes to their areas |
| **Enforce admins** | Enabled | Admins are not exempt from review requirements |
| **Restrict force pushes** | Disabled (force push blocked) | Prevents history rewriting on main |
| **Restrict deletions** | Disabled (deletion blocked) | Prevents accidental branch deletion |
| **Require status checks before merge** | Enabled | All required checks must pass |
| **Require branches to be up to date** | Enabled | Prevents merging stale branches |

### Required Status Checks

The following CI checks **must pass** before a PR can be merged into `main`:

| Check Name | Workflow | Failure Policy |
|-----------|----------|---------------|
| `CI Checks` (lint) | `ci.yml` | Hard block |
| `CI Checks` (unit tests) | `ci.yml` | Hard block |
| `Security Audit` | `ci.yml` | Advisory (see Note 1) |
| `Auto-label Security-Sensitive PRs` | `pr-governance.yml` | Hard block |
| `Fail CI if security-review label is missing` | `pr-governance.yml` | Hard block (security PRs only) |

> **Note 1:** The security audit check is currently set to `continue-on-error: true` during Phase 1 rollout to baseline existing vulnerability counts. This will be hardened to a block in Phase 2.

### `gh` CLI Command to Apply Branch Protection

Run the following command **after reviewing** to apply these rules to `main`:

```bash
gh api \
  --method PUT \
  -H "Accept: application/vnd.github+json" \
  /repos/Krosebrook/archon-orchestrator/branches/main/protection \
  --input - <<'EOF'
{
  "required_status_checks": {
    "strict": true,
    "contexts": [
      "CI Checks",
      "Auto-label Security-Sensitive PRs",
      "Warn on Large PRs (> 800 lines changed)"
    ]
  },
  "enforce_admins": true,
  "required_pull_request_reviews": {
    "dismiss_stale_reviews": true,
    "require_code_owner_reviews": true,
    "required_approving_review_count": 1,
    "require_last_push_approval": true
  },
  "restrictions": null,
  "allow_force_pushes": false,
  "allow_deletions": false,
  "block_creations": false,
  "required_conversation_resolution": true
}
EOF
```

---

## 4. CODEOWNERS Guidance

A `CODEOWNERS` file should be maintained at `.github/CODEOWNERS` (or `CODEOWNERS` at repo root). This file designates the required reviewers for specific paths.

### Recommended CODEOWNERS Structure

```
# Global fallback — all unmatched files require review from platform team
*                           @Krosebrook

# Frontend application code
src/                        @Krosebrook

# Backend serverless functions
functions/                  @Krosebrook

# Security-sensitive paths — always require AppSec sign-off
src/auth/                   @Krosebrook @security-team
middleware/                 @Krosebrook @security-team
secrets/                    @Krosebrook @security-team

# Infrastructure and deployment
infra/                      @Krosebrook @platform-team
terraform/                  @Krosebrook @platform-team
helm/                       @Krosebrook @platform-team
.github/                    @Krosebrook

# Environment configuration
.env*                       @Krosebrook @security-team
```

### CODEOWNERS Rules

1. **CODEOWNERS must be kept up to date** — update whenever ownership changes
2. **Teams, not individuals** — use GitHub Teams (e.g., `@org/security-team`) wherever possible to avoid single points of failure
3. **Least-specific match wins** — GitHub uses the last matching rule, so order from general to specific
4. **Every path should have an owner** — use `*` as a fallback catch-all

---

## 5. Merge Requirements

### Merge Strategy

| Branch Type | Allowed Merge Strategies | Rationale |
|------------|--------------------------|-----------|
| `main` ← `feature/*` | **Squash merge only** | Keeps main history clean; one commit per feature |
| `main` ← `release/*` | **Merge commit** | Preserves release history with full context |
| `main` ← `hotfix/*` | **Squash merge** or **Merge commit** | Engineer discretion based on complexity |
| `develop` ← `feature/*` | **Squash merge** or **Merge commit** | Either acceptable on integration branch |

> ⚠️ **Rebase merges are discouraged** on `main` as they rewrite commit SHAs and complicate rollbacks.

### Merge Commit Message Format

When squash-merging a feature branch, the squash commit message **must** follow the format:

```
type(scope): description (#PR-number)

Co-authored-by: Name <email>
```

**Allowed types:** `feat`, `fix`, `chore`, `docs`, `refactor`, `test`, `style`, `ci`, `perf`, `security`

**Examples:**
```
feat(auth): add OAuth2 PKCE flow (#42)
fix(api): handle null response from agent executor (#87)
chore: add PR governance policy, template, and automation (#91)
```

### Pre-Merge Checklist

Before clicking "Merge":

- [ ] All required status checks are green
- [ ] At least 1 approving review from a non-author
- [ ] CODEOWNERS have approved (if applicable)
- [ ] `security-review` label present AND AppSec has approved (if security-sensitive)
- [ ] PR description is complete (no placeholder text)
- [ ] Branch is up to date with `main`
- [ ] No unresolved review threads

---

## 6. PR Hygiene Standards

### PR Size

| Category | Lines Changed | Guidance |
|----------|--------------|---------|
| 🟢 Small | < 200 | Ideal; fast review turnaround |
| 🟡 Medium | 200–800 | Acceptable; break down if possible |
| 🔴 Large | > 800 | Automated warning posted; justify or split |

**Guidelines for large PRs:**
- Add a detailed "What Changed" section explaining every significant change
- Consider stacking PRs (prerequisite → dependent)
- Request a synchronous walkthrough with reviewers for PRs > 1,500 lines

### PR Titles

- **Must** follow `type(scope): description` format
- **Must** be written in the imperative mood ("add X", not "adds X" or "added X")
- **Must not** contain ticket numbers in the title (use the body instead)
- **Max 72 characters**

### PR Descriptions

Every PR **must** use the [PR template](../pull_request_template.md) and complete all sections. PRs with incomplete descriptions (placeholder text remaining) may be returned to the author without review.

### Draft PRs

- Use GitHub Draft PRs for work-in-progress to avoid triggering full review cycles
- Convert to "Ready for Review" only when the author is satisfied with the implementation
- Draft PRs will not be merged regardless of approvals

### Review Turnaround SLA

| Reviewer Role | Expected Response Time |
|--------------|----------------------|
| Peer reviewer | 1 business day |
| CODEOWNER | 2 business days |
| AppSec reviewer | 3 business days |

If an SLA is missed, the PR author should ping the reviewer in Slack and/or re-request review.

---

## 7. Security Review Requirements

### Trigger Paths

The `pr-governance.yml` workflow automatically applies the `security-review` label and posts a comment when a PR modifies files in any of these paths:

| Path Pattern | Reason |
|-------------|--------|
| `src/auth/**` | Authentication and authorization logic |
| `middleware/**` | Request/response interception layer |
| `secrets/**` | Secret storage or retrieval code |
| `infra/**` | Infrastructure configuration |
| `terraform/**` | Infrastructure-as-code |
| `helm/**` | Kubernetes deployment manifests |
| `.env*` / `*.env` | Environment variable files |

### Security Review Process

1. **Automated detection** — CI applies the `security-review` label automatically
2. **Author responsibility** — Complete the "Security Impact" section in the PR description
3. **Reviewer assignment** — Tag `@security-team` or a designated AppSec reviewer
4. **AppSec approval** — An AppSec-approved reviewer must leave an approving review
5. **CI gate** — `enforce-security-label` job will **fail** if `security-review` label is present but the PR is missing the required approval

### Security PR Standards

Security-sensitive PRs must additionally include:

- Threat model impact assessment (what attack surface changed and how)
- Test coverage for the security-sensitive code paths
- Reference to any relevant CVEs, security advisories, or compliance requirements
- Confirmation that secrets are not hardcoded and that input validation is in place

---

## 8. Automated Governance (CI/CD)

### Workflow: `pr-governance.yml`

| Job | Trigger | Action |
|-----|---------|--------|
| `security-label` | All PRs | Detects changes to security-sensitive paths; applies `security-review` label; posts comment |
| `enforce-security-label` | PRs with `security-review` label | Fails CI if label is present without AppSec approval |
| `pr-size-check` | All PRs | Posts a warning comment if total lines changed > 800 |

### Workflow: `ci.yml`

| Job | Action | Failure Policy |
|-----|--------|---------------|
| Lint (`npm run lint`) | ESLint | Hard block |
| Unit tests (`npm test`) | Vitest | Hard block |
| Security audit (`npm audit`) | npm audit | Advisory (Phase 1), Hard block (Phase 2) |
| Build check (`npm run build`) | Vite build | Advisory (known issues, see KNOWN_ISSUES.md) |

---

## 9. Rollout Plan

### Phase 1 — Foundation (Current)

**Timeline:** Immediately upon merging this PR

- [x] PR template deployed
- [x] `pr-governance.yml` workflow deployed
- [x] Policy document published
- [ ] Branch protection rules applied to `main` (manual step — see Section 3)
- [ ] Team notified of new policy via #engineering Slack channel

**Success Criteria:** All new PRs use the template; security-sensitive PRs are auto-labeled.

---

### Phase 2 — Hardening (30 days post-Phase 1)

**Timeline:** ~30 days after Phase 1 stabilization

- [ ] `CODEOWNERS` file created and populated
- [ ] Security audit check hardened from advisory to hard block (`continue-on-error: false`)
- [ ] Branch protection rules reviewed and adjusted based on Phase 1 feedback
- [ ] SLA compliance tracked and reported in monthly engineering metrics

**Success Criteria:** Zero PRs merged without required reviews; security audit passing on all new code.

---

### Phase 3 — Optimization (60–90 days post-Phase 1)

**Timeline:** ~60–90 days after Phase 1 stabilization

- [ ] Automated PR size enforcement (block merges for PRs > 1,500 lines without manager approval)
- [ ] Integration with Jira/Linear for ticket traceability
- [ ] PR metrics dashboard (avg review time, security PR rate, size distribution)
- [ ] Annual policy review cycle established

**Success Criteria:** Measurable improvement in review quality scores; reduced security incidents from code changes.

---

## 10. Enforcement & Exceptions

### Enforcement

Violations of this policy may result in:

1. PR blocked from merging by automated CI gates
2. Request to revise the PR to meet standards
3. Escalation to engineering manager for repeated violations

### Exception Process

If a specific PR requires an exception to this policy (e.g., an emergency hotfix with expedited review):

1. **Document the exception** in the PR description under a "Policy Exception" heading
2. **Get verbal/Slack approval** from the engineering manager or on-call lead
3. **Tag the PR** with the `policy-exception` label
4. **Complete a post-merge review** within 24 hours to ensure no issues were introduced

Emergency exceptions to the security review requirement require **VP Engineering or CISO approval**.

---

## 11. References

| Document | Location |
|----------|----------|
| PR Template | `.github/pull_request_template.md` |
| PR Governance Workflow | `.github/workflows/pr-governance.yml` |
| CI Workflow | `.github/workflows/ci.yml` |
| Security Policy | `SECURITY.md` |
| Contributing Guide | `CONTRIBUTING.md` |
| Architecture Reference | `ARCHITECTURE.md` |
| Known Issues | `KNOWN_ISSUES.md` |

---

*This document is maintained by the Platform Engineering team. For questions or proposed changes, open a PR against this file or contact `@Krosebrook` in Slack.*
