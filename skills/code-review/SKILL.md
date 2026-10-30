---
name: code-review
description: "Reviews a diff in a fresh context: spec compliance first, then correctness, security, and test proof, with style explicitly out of scope. Use when reviewing a PR, a branch, or a pre-merge diff."
---

# Code Review

> A reviewer who inherits the author's reasoning misses the author's assumptions. Review the diff against the spec, not the story around it.

## Contract

- Reviewer: a fresh session or subagent that did not write the change and has not read the author's chat.
- Inputs: the task or spec, the diff, the verify command and output, and the relevant invariants.
- Output: blockers, owned shoulds, and at most 3 nits.
- Stop: zero blockers, every should has an owner and date, every comment resolves.

## Review Order

1. **Spec compliance.** Does the diff do what the task claims, no more and no less? Flag scope creep and missing acceptance criteria.
2. **Correctness.** Edge cases: zero, null, empty, max, first, last, concurrent. Error paths surface and recover. No leaked listeners, timers, contexts, or caches.
3. **Security.** Input validation, authorization, secrets, injection surfaces, unsafe defaults.
4. **Test proof.** Does a failing check exist? Does it fail for the right reason? Do mocks hide the bug? Was the real runtime observed?
5. **Architecture.** Only where it creates a behavioral or maintenance risk: duplicated logic, wrong boundary, new dependency without a blocker.
6. **Style.** Out of scope. Formatting and naming preferences belong to the linter or a batch nit.

## Severity

| Level | Meaning | Action |
|---|---|---|
| `blocker` | Wrong behavior, security hole, data loss, broken build, or no proof for a must-have | Fix before merge |
| `should` | Real risk with a clear owner | Fix now or track with a date |
| `nit` | Preference | Drop, or batch at most 3 |

Finding inflation is a failure mode. A reviewer asked to find problems will always find some. Cap the output at 10 comments. More means the diff is too large or the review is unfocused.

## Output

One comment per finding:

```
file:line  [blocker|should|nit]
Claim: what is wrong.
Evidence: the path, test, or observed behavior.
Fix: the smallest change that resolves it.
Verify: the command or check that proves it.
```

Summary: blockers, owned shoulds, and the verification you ran. Do not restate the diff.

## Rules

- Run the check yourself when it is cheap. Do not accept "tests pass" without the command and output.
- Do not rewrite the author's design in comments. Propose the smallest change.
- A clean review is valid. If spec compliance and test proof hold, say so and stop.
- Large diff: review by layer or ask for a split. Size alone is not a blocker.
- A bug found here becomes a regression test per `failure-to-regression`.
- Approve only when no blockers and no unowned shoulds.

## Verification

- Zero blockers.
- Every `should` has an owner and date.
- Every comment resolved to a change, a tracked follow-up, or a dismissal with a reason.
- The repository gate was run on the reviewed head, not an earlier commit.

## Invocation

Load when:

- Reviewing a PR, diff, or branch.
- The user says "review", "check this PR", "is this good to merge".
- Before merging any non-trivial change.
