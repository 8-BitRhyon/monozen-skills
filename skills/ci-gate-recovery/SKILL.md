---
name: ci-gate-recovery
description: "Recover a blocked merge when a required check, external review, or protected-branch rule fails or times out. Covers retry, split, temporary bypass with restore, stacked PRs, and an audit trail. Load when a required check blocks a merge or branch protection rejects a push."
---

# CI Gate Recovery

> **Scope:** Resolve a blocked merge with verified evidence and leave the repository at least as protected as it started.

## Hard Rules

- Never fake, suppress, or manually mark a required check as passed.
- Never force-push a protected branch.
- Never disable all checks or delete a workflow to get a merge.
- A temporary bypass needs explicit approval, a backup, and a restore in the same operation.
- Leave the repository with at least the original protection.

## Decision Tree

1. **Establish local truth.** Run the repository gate. Record branch, head SHA, mergeability, required checks, and the protection JSON.
2. **Classify.** Code failure, config or secret, infrastructure timeout, missing check, review policy, or auth.
3. **Retry once for infrastructure.** Re-run the check or push a new head. Record the time and result.
4. **Reduce the diff.** Split by logical layer or stack the pull requests. Keep every head self-consistent and locally green.
5. **Retarget and update.** Base each pull request on main or the previous branch. After a merge, merge main into the next branch and push. Required checks must run on the head that will merge.
6. **Bypass only with approval.** Remove only the failing context, keep the rest, back up the protection JSON, merge in order, restore in a `trap` or finally block, then verify.
7. **Close the loop.** Verify main CI, protection, and branch cleanup. Add a failure-ledger entry.

## Bypass Protocol

See [ci-recovery.md](references/ci-recovery.md) for the API commands, backup shape, and restore checks.

The short version:

1. Save the required-status-checks object.
2. Patch out only the failing context.
3. Merge the verified heads.
4. Patch the original object back.
5. Prove the restored contexts and run main CI.

## Stacked PR Rules

- One logical layer per pull request.
- The base is main or the previous pull request branch.
- After the previous merge, retarget to main and update the branch.
- Required checks run on the current head.
- Merge bottom-up. Delete merged branches only after the stack lands.

## Evidence

- Local gate output.
- Check-run summary and the exact failure.
- Protection backup and restore output.
- Post-merge CI run.
- Failure-ledger entry.

## Anti-Patterns

- Bypassing because the check is "probably flaky".
- Removing the whole protection object.
- Merging with a red local gate.
- Leaving a branch protection bypass in place.
- Rebuilding a stack from memory after a failed merge.

## Verification

- The protection JSON matches the backup.
- Main CI is green.
- Every pull request is merged or closed with a reason.
- The ledger names the cause and the follow-up.

## Invocation

Load when:

- A required check fails or times out
- A protected branch rejects a push or merge
- A pull request stack needs retargeting
- The user says "CI is flaking", "merge is blocked", or "bypass this check"

## Related

- `pr-workflow`: the normal branch and merge path.
- `failure-to-regression`: record the recovery as a ledger entry.

## Provenance

Influenced by pstack's `babysit`, `shipping`, `autopilot-stack`, and `never-block-on-the-human` playbooks by Lauren Tan. See [THIRD_PARTY_NOTICES.md](../../THIRD_PARTY_NOTICES.md).
