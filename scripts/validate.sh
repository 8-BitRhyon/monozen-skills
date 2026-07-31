#!/usr/bin/env bash
# scripts/validate.sh - Linter and validator for monozen-skills repository
#
# Contract checks:
#  1. Every skills/<folder>/SKILL.md exists with strict YAML frontmatter:
#     - file starts with a '---' delimiter and has a closing '---'
#     - frontmatter parses as valid YAML (via Ruby Psych, zero deps)
#     - 'name' and 'description' are present and non-empty
#     - 'name' matches the folder name
#     - no machine-specific absolute paths (/Users/, file://)
#     - no case-insensitive duplicate folder names
#  2. Zero em dashes across all tracked text files (any extension)
#  3. No /Users/ or file:// references in any tracked Markdown file
#  4. skills-lock.json is valid JSON with:
#     - every skill folder registered (no missing entries)
#     - no orphan entries (every lock key has a folder)
#     - computedHash is a real sha256 of the SKILL.md content
#  5. Internal Markdown links and asset references resolve to existing files
#  6. Workflow YAML files parse as valid YAML

set -euo pipefail

REPO_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
SKILLS_DIR="${REPO_DIR}/skills"
LOCK_FILE="${REPO_DIR}/skills-lock.json"

# Construct the em dash at runtime so this script itself contains no literal em dash
EMDASH="$(ruby -e 'print "\u2014"')"

ERRORS=0

fail() {
  echo "[FAIL] $*"
  ERRORS=$((ERRORS + 1))
}

echo "=== [validate] Starting Skill Validation Suite ==="

# ---------------------------------------------------------------
# 1. Per-skill frontmatter + portability checks (strict YAML via Ruby)
# ---------------------------------------------------------------
ruby - "$SKILLS_DIR" <<'RUBY' || ERRORS=$((ERRORS + 1))
require "yaml"

skills_dir = ARGV[0]
failures = 0

