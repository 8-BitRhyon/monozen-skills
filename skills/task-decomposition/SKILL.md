---
name: task-decomposition
description: Breaks complex engineering requests into ordered, independent, testable tasks with a PLAN.md artifact, acceptance criteria, and a verification command per task. Use when a request spans more than three files or two concepts.
---

# Task Decomposition

> One task, one outcome, one verify command. If a task cannot fail, it is not a task.

## Output: PLAN.md

- Goal and non-goals, one paragraph.
- Tasks in dependency order, grouped as parallel or sequential.
- Per task: files, interface, failing check, verify command, rollback.
- Open questions with an owner.

```markdown
## Goal
## Non-goals
## Tasks
- [ ] T1: <outcome>
  - Files:
  - Check:
  - Verify:
  - Depends on:
## Open questions
```

## Rules

- **Atomic:** one verifiable outcome.
- **Independent:** no shared mutable state; parallel tasks own disjoint files.
- **Ordered:** mark blocked tasks and the unblocker.
- **Sized:** minutes, not hours. More than 3 files or 2 concepts means split again.
- **Scale down:** a trivial change skips the plan and goes straight to build, test, land.

## Verification Ladder

Pick the cheapest level that proves the claim:

1. LLM self-check
2. Lint or typecheck
3. Unit test
4. Integration test
5. Browser or CLI observation
6. Deploy preview plus smoke
7. Production canary with rollback

State the command and the observed result. Never claim a level you did not run.

## Exit And Escalation

- Max 3 plan -> act -> verify iterations per task.
- Two failures with the same root cause: stop guessing, re-read the code, change the hypothesis.
- Scope grows past 3 files or 2 concepts: stop and split.
- Escalate with what was tried, the failing evidence, and the decision needed.

## Parallelism

- Read-only searches can run together.
- Independent files or test suites can run in parallel worktrees.
- Never parallelize shared file writes or sequential dependencies.

## Invocation

Load when:

- A request spans more than 3 files or 2 concepts.
- You feel "where do I start?"
- Previous work had missed steps or rework.
- Planning a multi-session effort.
- The scope is still ambiguous: run `alpha-loop` first.
