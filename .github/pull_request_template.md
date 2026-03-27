## Summary

<!-- Provide a concise description of the change and the motivation behind it. Link to the relevant issue or ticket. -->

Closes #<!-- issue number -->

---

## Type of Change

<!-- Check all that apply -->

- [ ] 🐛 Bug fix (non-breaking change that fixes an issue)
- [ ] ✨ New feature (non-breaking change that adds functionality)
- [ ] 💥 Breaking change (fix or feature that would cause existing functionality to not work as expected)
- [ ] 🔒 Security fix / hardening
- [ ] ♻️ Refactor / code cleanup (no functional change)
- [ ] 📝 Documentation update
- [ ] 🏗️ Infrastructure / CI/CD change
- [ ] 🔧 Configuration change

---

## What Changed

<!-- List the key files/components modified and describe what was changed and why. -->

**Files changed:**

-
-

**Key changes:**

-
-

---

## Testing

<!-- Describe how you tested this change. Include any relevant test commands or manual verification steps. -->

- [ ] Unit tests added / updated (`npm test`)
- [ ] Linting passes (`npm run lint`)
- [ ] Build passes (`npm run build`)
- [ ] Manually verified in local dev environment (`npm run dev`)
- [ ] E2E / integration tests run (if applicable)

**Test steps:**

1.
2.

---

## Security Impact

<!-- REQUIRED: Describe any security implications of this change. If this PR touches authentication, authorization, secrets, infrastructure, or sensitive data paths, tag @security-review. -->

- [ ] This PR has **no** security impact (no changes to auth, secrets, infra, or data access paths)
- [ ] This PR **has** security implications — `@security-review` has been notified

**Security notes:**

<!-- If security-relevant, describe the threat model impact, what was hardened or changed, and any compensating controls. -->

---

## Rollback Plan

<!-- How can this change be safely reverted if it causes issues in production? -->

- [ ] Simple `git revert` is sufficient
- [ ] Database migration rollback required — steps:
- [ ] Feature flag can be toggled off — flag name:
- [ ] Manual intervention required — steps:

**Rollback steps:**

1.
2.

---

## Checklist

<!-- Confirm all items before requesting review. -->

- [ ] My code follows the project's style and conventions
- [ ] I have reviewed my own diff before submitting
- [ ] I have added or updated tests to cover my changes
- [ ] I have updated relevant documentation (README, AGENTS.md, API.md, etc.)
- [ ] No secrets, credentials, or sensitive data are committed
- [ ] All CI checks pass (lint, tests, build, security scan)
- [ ] Breaking changes are documented and migration path is provided
- [ ] The PR title follows the commit convention (`type: description`)
