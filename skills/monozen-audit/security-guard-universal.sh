#!/bin/zsh
# Universal Security Guard - blocks commits/pushes with any ID, secret, fingerprint, token, or audit doc.
# Works on ANY repo. No hardcoded project IDs.
set -e
FAIL=0

echo "=== UNIVERSAL SECURITY GUARD ==="

# Generic ID/secret/fingerprint patterns (not project-specific)
PATTERNS='(sha256-[a-zA-Z0-9+/]{20,}|[0-9a-f]{32,40}|Zone ID:|Account ID:|CLOUDFLARE_ACCOUNT_ID|fingerprint|cf_clearance)'

# 1. No audit/internal docs tracked
if git ls-files | grep -qiE '(^|/)AGENTS\.md$|(^|/)AUDIT\.md$|(^|/)m-hack-'; then
  echo "BLOCKED: Internal/audit doc tracked."
  FAIL=1
fi

# 2. Any sensitive pattern in tracked .md / .txt / .json / .yml / .yaml / .md files
MATCHES=$(git ls-files -- '*.md' '*.txt' '*.json' '*.yml' '*.yaml' | grep -vE 'package-lock\.json|package\.json|design\.md|monozen-audit/|skills-lock\.json' | xargs grep -niE "$PATTERNS" 2>/dev/null || true)
if [ -n "$MATCHES" ]; then
  echo "BLOCKED: Sensitive pattern found in tracked docs:"
  echo "$MATCHES" | head -10
  FAIL=1
fi

# 3. No legacy image filenames (project-agnostic patterns)
if git ls-files | grep -qiE '(^|/)logo\.png$|(^|/)RhyonHeadshot\.png$|(^|/)RhyonDoodle\.png$'; then
  echo "BLOCKED: Legacy PNG assets tracked."
  FAIL=1
fi

# 4. No root test files if policy requires removal
if git ls-files | grep -q '^test/.*\.test\.js$'; then
  echo "BLOCKED: Root test files tracked (policy violation)."
  FAIL=1
fi

# 5. .gitignore must cover temp/dev artifacts
for p in '^test/$' '^e2e/$' '^\.dev\.vars$' '^archive/$'; do
  if ! grep -q "$p" .gitignore 2>/dev/null; then
    echo "BLOCKED: .gitignore missing '$p'."
    FAIL=1
  fi
done

# 6. Signing check
LAST_SIG=$(git log --show-signature -1 --format='%G?' 2>/dev/null | tail -1)
if [ "$LAST_SIG" != "G" ]; then
  echo "BLOCKED: Last commit unsigned."
  FAIL=1
fi

if [ "$FAIL" -eq 1 ]; then
  echo "GUARD FAILED - fix above before committing."
  exit 1
fi
echo "PASS: Universal guard cleared."
