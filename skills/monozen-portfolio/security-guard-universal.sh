#!/usr/bin/env bash
# Universal Security Guard - blocks commits with IDs, secrets, fingerprints, tokens, or audit docs.
# Works on ANY repo. No hardcoded project IDs, paths, or stack-specific policies.
# Repos may add their own checks via an optional .guard-policy.sh (sourced if present).
set -e
FAIL=0

echo "=== UNIVERSAL SECURITY GUARD ==="

# Generic ID/secret/fingerprint patterns (not project-specific)
PATTERNS='(sha256-[a-zA-Z0-9+/]{20,}|[0-9a-f]{32,40}|Zone ID:|Account ID:|CLOUDFLARE_ACCOUNT_ID|fingerprint|cf_clearance|ghp_[A-Za-z0-9]{36}|sk-[A-Za-z0-9]{20,}|AKIA[0-9A-Z]{16})'

# 1. No audit/internal docs tracked
if git ls-files | grep -qiE '(^|/)AUDIT\.md$|(^|/)m-hack-|(^|/)internal[-_]?notes?\.md$'; then
  echo "BLOCKED: Internal/audit doc tracked."
  FAIL=1
fi

# 2. No sensitive pattern in tracked text files
MATCHES=$(git ls-files -- '*.md' '*.txt' '*.json' '*.yml' '*.yaml' '*.toml' '*.ini' '*.env' '*.sh' \
  | grep -vE 'package-lock\.json|package\.json|skills-lock\.json|pnpm-lock\.yaml|yarn\.lock' \
  | xargs grep -niE "$PATTERNS" 2>/dev/null || true)
if [ -n "$MATCHES" ]; then
  echo "BLOCKED: Sensitive pattern found in tracked files:"
  echo "$MATCHES" | head -10
  FAIL=1
fi

# 3. Signing check (skip if repo does not require signing)
SIGN_REQUIRED="$(git config --get commit.gpgsign 2>/dev/null || echo false)"
if [ "${SIGN_REQUIRED}" = "true" ]; then
  LAST_SIG=$(git log --show-signature -1 --format='%G?' 2>/dev/null | tail -1)
  if [ "$LAST_SIG" != "G" ]; then
    echo "BLOCKED: Last commit unsigned (repo requires signing)."
    FAIL=1
  fi
fi

# 4. Repo-specific policy hook (optional, additive)
if [ -f .guard-policy.sh ]; then
  # shellcheck source=/dev/null
  source .guard-policy.sh
fi

if [ "$FAIL" -eq 1 ]; then
  echo "GUARD FAILED - fix above before committing."
  exit 1
fi
echo "PASS: Universal guard cleared."
