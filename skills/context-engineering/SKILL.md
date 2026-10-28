---
name: context-engineering
description: "Manages agent context as a budget: what to load, what to drop, when to compact, and how to hand off. Use when a session grows long, an agent loses state, or context files need pruning."
---

# Context Engineering

> Context is a budget, not a library. Load the smallest set that changes the next action. Compact before the window forces you to.

## Evidence

- Context rot: accuracy falls as input grows, even on verbatim tasks. Focused prompts beat full histories.
- Repository context files rarely improve success and add about 20% cost. Instructions are followed; overviews are not useful.
- Context editing plus memory cut tokens by 84% on a 100-turn run while improving results.

Load non-standard invariants, not a tour of the repo.

## Load Order

1. **Contract.** `AGENTS.md` for commands, invariants, and pitfalls. Skip repo overviews the model can infer from code.
2. **Task slice.** The files to edit, their nearest tests, and one caller. Not the whole tree.
3. **Runtime baseline.** The current behavior, captured with a command, test, or browser check.
4. **History.** Only when blocked: `git log` on the touched file, prior attempts, open issues.

Stop when the next action is clear. More reading is not progress.

## Budget Rules

- Keep the prefix byte-stable. No timestamps or volatile state in headers.
- Load references on demand, one level deep.
- Prefer targeted reads over bulk dumps. If you read 20 files and edited none, narrow the task.
- Drop superseded tool output before adding new context.
- When a fact is stable, write it to the contract. Do not re-derive it each session.

## Compaction And Handoff

Compact into a state document, not a narrative:

```markdown
# Handoff
- Goal:
- Decisions and why:
- Constraints:
- Touched paths:
- Failed attempts:
- Open bugs:
- Next action:
- Verify with:
```

Rules:

- Keep restorable pointers: URL, not page; path, not document; commit, not diff.
- Keep the last 5 files and the decisions that constrain them.
- Drop raw tool output and superseded attempts.
- Write the handoff to a file so the next session can load it without the transcript.

## Subagents

- Use subagents for read-only breadth, isolated exploration, and verification.
- One writer. The captain owns edits; parallel writers need isolated worktrees and a merge owner.
- Return a 1-2k summary plus a durable path. Never return a transcript.

## Verification

- A fresh session can state the commands, invariants, and next action from the handoff.
- Replaying the handoff reproduces the verification result.
- The context contains no tool names or paths that no longer exist.

## Anti-Patterns

- File-tree tours and architecture prose the code already shows.
- A giant `AGENTS.md` that repeats the README.
- Re-reading the same files every session.
- "Just in case" context that competes with the task.
- Compaction that drops decisions and keeps chatter.

## Ownership

`project-constitution` creates the contract. This skill decides what to load from it and when to compact.

## Invocation

Load when:

- A session is long, slow, or losing state.
- An agent repeats work or forgets a decision.
- `AGENTS.md` or a handoff needs pruning.
- You are about to dispatch subagents.
