---
name: git-worktree
description: "Creates, leases, and cleans up isolated git worktrees so parallel agent tasks never share a working tree. Covers git worktree basics, treehouse 3.x pools, pi-worktree, merge back, and cleanup. Use before spawning parallel subagents or parallelizing work."
---

# Git Worktrees (Isolation)

> One worktree per task. Shared dirty trees clobber sibling work. This is the mechanical foundation of the captain-and-crew pattern.

Requires: `git`. Optional: `treehouse` 3.x for pooled worktrees.

## Rules

- One worktree per task; never write two agents into the same branch.
- Name by task: `wt-login-fix`, `wt-dark-mode`.
- Read-only work does not need a worktree.
- Report the diff, then return the tree. No stale leases.
- Deterministic setup belongs in a script or `post_create` hook.

## Pooled Worktrees: treehouse

`treehouse` keeps a per-repository pool under `~/.treehouse/` with dependencies and build cache intact.

```bash
treehouse                  # acquire a worktree and open a subshell
treehouse get --lease      # durable lease; prints only the absolute path
treehouse lease <name>     # lease an existing slot in place, no reset
treehouse status           # slots, leases, in-use state
treehouse enter <name>     # open a subshell in an existing slot
treehouse return <path>    # release the lease and reset the slot
treehouse prune --yes      # delete idle, merged, clean slots
treehouse destroy <name>   # remove a slot from the pool
treehouse init             # write treehouse.toml defaults
```

- `get --lease` prints the path on stdout; banners go to stderr.
- A leased slot is never handed out or pruned until `return`.
- `--root .` creates an in-project pool; `--base <branch>` cuts from a specific base.
- Pool exhaustion means queue, not clone.

## Scale

- Cap concurrent workers at the pool size. Queue the rest.
- Stagger heavy installs or builds that share caches or API limits.
- Merge sequentially in dependency order; rebase each branch on fresh main.
- Confirm quota headroom with `quota-axi` before spawning more than two workers.

## Plain Git

```bash
git worktree add ../wt-dark-mode -b feat/dark-mode
git worktree list
git worktree remove ../wt-dark-mode   # --force only for dirty trees
```

## Wrappers

- `pi-worktree create --name dark-mode --base main --branch feat/dark-mode` (also `list`, `remove --name`).
- `herdr worktree create --branch <b>` opens a worktree-scoped workspace (see `herdr`).

## Integration

- Captain stays on `main`; workers run inside their worktree directories.
- Each worker reports what changed and how it verified.
- Captain reviews the diff, merges or opens a PR, then returns the tree.
- Do not allocate a worktree for exploration or review that only reads.

## Verification

- `treehouse status` shows each active slot leased and every returned slot idle and clean.
- `git worktree list` shows one entry per active task.
- `git status` in two worktrees shows independent dirty state.

## Invocation

Load when:

- Spawning parallel subagents or parallelizing work.
- The user asks for "parallel agents", "worktrees", or an "isolated task".
- Before delegating any unit that could collide with a sibling.
