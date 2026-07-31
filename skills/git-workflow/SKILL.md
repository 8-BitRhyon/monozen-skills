---
name: git-workflow
description: Commit signing (SSH), history purge, branch hygiene, and pre-commit universal guard for Monozen repos.
---

# Git Workflow (Monozen)

## Rules
- `commit.gpgsign=true` + `gpg.format=ssh` (`.git/config`).
- `allowed_signers` at `~/.ssh/allowed_signers`.
- Universal guard (`.git/hooks/pre-commit`) blocks IDs, audit docs, legacy filenames, unsigned commits.
- History purge: `git filter-branch --index-filter 'git rm --cached --ignore-unmatch <file>' --prune-empty --tag-name-filter cat -- --all` + `git reflog expire --expire-unreachable=now --all && git gc --prune=now --aggressive`.
