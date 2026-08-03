---
name: code-review
description: "Universal code review protocol for any language and any repository: five review dimensions (correctness, readability, architecture, security, performance), severity triage (blocker/should/nit), and PR review workflow. Load when reviewing a diff, PR, or branch before merge."
---

# Code Review (Universal)

> **Scope:** Systematized review of any diff in any repo, so reviews are consistent, complete, and actionable. Review the diff, not the prose; review for the five dimensions, not style preference.

## Five Dimensions (check every one)

1. **Correctness** - Does it do what it claims?
   - Edge cases: 0, null, empty, max, first/last, concurrent.
   - Error paths: does failure surface loudly and recover cleanly?
   - State: no leaked listeners, timers, contexts, caches.
2. **Readability** - Can the next agent understand it without a walkthrough?
   - Names say intent; one idea per function; no dead code or commented-out code.
3. **Architecture** - Does it fit the existing system?
   - Follows existing patterns; no duplicate logic (DRY); boundaries respected; no new dependency without a blocker.
4. **Security** - Does it hold the line?
   - Input validation, no secrets logged/committed, authz checks, no injection surfaces, safe defaults.
5. **Performance** - Does it waste resources?
   - No N+1 queries, no O(n^2) in hot paths, no work in render/loop that belongs elsewhere, no unbounded memory.

## Severity Triage

| Severity | Meaning | Action |
|---|---|---|
| `blocker` | Wrong behavior, security hole, data loss, broken build | Must fix before merge |
| `should` | Correctness/robustness risk, missing test | Fix now or track with owner |
| `nit` | Style, naming, preference | Optional; batch them |

## PR Review Workflow

1. Read the intent: PR body, linked issue, commit messages. What is the claim?
2. Read the diff per file: changed lines, then surrounding context.
3. Run the verification yourself if cheap: tests, lint, typecheck, runtime check.
4. Comment with `file:line`, one concern per comment, tagged with severity.
5. Approve only when no blockers and no unowned shoulds. A review that found nothing is a red flag: re-check dimensions 1 and 4.

## Rules

- Praise what is correct; be specific about what is not.
- Never rubber-stamp: approve implies you verified or explicitly accepted the risk.
- Auto-fix typos and formatting in the diff; never change product behavior silently.
- If the change is >300 lines, require decomposition before review (blocker).

## Verification

- Review checklist produces zero blockers and zero unowned shoulds before merge.
- Every comment resolves to a change, a tracked follow-up, or an explicit dismissal with reason.

## Invocation

Load when:
- Reviewing a PR, diff, or branch
- User says "review", "check this PR", "is this good to merge", "critique my code"
- Before merging any non-trivial change
