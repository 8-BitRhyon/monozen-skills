---
name: project-constitution
description: "Create or repair a project-local AGENTS.md and behavior-level verification map for an existing repository. Captures real commands, boundaries, invariants, verification ladder, deploy path, and known pitfalls so a fresh agent can work without rediscovery. Load when onboarding an existing repo or when commands and invariants are undocumented."
---

# Project Constitution

> **Scope:** Make an existing repository legible to a fresh agent in one pass, using evidence from commands that actually run.

## Outputs

- `AGENTS.md` at the repository root.
- Optional `verification/` feature map for user-visible behavior.
- A short list of missing gates.

## Flow

1. **Inventory.** Read manifests, lockfiles, CI workflows, Makefile or justfile, scripts, test folders, deploy config, env samples, ADRs, and existing docs. Do not trust the README alone.
2. **Run the commands.** Install, build, lint, test, smoke, verify, and start the dev server. Record the exact command, exit code, and setup. Never document a command you did not run.
3. **Map the boundaries.** Entry points, runtime processes, state owners, external services, generated files, migrations, and ownership.
4. **Capture invariants and pitfalls.** Version pins, CSS load order, cache and service worker state, coordinate spaces, dirty worktree rules, branch protection, secrets. Link each pitfall to a test or gate when one exists.
5. **Write `AGENTS.md`.** Use [templates/AGENTS.md](templates/AGENTS.md). Keep it short enough to read at session start.
6. **Add a feature map when behavior is user-visible.** Use [templates/feature-map.md](templates/feature-map.md). One file per feature area, four questions, and a sweep order in `verification/features/README.md`.
7. **Verify.** A fresh agent can answer: how do I run tests, how do I verify a UI change, what must I not break, and how do I deploy or roll back?

## AGENTS.md Must Cover

- Purpose and stack.
- Commands: install, dev, build, lint, test, verify, deploy.
- Verification ladder.
- File map with ownership boundaries.
- Invariants and known pitfalls.
- Deploy and rollback.
- Links to deeper docs and skills.

## Rules

- Run every command before documenting it.
- Use `~` or relative paths. Never a machine-specific path.
- No em dashes.
- Move long procedures into skills or `references/`, not the constitution.
- Update the constitution in the same change as a command, boundary, or deploy change.
- Prefer a gate over prose when the rule can be enforced.

## Verification

- Every command in `AGENTS.md` runs from a clean checkout.
- Every link resolves.
- A fresh agent can state the verify ladder without asking.
- Each feature-map file names a reachable entry point and an executable check.

## Anti-Patterns

- A wiki dump or a copy of the README.
- Commands that only work on the author's machine.
- A file map that lists every file.
- Pitfalls with no test or gate.
- A feature map that describes internals instead of behavior.

## Invocation

Load when:

- Starting work in an existing repository
- The repo has no `AGENTS.md` or the commands are stale
- Onboarding a new stack or a new agent
- The user says "where do I start", "what are the commands", or "document this repo"

## Related

- `new-project`: bootstrap a new repository.
- `context-engineering`: load order for a session.

## Provenance

The behavior-level feature map is adapted from pstack's `create-verification-skill` and `verification-skill-example` by Lauren Tan. See [THIRD_PARTY_NOTICES.md](../../THIRD_PARTY_NOTICES.md).
