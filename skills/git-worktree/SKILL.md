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
# create a linked worktree on a new branch
git worktree add ../wt-dark-mode -b feat/dark-mode

# list current worktrees (with branch and path)
git worktree list

# remove after merging (requires a clean tree)
git worktree remove ../wt-dark-mode

# throwaway removal of a dirty tree
git worktree remove --force ../wt-dark-mode
```

## Wrapper (Pi)
- `treehouse get --lease` for the pooled, reusable path (preferred, cache-aware).
- `@ogulcancelik/pi-worktree` automates one-off creation from within Pi:

```bash
pi-worktree create --name dark-mode --base main --branch feat/dark-mode
pi-worktree list
pi-worktree remove --name dark-mode
```

## Firstmate Integration
The `firstmate` distro spawns every crewmate in its own treehouse worktree (or Orca worktree when `backend=orca`), supervises to completion, then returns the worktree to the pool. A crewmate never writes two agents into one tree. For a full captain distro, clone `kunchenguid/firstmate` and launch a harness inside it - see the `herdr` skill.

## Integration With the Captain
- Captain stays on `main`; crew panes run inside worktree dirs.
- Each crew pane is `cd`ed into its worktree, isolated from siblings.
- On completion crew reports: what changed + how verified.
- Captain reviews diff, merges to its branch (or opens PR), then releases worktrees back to the pool.
- Deliberately do not allocate worktrees for read-only work.

## Verification
- `treehouse status` shows each task worktree + lease, idle and clean after `return`.
- `git worktree list` shows one entry per active task, each on its own branch.
- `git status` in two worktrees shows independent dirty states.

## Invocation

Load when:
- Spawning parallel subagents or parallelizing work
- User asks "parallel agents", "worktrees", "isolated task"
- Before delegating any unit that could collide with sibling work