Dir.children(skills_dir).select { |f| File.directory?(File.join(skills_dir, f)) }.sort.each do |folder|
  md = File.join(skills_dir, folder, "SKILL.md")
  skill_fail = 0

  unless File.file?(md)
    puts "[FAIL] #{folder}: Missing SKILL.md"
    failures += 1
    next
  end

  content = File.read(md)
  lines = content.lines

  unless lines.first.to_s.strip == "---"
    puts "[FAIL] #{folder}/SKILL.md: File must start with a '---' frontmatter delimiter"
    failures += 1
    next
  end

  close_idx = lines[1..].index { |l| l.strip == "---" }
  if close_idx.nil?
    puts "[FAIL] #{folder}/SKILL.md: No closing '---' frontmatter delimiter found"
    failures += 1
    next
  end

  yaml_block = lines[1...(1 + close_idx)].join
  begin
    fm = YAML.safe_load(yaml_block)
  rescue Psych::Exception => e
    puts "[FAIL] #{folder}/SKILL.md: Invalid YAML frontmatter: #{e.message.lines.first.to_s.strip}"
    failures += 1
    next
  end

  unless fm.is_a?(Hash)
    puts "[FAIL] #{folder}/SKILL.md: Frontmatter must be a YAML mapping"
    failures += 1
    next
  end

  name = fm["name"].to_s.strip
  desc = fm["description"].to_s.strip

  if name.empty?
    puts "[FAIL] #{folder}/SKILL.md: Frontmatter 'name' is missing or empty"
    skill_fail += 1
  end
  if desc.empty?
    puts "[FAIL] #{folder}/SKILL.md: Frontmatter 'description' is missing or empty"
    skill_fail += 1
  end
  if !name.empty? && name != folder
    puts "[FAIL] #{folder}/SKILL.md: Frontmatter name '#{name}' does not match folder name '#{folder}'"
    skill_fail += 1
  end
  if content.match?(%r{/Users/|file://})
    puts "[FAIL] #{folder}/SKILL.md: Contains machine-specific path (/Users/ or file://). Use relative or ~/ paths."
    skill_fail += 1
  end

  if skill_fail == 0
    puts "[PASS] #{folder}"
  else
    failures += skill_fail
  end
end

exit(failures == 0 ? 0 : 1)
RUBY

# Case-insensitive duplicate folder names (macOS/Windows filesystem collision risk)
DUPS="$(ls -1 "${SKILLS_DIR}" | tr '[:upper:]' '[:lower:]' | sort | uniq -d)"
if [ -n "${DUPS}" ]; then
  fail "Case-insensitive duplicate skill folders detected: ${DUPS}"
fi

# ---------------------------------------------------------------
# 2. Global em dash prohibition across all tracked text files
# ---------------------------------------------------------------
if git -C "${REPO_DIR}" rev-parse --git-dir >/dev/null 2>&1; then
  TEXT_FILES="$(git -C "${REPO_DIR}" ls-files -- '*.md' '*.json' '*.yml' '*.yaml' '*.sh' '*.mmd' '*.conf' '*.toml' '*.ini' '*.template' '*.rb' '*.py' 'dotfiles/*' '.gitignore')"
else
  TEXT_FILES="$(find "${REPO_DIR}" -type f \( -name '*.md' -o -name '*.json' -o -name '*.yml' -o -name '*.yaml' -o -name '*.sh' -o -name '*.mmd' -o -name '*.conf' -o -name '*.toml' -o -name '*.ini' -o -name '*.template' -o -name '*.rb' -o -name '*.py' \) -not -path '*/.git/*')"
fi

while IFS= read -r f; do
  [ -f "${REPO_DIR}/${f}" ] || continue
  if grep -q -- "${EMDASH}" "${REPO_DIR}/${f}"; then
    fail "${f}: Contains em dash. Replace with '-', ':', or ' - '"
  fi
done <<< "${TEXT_FILES}"

# ---------------------------------------------------------------
# 3. Machine-specific paths in tracked Markdown (outside skills/, covered above)
# ---------------------------------------------------------------
MD_FILES="$(git -C "${REPO_DIR}" ls-files -- '*.md' | grep -v '^skills/' || true)"
while IFS= read -r f; do
  [ -n "${f}" ] || continue
  if grep -qE '/Users/|file://' "${REPO_DIR}/${f}"; then
    fail "${f}: Contains machine-specific path (/Users/ or file://)"
  fi
done <<< "${MD_FILES}"

# ---------------------------------------------------------------
# 4. skills-lock.json integrity (JSON, completeness, orphans, hashes)
# ---------------------------------------------------------------
if [ ! -f "${LOCK_FILE}" ]; then
  fail "skills-lock.json does not exist. Run 'npm run manifest'."
else
  ruby - "${SKILLS_DIR}" "${LOCK_FILE}" <<'RUBY' || ERRORS=$((ERRORS + 1))
require "json"
require "digest"

skills_dir, lock_path = ARGV
begin
  lock = JSON.parse(File.read(lock_path))
rescue JSON::ParserError => e
  puts "[FAIL] skills-lock.json: Invalid JSON: #{e.message.lines.first.to_s.strip}"
  exit 1
end

failures = 0
entries = lock.is_a?(Hash) ? (lock["skills"] || {}) : {}

folders = Dir.children(skills_dir).select { |f| File.directory?(File.join(skills_dir, f)) }.sort

folders.each do |folder|
  unless entries.key?(folder)
    puts "[FAIL] skills-lock.json: Skill '#{folder}' is missing from manifest. Run 'npm run manifest'."
    failures += 1
    next
  end
  entry = entries[folder]
  md = File.join(skills_dir, folder, "SKILL.md")
  unless File.file?(md)
    next
  end
  expected = Digest::SHA256.hexdigest(File.read(md))
  actual = entry.is_a?(Hash) ? entry["computedHash"].to_s : ""
  unless actual =~ /\A[0-9a-f]{64}\z/
    puts "[FAIL] skills-lock.json: '#{folder}' has no valid computedHash (sha256). Run 'npm run manifest'."
    failures += 1
    next
  end
  if actual != expected
    puts "[FAIL] skills-lock.json: '#{folder}' computedHash is stale. Run 'npm run manifest'."
    failures += 1
  end
end

entries.each_key do |key|
  unless File.directory?(File.join(skills_dir, key))
    puts "[FAIL] skills-lock.json: Orphan entry '#{key}' has no matching skill folder. Run 'npm run manifest'."
    failures += 1
  end
end

exit(failures == 0 ? 0 : 1)
RUBY
fi

# ---------------------------------------------------------------
# 5. Internal Markdown links and asset references resolve
# ---------------------------------------------------------------
while IFS= read -r md_rel; do
  [ -n "${md_rel}" ] || continue
  md="${REPO_DIR}/${md_rel}"
  [ -f "${md}" ] || continue
  base_dir="$(dirname "${md}")"
  while IFS= read -r target; do
    [ -n "${target}" ] || continue
    case "${target}" in
      http://*|https://*|mailto:*|tel:*|'#'*|file://*|cci:*|irc:*|'') continue ;;
    esac
    t="${target%%#*}"
    t="${t%%\?*}"
    t="${t#./}"
    [ -n "${t}" ] || continue
    if [ ! -e "${base_dir}/${t}" ]; then
      fail "${md_rel}: Broken link '${target}' (resolves to ${base_dir}/${t})"
    fi
  done < <(grep -oE '\]\([^)]*\)' "${md}" | sed -E 's/^\]\(//; s/\)$//')
done <<< "$(git -C "${REPO_DIR}" ls-files -- '*.md' || true)"

# ---------------------------------------------------------------
# 6. Workflow YAML files parse
# ---------------------------------------------------------------
while IFS= read -r wf; do
  [ -n "${wf}" ] || continue
  ruby -e 'require "yaml"; YAML.safe_load(File.read(ARGV[0]))' "${REPO_DIR}/${wf}" 2>/dev/null \
    || fail "${wf}: Invalid YAML syntax"
done <<< "$(git -C "${REPO_DIR}" ls-files -- '.github/workflows/*.yml' '.github/workflows/*.yaml' || true)"

# ---------------------------------------------------------------
echo "=================================================="
if [ "${ERRORS}" -eq 0 ]; then
  echo "✅ All skills & repo contracts validated successfully. Zero errors."
  exit 0
else
  echo "❌ Validation failed with ${ERRORS} error(s)."
  exit 1
fi
