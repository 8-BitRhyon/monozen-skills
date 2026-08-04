#!/usr/bin/env bash
# scripts/install.sh - One-shot workstation bootstrap for the monozen agent stack.
#
# Works standalone (piped from the remote one-liner, no clone needed) or from a
# cloned repo. Compartmentalized: install all of it, or just the skills.
#
# Usage:
#   bash scripts/install.sh [--all]                 full workstation (default)
#   bash scripts/install.sh --skills                agent skills only (minimal)
#   bash scripts/install.sh --pi --treehouse        selected compartments
#   bash scripts/install.sh --with-prereqs          brew-install missing node/gh/herdr
#   bash scripts/install.sh --dry-run               print steps, execute nothing
#
# Compartments: --skills --pi --treehouse --firstmate --herdr-plugins
# Exit: 0 ok, 1 one or more steps failed, 2 prerequisites missing.

set -uo pipefail

RAW_BASE="https://raw.githubusercontent.com/8-BitRhyon/monozen-skills/main"
REPO_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." 2>/dev/null && pwd || echo '')"

WANT_SKILLS=0; WANT_PI=0; WANT_TREEHOUSE=0; WANT_FIRSTMATE=0; WANT_PLUGINS=0
WITH_PREREQS=0; DRY_RUN=0

for arg in "$@"; do
  case "${arg}" in
    --all) WANT_SKILLS=1; WANT_PI=1; WANT_TREEHOUSE=1; WANT_FIRSTMATE=1; WANT_PLUGINS=1 ;;
    --skills) WANT_SKILLS=1 ;;
    --pi) WANT_PI=1 ;;
    --treehouse) WANT_TREEHOUSE=1 ;;
    --firstmate) WANT_FIRSTMATE=1 ;;
    --herdr-plugins) WANT_PLUGINS=1 ;;
    --with-prereqs) WITH_PREREQS=1 ;;
    --dry-run) DRY_RUN=1 ;;
    --help|-h)
      sed -n '1,14p' "${BASH_SOURCE[0]}" | sed 's/^# \{0,1\}//'
      exit 0 ;;
    *) echo "Unknown option: ${arg} (see --help)"; exit 2 ;;
  esac
done

if [ "${WANT_SKILLS}${WANT_PI}${WANT_TREEHOUSE}${WANT_FIRSTMATE}${WANT_PLUGINS}" = "00000" ]; then
  WANT_SKILLS=1; WANT_PI=1; WANT_TREEHOUSE=1; WANT_FIRSTMATE=1; WANT_PLUGINS=1
fi

OK=0; SKIP=0; FAILED=0
step_ok() {
  if [ "${DRY_RUN}" -eq 1 ]; then echo "  [dry]  $*"; else echo "  [ok]   $*"; fi
  OK=$((OK+1))
}
step_skip() { echo "  [skip] $*"; SKIP=$((SKIP+1)); }
step_fail() { echo "  [fail] $*"; FAILED=$((FAILED+1)); }

run() {
  [ "${DRY_RUN}" -eq 1 ] && return 0
  "$@" >/dev/null 2>&1
}

echo "==> monozen-skills bootstrap $(if [ "${DRY_RUN}" -eq 1 ]; then echo '(dry-run)'; fi)"

# ---------------------------------------------------------------
# Prerequisites: node, npm, gh, herdr
# ---------------------------------------------------------------
MISSING=()
for tool in node npm gh herdr; do
  command -v "${tool}" >/dev/null 2>&1 || MISSING+=("${tool}")
done

