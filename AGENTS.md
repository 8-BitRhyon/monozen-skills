# AGENTS.md

Canonical agent instructions for the `monozen-skills` repository and every project that consumes it. Shared verbatim across Pi, Claude Code, OpenCode, Codex, and other harnesses.

## Purpose

This repository is the canonical registry of executable agent skills. Skills are runnable protocols, not wiki pages. They are federated to consumer CLIs via `npx skills add`. The repository also documents the workstation agent stack: Pi (harness), Herdr (multiplexer), AXI-style CLI wrappers (tools), and Git worktrees (isolation).

## Non-Negotiable Standards

- **Evidence over hope.** "Seems right is not done." Every change ends with verification: tests, lint, typecheck, or real-browser DevTools observation.
- **Read before you write.** Never edit a file you have not read. Never guess names, signatures, or structures.
- **One logical change per commit.** No drive-by refactoring. Small diffs that can be bisected.
- **Write failing tests first.** TDD prove-it cycle: red, green, refactor, verify.
- **Token-aware output.** Prefer token-efficient formats (TOON, truncated tables, minimal fields). Keep skill prompts and tool output lean.
- **Cache-friendly sessions (prompt caching).** Provider caches (Anthropic 90% cheaper reads, Gemini 75%, OpenAI 50%) hit only on a byte-stable prefix. Therefore: load docs in a FIXED order (AGENTS.md -> README.md -> skills frontmatter -> skills on demand), never reorder, never put timestamps/dynamic state in the header, freeze tool schemas mid-session. Put volatile content in tool output or the tail, never the prefix.
- **Compaction over context growth.** When a session nears its budget, summarize history (decisions, unresolved bugs, key state) and continue with the summary + most recent work, rather than growing the window. Sub-agents return distilled 1-2k summaries, not raw transcripts.
- **No em dashes.** Use `-` or `:` instead of the Unicode U+2014 character in every artifact this repo produces.
- **No machine-specific paths.** Never commit absolute home paths or local file URI references. Use `~`, `$HOME`, or relative paths.
- **Secure by default.** Never commit secrets, keys, zone/account IDs, or fingerprints. Run the `pre-commit` gate before pushing.

## Harness-Agnostic Operating Model

The workstation runs one captain agent per task on an isolated Git worktree (pooled via `treehouse` by default), supervised from a Herdr pane:

1. **One captain.** A single orchestrator (Pi/Claude Code/OpenCode/Codex) owns the task end to end. Do not open parallel agents against the same working set.
2. **Delegation.** For independent units of work, spawn worker subagents in isolated git worktrees (via `treehouse` / `pi-worktree` / `git worktree`) and Herdr panes. Never write two agents into the same working branch.
3. **Escalation is cheap.** Ask the human for the decisions you cannot verify; do the work you can. Auto-fix typos; never change product behavior silently.
4. **Cleanup.** After a subagent finishes, report results to the captain and return/remove its worktree (`treehouse return` / `git worktree remove`). Never leave stale worktrees, leases, or branches.

## Engineering Principles from Kun Chen's Framework

- **Isolate parallel work.** One worktree per agent task. Shared dirty trees cause foot-guns.
- **Prefer agent-ergonomic CLIs over MCP.** MCP schema overhead dominates context (benchmarks: 185k tokens vs 79k per task for AXI). Wrap `gh`, `aws`, `docker`, and browser tools in trimmed, token-efficient CLI wrappers (TOON-style output, total counts, explicit empty states, next-step hints, no interactive prompts, exit codes 0/1/2).
- **Design for the CLI by default.** If a tool can answer in one command, do not jump into a script. Use `npx -y gh-axi` / `npx -y chrome-devtools-axi` before raw CLIs.
- **Ambient context.** Install session integrations (Herdr status plugins, Pi extensions) so state is visible before actions, and only load skills on demand.
- **Deterministic steps live in scripts.** Known sequences belong in scripts, not in the agent context: the agent edits the script when it breaks.

## Code Style

- Follow existing file patterns; never change style purely for style.
- Do not add comments unless a protocol, license, or intent demands one.
- Keep functions pure and small; prefer composition.
- No new dependencies unless the direct path has a concrete, repeated blocker.

## Subagent Delegation Guidelines

When this agent (or the captain) spawns subagents:

1. First decompose the task into independent units (use the `task-decomposition` skill).
2. Give each subagent a complete, self-contained brief: goal, files in scope, acceptance criteria, and the verify command.
3. Prefer to give the subagent a git worktree so it cannot clobber sibling work.
4. Require each subagent to report: what changed, how it verified, and what it left undone. Trust but verify evidence.
5. Do not burn tokens duplicating the subagent's work; review its diff, not its prose.

## Repository Conventions

- Skills live in `skills/<name>/SKILL.md` with strict YAML frontmatter (`name`, `description`).
- `skills-lock.json` is the generated manifest. Regenerate with `npm run manifest` and commit the sync.
- Every change must pass, in order:
  1. `npm run validate`
  2. `npm test`
  3. `npm run manifest` (and the lock file must be in sync)
- `scripts/install-hooks.sh` installs the shift-left pre-commit hook, which runs validate + test + smoke + manifest sync locally before every commit.
- Genesis: `CLAUDE.md` is a symlink to this file so Claude Code and other consumers read the same canonical instructions.

## Documentation Ownership (one owner per fact)

| Fact | Single owner |
|---|---|
| Agent rules and operating model | `AGENTS.md` (this file) |
| Skill catalog and captain-crew overview | `README.md` |
| Consumer-to-path federation map and load order | `FEDERATION.md` |
| Workstation terminal/multiplexer stack | `WORKSTATION.md` |
| Engineering philosophy (Moon/Sun, evidence over hope) | `PHILOSOPHY.md` |
| Skill definitions and runnable protocols | `skills/<name>/SKILL.md` |

Guides and diagrams explain purpose and link to the owner above instead of restating their content. When a fact moves, update the owner and repoint links; never keep two live copies.

## Scope Ownership

- Universal lifecycle skills (`new-project`, `test-driven-dev`, `code-review`, `pr-workflow`) apply to any repo.
- Universal engineering skills (`agentic-loop`, `context-engineering`, `task-decomposition`, `skill-authoring`, etc.) apply to any repo.
- Monozen portfolio-specific knowledge lives in `skills/monozen-portfolio/`.
- Tool wrappers (GitHub, browser, Herdr) are described in their own skills and distributed as CLI if available.

Do not expand this file with per-project trivia. Trivia that recurs belongs in a skill.

## Deliberate Decisions (do NOT silently revert)

Pattern borrowed from the Kun Chen framework: surface intentional choices so agents reason about them instead of "fixing" them.

- The validator is zero-dependency Ruby (`Psych`) on purpose: no `node_modules` for a lint gate. Do not port it to Node/TS without a concrete blocker.
- The em dash ban is literal and repo-wide, including generated `.svg`/`.html` artifacts.
- `CLAUDE.md` is a symlink to `AGENTS.md` so one canonical file drives every harness.
- The universal security guard (in `monozen-portfolio/`) is a commit/deploy gate run in real repos, not the installable pre-commit hook (which runs `validate` + `test` + manifest sync).
- The pre-commit gate never scans "unread" files; agents must read before writing, and the guard only blocks committed state. The hook's `manifest.sh` regen can write to `skills-lock.json`, so the hook runs it before the diff check.

## Maintaining this file

Keep this file for knowledge useful to almost every future agent session in this project.
Do not repeat what the codebase already shows; point to the authoritative file or command instead.
Prefer rewriting or pruning existing entries over appending new ones.
When updating this file, preserve this bar for all agents and keep entries concise.