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
- History purge: `git filter-branch --index-filter 'git rm --cached --ignore-unmatch <file>' --prune-empty --tag-name-filter cat -- --all` + `git reflog expire --expire-unreachable=now --all && git gc --prune=now --aggressive`.
