# Work Harness

> One workflow, three artifacts, one state file. The CLI is the only writer.

Skills define what an agent can do. The harness defines how work moves: goal, plan, execute, verify, deliver. State is durable, so the next session does not re-derive it.

## Install

Requires Node 18 or newer.

```bash
bash harness/install.sh
work --version
```

This links `harness/work.mjs` to `~/.local/bin/work`.

## Use

```bash
work init "Make webhook processing idempotent" \
  --accept "duplicate delivery produces one transaction" \
  --accept "integration tests pass" \
  --scope "webhook ingest and ledger"

work phase plan
work task add --task "Inspect the webhook path" --files "src/webhooks.ts" --verify "npm test"
work task start T1
work task done T1

work verify -- npm test
work phase deliver
```

`work status` prints the current phase, task count, evidence, blockers, and next action. `work status --json` is the machine-readable form.

## State

The CLI writes `.work/state.json` and renders three views. `.work/` is gitignored by default.

| File | Purpose |
|---|---|
| `.work/GOAL.md` | Outcome, scope, exclusions, acceptance criteria, constraints, risks |
| `.work/STATE.md` | Plan, decisions, blockers, next action |
| `.work/VERIFY.md` | Commands, results, evidence, residual risks |

Do not edit the views by hand. Change state through the CLI.

## Phases

```
goal -> plan -> execute -> verify -> deliver
                    ^         |
                    +- diagnose <-- failure
```

- `goal`: outcome and acceptance criteria exist.
- `plan`: tasks have files and a verify command.
- `execute`: one task in progress at a time.
- `verify`: the last evidence must pass.
- `deliver`: blocked until the last evidence passes and no blockers remain.

A failed verify returns to `execute` with a diagnosis requirement, not a blind retry. Record the diagnosis with `work decide`.

## Commands

| Command | Effect |
|---|---|
| `work init "<goal>"` | Create state and the three views |
| `work goal --outcome ... --accept ...` | Update the contract |
| `work phase <phase>` | Move phase, with deliver gated on evidence |
| `work task add --task ...` | Add a task with files and verify command |
| `work task start\|done <id>` | Advance a task |
| `work task block <id> --reason ...` | Block a task and the phase |
| `work verify -- <command>` | Run the check, log it, update evidence |
| `work decide "<decision>" --why ...` | Record a decision and rationale |
| `work block "<reason>"` | Block the phase |
| `work unblock` | Remove the last blocker |
| `work next` | Print the next action |
| `work metrics` | Print task metrics |
| `work render` | Regenerate the three views |
| `work --self-test` | Run the deterministic harness test |

## Metrics

`state.json` tracks:

- iterations (verify runs)
- verifies
- failures
- human interventions
- first-pass acceptance

The primary metric is first-pass acceptance: did the first full verification pass without a fix cycle?

## Team Rule

Delegate only independent work. Every delegated brief needs a scope, a deliverable, a verify command, and the files it owns. One writer per file. Read-only scouts and adversarial reviewers are safe to parallelize; writers need isolated worktrees.

## OpenCode Integration

The `/work` command runs this harness through the sentinel agent. `/goal`, `/plan`, and `/teamwork` are explicit operations inside the same state. The command lives in `~/.config/opencode/commands/work.md`.

At session start, run:

```bash
work status --json
```

Then execute only the current phase. Do not skip to delivery.

## Design Rules

- The CLI is the single writer of state.
- No delivery without a passing verify.
- No blind retries after a failed verify.
- No external side effects (deploy, migrate, publish, push) without explicit approval.
- Keep the plan proportional to the task. A one-line fix does not need a five-phase ceremony.
- State is local to the project; do not commit `.work/` unless the project explicitly wants a durable audit trail.
