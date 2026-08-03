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
  if content.bytesize > 4000
    est_tokens = content.bytesize / 4
    puts "[FAIL] #{folder}/SKILL.md: ~#{est_tokens} tokens (bytes/4 proxy) exceeds the 1000-token load budget. Split content into templates/ or references/."
    skill_fail += 1
  end

  if skill_fail == 0
    puts "[PASS] #{folder}" if ENV["VALIDATE_VERBOSE"]
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
  TEXT_FILES="$(git -C "${REPO_DIR}" ls-files -- '*.md' '*.json' '*.yml' '*.yaml' '*.sh' '*.mmd' '*.conf' '*.toml' '*.ini' '*.template' '*.rb' '*.py' '*.html' '*.svg' 'dotfiles/*' '**/.gitignore' '.gitignore')"
else
  TEXT_FILES="$(find "${REPO_DIR}" -type f \( -name '*.md' -o -name '*.json' -o -name '*.yml' -o -name '*.yaml' -o -name '*.sh' -o -name '*.mmd' -o -name '*.conf' -o -name '*.toml' -o -name '*.ini' -o -name '*.template' -o -name '*.rb' -o -name '*.py' -o -name '*.html' -o -name '*.svg' -o -name '.gitignore' \) -not -path '*/.git/*')"
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
  est = entry.is_a?(Hash) ? entry["tokenEstimate"] : nil
  expected_est = File.read(md).bytesize / 4
  if est.nil? || est != expected_est
    puts "[FAIL] skills-lock.json: '#{folder}' tokenEstimate is stale (#{est || 'missing'} vs #{expected_est}). Run 'npm run manifest'."
    failures += 1
  elsif est > 1000
    puts "[FAIL] skills-lock.json: '#{folder}' exceeds 1000-token load budget (~#{est}). Split content into templates/ or references/."
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
# 7. Metadata drift: README/FEDERATION/diagrams vs skills-lock.json
# ---------------------------------------------------------------
ruby - "${REPO_DIR}" "${LOCK_FILE}" <<'RUBY' || ERRORS=$((ERRORS + 1))
require "json"

repo, lock_path = ARGV
lock = JSON.parse(File.read(lock_path))
skills = lock["skills"].keys.sort
failures = 0

check = ->(cond, msg) do
  unless cond
    puts "[FAIL] #{msg}"
    failures += 1
  end
end

readme = File.read(File.join(repo, "README.md"))
fed = File.read(File.join(repo, "FEDERATION.md"))
taxo = File.read(File.join(repo, "assets", "skill-taxonomy.mmd"))
arch = File.read(File.join(repo, "assets", "monozen-skills-arch.mmd"))

# README catalog: "All N skills" header must match lock count
m = readme.match(/All (\d+) skills/)
check.call(m && m[1].to_i == skills.size, "README.md claims '#{m && m[1]} skills' but skills-lock.json has #{skills.size}")

# README catalog table must list every locked skill (and nothing extra)
table = readme.scan(/^\| `([a-z0-9-]+)` \|/).flatten.uniq.sort
missing = skills - table
check.call(missing.empty?, "README.md skill catalog missing: #{missing.join(', ')}")
extra = table - skills
check.call(extra.empty?, "README.md skill catalog has non-lock entries: #{extra.join(', ')}")

# FEDERATION primary listing: count + full canonical coverage
m = fed.match(/### `~\/\.agents\/skills\/`\s+- (\d+) skills/)
if m
  block = fed.split(/### `~\/\.agents\/skills\/`\s+- \d+ skills/, 2)[1]
  block = block.split("```", 3)[1].to_s
  entries = block.lines.map { |l| l.strip.split(/\s+#/, 2).first.to_s }.reject(&:empty?)
  check.call(entries.size == m[1].to_i, "FEDERATION.md claims #{m[1]} skills in ~/.agents/skills but lists #{entries.size}")
  fed_missing = skills - entries
  check.call(fed_missing.empty?, "FEDERATION.md ~/.agents/skills missing canonical: #{fed_missing.join(', ')}")
else
  check.call(false, "FEDERATION.md missing ~/.agents/skills count header")
end

# Diagrams must agree with the lock count
check.call(taxo.include?("#{skills.size} canonical skills"), "skill-taxonomy.mmd root does not say '#{skills.size} canonical skills'")
check.call(arch.include?("#{skills.size} canonical skills"), "monozen-skills-arch.mmd does not say '#{skills.size} canonical skills'")

exit(failures == 0 ? 0 : 1)
RUBY

# ---------------------------------------------------------------
if [ "${ERRORS}" -eq 0 ]; then
  echo "✅ Validation passed. (VALIDATE_VERBOSE=1 for per-skill output)"
  exit 0
else
  echo "❌ Validation failed with ${ERRORS} error(s)."
  exit 1
fi
