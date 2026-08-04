#!/usr/bin/env bash
# scripts/harden-repo.sh - Require "Kilo Code Review" on the default branch of
# any repo, preserving existing required checks and protection settings.
#
# Personal accounts have no org-level rulesets, so universal merge-gating on
# Kilo Code Review is applied per repo with this script. Run it once per repo
# (or on every repo owned by the authed user).
#
# Usage:
#   bash scripts/harden-repo.sh                 # all repos owned by the authed user
#   bash scripts/harden-repo.sh 8-BitRhyon/foo # specific repo(s)
#   bash scripts/harden-repo.sh --dry-run      # preview, change nothing

set -uo pipefail

REVIEW_CHECK="Kilo Code Review"
DRY_RUN=0
REPOS=()

for arg in "$@"; do
  case "${arg}" in
    --dry-run) DRY_RUN=1 ;;
    *) REPOS+=("${arg}") ;;
  esac
done

if [ "${#REPOS[@]}" -eq 0 ]; then
  while IFS= read -r repo; do
    [ -n "${repo}" ] && REPOS+=("${repo}")
  done < <(gh repo list --limit 200 --json nameWithOwner --jq '.[].nameWithOwner')
fi

changed=0
for repo in "${REPOS[@]}"; do
  branch="$(gh api "repos/${repo}" --jq .default_branch 2>/dev/null)" || { echo "[skip] ${repo}: no access"; continue; }
  current="$(gh api "repos/${repo}/branches/${branch}/protection" 2>/dev/null)" || current="{}"

  updated="$(printf '%s' "${current}" | ruby -rjson -e '
    REVIEW = ARGV[0]
    input = STDIN.read
    cur = JSON.parse(input.empty? ? "{}" : input)

    checks = cur.dig("required_status_checks", "contexts") || []
    checks = [REVIEW] + checks unless checks.include?(REVIEW)

    strict = cur.dig("required_status_checks", "strict")
    strict = true if strict.nil?
    enforce = cur.dig("enforce_admins", "enabled")
    enforce = true if enforce.nil?
    linear = cur.dig("required_linear_history", "enabled") || false
    force = cur.dig("allow_force_pushes", "enabled") || false
    del = cur.dig("allow_deletions", "enabled") || false
    conv = cur.dig("required_conversation_resolution", "enabled") || false

    puts JSON.generate({
      "required_status_checks" => { "strict" => strict, "contexts" => checks },
      "required_pull_request_reviews" => cur["required_pull_request_reviews"],
      "enforce_admins" => enforce,
      "required_linear_history" => linear,
      "allow_force_pushes" => force,
      "allow_deletions" => del,
      "required_conversation_resolution" => conv,
      "restrictions" => cur["restrictions"]
    })
  ' "${REVIEW_CHECK}")"

  labels="$(printf '%s' "${updated}" | ruby -rjson -e 'puts JSON.parse(STDIN.read)["required_status_checks"]["contexts"].join(", ")')"

  if [ "${DRY_RUN}" -eq 1 ]; then
    echo "[dry] ${repo}@${branch}: required -> ${labels}"
    continue
  fi
  if err="$(printf '%s' "${updated}" | gh api -X PUT "repos/${repo}/branches/${branch}/protection" --input - 2>&1 >/dev/null)"; then
    echo "[ok]  ${repo}@${branch}: required = ${labels}"
    changed=$((changed + 1))
  else
    reason="$(printf '%s' "${err}" | ruby -rjson -e 'begin; puts JSON.parse(STDIN.read)["message"]; rescue JSON::ParserError; end' 2>/dev/null)"
    [ -z "${reason}" ] && reason="$(printf '%s' "${err}" | head -1)"
    echo "[fail] ${repo}@${branch}: ${reason}"
  fi
done

echo "Done: ${changed} repo(s) updated."
