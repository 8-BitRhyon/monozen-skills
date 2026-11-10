# no-mistakes Gateway

Optional pre-landing gate. Push to the local proxy instead of `origin`; it validates in a disposable worktree, auto-fixes mechanical issues, forwards the branch, and opens the PR.

## Setup

```bash
no-mistakes init
git remote -v   # confirm the no-mistakes remote exists
```

## Use

```bash
# Push a branch through the gate
git push no-mistakes feat/my-feature

# Interactive review
no-mistakes

# Headless agent interface
no-mistakes axi status
no-mistakes axi review --accept-autofix
```

## Finding Classes

- `auto-fix`: lint, formatting, trivial imports, type annotations. Applied automatically or with one approval.
- `ask-user`: structural or behavioral decisions. Approve, fix, or skip explicitly.

## Standards

- Never force-push or bypass the gate when it is configured.
- Treat a refusal as evidence of a regression, not an obstacle.
- Headless runs use the TOON-native `no-mistakes axi` interface.
- A green gate is not a review. Run `code-review` in a fresh context before merge.

## Crew Integration

When a worker finishes a task, it reports the PR URL and green checks. The captain verifies the URL on the target branch before closing the task and releasing the worktree.

## When To Use

Use when the repository is initialized for no-mistakes and the change is ready to land. Otherwise use the manual path in `pr-workflow`.
