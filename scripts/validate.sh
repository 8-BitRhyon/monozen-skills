#!/usr/bin/env bash
# scripts/validate.sh - Linter and validator for monozen-skills repository

set -euo pipefail

REPO_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
SKILLS_DIR="${REPO_DIR}/skills"
LOCK_FILE="${REPO_DIR}/skills-lock.json"

echo "=== [validate] Starting Skill Validation Suite ==="

ERRORS=0

# 1. Validate skills frontmatter, formatting, and path portability
for skill_dir in "${SKILLS_DIR}"/*/; do
  if [ -d "${skill_dir}" ]; then
    skill_name="$(basename "${skill_dir}")"
    skill_md="${skill_dir}SKILL.md"

    if [ ! -f "${skill_md}" ]; then
      echo "[FAIL] ${skill_name}: Missing SKILL.md"
      ERRORS=$((ERRORS + 1))
      continue
    fi

    # Check required frontmatter keys
    if ! grep -q "^name:" "${skill_md}"; then
      echo "[FAIL] ${skill_name}/SKILL.md: Missing 'name:' in YAML frontmatter"
      ERRORS=$((ERRORS + 1))
    fi

    if ! grep -q "^description:" "${skill_md}"; then
      echo "[FAIL] ${skill_name}/SKILL.md: Missing 'description:' in YAML frontmatter"
      ERRORS=$((ERRORS + 1))
    fi

    # Check for hardcoded local user paths (/Users/)
    if grep -q "/Users/" "${skill_md}"; then
      echo "[FAIL] ${skill_name}/SKILL.md: Contains hardcoded local path '/Users/'. Use relative paths."
      ERRORS=$((ERRORS + 1))
    fi

    echo "[PASS] ${skill_name}"
  fi
done

# 2. Check global em dash prohibition across all Markdown files & package.json
while IFS= read -r md_file; do
  if grep -q "—" "${md_file}"; then
    echo "[FAIL] ${md_file}: Contains em dash ('—'). Replace with '-', ':', or ' - '"
    ERRORS=$((ERRORS + 1))
  fi
done < <(find "${REPO_DIR}" -type f \( -name "*.md" -o -name "package.json" \) -not -path "*/.git/*")

# 3. Validate skills-lock.json presence and completeness
if [ ! -f "${LOCK_FILE}" ]; then
  echo "[FAIL] skills-lock.json does not exist"
  ERRORS=$((ERRORS + 1))
else
  # Ensure all skill folders are registered in lock file
  for skill_dir in "${SKILLS_DIR}"/*/; do
    if [ -d "${skill_dir}" ]; then
      skill_name="$(basename "${skill_dir}")"
      if ! grep -q "\"${skill_name}\":" "${LOCK_FILE}"; then
        echo "[FAIL] skills-lock.json: Skill '${skill_name}' is missing from manifest"
        ERRORS=$((ERRORS + 1))
      fi
    fi
  done
fi

echo "=================================================="
if [ ${ERRORS} -eq 0 ]; then
  echo "✅ All skills & repo contracts validated successfully. Zero errors."
  exit 0
else
  echo "❌ Validation failed with ${ERRORS} error(s)."
  exit 1
fi
