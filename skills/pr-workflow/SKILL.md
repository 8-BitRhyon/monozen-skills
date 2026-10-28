---
name: pr-workflow
description: "Universal pull request lifecycle for any GitHub repo: branch strategy, PR creation, CI checks, review gate, merge (including protected branches), and cleanup. Load when opening, reviewing, or merging a PR, or pushing to a protected branch."
---

# Pull Request Workflow (Universal)

> **Scope:** The complete path from feature branch to merged change in any GitHub repository.

## Branch & Commit

- One branch per logical change: `feat/<slug>`, `fix/<slug>`, `chore/<slug>`.
- Base off latest main: `git fetch origin && git switch -c feat/slug origin/main`. Never commit directly to protected main.
- Conventional commits, signed via `git-workflow` (SSH): `feat:`, `fix:`, `refactor:`, `test:`, `ci:`.

## Open PR

### 1. Automated Gateway: no-mistakes (Preferred)
```bash
git push no-mistakes feat/slug
```
The proxy validates in a disposable worktree, auto-fixes mechanical issues, forwards to origin, and opens the PR. Setup, finding classes, and headless usage: [no-mistakes.md](references/no-mistakes.md).

### 2. Manual AXI CLI
```bash
npx -y gh-axi pr create --base main --head feat/slug \
  --title "feat: one-line summary" \
  --body "## What\n## Why\n## How verified"
```

## Checks & Review

- Wait for CI: `npx -y gh-axi pr checks <n>` (or `gh pr checks <n> --watch`).
- **Independent review gate (mandatory):** Review the diff in a separate session (clean worktree or pane). Load `code-review`: spec compliance first, then correctness and security, style out of scope. Fix blockers before merge.

## Merge & Cleanup

- Protected main: `npx -y gh-axi pr merge <n> --merge --delete-branch` (or squash).
- Unprotected: `git checkout main && git pull --ff-only && git merge --ff-only feat/slug`.
- Cleanup: delete local branch (`git branch -d feat/slug`), release worktrees (`treehouse return`). Verify `git status` clean.

## Rules

- Push is not merge: a branch is a draft until CI passes and review approves.
- Never bypass branch protection with force-push to shared branches.
- Rebase, don't merge `main` into your feature branch (linear history).

## Verification

- `npx -y gh-axi pr view <n>` shows open PR, passing required checks, review approval.
- After merge: branch deleted, worktrees returned, local `main` at `origin/main`.
- History is linear: `git log --oneline --graph` shows no merge bubbles from main.

## Invocation

Load when:
- Opening or merging a PR
- Push was rejected (protected branch)
- User says "open a PR", "merge it", "push this up", "review my PR"
