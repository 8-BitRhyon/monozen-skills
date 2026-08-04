---
name: herdr
description: "Operate the Herdr terminal multiplexer for multi-agent orchestration: workspaces/tabs/panes, agent states (idle/working/blocked/done), native agent-state integrations, socket API, daemon persistence, and the captain-crew pattern. Load when running multiple agents in one workspace or supervising a crew from a captain pane."
---

# Herdr Multiplexing

> **Scope:** Herdr is an agent-aware terminal multiplexer (session backend beside tmux). It detects agent states (`idle`, `working`, `blocked`, `done`, `unknown`), runs as a persistent daemon, and exposes a JSON socket API + CLI.

## Core Concepts

- **Workspaces -> tabs -> panes**: a pane runs one process (shell, agent, server). Compact ids: workspace `1`, tab `1:2`, pane `1-3`. Re-read ids after close/split; they are not durable.
- **Agent states**: `idle`, `working`, `blocked` (needs human), `done` (finished, unviewed), `unknown`.
- **Daemon**: the server holds PTY sessions independently; closing the client or dropping SSH does not kill panes (`herdr status`, `server stop`).
- **Control**: CLI over a local unix socket. `herdr api snapshot` dumps live state; `api schema` writes the API schema.

## Captain (First Mate) Pattern

One conductor pane owns the task; it spawns isolated crew panes, supervises, and reports:

1. Decompose into independent units (see `task-decomposition`).
2. For each unit spawn a crew pane in a clean worktree (see `git-worktree`).
3. Keep the captain pane free: delegate by default, escalate only decisions.
4. Poll state, not prose: `agent list` for states, `pane read` for output deltas.
5. Collect results, then release worktrees + close panes. Never leave stale crew.

Each crew pane runs one `agentic-loop`; the captain syncs with `herdr agent wait <id> --until done`.

### Prefer the firstmate distro for crew runs

The `kunchenguid/firstmate` agent distro ships this pattern: you talk to one first-mate agent that runs the crew - spawning crewmates in visible panes with clean treehouse worktrees, supervising, returning PRs/merges/reports. Pool worktrees with `treehouse` (see `git-worktree`).

## CLI Reference (verified against installed herdr)

```
herdr                          launch or attach to the session
herdr pane list|current|read <id>   panes + states, output
herdr pane split <id> --direction right|down [--no-focus]
herdr pane run <id> "<cmd>"    send command + Enter
herdr pane send-text|send-keys <id> text|Enter
herdr pane focus/rename/close <id>
herdr tab create [--label]; focus/rename/close <tabid>
herdr workspace create --cwd <path> [--label]; focus/rename/close
herdr agent list|get           agents + states
herdr agent prompt <id> "<task>" [--wait --until done --timeout MS]
herdr agent wait <id> --until done [--until blocked ...]
herdr integration install <pi|claude|codex|opencode|kilo|...>
herdr integration status     per-agent hook state
herdr worktree create --branch feat/x   worktree-scoped workspace
herdr api snapshot|schema
```

## Status Integrations

- `herdr integration install <agent>` installs a native agent-state hook (Pi extension, Claude/Codex hook, Kilo plugin) so herdr tracks real states, not scraped buffers; `integration status` lists per-agent install state. For Pi it writes `~/.pi/agent/extensions/herdr-agent-state.ts` (see `pi-agent`).
- Focus-Notify: toast when an agent blocks or finishes; click jumps to the pane.
- `herdr worktree create` scopes a workspace to a fresh git worktree (see `git-worktree`).

## Verification
- `herdr agent list` shows correct states after a spawn; `agent wait --until done` returns on finish.
- `herdr integration status` shows your harness hook installed; killing a pane leaves no orphans.

## Invocation

Load when:
- Running multiple agents in one workspace or supervising a crew from a captain pane
- User asks "spawn an agent", "split pane", "supervise the crew", "herdr"
- Orchestrating parallel work via the first-mate pattern
