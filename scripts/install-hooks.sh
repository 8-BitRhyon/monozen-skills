#!/usr/bin/env bash
# scripts/install-hooks.sh - Installs the monozen-skills pre-commit hook (shift-left).
# The hook runs the local gate (validate + test + manifest sync); CI adds the
# SHA-pinned actions check and gitleaks secrets scan on top.
#
# Usage: bash scripts/install-hooks.sh [--remove]

set -euo pipefail

REPO_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
HOOK_PATH="${REPO_DIR}/.git/hooks/pre-commit"

if [ "${1:-}" = "--remove" ]; then
  rm -f "${HOOK_PATH}"
  echo "[hooks] Removed pre-commit hook."
  exit 0
fi

cat > "${HOOK_PATH}" <<'HOOK'
#!/usr/bin/env bash
set -euo pipefail

REPO_DIR="$(git rev-parse --show-toplevel)"
echo "=== [pre-commit] Running skill validation suite ==="
"${REPO_DIR}/scripts/validate.sh"

echo "=== [pre-commit] Running validator self-tests ==="
bash "${REPO_DIR}/scripts/test.sh" >/dev/null

echo "=== [pre-commit] Checking manifest sync ==="
bash "${REPO_DIR}/scripts/manifest.sh" >/dev/null
cd "${REPO_DIR}"
git diff --exit-code --quiet skills-lock.json || {
  echo "❌ skills-lock.json is out of sync. Run 'npm run manifest' and commit the result."
  exit 1
}

echo "=== [pre-commit] OK ==="
HOOK
chmod +x "${HOOK_PATH}"

echo "[hooks] Installed pre-commit hook at ${HOOK_PATH}"
