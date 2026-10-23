---
name: no-mistakes
description: "Run automated AI-driven validation pipelines and zero-slop PR creation through the no-mistakes local git proxy gate. Load when preparing to push branches, opening clean PRs, running pre-landing audits, or operating the no-mistakes TUI and headless AXI interface."
---

# no-mistakes: Zero-Slop PR Gateway

> **Scope:** A local git proxy placed in front of your remote repository. Push to `no-mistakes` instead of raw `origin`; the pipeline spins up a disposable worktree, executes multi-pass AI validation, auto-fixes mechanical issues, forwards to the target remote upon green status, and opens a clean PR automatically.

## Core Concepts

- **Local Git Proxy**: Intercepts `git push no-mistakes <branch>`. The developer or agent never pushes unvalidated code directly to the forge.
- **Disposable Worktree**: Runs the full validation suite in an isolated tree without disrupting your active editor or dirty working set.
- **Two Finding Classes**:
  - `auto-fix`: Mechanical corrections (lint, formatting, trivial imports, type annotations) applied automatically or with one approval.
  - `ask-user`: Structural or behavioral decisions requiring explicit captain judgement (approve, fix, or skip).
- **Forward & PR**: Only when 100% of checks pass does the proxy forward the branch to `origin` and raise a clean PR with an auto-generated, evidence-backed summary.

## CLI & Agent Usage

```bash
# Initialize the proxy for the current repository
no-mistakes init

# Push a branch through the validation gate
git push no-mistakes feat/my-feature

# Open the interactive TUI to review runs and findings
no-mistakes

# Headless agent interface (TOON format output)
no-mistakes axi status
no-mistakes axi review --accept-autofix
```

## Firstmate Integration

Within the Firstmate captain-and-crew model:
1. Crewmates working on ship tasks run `/no-mistakes` before declaring done.
2. The crewmate reports the ready signal: `done [at=<epoch>]: PR <url> checks green`.
3. The First Mate verifies the PR URL via `ship-landing` protocols before closing the task and releasing the worktree.

## Non-Negotiable Standards

- Never force-push or bypass the gate when `no-mistakes` is configured.
- Treat gate refusals as real evidence of regressions, not obstacles to circumvent.
- Headless runs use the TOON-native `no-mistakes axi` interface to keep token overhead low.

## Invocation

Load when:
- Opening or preparing to push a PR
- Setting up pre-landing quality gates
- Running headless branch validation via agents
