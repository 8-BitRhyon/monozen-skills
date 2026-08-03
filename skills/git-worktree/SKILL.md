---
name: git-worktree
description: "Create, use, and clean up isolated git worktrees so parallel agent tasks never share a working tree. Covers git worktree basics, treehouse pooled worktrees, pi-worktree wrapper, per-task isolation, merge back, and cleanup discipline. Load before spawning parallel subagents or parallelizing work."
---

# Git Worktrees (Isolation)

> **Scope:** One worktree per agent task. Shared dirty working trees cause clobbering foot-guns. This is the mechanical foundation of the captain-and-crew pattern.

## Rules (Non-Negotiable)

- One worktree per task; never write two agents into the same branch.
- Name worktrees by task, e.g. `wt-login-fix`, `wt-dark-mode`.
- Clean up: report diff to captain, then release the worktree. No stale worktrees left behind.
- Deterministic steps live in scripts (agent edits the script when it breaks, not the tree).

## Parallelism Governor (scale safety)

- **Max concurrent crewmates: 4** (or `treehouse status` pool size, whichever is lower). Beyond that, queue tasks instead of spawning.
- **Pool exhaustion** (`treehouse status` shows all trees leased/in-use): do NOT spawn more agents. Block the task until a `return` frees a tree, or wait for a lease.
- **Contention preflight:** before parallel `npm install`/build/`gh` calls, stagger heavy operations (shared caches, registry/API rate limits). If a quota tool is available (`quota-axi`), confirm headroom before spawning >2 crewmates.
- **Merge ordering:** when N branches target main, merge sequentially in dependency order (smallest/least-conflicting first); rebase each on fresh main before merging to keep conflicts bounded.

## Preferred Runtime: treehouse (pooled worktrees)

`treehouse` (kunchenguid) manages a reusable pool of isolated worktrees under `~/.treehouse/`. Each agent gets a clean worktree instantly, with dependencies and build cache preserved between uses:

```bash
treehouse                    # drop into a pooled worktree subshell
treehouse get --lease        # durable lease, prints path only (for agents)
treehouse status             # pool status (leased/in-use highlighted)
treehouse return <path>      # release lease, reset, return to pool
treehouse prune --yes        # reclaim idle, merged, clean worktrees
```

- Never clone a repo for a task; take a worktree from the pool.
- `post_create` hooks (user-level `~/.config/treehouse/config.toml`) provision env/venv automatically.
- Cleanup is `return`, not `remove`: the pool reuses the tree.

## Core Git Commands

```bash
# create a linked worktree on a new branch (list/remove: git worktree list/remove, --force for dirty trees)
git worktree add ../wt-dark-mode -b feat/dark-mode
```

## Wrapper (Pi)
- `treehouse get --lease` for the pooled, reusable path (preferred, cache-aware).
- `@ogulcancelik/pi-worktree` for one-off creation: `pi-worktree create --name dark-mode --base main --branch feat/dark-mode` (also `list` / `remove --name`).

## Firstmate Integration
The `firstmate` distro spawns each crewmate in its own treehouse worktree, supervises to completion, then returns the tree to the pool - see the `herdr` skill for the full captain distro.

## Integration With the Captain
- Captain stays on `main`; crew panes run inside worktree dirs.
- Each crew pane is `cd`ed into its worktree, isolated from siblings.
- On completion crew reports: what changed + how verified.
- Captain reviews diff, merges to its branch (or opens PR), then releases worktrees back to the pool.
- Do not allocate worktrees for read-only work.

## Verification
- `treehouse status` shows each task worktree + lease, idle and clean after `return`.
- `git worktree list` shows one entry per active task; `git status` in two worktrees shows independent dirty states.

## Invocation

Load when:
- Spawning parallel subagents or parallelizing work
- User asks "parallel agents", "worktrees", "isolated task"
- Before delegating any unit that could collide with sibling work