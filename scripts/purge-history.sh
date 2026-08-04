#!/usr/bin/env bash
# scripts/purge-history.sh - Permanently remove a file from git history.
# USE WITH CARE: rewrites history, invalidates clone SHAs, requires force-push.
#
# Usage: bash scripts/purge-history.sh <path/to/file>
# After running, force-push with: git push --force-with-lease origin <branch>

set -euo pipefail

if [ $# -ne 1 ]; then
  echo "Usage: $0 <path/to/file>" >&2
  exit 2
fi

TARGET="$1"

if ! git ls-files --error-unmatch "${TARGET}" >/dev/null 2>&1; then
  echo "Target not tracked by git: ${TARGET}" >&2
  exit 1
fi

echo "=== Purging ${TARGET} from history ==="
# The target travels via env so the index-filter string stays single-quoted
# (no interpolation, no injection; paths with spaces are safe).
export GIT_TARGET="${TARGET}"
git filter-branch --index-filter 'git rm --cached --ignore-unmatch -- "$GIT_TARGET"' \
  --prune-empty --tag-name-filter cat -- --all

echo "=== Expiring reflog + GC ==="
git reflog expire --expire-unreachable=now --all
rm -rf "$(git rev-parse --git-dir)/refs/original" 2>/dev/null || true
git gc --prune=now --aggressive

echo "=== Done. Force-push with: ==="
echo "  git push --force-with-lease origin <branch>"
echo "WARNING: all clone SHAs are now invalid; coordinate with any collaborators."
