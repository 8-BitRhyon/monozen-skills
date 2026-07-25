#!/usr/bin/env bash
# scripts/manifest.sh - Auto-generates skills-lock.json from skills/*/SKILL.md frontmatter

set -euo pipefail

REPO_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
LOCK_FILE="${REPO_DIR}/skills-lock.json"

echo "[manifest] Generating ${LOCK_FILE}..."

node -e "
const fs = require('fs');
const path = require('path');

const skillsDir = path.join('${REPO_DIR}', 'skills');
const lockPath = '${LOCK_FILE}';

const skillFolders = fs.readdirSync(skillsDir).filter(f => {
  return fs.statSync(path.join(skillsDir, f)).isDirectory();
});

const lock = {
  version: 1,
  skills: {}
};

skillFolders.sort().forEach(folder => {
  const mdPath = path.join(skillsDir, folder, 'SKILL.md');
  if (fs.existsSync(mdPath)) {
    lock.skills[folder] = {
      source: '8-BitRhyon/monozen-skills',
      sourceType: 'github',
      skillPath: 'skills/' + folder + '/SKILL.md',
      computedHash: ''
    };
  }
});

fs.writeFileSync(lockPath, JSON.stringify(lock, null, 2) + '\n');
console.log('[manifest] Registered ' + Object.keys(lock.skills).length + ' skills in skills-lock.json');
"
