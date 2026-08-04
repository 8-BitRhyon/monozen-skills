#!/usr/bin/env bash
# scripts/setup.sh - Backward-compatible alias for scripts/install.sh.
# The one-shot bootstrap now lives in install.sh (compartmentalized,
# --dry-run, --with-prereqs). Use install.sh directly for options.
#
# Usage: bash scripts/setup.sh   (equivalent to: bash scripts/install.sh --all)

set -euo pipefail

DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
exec bash "${DIR}/install.sh" --all "$@"