if [ "${#MISSING[@]}" -gt 0 ]; then
  if [ "${WITH_PREREQS}" -eq 1 ]; then
    if command -v brew >/dev/null 2>&1; then
      for tool in "${MISSING[@]}"; do
        echo ":: Installing ${tool} via brew..."
        if [ "${DRY_RUN}" -eq 1 ]; then
          echo "  [dry]  brew install ${tool}"
        elif brew install "${tool}" >/dev/null 2>&1; then
          step_ok "brew install ${tool}"
        else
          step_fail "brew install ${tool}"
        fi
      done
    else
      echo "ERROR: --with-prereqs needs Homebrew (https://brew.sh)." >&2
      exit 2
    fi
  else
    echo "ERROR: missing prerequisites: ${MISSING[*]}" >&2
    echo "  Install them, or re-run with --with-prereqs (Homebrew auto-install):" >&2
    for tool in "${MISSING[@]}"; do
      if [ "${tool}" = "herdr" ]; then echo "  brew install herdr" >&2
      else echo "  brew install ${tool}" >&2; fi
    done
    exit 2
  fi
fi

# ---------------------------------------------------------------
# Compartment: skills (canonical + external agent skills)
# ---------------------------------------------------------------
install_skills() {
  echo "==> Compartment: agent skills"
  run npx -y skills add 8-BitRhyon/monozen-skills && step_ok "canonical monozen skills" || step_fail "canonical monozen skills"
  run npx -y skills add kunchenguid/gh-axi --skill gh-axi -g --yes && step_ok "gh-axi" || step_fail "gh-axi"
  run npx -y skills add kunchenguid/chrome-devtools-axi --skill chrome-devtools-axi -g --yes && step_ok "chrome-devtools-axi" || step_fail "chrome-devtools-axi"
  run npx -y skills add kunchenguid/tasks-axi --skill tasks-axi -g --yes && step_ok "tasks-axi" || step_fail "tasks-axi"
  run npx -y skills add kunchenguid/quota-axi --skill quota-axi -g --yes && step_ok "quota-axi" || step_fail "quota-axi"
  run npx -y skills add vercel-labs/skills --skill find-skills -g --yes && step_ok "find-skills" || step_fail "find-skills"
}

# ---------------------------------------------------------------
# Compartment: Pi agent runtime
# ---------------------------------------------------------------
fetch_repo_file() {
  local rel="$1" dest="$2"
  if [ -n "${REPO_DIR}" ] && [ -f "${REPO_DIR}/${rel}" ]; then
    run cp "${REPO_DIR}/${rel}" "${dest}"
  else
    run curl -fsSL "${RAW_BASE}/${rel}" -o "${dest}"
  fi
}

install_pi() {
  echo "==> Compartment: Pi agent runtime"
  if [ "${DRY_RUN}" -eq 0 ] && ! command -v pi >/dev/null 2>&1; then
    run npm install -g --ignore-scripts @earendil-works/pi-coding-agent
  fi
  if command -v pi >/dev/null 2>&1 || [ "${DRY_RUN}" -eq 1 ]; then
    step_ok "pi binary"
  else
    step_fail "pi binary"
  fi
  run mkdir -p ~/.pi/agent/extensions
  if [ ! -f ~/.pi/agent/extensions/terminal-title.ts ] || [ "${DRY_RUN}" -eq 1 ]; then
    fetch_repo_file "skills/pi-agent/templates/terminal-title.ts" ~/.pi/agent/extensions/terminal-title.ts
    if [ "${DRY_RUN}" -eq 1 ] || [ -f ~/.pi/agent/extensions/terminal-title.ts ]; then
      step_ok "terminal-title.ts"
    else
      step_fail "terminal-title.ts"
    fi
  else
    step_skip "terminal-title.ts (already present)"
  fi
  if [ ! -f ~/.pi/agent/settings.json ]; then
    fetch_repo_file "skills/pi-agent/templates/settings.json" ~/.pi/agent/settings.json
    if [ "${DRY_RUN}" -eq 1 ] || [ -f ~/.pi/agent/settings.json ]; then
      step_ok "settings.json"
    else
      step_fail "settings.json"
    fi
  else
    step_skip "settings.json (already present, not overwritten)"
  fi
  echo "   Pi packages (pi-herdr, pi-worktree) auto-install on Pi >=0.82 via settings.json"
}

