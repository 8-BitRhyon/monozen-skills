#!/usr/bin/env bash
# scripts/harden-repo.sh - Require "Kilo Code Review" on the default branch of
# any repo, preserving existing required checks, their app associations, and
# all other protection settings.
#
# Personal accounts have no org-level rulesets, so universal merge-gating on
# Kilo Code Review is applied per repo with this script. Run it once per repo
# (or on every repo owned by the authed user).
#
# Deliberate defaults when a repo has no branch protection yet:
#   - enforce_admins: true. Required, otherwise the repo admin (the owner) can
#     push directly to the protected branch and bypass the gate.
#     Opt out with --no-enforce-admins.
#   - strict: false. "Require branches up to date before merging" is only
#     enabled where the repo already had it.
#
# Usage:
#   bash scripts/harden-repo.sh                 # all repos owned by the authed user
#   bash scripts/harden-repo.sh 8-BitRhyon/foo # specific repo(s)
#   bash scripts/harden-repo.sh --dry-run      # preview, change nothing
#   bash scripts/harden-repo.sh --no-enforce-admins

set -uo pipefail

REVIEW_CHECK="Kilo Code Review"
DRY_RUN=0
ENFORCE_ADMINS=1
REPOS=()

for arg in "$@"; do
  case "${arg}" in
    --dry-run) DRY_RUN=1 ;;
    --no-enforce-admins) ENFORCE_ADMINS=0 ;;
    *) REPOS+=("${arg}") ;;
  esac
done

if [ "${#REPOS[@]}" -eq 0 ]; then
  # Cap at 1000 (the CLI's effective ceiling); pass explicit repo names to go
  # beyond that.
  while IFS= read -r repo; do
    [ -n "${repo}" ] && REPOS+=("${repo}")
  done < <(gh repo list --limit 1000 --json nameWithOwner --jq '.[].nameWithOwner' 2>/dev/null)
fi

changed=0
for repo in ${REPOS[@]+"${REPOS[@]}"}; do
  branch="$(gh api "repos/${repo}" --jq .default_branch 2>/dev/null)" || { echo "[skip] ${repo}: no access"; continue; }
  if [ -z "${branch}" ]; then
    echo "[skip] ${repo}: no default branch"
    continue
  fi
  current="$(gh api "repos/${repo}/branches/${branch}/protection" 2>/dev/null)" || current=""
  had=0
  [ -n "${current}" ] && had=1

  plan="$(printf '%s' "${current}" | ENFORCE_ADMINS="${ENFORCE_ADMINS}" ruby -rjson -e '
    REVIEW = ARGV[0]
    enforce_default = ENV["ENFORCE_ADMINS"] == "1"
    input = STDIN.read
    had = !input.empty?
    cur = JSON.parse(input.empty? ? "{}" : input)

    rsc = cur["required_status_checks"]
    strict = rsc && !rsc["strict"].nil? ? rsc["strict"] : false
    checks = (rsc && rsc["checks"]) || []
    contexts = (rsc && rsc["contexts"]) || []

    already = checks.map { |c| c["context"] } + contexts
    if already.include?(REVIEW)
      puts "unchanged"
    else
      if checks.empty?
        contexts << REVIEW
        rsc_new = { "strict" => strict, "contexts" => contexts }
      else
        checks << { "context" => REVIEW }
        rsc_new = { "strict" => strict, "checks" => checks }
      end

      enforce = had && !cur.dig("enforce_admins", "enabled").nil? \
        ? cur.dig("enforce_admins", "enabled") : enforce_default

      puts JSON.generate({
        "required_status_checks" => rsc_new,
        "required_pull_request_reviews" => cur["required_pull_request_reviews"],
        "enforce_admins" => enforce,
        "required_linear_history" => cur.dig("required_linear_history", "enabled") || false,
        "allow_force_pushes" => cur.dig("allow_force_pushes", "enabled") || false,
        "allow_deletions" => cur.dig("allow_deletions", "enabled") || false,
        "required_conversation_resolution" => cur.dig("required_conversation_resolution", "enabled") || false,
        "block_creations" => cur.dig("block_creations", "enabled") || false,
        "lock_branch" => cur.dig("lock_branch", "enabled") || false,
        "allow_fork_syncing" => cur.dig("allow_fork_syncing", "enabled") || false,
        "restrictions" => cur["restrictions"]
      })
    end
  ' "${REVIEW_CHECK}")"

  if [ "${plan}" = "unchanged" ]; then
    echo "[skip] ${repo}@${branch}: already requires ${REVIEW_CHECK}"
    continue
  fi
  if [ "${DRY_RUN}" -eq 1 ]; then
    labels="$(printf '%s' "${plan}" | ruby -rjson -e '
      j = JSON.parse(STDIN.read)
      rsc = j["required_status_checks"]
      list = rsc["checks"] || rsc["contexts"] || []
      puts list.map { |c| c.is_a?(Hash) ? c["context"] : c }.join(", ")
    ')"
    echo "[dry] ${repo}@${branch}: required -> ${labels}"
    continue
  fi
  if err="$(printf '%s' "${plan}" | gh api -X PUT "repos/${repo}/branches/${branch}/protection" --input - 2>&1 >/dev/null)"; then
    sig="$(gh api "repos/${repo}/branches/${branch}/protection/required_signatures" --jq '.enabled' 2>/dev/null || echo 'unset')"
    echo "[ok]  ${repo}@${branch}: now requires ${REVIEW_CHECK} (required_signatures: ${sig})"
    changed=$((changed + 1))
  else
    reason="$(printf '%s' "${err}" | ruby -rjson -e 'begin; puts JSON.parse(STDIN.read)["message"]; rescue JSON::ParserError; end' 2>/dev/null)"
    [ -z "${reason}" ] && reason="$(printf '%s' "${err}" | head -1)"
    echo "[fail] ${repo}@${branch}: ${reason}"
  fi
done

echo "Done: ${changed} repo(s) updated."
