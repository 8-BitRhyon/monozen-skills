#!/usr/bin/env bash
# scripts/validate-evals.sh - Validates skills/*/evals/*.json against the
# behavioral eval convention documented in skill-authoring.
#
# Contract per file:
#   - valid JSON object
#   - query: non-empty string
#   - expected_behavior: non-empty array of non-empty strings
#   - files: optional array of strings
#   - baseline_failure: optional non-empty string
#
# Zero eval files is valid while the convention is adopted incrementally.

set -euo pipefail

REPO_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"

exec ruby - "${REPO_DIR}" <<'RUBY'
require "json"

repo = ARGV[0]
files = Dir.glob(File.join(repo, "skills", "*", "evals", "*.json")).sort

if files.empty?
  puts "[validate-evals] No eval files registered yet."
  exit 0
end

failures = 0
files.each do |path|
  rel = path.sub("#{repo}/", "")

  begin
    data = JSON.parse(File.read(path))
  rescue JSON::ParserError => e
    puts "[FAIL] #{rel}: invalid JSON (#{e.message.lines.first.to_s.strip})"
    failures += 1
    next
  end

  unless data.is_a?(Hash)
    puts "[FAIL] #{rel}: top level must be an object"
    failures += 1
    next
  end

  query = data["query"]
  unless query.is_a?(String) && !query.strip.empty?
    puts "[FAIL] #{rel}: query must be a non-empty string"
    failures += 1
  end

  behavior = data["expected_behavior"]
  valid_behavior = behavior.is_a?(Array) && !behavior.empty? &&
    behavior.all? { |item| item.is_a?(String) && !item.strip.empty? }
  unless valid_behavior
    puts "[FAIL] #{rel}: expected_behavior must be a non-empty array of strings"
    failures += 1
  end

  if data.key?("files")
    valid_files = data["files"].is_a?(Array) &&
      data["files"].all? { |item| item.is_a?(String) && !item.strip.empty? }
    unless valid_files
      puts "[FAIL] #{rel}: files must be an array of non-empty strings"
      failures += 1
    end
  end

  if data.key?("baseline_failure")
    baseline = data["baseline_failure"]
    unless baseline.is_a?(String) && !baseline.strip.empty?
      puts "[FAIL] #{rel}: baseline_failure must be a non-empty string"
      failures += 1
    end
  end
end

if failures.zero?
  puts "[validate-evals] #{files.size} eval file(s) valid."
  exit 0
else
  exit 1
end
RUBY
