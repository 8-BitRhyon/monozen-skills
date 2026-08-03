---
name: pi-agent
description: "Configure and extend the Pi coding agent: extension API (terminal-title spinner, status), global settings.json, models.json provider overrides, and subscription-auth providers. Load when setting up Pi, writing a Pi extension, or tuning models/settings."
---

# Pi Agent Runtime

> **Scope:** Pi is the interactive coding-agent harness (npm: `@earendil-works/pi-coding-agent`). Config lives under `~/.pi/agent/`. Extensions auto-load from `~/.pi/agent/extensions/*.ts` and hot-reload with `/reload`.

## Directory Contract

- `~/.pi/agent/auth.json` - credentials (0600). API key or OAuth tokens from `/login`.
- `~/.pi/agent/settings.json` - packages, extensions, model/store defaults.
- `~/.pi/agent/models.json` - custom provider/model catalog overrides.
- `~/.pi/agent/extensions/*.ts` - global extensions (auto-discovered).
- `.pi/extensions/*.ts` - project-local, load only on trusted project.

## Extension API (essentials)
Extensions export default factory: `export default (pi: ExtensionAPI) => {}`.

Events (subscribe with `pi.on`):
- `session_start`, `agent_start` / `agent_end` / `agent_settled` (idle check: `ctx.isIdle()`)
- `turn_start` / `turn_end`, `tool_call` (can block), `tool_result` (can modify)
- `model_select` (model switched), `input` (raw prompt, can transform)

API in factory: `pi.registerTool()`, `pi.registerCommand()`, `pi.registerShortcut()`, `pi.registerFlag()`, `pi.sendUserMessage()`, `pi.setSessionName()`, `pi.exec()`.
ExtensionContext: `ctx.ui` (`notify`, `confirm`, `input`, `select`, `setStatus`, `setWidget`), `ctx.mode`, `ctx.hasUI`, `ctx.cwd`.

Startup rules:
- Never start long-lived resources from the factory; defer until `session_start` and close on `session_shutdown`.
- No new session is started in some invocations; guard heavy init behind events.

## Pre-Styled: terminal-title.ts (Spinner in Tab Title)
Templates live in `templates/`. Install:
```
cp templates/terminal-title.ts ~/.pi/agent/extensions/
pi # then /reload
```
The extension paints a spinner while a turn is running and the final status (session name or cwd) when idle, via the `ESC]0;` title sequence. Works in Ghostty/tmux/herdr tabs.

## settings.json Template
`templates/settings.json`: declare pinned packages and explicit extension paths. Pi 0.82+ auto-installs missing pinned packages at startup. Pin immutable refs (pinned versions or commits), never `@latest`; audit before bumping.

## models.json Template
`templates/models.json`: model overrides and custom providers. Top-level:
- `models` override display/cost/context for existing catalog IDs.
- `providers` define new providers speaking `openai-completions`, `openai-responses`, `anthropic`, or `google-generative-ai`.
- Radius custom gateways use `"oauth": "radius"` + `baseUrl`.
- No credentials here: reference `$ENV_VAR` or `!cmd` in `auth.json` keys instead.

## Verification
- `pi -e ./templates/terminal-title.ts` runs an extension once.
- `/reload` picks up edits without restarting.
- `/model` shows the configured catalog; `/login` wires a provider.
- `/extensions` (or runtime status) confirms extensions loaded, idle spinner clears on completion.