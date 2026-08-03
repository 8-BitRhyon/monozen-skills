#!/usr/bin/env bash
# scripts/smoke-test.sh - Deterministic consumer smoke test.
# Executes the new-project protocol end-to-end in a temp dir and proves the
# scaffold is runnable: required templates exist, AGENTS.md is a valid agent
# contract, validate.yml parses and is SHA-pinned, .gitignore is non-empty.
# Zero LLM, zero tokens, ~1s. Runs in CI.
#
# Usage: bash scripts/smoke-test.sh

set -euo pipefail

REPO_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
SKILL_DIR="${REPO_DIR}/skills/new-project"
TMP="$(mktemp -d)"
trap 'rm -rf "${TMP}"' EXIT

FAIL=0
check() {
  local ok=$1; shift
  if [ "$ok" = "ok" ]; then
    echo "  [pass] $*"
  else
    echo "  [FAIL] $*"
    FAIL=1
  fi
}

echo "=== [smoke] new-project protocol ==="

# 1. Required templates exist
for t in AGENTS.md .gitignore validate.yml design.md; do
  check "$([ -f "${SKILL_DIR}/templates/${t}" ] && echo ok || echo no)" "template exists: ${t}"
done

# 2. Scaffold into temp dir
cp "${SKILL_DIR}/templates/AGENTS.md" "${TMP}/AGENTS.md"
cp "${SKILL_DIR}/templates/.gitignore" "${TMP}/.gitignore"
mkdir -p "${TMP}/.github/workflows"
cp "${SKILL_DIR}/templates/validate.yml" "${TMP}/.github/workflows/validate.yml"
cp "${SKILL_DIR}/templates/design.md" "${TMP}/design.md"

# 3. AGENTS.md is a valid agent contract (required sections)
for sec in "## Purpose" "## Commands" "## Standards" "## Process"; do
  check "$(grep -q "${sec}" "${TMP}/AGENTS.md" && echo ok || echo no)" "AGENTS.md has section: ${sec}"
done

# 4. AGENTS.md has no em dashes (U+2014)
check "$(! grep -q $'\u2014' "${TMP}/AGENTS.md" && echo ok || echo no)" "AGENTS.md has zero em dashes"

# 5. validate.yml parses as YAML
check "$(ruby -e 'require "yaml"; YAML.safe_load(File.read(ARGV[0]))' "${TMP}/.github/workflows/validate.yml" 2>/dev/null && echo ok || echo no)" "validate.yml parses as YAML"

# 6. Actions are SHA-pinned (40-hex), never mutable tags
PINNED=$(grep -cE 'uses: [a-z0-9-]+/[a-z0-9-]+@[0-9a-f]{40}' "${TMP}/.github/workflows/validate.yml" || true)
TAGS=$(grep -cE 'uses: [a-z0-9-]+/[a-z0-9-]+@v[0-9]' "${TMP}/.github/workflows/validate.yml" || true)
check "$([ "${PINNED}" -ge 2 ] && [ "${TAGS}" -eq 0 ] && echo ok || echo no)" "validate.yml actions SHA-pinned (${PINNED} pinned, ${TAGS} tags)"

# 7. .gitignore is non-empty and covers env/secrets
check "$([ -s "${TMP}/.gitignore" ] && echo ok || echo no)" ".gitignore non-empty"
check "$(grep -q '^.env' "${TMP}/.gitignore" && echo ok || echo no)" ".gitignore covers .env"

echo ""
if [ "${FAIL}" -eq 0 ]; then
  echo "=== [smoke] PASS: scaffold is runnable ==="
  exit 0
else
  echo "=== [smoke] FAIL: fix the failures above ==="
  exit 1
fi