# ---------------------------------------------------------------
# Compartment: treehouse (pooled git worktrees)
# ---------------------------------------------------------------
install_treehouse() {
  echo "==> Compartment: treehouse (pooled worktrees)"
  if command -v treehouse >/dev/null 2>&1; then
    step_skip "treehouse (already installed)"
  elif [ "${DRY_RUN}" -eq 1 ]; then
    echo "  [dry]  curl -fsSL https://kunchenguid.github.io/treehouse/install.sh | sh"
  else
    curl -fsSL https://kunchenguid.github.io/treehouse/install.sh | sh >/dev/null 2>&1
    command -v treehouse >/dev/null 2>&1 && step_ok "treehouse installed" || step_fail "treehouse install"
  fi
  if [ ! -f ~/.config/treehouse/config.toml ] && command -v treehouse >/dev/null 2>&1; then
    run treehouse init && step_ok "treehouse config" || step_fail "treehouse init"
  fi
}

# ---------------------------------------------------------------
# Compartment: firstmate (captain-and-crew distro)
# ---------------------------------------------------------------
install_firstmate() {
  echo "==> Compartment: firstmate (captain-and-crew distro)"
  if [ -d ~/firstmate/.git ]; then
    step_skip "firstmate (already cloned)"
  elif [ "${DRY_RUN}" -eq 1 ]; then
    echo "  [dry]  git clone --depth 1 https://github.com/kunchenguid/firstmate ~/firstmate"
  else
    git clone --depth 1 https://github.com/kunchenguid/firstmate ~/firstmate >/dev/null 2>&1 \
      && step_ok "firstmate cloned" || step_fail "firstmate clone"
  fi
}

# ---------------------------------------------------------------
# Compartment: herdr plugins
# ---------------------------------------------------------------
install_plugins() {
  echo "==> Compartment: herdr plugins"
  local plugins=(
    smarzban/herdr-file-viewer
    persiyanov/herdr-reviewr
    yuk1ty/herdr-spreader
    cloudmanic/herdr-plus
    ogulcancelik/herdr-plugin-github-start
    paulbkim-dev/vim-herdr-navigation
    lmilojevicc/herdr-tab-rename
    fkiene/llmtrim-herdr
  )
  for p in "${plugins[@]}"; do
    run herdr plugin install "${p}" --yes && step_ok "${p}" || step_fail "${p}"
  done
}

[ "${WANT_SKILLS}" -eq 1 ] && install_skills
[ "${WANT_PI}" -eq 1 ] && install_pi
[ "${WANT_TREEHOUSE}" -eq 1 ] && install_treehouse
[ "${WANT_FIRSTMATE}" -eq 1 ] && install_firstmate
[ "${WANT_PLUGINS}" -eq 1 ] && install_plugins

# ---------------------------------------------------------------
# Verification
# ---------------------------------------------------------------
echo "==> Verifying installation"
verify() {
  local label="$1"; shift
  if [ "${DRY_RUN}" -eq 1 ]; then
    echo "  [dry]  ${label}"
    return 0
  fi
  if "$@" >/dev/null 2>&1; then step_ok "${label}"; else step_fail "${label}"; fi
}
for tool in node npm gh herdr; do
  verify "${tool} present" command -v "${tool}"
done
if [ "${WANT_SKILLS}" -eq 1 ]; then
  verify "skills dir (~/.agents/skills)" test -d ~/.agents/skills
fi
if [ "${WANT_PI}" -eq 1 ]; then
  verify "pi present" command -v pi
  verify "pi settings.json" test -f ~/.pi/agent/settings.json
fi
if [ "${WANT_TREEHOUSE}" -eq 1 ]; then
  verify "treehouse present" command -v treehouse
fi
if [ "${WANT_FIRSTMATE}" -eq 1 ]; then
  verify "firstmate dir" test -d ~/firstmate
fi
if [ "${WANT_PLUGINS}" -eq 1 ]; then
  verify "herdr plugins" herdr plugin list
fi

echo ""
echo "==> Result: ${OK} ok, ${SKIP} skipped, ${FAILED} failed"
if [ "${FAILED}" -gt 0 ]; then
  echo "   Some steps failed. Re-run this script to retry only what is missing (idempotent)."
  exit 1
fi
echo "   Restart your agent session so skills and plugins load."
exit 0
