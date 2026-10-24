# Failure Ledger

Keep one ledger per repository that owns the behavior.

| Date | Symptom | Root cause | Failing check | Fix | Enforcement | Verify | Commit |
|---|---|---|---|---|---|---|---|
| 2026-10-24 | Footer styles stayed stale after a CSS change | Service worker install failed on a missing precache URL, so the old cache stayed active | `e2e/footer-viewport.spec.js` service worker install case | Removed the missing URL, bumped the cache, added an asset query | Test plus release query check | `npx playwright test footer-viewport.spec.js` | `<sha>` |

## Rule Table

Pair every durable rule with its enforcement. Drop a rule when its mistake cannot happen.

| Rule | Enforced by | Evidence |
|---|---|---|
| Full-height sections fill the bottom viewport | `production-web-audit` layout contract | viewport spec |
| Pointer effects stay under the cursor | layout contract hover assertion | canvas centroid test |
| Required checks cannot be quietly bypassed | `ci-gate-recovery` restore check | protection diff |

## Entry Rules

- Add an entry for every escaped defect and every correction that happened twice.
- Name the check that would have caught it, not only the fix.
- Link the commit and the command that proves the fix.
- If no executable check exists, record the closest proof and the reason.
