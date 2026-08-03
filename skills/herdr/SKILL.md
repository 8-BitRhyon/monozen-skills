---
name: herdr
description: "Operate the Herdr terminal multiplexer for multi-agent orchestration: panes, sockets, agent state (working/idle/blocked), spawning crew panes, focus/notify, and the first-mate captain pattern. Load whenever running multiple agents in one workspace or supervising the crew from a captain pane."
---

# Herdr Multiplexing

> **Scope:** Herdr is an agent-aware terminal multiplexer (session backend beside tmux). It knows agent states (working/idle/blocked) instead of just tracking panes. This skill encodes the captain-and-crew/first-mate operating pattern.

## Core Concepts

- **Panes** hold an agent process (Pi, Claude Code, OpenCode, Codex) plus your shell.
- **States**: `working`, `idle`, `blocked` (waiting on human). Status plugins surface these into the tab bar.
- **Control**: local unix socket API. Pi-side wrapper: `@andrewjacop/pi-herdr`.
- **Layouts**: YAML workspace layouts via herdr-spreader.

## Captain (First Mate) Pattern

One conductor pane owns the task; it spawns isolated crew panes, supervises, and reports:

1. Decompose into independent units (see `task-decomposition`).
2. For each unit spawn a crew pane with a clean git worktree (see `git-worktree` skill).
3. Keep the captain pane free: delegate by default, escalate only decisions.
4. Poll state, not prose: read pane status + output deltas, avoid re-reading full logs.
5. Collect results, then `git worktree remove` + close panes. Never leave stale crew.

### Prefer the firstmate distro for crew runs

The `kunchenguid/firstmate` agent distro ships the full implementation of this pattern: you talk to a single first-mate agent and it runs the crew for you - spawning crewmates in visible session panes, giving each a clean treehouse worktree, supervising them, and returning PRs/merges/reports. It is a portable directory (`AGENTS.md` + bundled skills + scripts), not an app - clone it and launch a harness inside it.

Use `treehouse` (see `git-worktree`) for worktree pooling whether or not you adopt firstmate.

## CLI Commands (reference)

```
herdr new / attach - create or join a session
herdr pane list          - panes + agent state
herdr pane split         - vertical split (new pane)
herdr pane send <id> <cmd> - send a command to a pane
herdr pane read <id>     - tail the pane output
herdr pane focus <id>    - bring pane into view
herdr status             - blocked/working/idle summary for all panes
herdr wait <state>       - block until a pane reaches a state
```

Use socket-mode (`@andrewjacop/pi-herdr`) for programmatic control from within Pi extensions.

## Status Integrations

- Focus-Notify: native toast when an agent blocks or finishes; click jumps to the pane.
- Attention: jump to agents needing input (blocked first).
- Worktree plugins see pane workspace isolation.

## Verification
- `herdr pane list` shows each pane with a correct state label after a spawn.
- A blocked call surfaces a toast and the captain can escalate to the human.
- Killing a pane cleans its process tree; `herdr session` returns to the captain without orphan panes.

## Invocation

Load when:
- Running multiple agents in one workspace or supervising a crew from a captain pane
- User asks "spawn an agent", "split pane", "supervise the crew", "herdr"
- Orchestrating parallel work via the first-mate pattern