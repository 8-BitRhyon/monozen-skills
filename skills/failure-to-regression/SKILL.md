---
name: failure-to-regression
description: "Turn a bug, incident, review finding, or recurring agent mistake into an executable regression proof, a root-cause fix, and a durable gate. Load when fixing a defect, closing an incident, or correcting behavior that has failed before."
---

# Failure to Regression

> **Scope:** Every defect ends with a check that would have caught it, a fix at the right level, and a ledger entry a future agent can use.

## Core Rule

A fix is not done when the symptom disappears. It is done when the same failure cannot return silently.

## Flow

1. **Reproduce the smallest failure.** State expected behavior, actual behavior, and the narrowest observable check. Capture the artifact: test output, DOM metric, screenshot, network trace, or log.
2. **Make the check fail first.** Run it before editing production code. It must fail for the intended reason. If a focused test is impractical, use a script, browser assertion, snapshot, or log check and say why.
3. **Fix the root cause.** Prefer deleting the cause to adding a guard. If two fixes that share one premise have failed, write the premise down and test it directly.
4. **Prove passing.** Run the same check after the fix, plus the nearest contract checks.
5. **Encode the lesson.** Pick the highest level that works: architecture, types, lint, CI, test, docs, memory. A markdown rule is the last resort.
6. **Record the ledger entry.** Use [failure-ledger.md](references/failure-ledger.md). Name the check, commit, and verification command.
7. **Two strikes.** If the same failure class recurs twice, add a gate or a sibling test. Do not add another note.

## Proof Ladder

For each fact the fix depends on, get as far down this list as is cheap:

1. You said so.
2. You cited a real `file:line` or the library source.
3. You showed the bad path cannot happen.
4. You ran real code that fails loudly if you are wrong.
5. You reproduced it in the running app.

State where you stopped. Step 4 is usually the best value.

## Rules

- Do not change a test to match a wrong implementation.
- Prefer no new test over a bad test. A bad test mocks the bug away.
- Keep the regression check in the same commit as the fix.
- One logical change per commit.
- Report failing-before and passing-after evidence, not a claim.

## Verification

- The check fails on the parent commit and passes on the fix.
- The ledger entry links to the check and names the command.
- Any structural gate fails on a deliberate mutation.
- Nearby tests still pass.

## Anti-Patterns

- "Fixed" with only a manual observation.
- Adding a rule that nothing enforces.
- Broad fixture churn for a narrow bug.
- Deleting a failing test.
- Treating a flaky pass as proof.

## Invocation

Load when:

- Fixing a bug or regression
- Closing an incident
- Acting on a review finding
- A correction repeats for the second time
- The user says "why did this happen again", "make sure it cannot regress", or "prove it"

## Related

- `test-driven-dev`: the narrowest failing test.
- `production-web-audit`: browser and release proof.

## Provenance

The proof ladder and enforcement hierarchy are adapted from pstack's `blast-radius`, `correct`, `reflect`, and `principle-prove-it-works` by Lauren Tan. See [THIRD_PARTY_NOTICES.md](../../THIRD_PARTY_NOTICES.md).
