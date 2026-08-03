---
name: new-project
description: "Bootstrap any new software project from zero: repo creation, scaffold, constitution files (AGENTS.md, design.md, README.md), .gitignore, CI, signing, and first commit. Load whenever starting a new project or repository from scratch, for any language or stack."
---

# New Project Bootstrap

> **Scope:** Turn an idea into a versioned, agent-ready, CI-protected repository in one session. Works for any language, framework, or team size. This is stage 1 of the project lifecycle: idea -> scaffold -> implement -> review -> merge.

## Flow (in order)

1. **Clarify intent** (prompt-engineering-loop): language/runtime, package manager, deploy target, test runner, CI host. 5 questions minimum.
2. **Scaffold the skeleton** for the chosen stack (framework CLI: `npm create`, `cargo new`, `uv init`, `flutter create`, etc.).
3. **Add constitution files** from `templates/` in this skill:
   - `templates/AGENTS.md` -> repo root (agent contract)
   - `templates/.gitignore` -> repo root (adapt per stack)
   - `templates/validate.yml` -> `.github/workflows/validate.yml` (CI gate; adapt test command)
   - Optionally `templates/design.md` -> `design.md` (one-page architecture note)
4. **Commit skeleton + constitution as one commit** (never mix scaffold with feature work).
5. **Add a first feature** using `test-driven-dev` (test first), one logical change per commit.
6. **Code review** via `code-review` skill, then land via `pr-workflow`.

## Rules

- Constitution before features: `AGENTS.md`, `.gitignore`, CI must exist before the first feature commit.
- One logical change per commit; scaffold is one commit.
- CI gate (validate.yml) must run `test` on push/PR; adapt to the stack's test command.
- Commit signing per `git-workflow` (SSH/GP G) before the first commit; never co-author an agent.
- No machine-specific paths in any committed file (`~` and relative paths only).
- No em dashes (U+2014) in any committed artifact.

## Verification

- `git log --oneline` shows: scaffold commit, then feature commits (one logical change each).
- `.github/workflows/validate.yml` parses and CI passes on the first push.
- `npm test` (or stack equivalent) runs green from a clean clone.
- Fresh agent session loads `AGENTS.md` and can describe project commands without prompting.

## Invocation

Load when:
- Starting any new project or repository
- User says "start a new project", "scaffold", "init a repo", "bootstrap"
- Onboarding a repo that has no `AGENTS.md` or CI (remedy: run this skill)
