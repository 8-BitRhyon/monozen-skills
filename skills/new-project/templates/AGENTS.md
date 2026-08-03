# AGENTS.md

Operating contract for agents working in this repository. Read before writing.

## Purpose

<one sentence: what this project is and who it is for>

## Stack

- Language / runtime: <fill>
- Package manager: <fill>
- Test runner: <fill>
- Deploy target: <fill>

## Commands

- Install: `npm install` (adapt to package manager)
- Test: `npm test`
- Lint: `npm run lint`
- Build: `npm run build`

## Standards

- **Evidence over hope.** Every change ends with verification: tests, lint, typecheck, or runtime observation. "Seems right" is not done.
- **Read before you write.** Never edit a file you have not read. Never guess names or signatures.
- **One logical change per commit.** Small diffs that can be bisected. No drive-by refactoring.
- **Test first.** New behavior starts as a failing test (red), then implementation (green), then refactor.
- **No em dashes (U+2014).** Use `-` or `:` in every artifact this repo produces.
- **No machine-specific paths.** Never commit absolute home paths. Use `~`, `$HOME`, or relative paths.
- **Secure by default.** Never commit secrets, keys, tokens, or IDs. Run the pre-commit gate before pushing.

## Process

1. Decompose the request into independent, verifiable units.
2. Implement one unit per commit, test first.
3. Verify: tests green, lint clean, runtime observed (browser/CLI).
4. Open a PR; see `code-review` and `pr-workflow` skills for the rest.

## Conventions

- Conventional commits: `feat:`, `fix:`, `refactor:`, `docs:`, `chore:`, `test:`, `ci:`.
- Branch names: `feat/<slug>`, `fix/<slug>`, `chore/<slug>`.
- This file is the single owner of agent rules. When a fact recurs, update this file; prefer pruning over appending.
