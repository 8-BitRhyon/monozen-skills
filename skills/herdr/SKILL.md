---
name: herdr
description: "Operate the Herdr terminal multiplexer (0.9.x): named sessions, workspaces/tabs/panes, agent states, hooks, socket API, restart and husk behavior, and the captain-crew pattern. Load when running or supervising multiple agents in one workspace."
---

# Herdr Multiplexing

Herdr is an agent-aware terminal multiplexer beside tmux. It detects `idle`, `working`, `blocked`, `done`, and `unknown` states, runs a persistent daemon, and exposes a CLI and JSON socket API. The installed binary is authoritative: run `herdr <command> --help`.

## Core Concepts

- **Named sessions**: each server is a session (`default` unless selected). Pass `--session <name>` or set `HERDR_SESSION`; otherwise commands use inherited context. Client and server versions can differ; `herdr status --json` reports both.
- **Workspaces -> tabs -> panes**: IDs are session-scoped (`w3`, `w3:t1`, `w3:p1`). Re-read them after close, split, or restart.
- **States**: a registration is a hint, not proof. Confirm with `pane process-info` before trusting or relaunching.
- **Daemon**: closing the client or losing SSH does not kill panes. `server stop` does.

## Environment and Nesting

Panes receive `HERDR_ENV=1`, `HERDR_PANE_ID`, `HERDR_SESSION`, and `HERDR_SOCKET_PATH`.

A tmux started inside a Herdr pane sets `$TMUX` for its children. Backend auto-detection that checks `$TMUX` first then selects tmux and hides the agent. Guard shell auto-start with `[[ -z "$HERDR_ENV" ]]`; never start tmux inside a Herdr pane.

## CLI

```
herdr status [--json] [--session <name>]
herdr session list [--json]
herdr workspace list|get|create --cwd <path> [--label] [--env K=V] [--no-focus]|focus|rename|close
herdr tab list|create --workspace <id> [--label]|get|focus|rename|close
herdr pane list|get|current|process-info|read <id> [--lines N] [--format text|ansi]
herdr pane run <id> "<command>"
herdr pane send-text|send-keys <id> <text|Enter|Escape|C-c>
herdr pane split <id> --direction right|down [--no-focus]|focus|rename|close
herdr agent list|get <id>
herdr agent prompt <id> "<task>" [--wait [--until done] [--timeout MS]]
herdr agent wait <id> --until done [--until blocked ...]
herdr integration install <pi|claude|codex|opencode|kilo|...>
herdr integration status
herdr api snapshot|schema
```

## Status Integrations

`herdr integration install <agent>` installs a native state hook (Pi extension, Claude/Codex hook, Kilo plugin); `integration status` lists them. Focus Notify toasts on block or finish.

## Restart and Husks

- A server restart preserves workspace, tab, pane, and label IDs; harness processes and registrations do not survive.
- A restored tab with no live agent is a husk. `agent get` can show a stale registration after the harness exits.
- Confirm with `pane process-info`: a foreground of only shells means the agent is gone. Relaunch it; do not trust the registration.
- Do not replace a tab before the old pane is confirmed dead; the last tab can take its workspace with it.
- Restarting the daemon kills every pane. Do it only with the user's consent.

## Captain (First Mate) Pattern

1. Decompose into independent units (see `task-decomposition`).
2. Spawn each crew pane in a clean worktree (see `git-worktree`).
3. Keep the captain free: delegate by default, escalate only decisions.
4. Poll `agent list` for state and `pane read` for output deltas.
5. Release worktrees and close panes when done.

Prefer the `kunchenguid/firstmate` distro: it runs the crew in visible panes with treehouse worktrees and needs Herdr protocol 14+ (see `firstmate`).

## Verification

- `pane list` and `agent list` show the expected topology and states.
- `pane process-info` proves the harness is live.
- `integration status` shows the hook installed.

## Invocation

Load when supervising multiple agents, spawning or splitting panes, or running the first-mate pattern.
