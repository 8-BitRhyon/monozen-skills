---
name: git-workflow
description: Commit signing (SSH), history purge, branch hygiene, and pre-commit universal guard for Monozen repos.
---

# Git Workflow (Monozen)

## Rules
- `commit.gpgsign=true` + `gpg.format=ssh` (`.git/config`).
- `allowed_signers` at `~/.ssh/allowed_signers`.
- Installable pre-commit hook (`scripts/install-hooks.sh`) runs skill validation + manifest sync. Secrets/IDs are handled by the universal guard in `skills/monozen-portfolio/security-guard-universal.sh`, run at commit/deploy time in the repo being guarded.
- Never add an agent name as a commit co-author.
- History purge: run `bash scripts/purge-history.sh <path>` (filter-branch + reflog expire + gc). Never type the filter-branch pipeline by hand; the script is the single source of truth.
- Branch hygiene: `git branch --merged | grep -v main | xargs -r git branch -d` after merge; `git fetch --prune` after PR deletions.

## Invocation

Load when:
- Configuring commit signing, branch hygiene, or history cleanup
- User asks "sign commits", "set up git", "purge history"
- Before the first commit in a new repo (see `new-project`)
