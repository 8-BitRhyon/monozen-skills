#!/usr/bin/env bash
set -euo pipefail

# monozen-skills - Workstation Bootstrap
# Installs all external skills, herdr plugins, and tools for a fresh machine.
# Run after cloning the repo: bash scripts/setup.sh

REPO_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"

echo "==> monozen-skills bootstrap"
echo ""

# ── Prerequisites ──────────────────────────────────────────────
# Requires: node (>=18), npm, gh (authenticated), herdr (>=0.7.1)

if ! command -v node &>/dev/null; then echo "ERROR: node not found" >&2; exit 1; fi
if ! command -v gh &>/dev/null; then echo "ERROR: gh not found" >&2; exit 1; fi
if ! command -v herdr &>/dev/null; then echo "ERROR: herdr not found" >&2; exit 1; fi

# ── 1. Install monozen canonical skills ────────────────────────
echo ":: Installing monozen canonical skills..."
npx skills add 8-BitRhyon/monozen-skills

# ── 2. Install external skills ─────────────────────────────────
echo ":: Installing gh-axi (GitHub CLI wrapper)..."
npx skills add kunchenguid/gh-axi --skill gh-axi -g --yes || true

echo ":: Installing chrome-devtools-axi (browser automation)..."
npx skills add kunchenguid/chrome-devtools-axi --skill chrome-devtools-axi -g --yes || true

echo ":: Installing tasks-axi (markdown backlog)..."
npx skills add kunchenguid/tasks-axi --skill tasks-axi -g --yes || true

echo ":: Installing quota-axi (provider quota status)..."
npx skills add kunchenguid/quota-axi --skill quota-axi -g --yes || true

echo ":: Installing find-skills..."
npx skills add vercel-labs/skills --skill find-skills -g --yes || true

echo ":: Installing Pi companion packages..."
npm install -g --ignore-scripts @earendil-works/pi-coding-agent || true
mkdir -p ~/.pi/agent/extensions
cp "${REPO_DIR}/skills/pi-agent/templates/terminal-title.ts" ~/.pi/agent/extensions/ || true
if [ -f ~/.pi/agent/settings.json ]; then
  cp ~/.pi/agent/settings.json ~/.pi/agent/settings.json.bak.$(date +%s)
fi
cp "${REPO_DIR}/skills/pi-agent/templates/settings.json" ~/.pi/agent/settings.json || true

echo ":: Pi packages declared in settings.json (auto-install on Pi >=0.82): pi-herdr, pi-worktree"

echo ":: Installing treehouse (pooled git worktrees)..."
if ! command -v treehouse &>/dev/null; then
  curl -fsSL https://kunchenguid.github.io/treehouse/install.sh | sh || true
fi
if command -v treehouse &>/dev/null && [ ! -f ~/.config/treehouse/config.toml ]; then
  echo ":: Initializing treehouse config..."
  treehouse init || true
fi

echo ":: Installing firstmate (captain-and-crew agent distro)..."
if [ ! -d ~/firstmate/.git ]; then
  git clone --depth 1 https://github.com/kunchenguid/firstmate ~/firstmate || true
fi

# ── 3. Install herdr plugins ──────────────────────────────────
echo ":: Installing herdr-file-viewer (git-aware TUI file viewer)..."
herdr plugin install smarzban/herdr-file-viewer --yes || true

echo ":: Installing herdr-reviewr (code review sidebar)..."
herdr plugin install persiyanov/herdr-reviewr --yes || true

echo ":: Installing herdr-spreader (YAML workspace layouts)..."
herdr plugin install yuk1ty/herdr-spreader --yes || true

echo ":: Installing herdr-plus (projects + quick actions)..."
herdr plugin install cloudmanic/herdr-plus --yes || true

echo ":: Installing github-start (launch agent from issue/PR)..."
herdr plugin install ogulcancelik/herdr-plugin-github-start --yes || true

echo ":: Installing vim-herdr-navigation (unified Ctrl+h/j/k/l across editor/panes)..."
herdr plugin install paulbkim-dev/vim-herdr-navigation --yes || true

echo ":: Installing herdr-tab-rename (auto-sync tab name to cwd/branch)..."
herdr plugin install lmilojevicc/herdr-tab-rename --yes || true

echo ":: Installing llmtrim-herdr (token usage optimization)..."
herdr plugin install fkiene/llmtrim-herdr --yes || true

# ── 4. Post-install verification ──────────────────────────────
echo ""
echo "==> Verifying installation..."
VERIFY_FAIL=0
for tool in node npm gh herdr pi treehouse; do
  if command -v "${tool}" &>/dev/null; then
    echo "  [ok] ${tool}"
  else
    echo "  [MISSING] ${tool}"
    VERIFY_FAIL=1
  fi
done
if [ -d ~/.agents/skills ]; then
  echo "  [ok] skills dir (~/.agents/skills, $(ls ~/.agents/skills | wc -l | tr -d ' ') entries)"
else
  echo "  [MISSING] ~/.agents/skills (run: npx skills add 8-BitRhyon/monozen-skills)"
  VERIFY_FAIL=1
fi
if [ -f ~/.pi/agent/settings.json ]; then
  echo "  [ok] Pi settings.json (pinned packages declared)"
else
  echo "  [MISSING] ~/.pi/agent/settings.json"
  VERIFY_FAIL=1
fi
if command -v treehouse &>/dev/null; then
  treehouse status >/dev/null 2>&1 && echo "  [ok] treehouse pool responds" || echo "  [warn] treehouse status failed (no repo context is fine)"
fi

echo ""
if [ "${VERIFY_FAIL}" -eq 0 ]; then
  echo "==> All required tools present. Restart your agent session for skills to load."
else
  echo "==> Some required tools missing (see [MISSING] above). Re-run or install manually."
fi
