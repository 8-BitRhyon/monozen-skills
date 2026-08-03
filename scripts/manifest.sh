#!/usr/bin/env bash
# scripts/manifest.sh - Auto-generates skills-lock.json from skills/*/SKILL.md
# Reads frontmatter via Ruby Psych (zero deps) and hashes SKILL.md content (sha256)
# so federation consumers can detect drift.

set -euo pipefail

REPO_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"

echo "[manifest] Generating ${REPO_DIR}/skills-lock.json..."

ruby - "${REPO_DIR}" <<'RUBY'
require "yaml"
require "json"
require "digest"

repo = ARGV[0]
skills_dir = File.join(repo, "skills")
lock_path = File.join(repo, "skills-lock.json")

skills = {}
Dir.children(skills_dir).select { |f| File.directory?(File.join(skills_dir, f)) }.sort.each do |folder|
  md = File.join(skills_dir, folder, "SKILL.md")
  next unless File.file?(md)

  content = File.read(md)
  lines = content.lines
  fm = {}

  if lines.first.to_s.strip == "---"
    close_idx = lines[1..].index { |l| l.strip == "---" }
    if close_idx
      begin
        parsed = YAML.safe_load(lines[1...(1 + close_idx)].join)
        fm = parsed if parsed.is_a?(Hash)
      rescue Psych::Exception
        # validate.sh reports the error; manifest keeps going with empty values
      end
    end
  end

  skills[folder] = {
    "name" => (fm["name"] || "").to_s.strip,
    "description" => (fm["description"] || "").to_s.strip,
    "tokenEstimate" => content.bytesize / 4,
    "source" => "8-BitRhyon/monozen-skills",
    "sourceType" => "github",
    "skillPath" => "skills/#{folder}/SKILL.md",
    "computedHash" => Digest::SHA256.hexdigest(content)
  }
end

lock = { "version" => 1, "skills" => skills }
File.write(lock_path, JSON.pretty_generate(lock) + "\n")
puts "[manifest] Registered #{skills.size} skills in skills-lock.json"
RUBY
