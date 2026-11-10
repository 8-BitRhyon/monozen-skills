---
name: herdr
description: "Operates the Herdr terminal multiplexer (0.9+): sessions, workspaces, tabs, panes, agent states, hooks, socket API, restart and husk recovery, and the captain pattern. Use when supervising multiple agents in one workspace."
---

# Herdr Multiplexing

> Herdr is an agent-aware terminal multiplexer. It keeps real panes alive and classifies each agent as `working`, `blocked`, `done`, `idle`, or `unknown`.

Requires: `herdr` 0.9+ on PATH. The installed binary is authoritative: run `herdr <command> --help`.

## Concepts

- **Session:** one server per session. Pass `--session <name>` or set `HERDR_SESSION`.
- **Workspace -> tab -> pane:** IDs are session-scoped (`w3`, `w3:t1`, `w3:p1`). Re-read them after close, split, or restart.
- **State:** a registration is a hint. Confirm with `pane process-info` before trusting or relaunching.
- **Daemon:** detaching or losing SSH does not kill panes. `server stop` does, and it kills every pane.

## Environment And Nesting

Panes get `HERDR_ENV=1`, `HERDR_PANE_ID`, `HERDR_SESSION`, and `HERDR_SOCKET_PATH`.

A tmux started inside a Herdr pane sets `$TMUX` for its children. Backend detection that checks `$TMUX` first then hides the agent. Guard shell auto-start with `[[ -z "$HERDR_ENV" ]]`. Never start tmux inside a Herdr pane.

## CLI

```
herdr status [--json] [--session <name>]
herdr session list [--json]
herdr workspace list|get|create --cwd <path> [--label] [--no-focus]|focus|rename|close
herdr tab list|create --workspace <id> [--label]|get|focus|rename|close
herdr pane list|get|current|process-info|read <id> [--lines N] [--format text|ansi]
herdr pane run <id> "<command>"
herdr pane send-text|send-keys <id> <text|Enter|Escape|C-c>
herdr pane split <id> --direction right|down [--no-focus]|focus|rename|close
herdr agent list|get <id>|explain <id>|attach <id>
herdr agent prompt <id> "<task>" [--wait [--until done] [--timeout MS]]
herdr agent wait <id> --until done [--until blocked ...]
herdr terminal attach <terminal_id>
herdr integration install <pi|claude|codex|opencode|kilo|...>
herdr integration status
herdr api snapshot|schema
```

## Integrations

`herdr integration install <agent>` installs a native state hook. `integration status` lists what is installed. Focus Notify toasts on block or finish.

## Restart And Husks

- A restart preserves layout IDs, not harness processes or registrations.
- A restored tab with no live agent is a husk. `agent get` can show a stale registration.
- Confirm with `pane process-info`: a foreground of only shells means the agent is gone. Relaunch it.
- Do not replace a tab before the old pane is confirmed dead; the last tab can take its workspace with it.
- Restarting the daemon kills every pane. Get consent first.

## Captain Pattern

1. Decompose into independent units (`task-decomposition`).
2. Give each worker a clean worktree (`git-worktree`).
3. Keep the captain free: delegate by default, escalate only decisions.
4. Watch `agent list` and `pane read`; steer blocked workers before killing them.
5. Return worktrees and close panes when done.

## Verification

- `pane list` and `agent list` show the expected topology and states.
- `pane process-info` proves the harness is live.
- `agent explain <id>` explains a wrong state.
- `integration status` shows the hook installed.

## Invocation

Load when supervising multiple agents, spawning or splitting panes, or running the captain pattern.
