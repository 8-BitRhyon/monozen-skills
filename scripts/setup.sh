#!/usr/bin/env bash
set -euo pipefail

# monozen-skills — Workstation Bootstrap
# Installs all external skills, herdr plugins, and tools for a fresh machine.
# Run after cloning the repo: bash scripts/setup.sh

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

echo ":: Installing herdr control skill..."
npx skills add ogulcancelik/herdr --skill herdr -g --yes || true

echo ":: Installing find-skills..."
npx skills add vercel-labs/skills --skill find-skills -g --yes || true

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

# ── 4. Prompt for optional tools ───────────────────────────────
echo ""
echo "==> Optional tools (install manually if needed):"
echo "  - herdr-remote:     herdr plugin install dcolinmorgan/herdr-remote"
echo "  - ghzinga:          herdr plugin install dutifuldev/ghzinga"
echo "  - herdr-sessionizer: herdr plugin install andrewchng/herdr-sessionizer"
echo "  - agentbox:         herdr plugin install madarco/agentbox"
echo ""

echo "==> Done. Restart your agent session for skills to load."
