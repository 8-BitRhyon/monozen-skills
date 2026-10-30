#!/usr/bin/env bash
# Install the work harness on PATH.
set -euo pipefail

DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
TARGET="${HOME}/.local/bin"

mkdir -p "${TARGET}"
chmod +x "${DIR}/work.mjs"
ln -sf "${DIR}/work.mjs" "${TARGET}/work"

echo "Installed ${TARGET}/work"
case ":${PATH}:" in
  *":${TARGET}:"*) ;;
  *) echo "Add ${TARGET} to PATH before using work." ;;
esac
