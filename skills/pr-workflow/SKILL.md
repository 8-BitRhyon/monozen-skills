---
name: pr-workflow
description: "Universal pull request lifecycle for any GitHub repo: branch strategy, PR creation, CI checks, review gate, merge (including protected branches), and cleanup. Load when opening, reviewing, or merging a PR, or pushing to a protected branch."
---

# Pull Request Workflow (Universal)

> **Scope:** The complete path from feature branch to merged change, in any GitHub repository, with or without branch protection. Codifies the sequence so agents never improvise the git dance.

## Branch

- One branch per logical change: `feat/<slug>`, `fix/<slug>`, `chore/<slug>`, `docs/<slug>`.
- Base off latest main: `git fetch origin && git switch -c feat/slug origin/main`.
- Never commit directly to `main`; always work through a branch (required when main is protected).

## Commit

- Conventional commits, one logical change per commit: `feat:`, `fix:`, `refactor:`, `docs:`, `chore:`, `test:`, `ci:`.
- Sign commits per `git-workflow` (SSH). Never co-author an agent.

## Open PR

Use the AXI wrapper (`gh-axi`) for token-efficient output - never raw `gh` (AGENTS.md AXI doctrine):

```bash
npx -y gh-axi pr create --base main --head feat/slug \
  --title "feat: one-line summary" \
  --body "## What\n## Why\n## How verified"
```

PR body must state: what changed, why, and the verification evidence (tests, runtime checks).

## Iterate

- Push fixups: `git push`. Force-push only your own feature branch with `--force-with-lease`.
- Rebase on main before merge: `git fetch origin && git rebase origin/main` (keeps history linear).
- If checks fail, fix locally, rerun the gate, push again. Never merge red.

## Checks + Review

- Wait for CI: re-run `npx -y gh-axi pr checks <n>` until all checks pass (validate + secrets jobs in this repo); gh-axi has no `--watch` flag, or use `gh pr checks <n> --watch` for live polling.
- **Independent review gate (mandatory, non-negotiable):** before merge, run a fresh-context review of the diff via a separate review agent/session - never review your own work in the session that wrote it. Load the `code-review` skill in a clean context (new worktree or new pane), apply the five dimensions, tag findings blocker/should/nit.
- Blockers must be fixed; shoulds tracked or fixed. No merge with open blockers.
- Required status checks must pass before merge on protected branches.

## Merge

- Protected main: `npx -y gh-axi pr merge <n> --merge --delete-branch` (or squash for one-commit-per-change repos).
- Unprotected: fast-forward merge after local gate: `git checkout main && git pull --ff-only && git merge --ff-only feat/slug`.
- Confirm merge: `git log --oneline -3` shows the merge + feature commit; remote reflects it.

## Cleanup

- Delete the branch locally: `git branch -d feat/slug` (merged) or `git push origin --delete feat/slug`.
- Release worktrees back to the pool: `treehouse return` (or `git worktree remove`).
- Verify clean: `git status` clean, `git worktree list` shows only the base tree.

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
