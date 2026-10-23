---
name: firstmate
description: "Captain-and-crew orchestration distro: Captain, First Mate, Second Mates, and Crewmates; lifecycle (/ahoy, /bearings), backend selection (Herdr, tmux, Rex, cmux, Zellij, Orca, Paseo), Definition of Done, and stall or restart recovery. Load when coordinating agent fleets."
---

# firstmate: Captain-and-Crew Orchestration

Firstmate (`kunchenguid/firstmate`) replaces multi-tab babysitting with a hierarchy: one Captain, one First Mate, optional Second Mates, and disposable Crewmates in isolated worktrees.

## Hierarchy

1. **Captain**: owns goals, scope, and production deploys; answers real decision escalations.
2. **First Mate**: decomposes work (see `task-decomposition`), dispatches workers into pooled `treehouse` worktrees and backend panes, synthesizes diffs, and recovers stalls.
3. **Second Mates**: optional persistent leads for large submodules or remote hosts, each in its own firstmate home.
4. **Crewmates**: short-lived workers running one `agentic-loop` per task in a treehouse worktree; never share a branch.

## Runtime Backend

Spawn resolution order: `FM_BACKEND` > `config/backend` > runtime auto-detection > `tmux` default.

Detection is innermost-first: `$TMUX` selects tmux; `HERDR_ENV=1` with no `$TMUX` selects herdr; Rex and cmux have their own markers; Zellij, Orca, and Paseo are never auto-detected. A tmux nested in a Herdr pane wins, so pin `config/backend` when Herdr is intended and never auto-start tmux inside a Herdr pane.

### Herdr Backend (Protocol 14+)

- One task tab per endpoint, `fm-<id>`, in the launcher's workspace; a First Mate outside Herdr uses a home workspace labeled `firstmate` (`2ndmate-<id>` for a secondmate).
- Metadata: `backend=herdr`, `window=<session>:<pane-id>`, `herdr_session`, `herdr_workspace_id`, `herdr_tab_id`, `herdr_pane_id`. Split `window=` on the first colon only.
- The adapter uses `HERDR_SESSION`, else `default`, and always passes `--session`. Preflight needs `herdr`, `jq`, and protocol 14+.
- Supervise without attaching: `bin/fm-peek.sh <id>` and `FM_HOME=<home> bin/fm-send.sh <id> '<text>'`.
- On Herdr 0.8.0+ tasks default to disposable one-task workspaces. `config/herdr-presentation-spaces` sets `off`, `on`, or empty (on); absent follows the version floor.
- Project groups, tags, and the sorted agents view are opt-in display layers on protocol 22 (0.9.5), never task authority.

### Restart and Husk Recovery

A restart preserves layout IDs but not harnesses or registrations. A restored tab with no live agent is a husk, and `agent get` can report a stale registration. Confirm with `herdr pane process-info`; a foreground of only shells means the agent is gone. Recovery refuses live or unknown endpoints rather than risk a duplicate. A live restart kills every pane, so get the Captain's consent.

## Lifecycle

### `/bearings`
Discover layout, toolchains, manifests, and remote state; inspect issues, PRs, and branch hygiene without destructive commands.

### `/ahoy`
Recap visible events since the last Captain message: landed work, failed checks, unanswered decisions. Do not re-crawl the repo.

### `ship-landing`
- Named-head verification: the commit must exist on the target branch or remote. A commit only in a local copy is not done.
- Teardown discipline: investigate uncommitted or unlanded work; never force-clean without discard authority.
- Release with `treehouse return <path>` so caches persist.

### `firstmate-calm`
Monitor with `herdr agent list` plus `pane process-info`. Steer blocked or looping workers before killing. Re-check endpoints for husks after a restart. Avoid frantic polling.

## Standards

- One captain per branch; no conflicting orchestrators.
- Check quota with `npx -y quota-axi` before dispatching more than two crewmates.
- Every task ends with runtime proof (tests, lint, typecheck, or DevTools).

## Invocation

Load when dispatching workers, handling worktree handoffs, backend selection, or stall and restart recovery.
